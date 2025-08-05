import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '../utils/api';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import type { Teacher, User, DetailedReview, Appointment, ScoreRecord } from '../types';

// 通用查询选项类型
type QueryOptions<T> = Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>;

// 通用突变选项类型  
type MutationOptions<TData, TVariables> = UseMutationOptions<TData, ApiError, TVariables>;

// ==================== 教师相关 API Hooks ====================

// 获取教师列表
export const useTeachers = (
  filters?: { subject?: string; location?: string; priceRange?: [number, number] },
  options?: QueryOptions<Teacher[]>
) => {
  return useQuery({
    queryKey: queryKeys.teachersList(filters),
    queryFn: () => apiRequest.get<Teacher[]>('/teachers', { params: filters }),
    ...options,
  });
};

// 获取教师详情
export const useTeacher = (
  teacherId: string,
  options?: QueryOptions<Teacher>
) => {
  return useQuery({
    queryKey: queryKeys.teacher(teacherId),
    queryFn: () => apiRequest.get<Teacher>(`/teachers/${teacherId}`),
    enabled: !!teacherId,
    ...options,
  });
};

// 搜索附近教师
export const useNearbyTeachers = (
  location: { lat: number; lng: number },
  radius: number = 10,
  options?: QueryOptions<Teacher[]>
) => {
  return useQuery({
    queryKey: queryKeys.teachersNearby(location),
    queryFn: () => apiRequest.get<Teacher[]>('/teachers/nearby', {
      params: { lat: location.lat, lng: location.lng, radius }
    }),
    enabled: !!(location.lat && location.lng),
    ...options,
  });
};

// 创建教师档案
export const useCreateTeacher = (
  options?: MutationOptions<Teacher, Partial<Teacher>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (teacherData: Partial<Teacher>) => 
      apiRequest.post<Teacher>('/teachers', teacherData),
    onSuccess: (data) => {
      // 无效化教师列表缓存
      invalidateQueries.teachers();
      // 设置新教师数据到缓存
      queryClient.setQueryData(queryKeys.teacher(data.id), data);
    },
    ...options,
  });
};

// 更新教师信息
export const useUpdateTeacher = (
  options?: MutationOptions<Teacher, { id: string; data: Partial<Teacher> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      apiRequest.put<Teacher>(`/teachers/${id}`, data),
    onSuccess: (data, variables) => {
      // 更新教师详情缓存
      queryClient.setQueryData(queryKeys.teacher(variables.id), data);
      // 无效化教师列表缓存
      invalidateQueries.teachers();
    },
    ...options,
  });
};

// ==================== 用户相关 API Hooks ====================

// 获取当前用户信息
export const useCurrentUser = (options?: QueryOptions<User>) => {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: () => apiRequest.get<User>('/auth/profile'),
    ...options,
  });
};

// 更新用户信息
export const useUpdateUser = (
  options?: MutationOptions<User, Partial<User>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) =>
      apiRequest.put<User>('/auth/profile', userData),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userProfile(), data);
    },
    ...options,
  });
};

// ==================== 预约相关 API Hooks ====================

// 获取用户预约列表
export const useUserAppointments = (
  userId: string,
  options?: QueryOptions<Appointment[]>
) => {
  return useQuery({
    queryKey: queryKeys.userAppointments(userId),
    queryFn: () => apiRequest.get<Appointment[]>(`/appointments/user/${userId}`),
    enabled: !!userId,
    ...options,
  });
};

// 获取教师预约列表  
export const useTeacherAppointments = (
  teacherId: string,
  options?: QueryOptions<Appointment[]>
) => {
  return useQuery({
    queryKey: queryKeys.teacherAppointments(teacherId),
    queryFn: () => apiRequest.get<Appointment[]>(`/appointments/teacher/${teacherId}`),
    enabled: !!teacherId,
    ...options,
  });
};

// 创建预约
export const useCreateAppointment = (
  options?: MutationOptions<Appointment, Partial<Appointment>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentData: Partial<Appointment>) =>
      apiRequest.post<Appointment>('/appointments', appointmentData),
    onSuccess: (data) => {
      // 无效化相关预约缓存
      invalidateQueries.appointments();
      if (data.studentId) {
        invalidateQueries.userAppointments(data.studentId);
      }
      if (data.teacherId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teacherAppointments(data.teacherId) });
      }
    },
    ...options,
  });
};

// 更新预约状态
export const useUpdateAppointment = (
  options?: MutationOptions<Appointment, { id: string; data: Partial<Appointment> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      apiRequest.put<Appointment>(`/appointments/${id}`, data),
    onSuccess: (data, variables) => {
      // 更新预约详情缓存
      queryClient.setQueryData(queryKeys.appointment(variables.id), data);
      // 无效化相关预约列表缓存
      invalidateQueries.appointments();
    },
    ...options,
  });
};

// 取消预约
export const useCancelAppointment = (
  options?: MutationOptions<void, string>
) => {
  return useMutation({
    mutationFn: (appointmentId: string) =>
      apiRequest.delete(`/appointments/${appointmentId}`),
    onSuccess: () => {
      invalidateQueries.appointments();
    },
    ...options,
  });
};

// ==================== 评价相关 API Hooks ====================

// 获取教师评价
export const useTeacherReviews = (
  teacherId: string,
  options?: QueryOptions<DetailedReview[]>
) => {
  return useQuery({
    queryKey: queryKeys.teacherReviews(teacherId),
    queryFn: () => apiRequest.get<DetailedReview[]>(`/reviews/teacher/${teacherId}`),
    enabled: !!teacherId,
    ...options,
  });
};

// 创建评价
export const useCreateReview = (
  options?: MutationOptions<DetailedReview, Partial<DetailedReview>>
) => {
  return useMutation({
    mutationFn: (reviewData: Partial<DetailedReview>) =>
      apiRequest.post<DetailedReview>('/reviews', reviewData),
    onSuccess: (data) => {
      // 无效化教师评价缓存
      if (data.teacherId) {
        invalidateQueries.teacherReviews(data.teacherId);
      }
      // 无效化教师详情缓存 (因为评分可能变化)
      if (data.teacherId) {
        invalidateQueries.teacher(data.teacherId);
      }
    },
    ...options,
  });
};

// ==================== 成绩记录相关 API Hooks ====================

// 获取学生成绩记录
export const useStudentScores = (
  studentId: string,
  options?: QueryOptions<ScoreRecord[]>
) => {
  return useQuery({
    queryKey: queryKeys.studentScores(studentId),
    queryFn: () => apiRequest.get<ScoreRecord[]>(`/scores/student/${studentId}`),
    enabled: !!studentId,
    ...options,
  });
};

// 创建成绩记录
export const useCreateScoreRecord = (
  options?: MutationOptions<ScoreRecord, Partial<ScoreRecord>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scoreData: Partial<ScoreRecord>) =>
      apiRequest.post<ScoreRecord>('/scores', scoreData),
    onSuccess: (data) => {
      // 无效化学生成绩缓存
      if (data.studentId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.studentScores(data.studentId) });
      }
      // 无效化分析数据缓存
      invalidateQueries.analytics();
    },
    ...options,
  });
};

// ==================== 搜索相关 API Hooks ====================

// 搜索教师和内容
export const useSearch = (
  query: string,
  type?: 'teachers' | 'all',
  options?: QueryOptions<{ teachers: Teacher[]; total: number }>
) => {
  return useQuery({
    queryKey: queryKeys.search(query, type),
    queryFn: () => apiRequest.get<{ teachers: Teacher[]; total: number }>('/search', {
      params: { q: query, type }
    }),
    enabled: query.length >= 2, // 至少2个字符才搜索
    ...options,
  });
};

// ==================== 分析数据相关 API Hooks ====================

// 获取学生学习分析数据
export const useStudentAnalytics = (
  studentId: string,
  options?: QueryOptions<{
    progress: { date: string; score: number; subject: string }[];
    subjects: { name: string; score: number; improvement: number }[];
    performance: { overall: number; trend: 'up' | 'down' | 'stable' };
    recommendations: string[];
  }>
) => {
  return useQuery({
    queryKey: queryKeys.studentAnalytics(studentId),
    queryFn: () => apiRequest.get(`/analytics/student/${studentId}`),
    enabled: !!studentId,
    ...options,
  });
};

// 获取教师教学分析数据
export const useTeacherAnalytics = (
  teacherId: string,
  options?: QueryOptions<{
    students: number;
    ratings: { date: string; rating: number; studentName: string }[];
    earnings: { month: string; amount: number }[];
    subjects: { name: string; studentCount: number; avgRating: number }[];
  }>
) => {
  return useQuery({
    queryKey: queryKeys.teacherAnalytics(teacherId),
    queryFn: () => apiRequest.get(`/analytics/teacher/${teacherId}`),
    enabled: !!teacherId,
    ...options,
  });
};