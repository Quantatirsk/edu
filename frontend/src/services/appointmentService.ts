import { apiRequest } from '../utils/api';
import type { Appointment } from '../types';

// 预约状态类型
export type AppointmentStatus = 
  | 'pending'    // 待确认
  | 'confirmed'  // 已确认
  | 'cancelled'  // 已取消
  | 'completed'  // 已完成
  | 'missed';    // 缺席

// 预约创建参数类型
export interface CreateAppointmentData {
  teacherId: string;
  studentId?: string; // 如果未提供，使用当前用户
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'trial' | 'regular' | 'intensive';
  location?: {
    type: 'online' | 'teacher_home' | 'student_home' | 'public_place';
    address?: string;
    platform?: string; // 在线平台
    meetingId?: string;
  };
  notes?: string;
  price?: number;
}

// 预约更新参数类型
export interface UpdateAppointmentData {
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: CreateAppointmentData['location'];
  notes?: string;
  status?: AppointmentStatus;
}

// 预约搜索参数类型
export interface AppointmentSearchParams {
  teacherId?: string;
  studentId?: string;
  status?: AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  subject?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

// 分页预约响应类型
export interface PaginatedAppointments {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 预约统计类型
export interface AppointmentStatistics {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  bySubject: Array<{ subject: string; count: number }>;
  byMonth: Array<{ month: string; count: number; revenue?: number }>;
  upcomingCount: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
}

// 时间冲突检查类型
export interface TimeConflictCheck {
  hasConflict: boolean;
  conflictingAppointments: Array<{
    id: string;
    teacherId: string;
    studentId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
}

// 预约服务类
export class AppointmentService {
  // 创建预约
  static async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    return apiRequest.post<Appointment>('/appointments', data);
  }

  // 获取预约详情
  static async getAppointment(id: string): Promise<Appointment> {
    return apiRequest.get<Appointment>(`/appointments/${id}`);
  }

  // 获取预约列表
  static async getAppointments(params: AppointmentSearchParams = {}): Promise<PaginatedAppointments> {
    return apiRequest.get<PaginatedAppointments>('/appointments', { params });
  }

  // 获取用户的预约列表
  static async getUserAppointments(
    userId: string,
    params: Omit<AppointmentSearchParams, 'studentId' | 'teacherId'> = {}
  ): Promise<PaginatedAppointments> {
    return apiRequest.get<PaginatedAppointments>(`/users/${userId}/appointments`, { params });
  }

  // 获取教师的预约列表
  static async getTeacherAppointments(
    teacherId: string,
    params: Omit<AppointmentSearchParams, 'teacherId'> = {}
  ): Promise<PaginatedAppointments> {
    return apiRequest.get<PaginatedAppointments>(`/teachers/${teacherId}/appointments`, { params });
  }

  // 获取学生的预约列表
  static async getStudentAppointments(
    studentId: string,
    params: Omit<AppointmentSearchParams, 'studentId'> = {}
  ): Promise<PaginatedAppointments> {
    return apiRequest.get<PaginatedAppointments>(`/students/${studentId}/appointments`, { params });
  }

  // 更新预约
  static async updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    return apiRequest.put<Appointment>(`/appointments/${id}`, data);
  }

  // 确认预约（教师操作）
  static async confirmAppointment(id: string, notes?: string): Promise<Appointment> {
    return apiRequest.post<Appointment>(`/appointments/${id}/confirm`, { notes });
  }

  // 取消预约
  static async cancelAppointment(
    id: string,
    reason: string,
    cancelledBy: 'teacher' | 'student'
  ): Promise<Appointment> {
    return apiRequest.post<Appointment>(`/appointments/${id}/cancel`, {
      reason,
      cancelledBy,
    });
  }

  // 完成预约
  static async completeAppointment(id: string, summary?: string): Promise<Appointment> {
    return apiRequest.post<Appointment>(`/appointments/${id}/complete`, { summary });
  }

  // 标记缺席
  static async markAsMissed(id: string, missedBy: 'teacher' | 'student', reason?: string): Promise<Appointment> {
    return apiRequest.post<Appointment>(`/appointments/${id}/missed`, {
      missedBy,
      reason,
    });
  }

  // 重新安排预约
  static async rescheduleAppointment(
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    reason?: string
  ): Promise<Appointment> {
    return apiRequest.post<Appointment>(`/appointments/${id}/reschedule`, {
      newDate,
      newStartTime,
      newEndTime,
      reason,
    });
  }

  // 检查时间冲突
  static async checkTimeConflict(
    teacherId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<TimeConflictCheck> {
    return apiRequest.post<TimeConflictCheck>('/appointments/check-conflict', {
      teacherId,
      date,
      startTime,
      endTime,
      excludeAppointmentId,
    });
  }

  // 获取可用时间段
  static async getAvailableTimeSlots(
    teacherId: string,
    date: string,
    duration: number = 60 // 分钟
  ): Promise<Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    reason?: string;
  }>> {
    return apiRequest.get(`/appointments/available-slots`, {
      params: { teacherId, date, duration },
    });
  }

  // 获取预约统计
  static async getAppointmentStatistics(
    userId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AppointmentStatistics> {
    return apiRequest.get<AppointmentStatistics>('/appointments/statistics', {
      params: { userId, dateFrom, dateTo },
    });
  }

  // 获取即将到来的预约
  static async getUpcomingAppointments(
    limit: number = 5,
    hours: number = 24
  ): Promise<Appointment[]> {
    return apiRequest.get<Appointment[]>('/appointments/upcoming', {
      params: { limit, hours },
    });
  }

  // 发送预约提醒
  static async sendAppointmentReminder(
    id: string,
    type: 'email' | 'sms' | 'push',
    advanceMinutes: number = 60
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest.post<{ success: boolean; message: string }>(
      `/appointments/${id}/remind`,
      { type, advanceMinutes }
    );
  }

  // 获取预约历史
  static async getAppointmentHistory(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<PaginatedAppointments> {
    return apiRequest.get<PaginatedAppointments>(`/users/${userId}/appointment-history`, {
      params,
    });
  }

  // 导出预约数据
  static async exportAppointments(
    params: AppointmentSearchParams & {
      format: 'csv' | 'excel' | 'pdf';
    }
  ): Promise<{ downloadUrl: string; filename: string }> {
    return apiRequest.post<{ downloadUrl: string; filename: string }>(
      '/appointments/export',
      params
    );
  }

  // 批量操作预约
  static async bulkUpdateAppointments(
    appointmentIds: string[],
    updates: Partial<UpdateAppointmentData>
  ): Promise<{ success: boolean; updated: number; errors: string[] }> {
    return apiRequest.post<{ success: boolean; updated: number; errors: string[] }>(
      '/appointments/bulk-update',
      { appointmentIds, updates }
    );
  }

  // 创建定期预约
  static async createRecurringAppointment(
    data: CreateAppointmentData & {
      recurrence: {
        frequency: 'daily' | 'weekly' | 'monthly';
        interval: number; // 每隔几天/周/月
        endDate: string;
        daysOfWeek?: number[]; // 周几 (0=星期日, 1=星期一...)
        excludeDates?: string[]; // 排除的日期
      };
    }
  ): Promise<{
    appointments: Appointment[];
    total: number;
    skipped: number;
    conflicts: string[];
  }> {
    return apiRequest.post<{
      appointments: Appointment[];
      total: number;
      skipped: number;
      conflicts: string[];
    }>('/appointments/recurring', data);
  }

  // 获取预约评价
  static async getAppointmentReview(appointmentId: string): Promise<{
    teacherReview?: {
      rating: number;
      comment: string;
      createdAt: string;
    };
    studentReview?: {
      rating: number;
      comment: string;
      createdAt: string;
    };
  }> {
    return apiRequest.get(`/appointments/${appointmentId}/reviews`);
  }

  // 创建预约评价
  static async createAppointmentReview(
    appointmentId: string,
    review: {
      rating: number;
      comment: string;
      tags?: string[];
    }
  ): Promise<{ success: boolean; reviewId: string }> {
    return apiRequest.post<{ success: boolean; reviewId: string }>(
      `/appointments/${appointmentId}/review`,
      review
    );
  }

  // 获取预约消息记录
  static async getAppointmentMessages(appointmentId: string): Promise<Array<{
    id: string;
    senderId: string;
    senderType: 'teacher' | 'student';
    message: string;
    type: 'text' | 'image' | 'file';
    createdAt: string;
  }>> {
    return apiRequest.get(`/appointments/${appointmentId}/messages`);
  }

  // 发送预约消息
  static async sendAppointmentMessage(
    appointmentId: string,
    message: {
      content: string;
      type?: 'text' | 'image' | 'file';
      attachment?: File;
    }
  ): Promise<{ success: boolean; messageId: string }> {
    const formData = new FormData();
    formData.append('content', message.content);
    formData.append('type', message.type || 'text');
    
    if (message.attachment) {
      formData.append('attachment', message.attachment);
    }

    return apiRequest.post<{ success: boolean; messageId: string }>(
      `/appointments/${appointmentId}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
}

// 导出默认实例
export default AppointmentService;