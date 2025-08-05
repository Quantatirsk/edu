import { useState, useCallback, useMemo } from 'react';
import type { ApiError } from '../utils/api';

// 错误状态类型
export interface ErrorState {
  error: ApiError | null;
  isError: boolean;
  errorMessage: string;
  errorCode?: string;
}

// 错误类型分类
export type ErrorType = 
  | 'network'
  | 'validation' 
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'unknown';

// 错误处理配置
export interface ErrorHandlerConfig {
  // 是否显示错误提示
  showNotification?: boolean;
  // 错误消息前缀
  messagePrefix?: string;
  // 是否记录错误日志
  logError?: boolean;
  // 自定义错误处理函数
  onError?: (error: ApiError) => void;
  // 错误重试配置
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
  };
}

// 默认错误处理配置
const defaultConfig: ErrorHandlerConfig = {
  showNotification: true,
  logError: true,
  retry: {
    enabled: false,
    maxAttempts: 3,
    delay: 1000,
  },
};

// 错误分类函数
const classifyError = (error: ApiError): ErrorType => {
  if (error.code) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'network';
      case 'VALIDATION_ERROR':
        return 'validation';
      case 'UNAUTHORIZED':
        return 'authentication';
      case 'FORBIDDEN':
        return 'authorization';
      case 'INTERNAL_SERVER_ERROR':
        return 'server';
      default:
        return 'unknown';
    }
  }
  
  if (error.status) {
    if (error.status >= 400 && error.status < 500) {
      return error.status === 401 ? 'authentication' : 
             error.status === 403 ? 'authorization' : 
             error.status === 422 ? 'validation' : 'unknown';
    }
    if (error.status >= 500) {
      return 'server';
    }
  }
  
  return 'unknown';
};

// 获取用户友好的错误消息
const getFriendlyErrorMessage = (error: ApiError): string => {
  const errorType = classifyError(error);
  
  // 如果有自定义消息，优先使用
  if (error.message && !error.message.includes('Error:')) {
    return error.message;
  }
  
  // 根据错误类型返回友好消息
  switch (errorType) {
    case 'network':
      return '网络连接失败，请检查网络设置后重试';
    case 'validation':
      return '输入信息有误，请检查后重试';
    case 'authentication':
      return '登录已过期，请重新登录';
    case 'authorization':
      return '没有权限执行此操作';
    case 'server':
      return '服务器繁忙，请稍后重试';
    default:
      return '操作失败，请稍后重试';
  }
};

// 主要错误处理 Hook
export const useError = (config: ErrorHandlerConfig = {}) => {
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: '',
  });

  // 处理错误
  const handleError = useCallback((error: ApiError | Error | unknown) => {
    let apiError: ApiError;
    
    // 标准化错误对象
    if (error instanceof Error) {
      apiError = {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    } else if (typeof error === 'object' && error !== null) {
      apiError = error as ApiError;
    } else {
      apiError = {
        message: '发生未知错误',
        code: 'UNKNOWN_ERROR',
      };
    }

    const friendlyMessage = getFriendlyErrorMessage(apiError);
    const fullMessage = finalConfig.messagePrefix 
      ? `${finalConfig.messagePrefix}: ${friendlyMessage}`
      : friendlyMessage;

    // 更新错误状态
    setErrorState({
      error: apiError,
      isError: true,
      errorMessage: fullMessage,
      errorCode: apiError.code,
    });

    // 记录错误日志
    if (finalConfig.logError) {
      console.error('Error handled by useError:', {
        error: apiError,
        type: classifyError(apiError),
        timestamp: new Date().toISOString(),
      });
    }

    // 执行自定义错误处理
    if (finalConfig.onError) {
      finalConfig.onError(apiError);
    }

    // 显示错误通知 (如果有通知系统的话)
    if (finalConfig.showNotification) {
      // 这里可以集成 toast 通知系统
      // toast.error(fullMessage);
    }

    return apiError;
  }, [finalConfig]);

  // 清除错误
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: '',
    });
  }, []);

  // 重试功能
  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    if (!finalConfig.retry?.enabled) {
      throw new Error('Retry is not enabled');
    }

    const { maxAttempts, delay } = finalConfig.retry;
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        clearError();
        return await operation();
      } catch (error) {
        lastError = handleError(error);
        
        if (attempt < maxAttempts) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError;
  }, [finalConfig.retry, handleError, clearError]);

  // 包装异步操作
  const wrapAsync = useCallback(<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<ErrorHandlerConfig>
  ) => {
    const mergedConfig = { ...finalConfig, ...customConfig };
    
    return async (): Promise<T> => {
      try {
        clearError();
        
        if (mergedConfig.retry?.enabled) {
          return await retry(operation);
        } else {
          return await operation();
        }
      } catch (error) {
        throw handleError(error);
      }
    };
  }, [finalConfig, handleError, clearError, retry]);

  return {
    // 错误状态
    ...errorState,
    
    // 错误处理方法
    handleError,
    clearError,
    retry,
    wrapAsync,
    
    // 错误分类工具
    classifyError: (error: ApiError) => classifyError(error),
    getFriendlyMessage: (error: ApiError) => getFriendlyErrorMessage(error),
    
    // 便捷的错误检查方法
    isNetworkError: errorState.error && classifyError(errorState.error) === 'network',
    isValidationError: errorState.error && classifyError(errorState.error) === 'validation',
    isAuthError: errorState.error && classifyError(errorState.error) === 'authentication',
    isServerError: errorState.error && classifyError(errorState.error) === 'server',
  };
};

// 表单错误处理 Hook
export const useFormError = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);
  
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _deleted, ...rest } = prev;
      void _deleted; // 标记为故意未使用
      return rest;
    });
  }, []);
  
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);
  
  const handleValidationError = useCallback((error: ApiError) => {
    if (error.code === 'VALIDATION_ERROR' && error.details) {
      // 假设验证错误详情是 { field: message } 格式
      if (typeof error.details === 'object') {
        setFieldErrors(error.details);
      }
    }
  }, []);
  
  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleValidationError,
    hasFieldError: (field: string) => !!fieldErrors[field],
    getFieldError: (field: string) => fieldErrors[field],
  };
};

// 全局错误边界 Hook
export const useGlobalError = () => {
  const [globalError, setGlobalError] = useState<ApiError | null>(null);
  
  const handleGlobalError = useCallback((error: ApiError) => {
    // 只处理严重错误
    const errorType = classifyError(error);
    if (['server', 'network'].includes(errorType)) {
      setGlobalError(error);
    }
  }, []);
  
  const clearGlobalError = useCallback(() => {
    setGlobalError(null);
  }, []);
  
  return {
    globalError,
    handleGlobalError,
    clearGlobalError,
    hasGlobalError: !!globalError,
  };
};