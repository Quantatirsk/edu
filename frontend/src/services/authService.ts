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
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

export interface APIResponse<T = any> {
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

// Token存储管理
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'youjiaotong_access_token';
  private static REFRESH_TOKEN_KEY = 'youjiaotong_refresh_token';
  private static TOKEN_EXPIRY_KEY = 'youjiaotong_token_expiry';

  static setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
      
      // 计算过期时间
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static isTokenExpired(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;
      
      return Date.now() > parseInt(expiryTime, 10);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  static hasValidToken(): boolean {
    const accessToken = this.getAccessToken();
    return accessToken !== null && !this.isTokenExpired();
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
    const token = TokenManager.getAccessToken();
    if (token && !TokenManager.isTokenExpired()) {
      config.headers.Authorization = `Bearer ${token}`;
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
        const refreshToken = TokenManager.getRefreshToken();
        if (refreshToken) {
          const newTokens = await AuthService.refreshAccessToken(refreshToken);
          TokenManager.setTokens(newTokens);
          
          // 重新发送原始请求
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          return authClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除tokens并跳转到登录页
        TokenManager.clearTokens();
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
      const response: AxiosResponse<APIResponse> = await authClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 用户登录
   */
  static async login(credentials: UserLogin): Promise<AuthTokens> {
    try {
      const response: AxiosResponse<AuthTokens> = await authClient.post('/api/auth/login', credentials);
      const tokens = response.data;
      
      // 存储tokens
      TokenManager.setTokens(tokens);
      
      return tokens;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response: AxiosResponse<AuthTokens> = await authClient.post('/api/auth/refresh', {
        refresh_token: refreshToken
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<UserProfile> {
    try {
      const response: AxiosResponse<UserProfile> = await authClient.get('/api/auth/me');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.post('/api/auth/logout');
      
      // 清除本地tokens
      TokenManager.clearTokens();
      
      return response.data;
    } catch (error: any) {
      // 即使API调用失败，也要清除本地tokens
      TokenManager.clearTokens();
      throw this.handleError(error);
    }
  }

  /**
   * 请求密码重置
   */
  static async requestPasswordReset(email: string): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.post('/api/auth/request-password-reset', {
        email
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 重置密码
   */
  static async resetPassword(resetData: PasswordReset): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.post('/api/auth/reset-password', resetData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(passwordData: PasswordChange): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await authClient.put('/api/auth/change-password', passwordData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 检查认证状态
   */
  static isAuthenticated(): boolean {
    return TokenManager.hasValidToken();
  }

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    return TokenManager.getAccessToken();
  }

  /**
   * 清除认证信息
   */
  static clearAuth(): void {
    TokenManager.clearTokens();
  }

  /**
   * 错误处理
   */
  private static handleError(error: any): Error {
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

// 导出token管理器以供其他模块使用
export { TokenManager };

// 默认导出
export default AuthService;