import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 基础配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API配置常量
export const APIConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
} as const;

// API 错误类型定义
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 创建 Axios 实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 添加认证 token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求时间戳
      config.metadata = { ...config.metadata, startTime: Date.now() };
      
      // 开发模式下打印请求信息
      if (import.meta.env.DEV) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // 计算请求耗时
      const duration = Date.now() - (response.config.metadata?.startTime || 0);
      
      // 开发模式下打印响应信息
      if (import.meta.env.DEV) {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
          status: response.status,
          data: response.data,
        });
      }

      return response;
    },
    (error: AxiosError) => {
      const apiError = handleApiError(error);
      
      // 开发模式下打印错误信息
      if (import.meta.env.DEV) {
        console.error('❌ API Error:', apiError);
      }

      return Promise.reject(apiError);
    }
  );

  return client;
};

// API 错误处理函数
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    const message = (data as any)?.message || error.message || '服务器错误';
    
    switch (status) {
      case 400:
        return {
          message: message || '请求参数错误',
          code: 'BAD_REQUEST',
          status,
          details: data,
        };
      case 401:
        // 清除过期的认证信息
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        return {
          message: '认证失败，请重新登录',
          code: 'UNAUTHORIZED',
          status,
        };
      case 403:
        return {
          message: '没有权限访问此资源',
          code: 'FORBIDDEN',
          status,
        };
      case 404:
        return {
          message: '请求的资源不存在',
          code: 'NOT_FOUND',
          status,
        };
      case 422:
        return {
          message: '数据验证失败',
          code: 'VALIDATION_ERROR',
          status,
          details: data,
        };
      case 500:
        return {
          message: '服务器内部错误',
          code: 'INTERNAL_SERVER_ERROR',
          status,
        };
      default:
        return {
          message: message || '网络请求失败',
          code: 'UNKNOWN_ERROR',
          status,
          details: data,
        };
    }
  } else if (error.request) {
    // 网络错误
    return {
      message: '网络连接失败，请检查网络设置',
      code: 'NETWORK_ERROR',
    };
  } else {
    // 其他错误
    return {
      message: error.message || '未知错误',
      code: 'UNKNOWN_ERROR',
    };
  }
};

// 创建全局 API 客户端实例
export const apiClient = createApiClient();

// API 请求包装函数
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get<ApiResponse<T>>(url, config).then(response => response.data.data),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post<ApiResponse<T>>(url, data, config).then(response => response.data.data),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put<ApiResponse<T>>(url, data, config).then(response => response.data.data),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then(response => response.data.data),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete<ApiResponse<T>>(url, config).then(response => response.data.data),
};

// 分页请求函数
export const paginatedRequest = <T = any>(
  url: string, 
  params?: { page?: number; limit?: number; [key: string]: any },
  config?: AxiosRequestConfig
): Promise<PaginatedResponse<T>> =>
  apiClient.get<PaginatedResponse<T>>(url, { ...config, params }).then(response => response.data);

// 错误重试逻辑
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 指数退避延迟
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw new Error('Max retries exceeded');
};

// 请求取消管理
export class RequestCancelManager {
  private controllers = new Map<string, AbortController>();

  cancel(key: string) {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  cancelAll() {
    this.controllers.forEach(controller => controller.abort());
    this.controllers.clear();
  }

  createRequest<T>(
    key: string,
    requestFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    // 取消之前的同类请求
    this.cancel(key);

    const controller = new AbortController();
    this.controllers.set(key, controller);

    return requestFn(controller.signal).finally(() => {
      this.controllers.delete(key);
    });
  }
}

// 全局请求取消管理实例
export const requestCancelManager = new RequestCancelManager();

// TypeScript 模块声明扩展
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
      [key: string]: any;
    };
  }
}