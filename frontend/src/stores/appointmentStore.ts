import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import type { Appointment } from '../types';
import { apiRequest } from '../utils/api';

// 预约状态类型
export type AppointmentStatus = 
  | 'pending'     // 待确认
  | 'confirmed'   // 已确认
  | 'cancelled'   // 已取消
  | 'completed'   // 已完成
  | 'no-show'     // 未出席
  | 'rescheduled'; // 已改期

// 预约筛选类型
export interface AppointmentFilters {
  status: AppointmentStatus[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  teacherId?: string;
  studentId?: string;
  subject?: string;
}

// 预约排序类型
export type AppointmentSortOption = 
  | 'date-asc'
  | 'date-desc'
  | 'status'
  | 'teacher'
  | 'student'
  | 'price';

// 预约状态接口
export interface AppointmentState {
  // 预约列表
  appointments: Appointment[];
  filteredAppointments: Appointment[];
  selectedAppointment: Appointment | null;
  
  // 列表状态
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
  
  // 筛选和排序
  filters: AppointmentFilters;
  sortBy: AppointmentSortOption;
  searchQuery: string;
  
  // 创建预约状态
  isCreating: boolean;
  createError: string | null;
  
  // 更新预约状态
  updatingIds: Set<string>;
  updateErrors: Record<string, string>;
  
  // 缓存策略
  cache: {
    lastFetch: number;
    ttl: number;
    version: string;
  };
  
  // 统计信息
  statistics: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    popularTimeSlots: Array<{ time: string; count: number }>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  };
}

// 预约操作接口
export interface AppointmentActions {
  // 基本数据操作
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  
  // 选择操作
  selectAppointment: (appointment: Appointment | null) => void;
  selectAppointmentById: (id: string) => void;
  
  // 加载状态
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  
  // 分页操作
  setPage: (page: number) => void;
  nextPage: () => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  
  // 筛选操作
  setFilters: (filters: Partial<AppointmentFilters>) => void;
  resetFilters: () => void;
  setStatusFilter: (status: AppointmentStatus[]) => void;
  setDateRangeFilter: (start: Date | null, end: Date | null) => void;
  setTeacherFilter: (teacherId?: string) => void;
  setStudentFilter: (studentId?: string) => void;
  
  // 搜索操作
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // 排序操作
  setSortBy: (sort: AppointmentSortOption) => void;
  
  // 预约状态管理
  setCreating: (creating: boolean) => void;
  setCreateError: (error: string | null) => void;
  setUpdatingId: (id: string, updating: boolean) => void;
  setUpdateError: (id: string, error: string | null) => void;
  
  // 预约操作
  createAppointment: (appointmentData: Omit<Appointment, 'id'>) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: Date, newTime: string) => Promise<void>;
  completeAppointment: (id: string, rating?: number, review?: string) => Promise<void>;
  
  // 数据处理
  applyFiltersAndSort: () => void;
  searchAppointments: (query: string) => Appointment[];
  getAppointmentsByStatus: (status: AppointmentStatus) => Appointment[];
  getUpcomingAppointments: (days?: number) => Appointment[];
  getAppointmentsByTeacher: (teacherId: string) => Appointment[];
  getAppointmentsByStudent: (studentId: string) => Appointment[];
  
  // 统计操作
  updateStatistics: () => void;
  getAppointmentsByDateRange: (start: Date, end: Date) => Appointment[];
  getRevenueByMonth: (year: number) => Array<{ month: string; revenue: number }>;
  
  // 缓存操作
  updateCache: () => void;
  isCacheValid: () => boolean;
  clearCache: () => void;
  
  // 工具方法
  canCancelAppointment: (appointment: Appointment) => boolean;
  canRescheduleAppointment: (appointment: Appointment) => boolean;
  getAppointmentDuration: (appointment: Appointment) => number;
  isAppointmentConflict: (date: Date, time: string, teacherId: string, excludeId?: string) => boolean;
  
  // 重置状态
  reset: () => void;
}

// 默认筛选条件
const defaultFilters: AppointmentFilters = {
  status: [],
  dateRange: {
    start: null,
    end: null,
  },
  teacherId: undefined,
  studentId: undefined,
  subject: undefined,
};

// 默认状态
const initialState: AppointmentState = {
  appointments: [],
  filteredAppointments: [],
  selectedAppointment: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  total: 0,
  page: 1,
  pageSize: 20,
  filters: defaultFilters,
  sortBy: 'date-desc',
  searchQuery: '',
  isCreating: false,
  createError: null,
  updatingIds: new Set(),
  updateErrors: {},
  cache: {
    lastFetch: 0,
    ttl: 2 * 60 * 1000, // 2分钟
    version: '1.0',
  },
  statistics: {
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0,
    popularTimeSlots: [],
    revenueByMonth: [],
  },
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 创建预约 Store
export const useAppointmentStore = create<AppointmentState & AppointmentActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 基本数据操作
        setAppointments: (appointments) => {
          set({ appointments });
          get().applyFiltersAndSort();
          get().updateStatistics();
        },
        
        addAppointment: (appointment) => {
          set((state) => ({
            appointments: [...state.appointments, appointment],
            total: state.total + 1,
          }));
          get().applyFiltersAndSort();
          get().updateStatistics();
        },
        
        updateAppointment: (id, updates) => {
          set((state) => ({
            appointments: state.appointments.map(appointment =>
              appointment.id === id ? { ...appointment, ...updates } : appointment
            ),
          }));
          get().applyFiltersAndSort();
          
          // 更新选中的预约
          const { selectedAppointment } = get();
          if (selectedAppointment && selectedAppointment.id === id) {
            set({ selectedAppointment: { ...selectedAppointment, ...updates } });
          }
        },
        
        removeAppointment: (id) => {
          set((state) => ({
            appointments: state.appointments.filter(appointment => appointment.id !== id),
            total: Math.max(0, state.total - 1),
          }));
          get().applyFiltersAndSort();
          
          // 清除相关状态
          const { selectedAppointment } = get();
          if (selectedAppointment && selectedAppointment.id === id) {
            set({ selectedAppointment: null });
          }
        },
        
        // 选择操作
        selectAppointment: (appointment) => {
          set({ selectedAppointment: appointment });
        },
        
        selectAppointmentById: (id) => {
          const appointment = get().appointments.find(a => a.id === id) || null;
          get().selectAppointment(appointment);
        },
        
        // 加载状态
        setLoading: (isLoading) => set({ isLoading }),
        setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
        setHasMore: (hasMore) => set({ hasMore }),
        
        // 分页操作
        setPage: (page) => set({ page }),
        nextPage: () => set((state) => ({ page: state.page + 1 })),
        setPageSize: (pageSize) => set({ pageSize, page: 1 }),
        setTotal: (total) => set({ total }),
        
        // 筛选操作
        setFilters: (newFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
            page: 1,
          }));
          get().applyFiltersAndSort();
        },
        
        resetFilters: () => {
          set({ filters: defaultFilters, page: 1 });
          get().applyFiltersAndSort();
        },
        
        setStatusFilter: (status) => {
          get().setFilters({ status });
        },
        
        setDateRangeFilter: (start, end) => {
          get().setFilters({ dateRange: { start, end } });
        },
        
        setTeacherFilter: (teacherId) => {
          get().setFilters({ teacherId });
        },
        
        setStudentFilter: (studentId) => {
          get().setFilters({ studentId });
        },
        
        // 搜索操作
        setSearchQuery: (searchQuery) => {
          set({ searchQuery, page: 1 });
          get().applyFiltersAndSort();
        },
        
        clearSearch: () => {
          set({ searchQuery: '' });
          get().applyFiltersAndSort();
        },
        
        // 排序操作
        setSortBy: (sortBy) => {
          set({ sortBy });
          get().applyFiltersAndSort();
        },
        
        // 预约状态管理
        setCreating: (isCreating) => set({ isCreating }),
        setCreateError: (createError) => set({ createError }),
        
        setUpdatingId: (id, updating) => {
          set((state) => {
            const updatingIds = new Set(state.updatingIds);
            if (updating) {
              updatingIds.add(id);
            } else {
              updatingIds.delete(id);
            }
            return { updatingIds };
          });
        },
        
        setUpdateError: (id, error) => {
          set((state) => {
            const newErrors = { ...state.updateErrors };
            if (error) {
              newErrors[id] = error;
            } else {
              delete newErrors[id];
            }
            return { updateErrors: newErrors };
          });
        },
        
        // 预约操作 - 使用真实API调用
        createAppointment: async (appointmentData) => {
          get().setCreating(true);
          get().setCreateError(null);
          
          try {
            // 调用真实API
            const newAppointment = await apiRequest.post('/appointments', appointmentData);
            get().addAppointment(newAppointment);
            
            return newAppointment;
          } catch (error) {
            get().setCreateError((error as Error).message);
            throw error;
          } finally {
            get().setCreating(false);
          }
        },
        
        confirmAppointment: async (id) => {
          get().setUpdatingId(id, true);
          get().setUpdateError(id, null);
          
          try {
            get().updateAppointment(id, { 
              status: 'confirmed',
              updatedAt: new Date().toISOString().split('T')[0],
            });
          } catch (error) {
            get().setUpdateError(id, (error as Error).message);
            throw error;
          } finally {
            get().setUpdatingId(id, false);
          }
        },
        
        cancelAppointment: async (id, reason) => {
          get().setUpdatingId(id, true);
          get().setUpdateError(id, null);
          
          try {
            get().updateAppointment(id, { 
              status: 'cancelled',
              cancelReason: reason,
              updatedAt: new Date().toISOString().split('T')[0],
            });
          } catch (error) {
            get().setUpdateError(id, (error as Error).message);
            throw error;
          } finally {
            get().setUpdatingId(id, false);
          }
        },
        
        rescheduleAppointment: async (id, newDate, newTime) => {
          get().setUpdatingId(id, true);
          get().setUpdateError(id, null);
          
          try {
            get().updateAppointment(id, { 
              date: newDate.toISOString().split('T')[0],
              time: newTime,
              status: 'rescheduled',
              updatedAt: new Date().toISOString().split('T')[0],
            });
          } catch (error) {
            get().setUpdateError(id, (error as Error).message);
            throw error;
          } finally {
            get().setUpdatingId(id, false);
          }
        },
        
        completeAppointment: async (id, rating, review) => {
          get().setUpdatingId(id, true);
          get().setUpdateError(id, null);
          
          try {
            get().updateAppointment(id, { 
              status: 'completed',
              rating,
              review,
              completedAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            });
          } catch (error) {
            get().setUpdateError(id, (error as Error).message);
            throw error;
          } finally {
            get().setUpdatingId(id, false);
          }
        },
        
        // 数据处理
        applyFiltersAndSort: () => {
          const { appointments, filters, sortBy, searchQuery } = get();
          
          let filtered = appointments;
          
          // 应用搜索
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(appointment =>
              appointment.teacherName.toLowerCase().includes(query) ||
              appointment.studentName.toLowerCase().includes(query) ||
              appointment.subject.toLowerCase().includes(query) ||
              appointment.notes?.toLowerCase().includes(query)
            );
          }
          
          // 应用筛选
          if (filters.status.length > 0) {
            filtered = filtered.filter(appointment =>
              filters.status.includes(appointment.status as AppointmentStatus)
            );
          }
          
          if (filters.dateRange.start || filters.dateRange.end) {
            filtered = filtered.filter(appointment => {
              const appointmentDate = new Date(appointment.date);
              const start = filters.dateRange.start;
              const end = filters.dateRange.end;
              
              if (start && appointmentDate < start) return false;
              if (end && appointmentDate > end) return false;
              return true;
            });
          }
          
          if (filters.teacherId) {
            filtered = filtered.filter(appointment => 
              appointment.teacherId === filters.teacherId
            );
          }
          
          if (filters.studentId) {
            filtered = filtered.filter(appointment => 
              appointment.studentId === filters.studentId
            );
          }
          
          if (filters.subject) {
            filtered = filtered.filter(appointment => 
              appointment.subject === filters.subject
            );
          }
          
          // 应用排序
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'date-asc':
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              case 'date-desc':
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              case 'status':
                return a.status.localeCompare(b.status);
              case 'teacher':
                return a.teacherName.localeCompare(b.teacherName);
              case 'student':
                return a.studentName.localeCompare(b.studentName);
              case 'price':
                return b.price - a.price;
              default:
                return 0;
            }
          });
          
          set({ filteredAppointments: filtered });
        },
        
        searchAppointments: (query) => {
          const { appointments } = get();
          if (!query.trim()) return appointments;
          
          const lowerQuery = query.toLowerCase();
          return appointments.filter(appointment =>
            appointment.teacherName.toLowerCase().includes(lowerQuery) ||
            appointment.studentName.toLowerCase().includes(lowerQuery) ||
            appointment.subject.toLowerCase().includes(lowerQuery)
          );
        },
        
        getAppointmentsByStatus: (status) => {
          const { appointments } = get();
          return appointments.filter(appointment => appointment.status === status);
        },
        
        getUpcomingAppointments: (days = 7) => {
          const { appointments } = get();
          const now = new Date();
          const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          
          return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= now && appointmentDate <= futureDate &&
              (appointment.status === 'pending' || appointment.status === 'confirmed');
          });
        },
        
        getAppointmentsByTeacher: (teacherId) => {
          const { appointments } = get();
          return appointments.filter(appointment => appointment.teacherId === teacherId);
        },
        
        getAppointmentsByStudent: (studentId) => {
          const { appointments } = get();
          return appointments.filter(appointment => appointment.studentId === studentId);
        },
        
        // 统计操作
        updateStatistics: () => {
          const { appointments } = get();
          
          const totalAppointments = appointments.length;
          const upcomingAppointments = get().getUpcomingAppointments().length;
          const completedAppointments = appointments.filter(a => a.status === 'completed').length;
          const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
          
          const ratingsCount = appointments.filter(a => a.rating).length;
          const averageRating = ratingsCount > 0 
            ? appointments.reduce((sum, a) => sum + (a.rating || 0), 0) / ratingsCount 
            : 0;
          
          // 计算热门时间段
          const timeSlotCount = appointments.reduce((acc, appointment) => {
            acc[appointment.time] = (acc[appointment.time] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const popularTimeSlots = Object.entries(timeSlotCount)
            .map(([time, count]) => ({ time, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          
          set((state) => ({
            statistics: {
              ...state.statistics,
              totalAppointments,
              upcomingAppointments,
              completedAppointments,
              cancelledAppointments,
              averageRating: Math.round(averageRating * 100) / 100,
              popularTimeSlots,
            },
          }));
        },
        
        getAppointmentsByDateRange: (start, end) => {
          const { appointments } = get();
          return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= start && appointmentDate <= end;
          });
        },
        
        getRevenueByMonth: (year) => {
          const { appointments } = get();
          const monthlyRevenue = new Array(12).fill(0);
          
          appointments
            .filter(a => a.status === 'completed')
            .forEach(appointment => {
              const appointmentDate = new Date(appointment.date);
              if (appointmentDate.getFullYear() === year) {
                monthlyRevenue[appointmentDate.getMonth()] += appointment.price;
              }
            });
          
          return monthlyRevenue.map((revenue, index) => ({
            month: new Date(year, index).toLocaleString('zh-CN', { month: 'long' }),
            revenue,
          }));
        },
        
        // 缓存操作
        updateCache: () => {
          set((state) => ({
            cache: {
              ...state.cache,
              lastFetch: Date.now(),
            },
          }));
        },
        
        isCacheValid: () => {
          const { cache } = get();
          return Date.now() - cache.lastFetch < cache.ttl;
        },
        
        clearCache: () => {
          set((state) => ({
            cache: {
              ...state.cache,
              lastFetch: 0,
            },
          }));
        },
        
        // 工具方法
        canCancelAppointment: (appointment) => {
          const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
          const now = new Date();
          const hoursDiff = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          return appointment.status === 'pending' || 
                 (appointment.status === 'confirmed' && hoursDiff > 24);
        },
        
        canRescheduleAppointment: (appointment) => {
          const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
          const now = new Date();
          const hoursDiff = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          return (appointment.status === 'pending' || appointment.status === 'confirmed') && 
                 hoursDiff > 12;
        },
        
        getAppointmentDuration: (appointment) => {
          return appointment.duration || 60; // 默认60分钟
        },
        
        isAppointmentConflict: (date, time, teacherId, excludeId) => {
          const { appointments } = get();
          return appointments.some(appointment => 
            appointment.id !== excludeId &&
            appointment.teacherId === teacherId &&
            appointment.date === date.toISOString().split('T')[0] &&
            appointment.time === time &&
            (appointment.status === 'pending' || appointment.status === 'confirmed')
          );
        },
        
        // 重置状态
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'appointment-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          appointments: state.appointments,
          filters: state.filters,
          sortBy: state.sortBy,
        }),
        version: 1,
      }
    )
  )
);

// 选择器 Hooks
export const useAppointments = () => useAppointmentStore((state) => state.filteredAppointments);
export const useAllAppointments = () => useAppointmentStore((state) => state.appointments);
export const useSelectedAppointment = () => useAppointmentStore((state) => state.selectedAppointment);
export const useAppointmentFilters = () => useAppointmentStore((state) => state.filters);
export const useAppointmentSort = () => useAppointmentStore((state) => state.sortBy);
export const useAppointmentLoading = () => {
  const isLoading = useAppointmentStore((state) => state.isLoading);
  const isLoadingMore = useAppointmentStore((state) => state.isLoadingMore);
  const hasMore = useAppointmentStore((state) => state.hasMore);
  const isCreating = useAppointmentStore((state) => state.isCreating);
  const updatingIds = useAppointmentStore((state) => state.updatingIds);
  
  return useMemo(() => ({
    isLoading,
    isLoadingMore,
    hasMore,
    isCreating,
    updatingIds,
  }), [isLoading, isLoadingMore, hasMore, isCreating, updatingIds]);
};
export const useAppointmentErrors = () => {
  const createError = useAppointmentStore((state) => state.createError);
  const updateErrors = useAppointmentStore((state) => state.updateErrors);
  
  return useMemo(() => ({
    createError,
    updateErrors,
  }), [createError, updateErrors]);
};
export const useAppointmentStatistics = () => useAppointmentStore((state) => state.statistics);

// 操作 Hooks - 使用 useMemo 稳定化返回对象
export const useAppointmentActions = () => {
  const setAppointments = useAppointmentStore((state) => state.setAppointments);
  const selectAppointment = useAppointmentStore((state) => state.selectAppointment);
  const selectAppointmentById = useAppointmentStore((state) => state.selectAppointmentById);
  const setFilters = useAppointmentStore((state) => state.setFilters);
  const resetFilters = useAppointmentStore((state) => state.resetFilters);
  const setSearchQuery = useAppointmentStore((state) => state.setSearchQuery);
  const setSortBy = useAppointmentStore((state) => state.setSortBy);
  const createAppointment = useAppointmentStore((state) => state.createAppointment);
  const confirmAppointment = useAppointmentStore((state) => state.confirmAppointment);
  const cancelAppointment = useAppointmentStore((state) => state.cancelAppointment);
  const rescheduleAppointment = useAppointmentStore((state) => state.rescheduleAppointment);
  const completeAppointment = useAppointmentStore((state) => state.completeAppointment);
  const getAppointmentsByStatus = useAppointmentStore((state) => state.getAppointmentsByStatus);
  const getUpcomingAppointments = useAppointmentStore((state) => state.getUpcomingAppointments);
  const canCancelAppointment = useAppointmentStore((state) => state.canCancelAppointment);
  const canRescheduleAppointment = useAppointmentStore((state) => state.canRescheduleAppointment);
  const isAppointmentConflict = useAppointmentStore((state) => state.isAppointmentConflict);

  return useMemo(() => ({
    setAppointments,
    selectAppointment,
    selectAppointmentById,
    setFilters,
    resetFilters,
    setSearchQuery,
    setSortBy,
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    rescheduleAppointment,
    completeAppointment,
    getAppointmentsByStatus,
    getUpcomingAppointments,
    canCancelAppointment,
    canRescheduleAppointment,
    isAppointmentConflict,
  }), [
    setAppointments,
    selectAppointment,
    selectAppointmentById,
    setFilters,
    resetFilters,
    setSearchQuery,
    setSortBy,
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    rescheduleAppointment,
    completeAppointment,
    getAppointmentsByStatus,
    getUpcomingAppointments,
    canCancelAppointment,
    canRescheduleAppointment,
    isAppointmentConflict,
  ]);
};