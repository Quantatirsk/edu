/**
 * 会话管理Hook - 处理用户会话状态和自动刷新
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore, useAuthActions } from '../stores/authStore';
import { AuthService, AuthStateManager } from '../services/authService';

interface SessionConfig {
  // 自动刷新配置
  autoRefresh: boolean;
  refreshThreshold: number; // 提前多少秒刷新token（默认5分钟）
  
  // 活动检测配置
  activityTimeout: number; // 无活动超时时间（毫秒，默认30分钟）
  activityEvents: string[]; // 监听的活动事件
  
  // 登出配置
  autoLogoutOnExpiry: boolean;
  showExpiryWarning: boolean;
  warningThreshold: number; // 过期前多少秒显示警告（默认2分钟）
}

const DEFAULT_CONFIG: SessionConfig = {
  autoRefresh: true,
  refreshThreshold: 300, // 5分钟
  activityTimeout: 30 * 60 * 1000, // 30分钟
  activityEvents: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  autoLogoutOnExpiry: true,
  showExpiryWarning: true,
  warningThreshold: 120, // 2分钟
};

export const useSession = (config: Partial<SessionConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionExpiry = useAuthStore((state) => state.sessionExpiry);
  const lastActivity = useAuthStore((state) => state.lastActivity);
  const { updateActivity, clearAuth } = useAuthActions();
  
  // 定时器引用
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 刷新令牌
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = AuthStateManager.getRefreshToken();
      if (!refreshTokenValue) {
        console.warn('No refresh token available');
        return false;
      }

      const newTokens = await AuthService.refreshAccessToken(refreshTokenValue);
      
      // 更新AuthStore中的token
      const authStore = AuthStateManager.getAuthStore();
      authStore.setAuth({
        user: authStore.user!,
        token: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
        expiresIn: newTokens.expires_in,
      });
      
      console.log('Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // 如果刷新失败，清除认证状态
      if (fullConfig.autoLogoutOnExpiry) {
        clearAuth();
      }
      
      return false;
    }
  }, [clearAuth, fullConfig.autoLogoutOnExpiry]);

  // 检查会话状态
  const checkSessionStatus = useCallback(() => {
    if (!isAuthenticated || !sessionExpiry) {
      return {
        isValid: false,
        isExpiring: false,
        timeUntilExpiry: 0,
      };
    }

    const now = Date.now();
    const timeUntilExpiry = sessionExpiry - now;
    const isValid = timeUntilExpiry > 0;
    const isExpiring = timeUntilExpiry <= (fullConfig.warningThreshold * 1000);

    return {
      isValid,
      isExpiring,
      timeUntilExpiry,
    };
  }, [isAuthenticated, sessionExpiry, fullConfig.warningThreshold]);

  // 设置自动刷新定时器
  const scheduleTokenRefresh = useCallback(() => {
    if (!fullConfig.autoRefresh || !sessionExpiry) {
      return;
    }

    // 清除现有定时器
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now();
    const timeUntilRefresh = sessionExpiry - now - (fullConfig.refreshThreshold * 1000);

    if (timeUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, timeUntilRefresh);
      
      console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`);
    } else {
      // 如果已经超过刷新阈值，立即刷新
      refreshToken();
    }
  }, [fullConfig.autoRefresh, fullConfig.refreshThreshold, sessionExpiry, refreshToken]);

  // 设置过期警告定时器
  const scheduleExpiryWarning = useCallback(() => {
    if (!fullConfig.showExpiryWarning || !sessionExpiry) {
      return;
    }

    // 清除现有定时器
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    const now = Date.now();
    const timeUntilWarning = sessionExpiry - now - (fullConfig.warningThreshold * 1000);

    if (timeUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        // 触发过期警告事件
        window.dispatchEvent(new CustomEvent('session-expiry-warning', {
          detail: { timeUntilExpiry: fullConfig.warningThreshold }
        }));
      }, timeUntilWarning);
    }
  }, [fullConfig.showExpiryWarning, fullConfig.warningThreshold, sessionExpiry]);

  // 设置活动检测定时器
  const scheduleActivityTimeout = useCallback(() => {
    // 清除现有定时器
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    activityTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity >= fullConfig.activityTimeout) {
        console.log('Session timeout due to inactivity');
        
        // 触发无活动超时事件
        window.dispatchEvent(new CustomEvent('session-activity-timeout'));
        
        if (fullConfig.autoLogoutOnExpiry) {
          clearAuth();
        }
      }
    }, fullConfig.activityTimeout);
  }, [lastActivity, fullConfig.activityTimeout, fullConfig.autoLogoutOnExpiry, clearAuth]);

  // 活动事件处理器
  const handleActivity = useCallback(() => {
    updateActivity();
    scheduleActivityTimeout();
  }, [updateActivity, scheduleActivityTimeout]);

  // 初始化和清理
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // 设置自动刷新
    scheduleTokenRefresh();
    
    // 设置过期警告
    scheduleExpiryWarning();
    
    // 设置活动检测
    scheduleActivityTimeout();

    // 注册活动事件监听器
    fullConfig.activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // 清理函数
    return () => {
      // 清除定时器
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }

      // 移除事件监听器
      fullConfig.activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [
    isAuthenticated,
    scheduleTokenRefresh,
    scheduleExpiryWarning,
    scheduleActivityTimeout,
    handleActivity,
    fullConfig.activityEvents,
  ]);

  // 手动刷新令牌
  const manualRefresh = useCallback(async () => {
    const success = await refreshToken();
    if (success) {
      scheduleTokenRefresh();
      scheduleExpiryWarning();
    }
    return success;
  }, [refreshToken, scheduleTokenRefresh, scheduleExpiryWarning]);

  // 延长会话
  const extendSession = useCallback(async () => {
    return await manualRefresh();
  }, [manualRefresh]);

  // 立即登出
  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return {
    // 会话状态
    sessionStatus: checkSessionStatus(),
    
    // 操作方法
    refreshToken: manualRefresh,
    extendSession,
    logout,
    
    // 配置信息
    config: fullConfig,
    
    // 实用工具
    formatTimeUntilExpiry: (milliseconds: number) => {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  };
};

// 会话警告组件Hook
export const useSessionWarning = () => {
  const { sessionStatus, extendSession, logout, formatTimeUntilExpiry } = useSession();
  
  useEffect(() => {
    const handleWarning = (event: CustomEvent) => {
      const { timeUntilExpiry } = event.detail;
      
      // 可以在这里显示警告弹窗或通知
      console.warn(`Session will expire in ${formatTimeUntilExpiry(timeUntilExpiry * 1000)}`);
    };

    const handleTimeout = () => {
      console.warn('Session expired due to inactivity');
    };

    window.addEventListener('session-expiry-warning', handleWarning as EventListener);
    window.addEventListener('session-activity-timeout', handleTimeout as EventListener);

    return () => {
      window.removeEventListener('session-expiry-warning', handleWarning as EventListener); 
      window.removeEventListener('session-activity-timeout', handleTimeout as EventListener);
    };
  }, [formatTimeUntilExpiry]);

  return {
    sessionStatus,
    extendSession,
    logout,
    formatTimeUntilExpiry,
  };
};

export default useSession;