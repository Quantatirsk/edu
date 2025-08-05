import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
import type { ApiError } from './api';

// React Query 默认配置
const defaultOptions: DefaultOptions = {
  queries: {
    // 5分钟缓存时间
    staleTime: 5 * 60 * 1000,
    // 10分钟垃圾回收时间
    gcTime: 10 * 60 * 1000,
    // 失败重试配置
    retry: (failureCount, error) => {
      const apiError = error as ApiError;
      
      // 不重试的错误类型
      const noRetryErrors = ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_ERROR'];
      if (apiError.code && noRetryErrors.includes(apiError.code)) {
        return false;
      }
      
      // 最多重试3次
      return failureCount < 3;
    },
    // 重试延迟 (指数退避)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // 窗口焦点时重新获取
    refetchOnWindowFocus: false,
    // 网络重连时重新获取
    refetchOnReconnect: true,
    // 挂载时重新获取
    refetchOnMount: true,
  },
  mutations: {
    // 失败重试配置 (突变通常不重试)
    retry: false,
    // 突变网络模式
    networkMode: 'online',
  },
};

// 创建 Query Client 实例
export const queryClient = new QueryClient({
  defaultOptions,
});

// Query Keys 工厂函数
export const queryKeys = {
  // 基础键值
  all: ['api'] as const,
  
  // 用户相关
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), 'user', id] as const,
  userProfile: () => [...queryKeys.users(), 'profile'] as const,
  
  // 教师相关
  teachers: () => [...queryKeys.all, 'teachers'] as const,
  teacher: (id: string) => [...queryKeys.teachers(), 'teacher', id] as const,
  teachersList: (filters?: Record<string, unknown>) => 
    [...queryKeys.teachers(), 'list', filters] as const,
  teachersNearby: (location?: { lat: number; lng: number }) => 
    [...queryKeys.teachers(), 'nearby', location] as const,
  
  // 学生相关
  students: () => [...queryKeys.all, 'students'] as const,
  student: (id: string) => [...queryKeys.students(), 'student', id] as const,
  studentProfile: () => [...queryKeys.students(), 'profile'] as const,
  
  // 预约相关
  appointments: () => [...queryKeys.all, 'appointments'] as const,
  appointment: (id: string) => [...queryKeys.appointments(), 'appointment', id] as const,
  userAppointments: (userId: string) => 
    [...queryKeys.appointments(), 'user', userId] as const,
  teacherAppointments: (teacherId: string) => 
    [...queryKeys.appointments(), 'teacher', teacherId] as const,
  
  // 评价相关
  reviews: () => [...queryKeys.all, 'reviews'] as const,
  review: (id: string) => [...queryKeys.reviews(), 'review', id] as const,
  teacherReviews: (teacherId: string) => 
    [...queryKeys.reviews(), 'teacher', teacherId] as const,
  userReviews: (userId: string) => 
    [...queryKeys.reviews(), 'user', userId] as const,
  
  // 成绩记录相关
  scoreRecords: () => [...queryKeys.all, 'scoreRecords'] as const,
  scoreRecord: (id: string) => [...queryKeys.scoreRecords(), 'record', id] as const,
  studentScores: (studentId: string) => 
    [...queryKeys.scoreRecords(), 'student', studentId] as const,
  
  // 分析数据相关
  analytics: () => [...queryKeys.all, 'analytics'] as const,
  studentAnalytics: (studentId: string) => 
    [...queryKeys.analytics(), 'student', studentId] as const,
  teacherAnalytics: (teacherId: string) => 
    [...queryKeys.analytics(), 'teacher', teacherId] as const,
  
  // 搜索相关
  search: (query: string, type?: string) => 
    [...queryKeys.all, 'search', query, type] as const,
};

// 缓存无效化工具函数
export const invalidateQueries = {
  // 无效化所有查询
  all: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
  
  // 无效化用户相关查询
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users() }),
  user: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.user(id) }),
  
  // 无效化教师相关查询
  teachers: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers() }),
  teacher: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.teacher(id) }),
  
  // 无效化预约相关查询
  appointments: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments() }),
  userAppointments: (userId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.userAppointments(userId) }),
  
  // 无效化评价相关查询
  reviews: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviews() }),
  teacherReviews: (teacherId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.teacherReviews(teacherId) }),
  
  // 无效化分析数据查询
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics() }),
};

// 预取数据工具函数
export const prefetchQueries = {
  // 预取教师列表
  teachersList: async (filters?: Record<string, unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teachersList(filters),
      staleTime: 5 * 60 * 1000, // 5分钟
    });
  },
  
  // 预取教师详情
  teacher: async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teacher(id),
      staleTime: 10 * 60 * 1000, // 10分钟
    });
  },
  
  // 预取用户预约
  userAppointments: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.userAppointments(userId),
      staleTime: 2 * 60 * 1000, // 2分钟
    });
  },
};

// 查询缓存管理
export const cacheManager = {
  // 设置查询数据
  setQueryData: <T>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // 获取查询数据
  getQueryData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
  
  // 移除查询缓存
  removeQueries: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // 清除所有缓存
  clear: () => {
    queryClient.clear();
  },
  
  // 获取缓存统计
  getStats: () => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    
    return {
      queries: {
        total: queryCache.getAll().length,
        fresh: queryCache.getAll().filter(q => q.state.dataUpdatedAt > Date.now() - 300000).length,
        stale: queryCache.getAll().filter(q => q.isStale()).length,
        inactive: queryCache.getAll().filter(q => !q.getObserversCount()).length,
      },
      mutations: {
        total: mutationCache.getAll().length,
        pending: mutationCache.getAll().filter(m => m.state.status === 'pending').length,
      },
    };
  },
};

// 离线支持配置
export const offlineConfig = {
  // 网络状态检测
  isOnline: () => typeof navigator !== 'undefined' ? navigator.onLine : true,
  
  // 设置离线查询行为
  setOfflineQueries: () => {
    queryClient.setDefaultOptions({
      queries: {
        ...defaultOptions.queries,
        // 离线时使用缓存数据
        networkMode: 'offlineFirst',
        // 减少重试次数
        retry: 1,
        // 增加缓存时间
        staleTime: 30 * 60 * 1000, // 30分钟
        gcTime: 60 * 60 * 1000, // 1小时
      },
    });
  },
  
  // 恢复在线查询行为
  setOnlineQueries: () => {
    queryClient.setDefaultOptions(defaultOptions);
  },
};

// 错误处理中心
export const errorHandler = {
  // 全局错误处理函数
  handleError: (error: ApiError) => {
    console.error('API Error:', error);
    
    // 根据错误类型执行不同操作
    switch (error.code) {
      case 'UNAUTHORIZED':
        // 清除认证状态并重定向到登录页
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
        break;
        
      case 'NETWORK_ERROR':
        // 启用离线模式
        offlineConfig.setOfflineQueries();
        break;
        
      case 'VALIDATION_ERROR':
        // 显示表单验证错误 (由组件处理)
        break;
        
      default:
        // 显示通用错误提示 (由组件处理)
        break;
    }
  },
  
  // 突变错误处理
  handleMutationError: (error: ApiError, context?: { previousData?: unknown }) => {
    console.error('Mutation Error:', error, context);
    
    // 乐观更新失败时的回滚逻辑
    if (context?.previousData) {
      // 回滚数据 (具体实现由各个突变处理)
    }
    
    errorHandler.handleError(error);
  },
};