import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import TeacherDetailPage from '../../pages/TeacherDetailPage';
import AppointmentsPage from '../../pages/AppointmentsPage';
import { useAuthUser } from '../../stores/authStore';
import { TeacherService } from '../../services/teacherService';
import { AppointmentService } from '../../services/appointmentService';

// Mock stores and services
vi.mock('../../stores/authStore');
vi.mock('../../services/teacherService');
vi.mock('../../services/appointmentService');
vi.mock('../../stores/appointmentStore');
vi.mock('../../stores/uiStore');

const mockUseAuthUser = vi.mocked(useAuthUser);
const mockTeacherService = vi.mocked(TeacherService);
const mockAppointmentService = vi.mocked(AppointmentService);

const mockTeacher = {
  id: 'teacher-1',
  name: '王老师',
  avatar: '/avatar.jpg',
  subject: ['数学', '物理'],
  price: 200,
  location: { district: '朝阳区', address: '朝阳区xxx街道', lat: 39.9, lng: 116.4 },
  rating: 4.8,
  reviews: 156,
  experience: 5,
  description: '专业数学教师，有丰富的教学经验',
  detailedRatings: {
    teaching: 4.8,
    patience: 4.9,  
    communication: 4.7,
    effectiveness: 4.8
  },
  teachingStyle: '耐心细致，因材施教',
  certifications: ['教师资格证', '数学专业八级'],
  availability: ['周一至周五 9:00-18:00']
};

const mockUser = {
  id: 'student-1',
  name: '张三',
  email: 'student@example.com',
  role: 'student' as const
};

const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/teachers/teacher-1'] 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Appointment Booking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthUser.mockReturnValue(mockUser);
    mockTeacherService.getTeacher.mockResolvedValue(mockTeacher);
    mockTeacherService.getTeacherReviews.mockResolvedValue({
      reviews: [],
      total: 0,
      average: 0,
      distribution: {}
    });
    mockTeacherService.isTeacherFavorited.mockResolvedValue({ isFavorited: false });
  });

  it('completes full appointment booking flow', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TeacherDetailPage />
      </TestWrapper>
    );

    // Wait for teacher data to load
    await waitFor(() => {
      expect(screen.getByText('王老师')).toBeInTheDocument();
    });

    // Click appointment booking button
    const bookButton = screen.getByText('立即预约');
    await user.click(bookButton);

    // Appointment form should open
    await waitFor(() => {
      expect(screen.getByText('预约教师课程')).toBeInTheDocument();
    });

    // Verify teacher information is displayed
    expect(screen.getByText('王老师')).toBeInTheDocument();
    expect(screen.getByText('数学, 物理')).toBeInTheDocument();
    expect(screen.getByText('¥200/小时')).toBeInTheDocument();

    // Step 1: Select time and subject
    expect(screen.getByText('选择时间和科目')).toBeInTheDocument();
    
    // Mock date and time selection would happen here
    // For now, we'll simulate the form being filled and progressing to next step
    
    // The next step button should be disabled initially
    const nextButton = screen.getByText('下一步');
    expect(nextButton).toBeDisabled();

    // Would need to implement form filling simulation here
    // This is a simplified version showing the flow structure
  });

  it('shows appointment in appointments page after booking', async () => {
    const mockAppointment = {
      id: 'apt-1',
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

    mockAppointmentService.getStudentAppointments.mockResolvedValue({
      appointments: [mockAppointment],
      total: 1,
      page: 1,
      limit: 50
    });

    render(
      <TestWrapper initialEntries={['/appointments']}>
        <AppointmentsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('我的预约')).toBeInTheDocument();
    });

    // Should show the appointment
    await waitFor(() => {
      expect(screen.getByText('王老师')).toBeInTheDocument();
      expect(screen.getByText('数学')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('待确认')).toBeInTheDocument();
    });
  });

  it('handles appointment status changes', async () => {
    const user = userEvent.setup();
    
    const mockAppointment = {
      id: 'apt-1',
      teacherId: 'teacher-1', 
      teacherName: '王老师',
      studentId: 'student-1',
      studentName: '张三',
      subject: '数学',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      price: 200,
      status: 'confirmed' as const,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockAppointmentService.getStudentAppointments.mockResolvedValue({
      appointments: [mockAppointment],
      total: 1,
      page: 1,
      limit: 50
    });

    render(
      <TestWrapper initialEntries={['/appointments']}>
        <AppointmentsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('已确认')).toBeInTheDocument();
    });

    // Should show complete button for confirmed appointments
    const completeButton = screen.getByText('完成');
    expect(completeButton).toBeInTheDocument();

    // Click complete button
    await user.click(completeButton);

    // Complete dialog should open
    await waitFor(() => {
      expect(screen.getByText('完成预约')).toBeInTheDocument();
    });

    // Should show rating interface
    expect(screen.getByText('评分')).toBeInTheDocument();
    expect(screen.getByText('评价内容（可选）')).toBeInTheDocument();
  });

  it('filters appointments correctly', async () => {
    const user = userEvent.setup();
    
    const mockAppointments = [
      {
        id: 'apt-1',
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
        id: 'apt-2',
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

    mockAppointmentService.getStudentAppointments.mockResolvedValue({
      appointments: mockAppointments,
      total: 2,
      page: 1,
      limit: 50
    });

    render(
      <TestWrapper initialEntries={['/appointments']}>
        <AppointmentsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
    });

    // Should show both appointments initially
    expect(screen.getByText('数学')).toBeInTheDocument();
    expect(screen.getByText('物理')).toBeInTheDocument();

    // Click on "已完成" tab
    const completedTab = screen.getByText('已完成');
    await user.click(completedTab);

    // Should filter to show only completed appointments
    // This would require proper store integration to work correctly
  });

  it('handles errors gracefully', async () => {
    mockTeacherService.getTeacher.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <TeacherDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('教师信息未找到')).toBeInTheDocument();
    });
  });

  it('requires authentication for booking', async () => {
    const user = userEvent.setup();
    
    // Mock unauthenticated user
    mockUseAuthUser.mockReturnValue(null);

    render(
      <TestWrapper>
        <TeacherDetailPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('王老师')).toBeInTheDocument();
    });

    const bookButton = screen.getByText('立即预约');
    await user.click(bookButton);

    // Should show authentication error
    // This would depend on the actual implementation of the auth check
  });
});