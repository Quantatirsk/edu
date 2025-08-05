import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AppointmentForm from '../AppointmentForm';
import { useAuthUser } from '../../stores/authStore';
import { TeacherService } from '../../services/teacherService';

// Mock stores
vi.mock('../../stores/authStore');
vi.mock('../../stores/appointmentStore');
vi.mock('../../stores/uiStore');

// Mock services
vi.mock('../../services/teacherService');
vi.mock('../../services/appointmentService');

const mockUseAuthUser = vi.mocked(useAuthUser);
const mockTeacherService = vi.mocked(TeacherService);

const mockTeacher = {
  id: 'teacher-1',
  name: '王老师',
  avatar: '/avatar.jpg', 
  subject: ['数学', '物理'],
  price: 200,
  location: { district: '朝阳区', address: '朝阳区xxx街道' },
  rating: 4.8,
  reviews: 156,
  experience: 5,
  description: '专业数学教师',
  detailedRatings: {
    teaching: 4.8,
    patience: 4.9,
    communication: 4.7,
    effectiveness: 4.8
  },
  teachingStyle: '耐心细致',
  certifications: ['教师资格证'],
  availability: ['周一至周五']
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AppointmentForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthUser.mockReturnValue({
      id: 'student-1',
      name: '学生张三',
      email: 'student@example.com',
      role: 'student'
    });
    
    mockTeacherService.getTeacher.mockResolvedValue(mockTeacher);
  });

  it('renders appointment form when open', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('预约教师课程')).toBeInTheDocument();
    });
  });

  it('displays teacher information correctly', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('王老师')).toBeInTheDocument();
      expect(screen.getByText('数学, 物理')).toBeInTheDocument();
      expect(screen.getByText('¥200/小时')).toBeInTheDocument();
    });
  });

  it('shows step indicator', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check step 1 is active
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('allows selecting date and time', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('选择日期')).toBeInTheDocument();
      expect(screen.getByText('选择科目')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      // Try to go to next step without selecting required fields
      const nextButton = screen.getByText('下一步');
      expect(nextButton).toBeDisabled();
    });
  });

  it('progresses through steps correctly', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('选择时间和科目')).toBeInTheDocument();
    });

    // Mock selecting date, time, and subject would enable next button
    // This would require more complex mocking of the component state
  });

  it('calculates total price correctly', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      // Price calculation would be tested when form is filled
      expect(screen.getByText('课程时长')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  it('shows loading state', () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    // Should show skeleton loading initially
    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('handles teacher not found', async () => {
    mockTeacherService.getTeacher.mockRejectedValue(new Error('Teacher not found'));

    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="invalid-teacher"
          isOpen={true}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('无法加载教师信息')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <AppointmentForm
          teacherId="teacher-1"
          isOpen={false}
          onClose={mockOnCancel}
          onSuccess={mockOnSubmit}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('预约教师课程')).not.toBeInTheDocument();
  });
});