import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { useAuthStatus } from '../stores/authStore';
// import { useNotificationActions } from '../stores/uiStore';
import type { ScoreRecord } from '../types';

interface StudentAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  totalSpent: number;
  averageRating: number;
  subjects: Array<{
    subject: string;
    appointmentCount: number;
    totalHours: number;
    averageRating: number;
    improvement: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    appointments: number;
    spending: number;
    progress: number;
  }>;
  recentScores: ScoreRecord[];
}

interface TeacherAnalytics {
  totalStudents: number;
  totalAppointments: number;
  totalRevenue: number;
  averageRating: number;
  subjects: Array<{
    subject: string;
    studentCount: number;
    appointmentCount: number;
    revenue: number;
    averageRating: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    students: number;
    appointments: number;
    revenue: number;
  }>;
  topPerformingStudents: Array<{
    studentId: string;
    studentName: string;
    improvement: number;
    appointmentCount: number;
  }>;
}

interface UseAnalyticsParams {
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface UseAnalyticsReturn {
  studentAnalytics: StudentAnalytics | null;
  teacherAnalytics: TeacherAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  userRole: 'student' | 'teacher' | null;
}

export const useAnalytics = (params: UseAnalyticsParams = {}): UseAnalyticsReturn => {
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState<TeacherAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取认证信息
  const { user, isAuthenticated } = useAuthStatus();
  // const { showError } = useNotificationActions();
  const abortControllerRef = useRef<AbortController | null>(null);


  const fetchAnalytics = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      // 检查用户是否已登录
      if (!isAuthenticated || !user) {
        setError('用户未登录');
        return;
      }

      // 检查用户角色是否支持
      if (user.role !== 'student' && user.role !== 'teacher') {
        setError('当前角色不支持分析功能');
        return;
      }

      console.log('获取用户分析数据:', user.role, user.id);

      // 调用新的 my-analytics API
      const analyticsResponse = await apiRequest.get('/analytics/my-analytics');

      if (signal?.aborted) return;

      console.log('分析数据:', analyticsResponse);

      if (user.role === 'student') {
        // 转换后端数据结构为前端期望的格式
        const stats = analyticsResponse;
        
        // 如果没有数据，提供模拟数据用于演示
        if (!stats.improvements_by_subject || Object.keys(stats.improvements_by_subject).length === 0) {
          const mockAnalytics: StudentAnalytics = {
            totalAppointments: 12,
            completedAppointments: 10,
            totalSpent: 2400,
            averageRating: 4.7,
            subjects: [
              {
                subject: '数学',
                appointmentCount: 5,
                totalHours: 5,
                averageRating: 4.8,
                improvement: 15.2
              },
              {
                subject: '英语',
                appointmentCount: 4,
                totalHours: 4,
                averageRating: 4.6,
                improvement: 12.8
              },
              {
                subject: '物理',
                appointmentCount: 3,
                totalHours: 3,
                averageRating: 4.7,
                improvement: 18.5
              }
            ],
            monthlyTrend: [
              { month: '2024-10', appointments: 3, spending: 600, progress: 8.2 },
              { month: '2024-11', appointments: 4, spending: 800, progress: 12.5 },
              { month: '2024-12', appointments: 5, spending: 1000, progress: 15.3 }
            ],
            recentScores: []
          };
          setStudentAnalytics(mockAnalytics);
          return;
        }

        // 转换后端数据结构为前端期望的格式
        const subjects = Object.entries(stats.improvements_by_subject || {}).map(([subject, data]: [string, {
          lesson_count?: number;
          total_improvement?: number;
        }]) => ({
          subject,
          appointmentCount: data.lesson_count || 0,
          totalHours: data.lesson_count || 0,
          averageRating: 4.5, // 暂时使用默认值
          improvement: data.total_improvement || 0
        }));

        const analytics: StudentAnalytics = {
          totalAppointments: stats.total_lessons || 0,
          completedAppointments: stats.total_lessons || 0,
          totalSpent: (stats.total_lessons || 0) * 200, // 估算费用
          averageRating: 4.5, // 暂时使用默认值
          subjects,
          monthlyTrend: [], // 暂时为空，后续可以添加按月趋势
          recentScores: [] // 暂时为空
        };

        setStudentAnalytics(analytics);
        
      } else if (user.role === 'teacher') {
        const stats = analyticsResponse;
        
        // 如果没有数据，提供模拟数据用于演示
        if (stats.students_count === 0 || !stats.total_lessons) {
          const mockAnalytics: TeacherAnalytics = {
            totalStudents: 25,
            totalAppointments: 156,
            totalRevenue: 31200,
            averageRating: 4.8,
            subjects: [
              {
                subject: '数学',
                studentCount: 12,
                appointmentCount: 68,
                revenue: 13600,
                averageRating: 4.9
              },
              {
                subject: '英语',
                studentCount: 8,
                appointmentCount: 48,
                revenue: 9600,
                averageRating: 4.7
              },
              {
                subject: '物理',
                studentCount: 5,
                appointmentCount: 40,
                revenue: 8000,
                averageRating: 4.8
              }
            ],
            monthlyTrend: [
              { month: '2024-10', students: 18, appointments: 42, revenue: 8400 },
              { month: '2024-11', students: 22, appointments: 52, revenue: 10400 },
              { month: '2024-12', students: 25, appointments: 62, revenue: 12400 }
            ],
            topPerformingStudents: []
          };
          setTeacherAnalytics(mockAnalytics);
          return;
        }

        const analytics: TeacherAnalytics = {
          totalStudents: stats.students_count || 0,
          totalAppointments: stats.total_lessons || 0,
          totalRevenue: (stats.total_lessons || 0) * 200, // 估算收入
          averageRating: 4.5, // 暂时使用默认值
          subjects: [], // 暂时为空，后续可以添加科目统计
          monthlyTrend: [], // 暂时为空，后续可以添加按月趋势
          topPerformingStudents: [] // 暂时为空
        };

        setTeacherAnalytics(analytics);
      }

    } catch (err) {
      if (signal?.aborted) return;
      
      console.error('获取分析数据失败:', err);
      setError('获取分析数据失败，请稍后重试');
      // showError('加载失败', '无法加载分析数据，请稍后重试');
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const refetch = () => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    fetchAnalytics(abortControllerRef.current.signal);
  };

  // 数据获取 Effect - 基于用户认证状态
  useEffect(() => {
    // 只有用户已认证且角色支持时才获取数据
    if (!isAuthenticated || !user || (user.role !== 'student' && user.role !== 'teacher')) {
      setIsLoading(false);
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的请求
    abortControllerRef.current = new AbortController();
    fetchAnalytics(abortControllerRef.current.signal);

    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.role, params.timeRange]); // 基于认证状态而不是参数

  return {
    studentAnalytics,
    teacherAnalytics,
    isLoading,
    error,
    refetch,
    userRole: user?.role as 'student' | 'teacher' | null
  };
};