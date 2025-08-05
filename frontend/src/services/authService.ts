/**
 * 认证服务 - 处理用户注册、登录和token管理
 */

import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { APIConfig } from '../utils/api';

// 类型定义
export interface UserRegister {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PasswordReset {
  token: string;
  new_password: string;
}

export interface PasswordChange {
  old_password: string;
  new_password: string;
}

// 认证状态管理 - 使用统一的AuthStore
import { useAuthStore } from '../stores/authStore';

class AuthStateManager {
  static getAuthStore() {
    return useAuthStore.getState();
  }

  static getAccessToken(): string | null {
    const { token, sessionExpiry } = this.getAuthStore();
    
    // 检查token是否过期
    if (token && sessionExpiry && Date.now() > sessionExpiry) {
      this.getAuthStore().clearAuth();
      return null;
    }
    
    return token;
  }

  static getRefreshToken(): string | null {
    const { refreshToken } = this.getAuthStore();
    return refreshToken;
  }

  static isTokenExpired(): boolean {
    const { sessionExpiry } = this.getAuthStore();
    if (!sessionExpiry) return true;
    return Date.now() > sessionExpiry;
  }

  static hasValidToken(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired();
  }

  static clearAuth(): void {
    this.getAuthStore().clearAuth();
  }
}

// API客户端配置
const authClient = axios.create({
  baseURL: APIConfig.baseURL,
  timeout: APIConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证头
authClient.interceptors.request.use(
  (config) => {
    const token = AuthStateManager.getAccessToken();
    console.log('🔐 AuthClient: Checking for token...', {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'null',
      url: config.url
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ AuthClient: Token attached to request');
    } else {
      console.warn('⚠️ AuthClient: No token available for request');
      // 检查AuthStore状态
      const authState = AuthStateManager.getAuthStore();
      console.log('📊 AuthStore state:', {
        hasUser: !!authState.user,
        hasToken: !!authState.token,
        isAuthenticated: authState.isAuthenticated
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是401错误且不是刷新token请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = AuthStateManager.getRefreshToken();
        if (refreshToken) {
          const newTokens = await AuthService.refreshAccessToken(refreshToken);
          
          // 更新AuthStore中的tokens
          const authStore = AuthStateManager.getAuthStore();
          authStore.setAuth({
            user: authStore.user!,
            token: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            expiresIn: newTokens.expires_in,
          });
          
          // 重新发送原始请求
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          return authClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除认证状态并跳转到登录页
        AuthStateManager.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 认证服务类
export class AuthService {
  /**
   * 用户注册
   */
  static async register(userData: UserRegister): Promise<APIResponse> {
    try {
      console.log('AuthService: Attempting register with URL:', `${APIConfig.baseURL}/auth/register`);
      const response: AxiosResponse<APIResponse> = await authClient.post('/auth/register', userData);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * 用户登录
   */
  static async login(credentials: UserLogin): Promise<AuthTokens> {
    try {
      console.log('🔑 AuthService: Attempting login with URL:', `${APIConfig.baseURL}/auth/login`);
      console.log('📤 Request payload:', { email: credentials.email, passwordLength: credentials.password.length });
      
      const response: AxiosResponse<AuthTokens> = await authClient.post('/auth/login', credentials);
      console.log('📥 Raw response status:', response.status);
      console.log('📥 Raw response data:', response.data);
      
      const tokens = response.data;
      
      // 验证token结构
      if (!tokens.access_token || !tokens.token_type) {
        console.error('❌ Invalid token response format:', tokens);
        throw new Error('Invalid token response format');
      }
      
      console.log('✅ Login tokens validated successfully');
      return tokens;
    } catch (error: unknown) {
      console.error('❌ AuthService login error:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('❌ Request made but no response:', error.request);
      } else {
        console.error('❌ Request setup error:', error.message);
      }
      throw this.handleError(error);
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response: AxiosResponse<AuthTokens> = await authClient.post('/auth/refresh', {
        refresh_token: refreshToken
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<UserProfile> {
    try {
      console.log('👤 AuthService: Fetching current user from:', `${APIConfig.baseURL}/auth/me`);
      const response: AxiosResponse<UserProfile> = await authClient.get('/auth/me');
      console.log('📥 User profile response status:', response.status);
      console.log('📥 User profile data:', response.data);
      
      const userProfile = response.data;
      
      // 验证用户信息结构
      if (!userProfile.id || !userProfile.email || !userProfile.name) {
        console.error('❌ Invalid user profile format:', userProfile);
        throw new Error('Invalid user profile response format');
      }
      
      console.log('✅ User profile validated successfully');
      return userProfile;
    } catch (error: unknown) {
      console.error('❌ AuthService getCurrentUser error:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
      throw this.handleError(error);
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.post('/auth/logout');
      
      // 清除认证状态
      AuthStateManager.clearAuth();
      
      return response.data;
    } catch (error: unknown) {
      // 即使API调用失败，也要清除认证状态
      AuthStateManager.clearAuth();
      throw this.handleError(error);
    }
  }

  /**
   * 请求密码重置
   */
  static async requestPasswordReset(email: string): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.post('/auth/request-password-reset', {
        email
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * 重置密码
   */
  static async resetPassword(resetData: PasswordReset): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(passwordData: PasswordChange): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * 检查认证状态
   */
  static isAuthenticated(): boolean {
    return AuthStateManager.hasValidToken();
  }

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    return AuthStateManager.getAccessToken();
  }

  /**
   * 清除认证信息
   */
  static clearAuth(): void {
    AuthStateManager.clearAuth();
  }

  /**
   * 错误处理
   */
  private static handleError(error: unknown): Error {
    if (error.response) {
      // 服务器响应错误
      const message = error.response.data?.detail || error.response.data?.message || '服务器错误';
      return new Error(message);
    } else if (error.request) {
      // 网络错误
      return new Error('网络连接失败，请检查网络设置');
    } else {
      // 其他错误
      return new Error(error.message || '未知错误');
    }
  }
}

// 导出认证状态管理器以供其他模块使用
export { AuthStateManager };

// 默认导出
export default AuthService;