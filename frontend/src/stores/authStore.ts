import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import React from 'react';
import type { User } from '../types';

// 认证状态接口
export interface AuthState {
  // 用户信息
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  
  // 认证状态
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // 用户偏好设置
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'zh' | 'en';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisible: boolean;
      locationVisible: boolean;
      contactVisible: boolean;
    };
  };
  
  // 会话管理
  sessionExpiry: number | null;
  rememberMe: boolean;
  lastActivity: number;
}

// 认证操作接口
export interface AuthActions {
  // 基本认证操作
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  
  // 完整认证设置
  setAuth: (data: {
    user: User;
    token: string;
    refreshToken?: string;
    expiresIn?: number;
    rememberMe?: boolean;
  }) => void;
  
  // 清除认证信息
  clearAuth: () => void;
  
  // 用户偏好设置
  updatePreferences: (preferences: Partial<AuthState['preferences']>) => void;
  setTheme: (theme: AuthState['preferences']['theme']) => void;
  setLanguage: (language: AuthState['preferences']['language']) => void;
  
  // 会话管理
  updateActivity: () => void;
  checkSessionExpiry: () => boolean;
  setSessionExpiry: (expiry: number) => void;
  
  // 用户信息更新
  updateUser: (updates: Partial<User>) => void;
  
  // 权限检查
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  
  // 重置状态
  reset: () => void;
}

// 默认状态
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: true, // 默认设为true，避免初始化问题
  preferences: {
    theme: 'system',
    language: 'zh',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profileVisible: true,
      locationVisible: true,
      contactVisible: false,
    },
  },
  sessionExpiry: null,
  rememberMe: false,
  lastActivity: Date.now(),
};

// 创建认证 Store
export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 基本认证操作
        setUser: (user) => {
          set({ user });
          if (user) {
            set({ isAuthenticated: true });
          }
        },
        
        setToken: (token) => {
          set({ token });
        },
        
        setRefreshToken: (refreshToken) => {
          set({ refreshToken });
        },
        
        setAuthenticated: (isAuthenticated) => {
          set({ isAuthenticated });
        },
        
        setLoading: (isLoading) => {
          set({ isLoading });
        },
        
        setInitialized: (isInitialized) => {
          set({ isInitialized });
        },
        
        // 完整认证设置
        setAuth: ({ user, token, refreshToken, expiresIn, rememberMe = false }) => {
          const sessionExpiry = expiresIn 
            ? Date.now() + (expiresIn * 1000)
            : null;
            
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            sessionExpiry,
            rememberMe,
            lastActivity: Date.now(),
          });
        },
        
        // 清除认证信息
        clearAuth: () => {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            sessionExpiry: null,
            lastActivity: Date.now(),
          });
        },
        
        // 用户偏好设置
        updatePreferences: (newPreferences) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              ...newPreferences,
            },
          }));
        },
        
        setTheme: (theme) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              theme,
            },
          }));
        },
        
        setLanguage: (language) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              language,
            },
          }));
        },
        
        // 会话管理
        updateActivity: () => {
          set({ lastActivity: Date.now() });
        },
        
        checkSessionExpiry: () => {
          const { sessionExpiry } = get();
          if (sessionExpiry && Date.now() > sessionExpiry) {
            get().clearAuth();
            return true; // 已过期
          }
          return false; // 未过期
        },
        
        setSessionExpiry: (expiry) => {
          set({ sessionExpiry: expiry });
        },
        
        // 用户信息更新
        updateUser: (updates) => {
          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                ...updates,
              },
            });
          }
        },
        
        // 权限检查
        hasRole: (role) => {
          const { user } = get();
          if (!user) return false;
          
          const roles = Array.isArray(role) ? role : [role];
          return roles.includes(user.role);
        },
        
        hasPermission: (permission) => {
          const { user } = get();
          if (!user) return false;
          
          // 简单的权限检查逻辑，可以根据需要扩展
          const userPermissions = user.permissions || [];
          return userPermissions.includes(permission);
        },
        
        // 重置状态
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        // 只持久化特定字段
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          preferences: state.preferences,
          rememberMe: state.rememberMe,
          sessionExpiry: state.sessionExpiry,
        }),
        // 版本管理
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // 从版本 0 迁移到版本 1 的逻辑
            return {
              ...persistedState,
              preferences: {
                ...initialState.preferences,
                ...persistedState.preferences,
              },
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// 选择器 Hooks (优化性能) - 使用 useMemo 缓存结果
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthPreferences = () => useAuthStore((state) => state.preferences);
export const useUserRole = () => useAuthStore((state) => state.user?.role);

// 组合选择器 - 使用 shallow 比较避免无限循环
export const useAuthStatus = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  
  return useMemo(() => ({
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
  }), [isAuthenticated, isLoading, isInitialized, user]);
};

// 认证操作 Hook - 使用 useMemo 缓存
export const useAuthActions = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const updateUser = useAuthStore((state) => state.updateUser);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);
  const setTheme = useAuthStore((state) => state.setTheme);
  const setLanguage = useAuthStore((state) => state.setLanguage);
  const updateActivity = useAuthStore((state) => state.updateActivity);
  const checkSessionExpiry = useAuthStore((state) => state.checkSessionExpiry);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const reset = useAuthStore((state) => state.reset);
  
  return useMemo(() => ({
    setAuth,
    clearAuth,
    updateUser,
    updatePreferences,
    setTheme,
    setLanguage,
    updateActivity,
    checkSessionExpiry,
    hasRole,
    hasPermission,
    reset,
  }), [setAuth, clearAuth, updateUser, updatePreferences, setTheme, setLanguage, updateActivity, checkSessionExpiry, hasRole, hasPermission, reset]);
};

// 会话管理 Hook
export const useSessionManager = () => {
  const { checkSessionExpiry, updateActivity, clearAuth } = useAuthActions();
  const sessionExpiry = useAuthStore((state) => state.sessionExpiry);
  const lastActivity = useAuthStore((state) => state.lastActivity);
  
  return {
    checkSessionExpiry,
    updateActivity,
    clearAuth,
    sessionExpiry,
    lastActivity,
    isSessionValid: () => {
      return sessionExpiry ? Date.now() < sessionExpiry : true;
    },
    getTimeUntilExpiry: () => {
      return sessionExpiry ? Math.max(0, sessionExpiry - Date.now()) : null;
    },
  };
};