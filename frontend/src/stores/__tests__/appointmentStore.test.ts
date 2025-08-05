import { renderHook, act } from '@testing-library/react';
import { useAppointmentStore } from '../appointmentStore';

// Mock the persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
  subscribeWithSelector: (fn: unknown) => fn
}));

describe('appointmentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppointmentStore.setState({
      appointments: [],
      filters: {
        status: [],
        dateRange: { start: null, end: null },
        teacherId: '',
        studentId: '',
        searchQuery: ''
      },
      sortBy: 'date',
      sortOrder: 'desc',
      loading: {
        isLoading: false,
        isCreating: false,
        updatingIds: new Set()
      },
      errors: {
        createError: null,
        updateErrors: new Map()
      }
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    expect(result.current.appointments).toEqual([]);
    expect(result.current.filters.status).toEqual([]);
    expect(result.current.sortBy).toBe('date');
    expect(result.current.loading.isLoading).toBe(false);
  });

  it('adds appointment correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    const newAppointment = {
      id: '1',
      teacherId: 'teacher-1',
      teacherName: '王老师',
      studentId: 'student-1', 
      studentName: '张三',
      subject: '数学',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      price: 200,
      status: 'pending' as const,
      notes: '第一次课',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    act(() => {
      result.current.addAppointment(newAppointment);
    });

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0]).toEqual(newAppointment);
  });

  it('updates appointment status correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    const appointment = {
      id: '1',
      teacherId: 'teacher-1',
      teacherName: '王老师',
      studentId: 'student-1',
      studentName: '张三',
      subject: '数学',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      price: 200,
      status: 'pending' as const,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    act(() => {
      result.current.addAppointment(appointment);
    });

    act(() => {
      result.current.updateAppointmentStatus('1', 'confirmed');
    });

    expect(result.current.appointments[0].status).toBe('confirmed');
  });

  it('removes appointment correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    const appointment = {
      id: '1',
      teacherId: 'teacher-1',
      teacherName: '王老师',
      studentId: 'student-1',
      studentName: '张三',
      subject: '数学',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      price: 200,
      status: 'pending' as const,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    act(() => {
      result.current.addAppointment(appointment);
    });

    expect(result.current.appointments).toHaveLength(1);

    act(() => {
      result.current.removeAppointment('1');
    });

    expect(result.current.appointments).toHaveLength(0);
  });

  it('sets filters correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    const newFilters = {
      status: ['confirmed' as const],
      dateRange: { 
        start: new Date('2024-01-01'), 
        end: new Date('2024-01-31') 
      },
      teacherId: 'teacher-1',
      studentId: 'student-1',
      searchQuery: 'math'
    };

    act(() => {
      result.current.setFilters(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
  });

  it('sets search query correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    act(() => {
      result.current.setSearchQuery('数学课程');
    });

    expect(result.current.filters.searchQuery).toBe('数学课程');
  });

  it('sets sort options correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    act(() => {
      result.current.setSortBy('price');
    });

    expect(result.current.sortBy).toBe('price');

    act(() => {
      result.current.setSortOrder('asc');
    });

    expect(result.current.sortOrder).toBe('asc');
  });

  it('manages loading states correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading.isLoading).toBe(true);

    act(() => {
      result.current.setCreating(true);
    });

    expect(result.current.loading.isCreating).toBe(true);

    act(() => {
      result.current.setUpdatingId('1', true);
    });

    expect(result.current.loading.updatingIds.has('1')).toBe(true);

    act(() => {
      result.current.setUpdatingId('1', false);
    });

    expect(result.current.loading.updatingIds.has('1')).toBe(false);
  });

  it('manages error states correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    act(() => {
      result.current.setCreateError('Failed to create appointment');
    });

    expect(result.current.errors.createError).toBe('Failed to create appointment');

    act(() => {
      result.current.setUpdateError('1', 'Failed to update');
    });

    expect(result.current.errors.updateErrors.get('1')).toBe('Failed to update');

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors.createError).toBeNull();
    expect(result.current.errors.updateErrors.size).toBe(0);
  });

  it('calculates statistics correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    const appointments = [
      {
        id: '1',
        teacherId: 'teacher-1',
        teacherName: '王老师',
        studentId: 'student-1',
        studentName: '张三',
        subject: '数学',
        date: '2024-01-15',
        time: '10:00',
        duration: 60,
        price: 200,
        status: 'completed' as const,
        rating: 5,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        teacherId: 'teacher-1',
        teacherName: '王老师',
        studentId: 'student-1',
        studentName: '张三',
        subject: '物理',
        date: '2024-01-16',
        time: '14:00',
        duration: 60,
        price: 200,
        status: 'confirmed' as const,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    act(() => {
      result.current.setAppointments(appointments);
    });

    const stats = result.current.statistics;
    
    expect(stats.totalAppointments).toBe(2);
    expect(stats.completedAppointments).toBe(1);
    expect(stats.upcomingAppointments).toBe(1);
    expect(stats.averageRating).toBe(5); // Only completed appointments with ratings
  });

  it('filters appointments correctly', () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    const appointments = [
      {
        id: '1',
        teacherId: 'teacher-1',
        teacherName: '王老师',
        studentId: 'student-1',
        studentName: '张三',
        subject: '数学',
        date: '2024-01-15',
        time: '10:00',
        duration: 60,
        price: 200,
        status: 'completed' as const,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        teacherId: 'teacher-2',
        teacherName: '李老师',
        studentId: 'student-1',
        studentName: '张三',
        subject: '物理',
        date: '2024-01-16',
        time: '14:00',
        duration: 60,
        price: 200,
        status: 'confirmed' as const,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    act(() => {
      result.current.setAppointments(appointments);
      result.current.setFilters({
        status: ['completed'],
        teacherId: 'teacher-1',
        dateRange: { start: null, end: null },
        studentId: '',
        searchQuery: ''
      });
    });

    const filtered = result.current.filteredAppointments;
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });
});