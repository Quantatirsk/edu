import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '../utils/api';
import { queryKeys } from '../utils/queryClient';
import type { User } from '../types';

// 认证相关类型定义
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  role: 'student' | 'teacher';
  agreement: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 认证状态类型
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
}

// 本地存储键名
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_info',
  REMEMBER_ME: 'remember_me',
} as const;

// 认证工具函数
const authUtils = {
  // 保存认证信息
  saveAuth: (data: AuthResponse, rememberMe: boolean = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(STORAGE_KEYS.TOKEN, data.token);
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    
    if (data.refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());
  },
  
  // 获取认证信息
  getAuth: (): { user: User | null; token: string | null } => {
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    
    const token = storage.getItem(STORAGE_KEYS.TOKEN);
    const userStr = storage.getItem(STORAGE_KEYS.USER);
    
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  },
  
  // 清除认证信息
  clearAuth: () => {
    [localStorage, sessionStorage].forEach(storage => {
      Object.values(STORAGE_KEYS).forEach(key => {
        storage.removeItem(key);
      });
    });
  },
  
  // 检查token是否过期
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  },
  
  // 自动刷新token
  refreshToken: async (): Promise<AuthResponse | null> => {
    try {
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) return null;
      
      const response = await apiRequest.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });
      
      authUtils.saveAuth(response, rememberMe);
      return response;
    } catch {
      authUtils.clearAuth();
      return null;
    }
  },
};

// 主要认证 Hook
export const useAuth = () => {
  const queryClient = useQueryClient();
  
  // 认证状态
  const [authState, setAuthState] = useState<AuthState>(() => {
    const { user, token } = authUtils.getAuth();
    return {
      user,
      token,
      isAuthenticated: !!(user && token),
      isLoading: false,
      error: null,
    };
  });

  // 更新认证状态
  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  };

  // 登录突变
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await apiRequest.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      return response;
    },
    onMutate: () => {
      updateAuthState({ isLoading: true, error: null });
    },
    onSuccess: (data, variables) => {
      authUtils.saveAuth(data, variables.rememberMe || false);
      updateAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // 设置用户数据到查询缓存
      queryClient.setQueryData(queryKeys.userProfile(), data.user);
    },
    onError: (error: ApiError) => {
      updateAuthState({
        isLoading: false,
        error,
      });
    },
  });

  // 注册突变
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      if (data.password !== data.confirmPassword) {
        throw new Error('密码确认不匹配');
      }
      
      const response = await apiRequest.post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        role: data.role,
      });
      return response;
    },
    onMutate: () => {
      updateAuthState({ isLoading: true, error: null });
    },
    onSuccess: (data) => {
      authUtils.saveAuth(data, false); // 注册后默认不记住登录
      updateAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      queryClient.setQueryData(queryKeys.userProfile(), data.user);
    },
    onError: (error: ApiError) => {
      updateAuthState({
        isLoading: false,
        error,
      });
    },
  });

  // 登出函数
  const logout = async () => {
    try {
      updateAuthState({ isLoading: true });
      
      // 调用服务器登出接口
      await apiRequest.post('/auth/logout');
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      // 无论服务器登出是否成功，都清理本地状态
      authUtils.clearAuth();
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      // 清理所有查询缓存
      queryClient.clear();
    }
  };

  // 密码重置请求
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordResetData): Promise<{ message: string }> => {
      return apiRequest.post('/auth/forgot-password', data);
    },
  });

  // 修改密码
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData): Promise<{ message: string }> => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('新密码确认不匹配');
      }
      
      return apiRequest.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      // 密码修改成功后，可以选择是否强制重新登录
      // logout();
    },
  });

  // 刷新用户信息
  const refreshUserInfo = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const user = await apiRequest.get<User>('/auth/profile');
      updateAuthState({ user });
      queryClient.setQueryData(queryKeys.userProfile(), user);
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }
  };

  // 检查认证状态并自动刷新token
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { user, token } = authUtils.getAuth();
      
      if (!user || !token) {
        updateAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // 检查token是否过期
      if (authUtils.isTokenExpired(token)) {
        const refreshedAuth = await authUtils.refreshToken();
        
        if (refreshedAuth) {
          updateAuthState({
            user: refreshedAuth.user,
            token: refreshedAuth.token,
            isAuthenticated: true,
            isLoading: false,
          });
          queryClient.setQueryData(queryKeys.userProfile(), refreshedAuth.user);
        } else {
          // 刷新失败，清除认证状态
          authUtils.clearAuth();
          updateAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        // token有效，设置认证状态
        updateAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        queryClient.setQueryData(queryKeys.userProfile(), user);
      }
    };

    checkAuthStatus();
  }, [queryClient]);

  // 监听storage变化 (多标签页同步)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && Object.values(STORAGE_KEYS).includes(e.key as keyof typeof STORAGE_KEYS)) {
        const { user, token } = authUtils.getAuth();
        updateAuthState({
          user,
          token,
          isAuthenticated: !!(user && token),
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    // 认证状态
    ...authState,
    
    // 认证操作
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    resetPassword: resetPasswordMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    refreshUserInfo,
    
    // 突变状态
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isResetPasswordLoading: resetPasswordMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
    
    // 错误状态
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    resetPasswordError: resetPasswordMutation.error,
    changePasswordError: changePasswordMutation.error,
    
    // 成功状态
    resetPasswordSuccess: resetPasswordMutation.isSuccess,
    changePasswordSuccess: changePasswordMutation.isSuccess,
    
    // 重置错误状态
    resetErrors: () => {
      loginMutation.reset();
      registerMutation.reset();
      resetPasswordMutation.reset();
      changePasswordMutation.reset();
      updateAuthState({ error: null });
    },
  };
};

// 认证路由守卫 Hook
export const useAuthGuard = (requiredRole?: 'student' | 'teacher' | 'admin') => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  const canAccess = () => {
    if (!isAuthenticated || !user) return false;
    if (!requiredRole) return true;
    return user.role === requiredRole;
  };
  
  return {
    isAuthenticated,
    canAccess: canAccess(),
    user,
    isLoading,
    shouldRedirect: !isLoading && !canAccess(),
  };
};