import { useState, useEffect, useRef } from 'react';
import { TeacherService } from '../services/teacherService';
// import { useNotificationActions } from '../stores/uiStore';
import type { Teacher } from '../types';

interface UseTeachersParams {
  searchQuery?: string;
  selectedSubject?: string;
  sortBy?: string;
  currentLocation?: { lat: number; lng: number } | null;
}

interface UseTeachersReturn {
  teachers: Teacher[];
  subjects: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTeachers = (params: UseTeachersParams = {}): UseTeachersReturn => {
  // Destructure params to get stable values
  const { searchQuery, selectedSubject, sortBy, currentLocation } = params;
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // const { showError } = useNotificationActions();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      // 并行获取教师列表和科目列表  
      const [teachersResponse, subjectsResponse] = await Promise.allSettled([
        TeacherService.getTeachers({
          query: searchQuery,
          filters: {
            subject: selectedSubject && selectedSubject !== 'all' 
              ? [selectedSubject] 
              : undefined,
            location: currentLocation ? {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              radius: 50
            } : undefined
          },
          sortBy: sortBy === 'rating-desc' ? 'rating' : 
                 sortBy === 'price-asc' ? 'price' : 
                 sortBy === 'experience-desc' ? 'experience' : 'rating',
          sortOrder: sortBy?.includes('desc') ? 'desc' : 'asc',
          page: 1,
          limit: 50
        }),
        TeacherService.getSubjects()
      ]);

      if (signal?.aborted) return;

      // 处理教师数据
      if (teachersResponse.status === 'fulfilled') {
        console.log('教师数据响应:', teachersResponse.value);
        const teachers = teachersResponse.value.teachers || [];
        if (teachers.length > 0) {
          console.log('第一个教师数据结构:', teachers[0]);
        }
        setTeachers(teachers);
      } else {
        console.error('获取教师列表失败:', teachersResponse.reason);
        setError('获取教师列表失败');
      }

      // 处理科目数据
      if (subjectsResponse.status === 'fulfilled') {
        console.log('科目数据响应:', subjectsResponse.value);
        setSubjects(subjectsResponse.value.map(s => s.subject));
      } else {
        console.error('获取科目列表失败:', subjectsResponse.reason);
        // 科目获取失败不影响主要功能，只记录错误
      }

    } catch (err) {
      if (signal?.aborted) return;
      
      console.error('获取数据失败:', err);
      setError('获取数据失败，请稍后重试');
      // showError('加载失败', '无法加载教师数据，请稍后重试');
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
    fetchData(abortControllerRef.current.signal);
  };

  // 防抖数据获取
  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 设置防抖
    timeoutRef.current = setTimeout(() => {
      abortControllerRef.current = new AbortController();
      fetchData(abortControllerRef.current.signal);
    }, 300);

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedSubject,
    sortBy,
    currentLocation?.lat,
    currentLocation?.lng
  ]); // fetchData is intentionally not included to avoid infinite loops

  return {
    teachers,
    subjects,
    isLoading,
    error,
    refetch
  };
};