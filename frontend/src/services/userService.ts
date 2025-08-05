import { apiRequest } from '../utils/api';
import type { User } from '../types';

// 用户偏好设置类型
export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointmentReminders: boolean;
    promotionalEmails: boolean;
    weeklyReports: boolean;
  };
  privacy: {
    profileVisible: boolean;
    contactInfoVisible: boolean;
    locationVisible: boolean;
    showOnlineStatus: boolean;
  };
  learning: {
    preferredSubjects: string[];
    studyGoals: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    sessionDuration: number; // 分钟
    preferredTimeSlots: string[];
  };
  teaching?: {
    availableSubjects: string[];
    teachingStyle: string;
    maxStudentsPerDay: number;
    minSessionDuration: number;
    maxSessionDuration: number;
    priceRange: { min: number; max: number };
    availableLocations: Array<'online' | 'teacher_home' | 'student_home' | 'public_place'>;
  };
}

// 用户活动日志类型
export interface UserActivity {
  id: string;
  type: 'login' | 'appointment_created' | 'appointment_cancelled' | 'review_posted' | 'profile_updated' | 'payment_made';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// 用户统计类型
export interface UserStatistics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalSpent: number;
  totalEarned?: number; // 仅教师
  averageRating: number;
  totalReviews: number;
  accountAge: number; // 天数
  lastLoginDate: string;
  favoriteSubjects: Array<{ subject: string; count: number }>;
  preferredTeachers?: Array<{ teacherId: string; appointmentCount: number }>; // 仅学生
  studentCount?: number; // 仅教师
}

// 安全设置类型
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustedDevices: Array<{
    id: string;
    name: string;
    lastUsed: string;
    trusted: boolean;
  }>;
  loginSessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
}

// 用户服务类
export class UserService {
  // 获取当前用户信息
  static async getCurrentUser(): Promise<User> {
    return apiRequest.get<User>('/users/me');
  }

  // 获取用户详情
  static async getUser(id: string): Promise<User> {
    return apiRequest.get<User>(`/users/${id}`);
  }

  // 更新用户资料
  static async updateProfile(updates: Partial<User>): Promise<User> {
    return apiRequest.put<User>('/users/me', updates);
  }

  // 更新头像
  static async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiRequest.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 删除头像
  static async deleteAvatar(): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>('/users/me/avatar');
  }

  // 获取用户偏好设置
  static async getPreferences(): Promise<UserPreferences> {
    return apiRequest.get<UserPreferences>('/users/me/preferences');
  }

  // 更新用户偏好设置
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiRequest.put<UserPreferences>('/users/me/preferences', preferences);
  }

  // 获取用户统计
  static async getUserStatistics(userId?: string): Promise<UserStatistics> {
    const endpoint = userId ? `/users/${userId}/statistics` : '/users/me/statistics';
    return apiRequest.get<UserStatistics>(endpoint);
  }

  // 获取用户活动日志
  static async getActivityLog(
    params: {
      page?: number;
      limit?: number;
      type?: UserActivity['type'];
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<{
    activities: UserActivity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return apiRequest.get('/users/me/activity', { params });
  }

  // 搜索用户
  static async searchUsers(
    query: string,
    filters: {
      role?: 'student' | 'teacher';
      location?: string;
      verified?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiRequest.get('/users/search', {
      params: { query, ...filters },
    });
  }

  // 关注用户
  static async followUser(userId: string): Promise<{ success: boolean }> {
    return apiRequest.post<{ success: boolean }>(`/users/${userId}/follow`);
  }

  // 取消关注用户
  static async unfollowUser(userId: string): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>(`/users/${userId}/follow`);
  }

  // 获取关注列表
  static async getFollowing(
    userId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const endpoint = userId ? `/users/${userId}/following` : '/users/me/following';
    return apiRequest.get(endpoint, { params: { page, limit } });
  }

  // 获取粉丝列表
  static async getFollowers(
    userId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const endpoint = userId ? `/users/${userId}/followers` : '/users/me/followers';
    return apiRequest.get(endpoint, { params: { page, limit } });
  }

  // 块用户
  static async blockUser(userId: string, reason?: string): Promise<{ success: boolean }> {
    return apiRequest.post<{ success: boolean }>(`/users/${userId}/block`, { reason });
  }

  // 解除阻止用户
  static async unblockUser(userId: string): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>(`/users/${userId}/block`);
  }

  // 获取阻止列表
  static async getBlockedUsers(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: Array<User & { blockedAt: string; reason?: string }>;
    total: number;
    page: number;
    limit: number;
  }> {
    return apiRequest.get('/users/me/blocked', { params: { page, limit } });
  }

  // 举报用户
  static async reportUser(
    userId: string,
    report: {
      reason: 'inappropriate_behavior' | 'spam' | 'harassment' | 'fake_profile' | 'other';
      description: string;
      evidence?: File[];
    }
  ): Promise<{ success: boolean; reportId: string }> {
    const formData = new FormData();
    formData.append('reason', report.reason);
    formData.append('description', report.description);
    
    if (report.evidence) {
      report.evidence.forEach((file, index) => {
        formData.append(`evidence_${index}`, file);
      });
    }

    return apiRequest.post<{ success: boolean; reportId: string }>(
      `/users/${userId}/report`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // 验证邮箱
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return apiRequest.post<{ success: boolean; message: string }>('/users/verify-email', { token });
  }

  // 重发邮箱验证
  static async resendEmailVerification(): Promise<{ success: boolean; message: string }> {
    return apiRequest.post<{ success: boolean; message: string }>('/users/resend-email-verification');
  }

  // 验证手机号
  static async verifyPhone(
    phone: string,
    verificationCode: string
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest.post<{ success: boolean; message: string }>('/users/verify-phone', {
      phone,
      verificationCode,
    });
  }

  // 发送手机验证码
  static async sendPhoneVerification(phone: string): Promise<{ success: boolean; message: string }> {
    return apiRequest.post<{ success: boolean; message: string }>('/users/send-phone-verification', {
      phone,
    });
  }

  // 获取安全设置
  static async getSecuritySettings(): Promise<SecuritySettings> {
    return apiRequest.get<SecuritySettings>('/users/me/security');
  }

  // 启用/禁用双因素认证
  static async toggle2FA(enable: boolean, code?: string): Promise<{
    success: boolean;
    qrCode?: string;
    backupCodes?: string[];
  }> {
    return apiRequest.post<{
      success: boolean;
      qrCode?: string;
      backupCodes?: string[];
    }>('/users/me/2fa', { enable, code });
  }

  // 信任设备
  static async trustDevice(deviceId: string): Promise<{ success: boolean }> {
    return apiRequest.post<{ success: boolean }>(`/users/me/devices/${deviceId}/trust`);
  }

  // 撤销设备信任
  static async revokeTrustedDevice(deviceId: string): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>(`/users/me/devices/${deviceId}/trust`);
  }

  // 终止登录会话
  static async terminateSession(sessionId: string): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>(`/users/me/sessions/${sessionId}`);
  }

  // 终止所有其他会话
  static async terminateAllOtherSessions(): Promise<{ success: boolean; terminatedCount: number }> {
    return apiRequest.delete<{ success: boolean; terminatedCount: number }>('/users/me/sessions/others');
  }

  // 导出用户数据
  static async exportUserData(format: 'json' | 'csv'): Promise<{ downloadUrl: string; filename: string }> {
    return apiRequest.post<{ downloadUrl: string; filename: string }>('/users/me/export', { format });
  }

  // 删除用户账户
  static async deleteAccount(
    confirmation: {
      password: string;
      reason?: string;
      deleteData: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest.delete<{ success: boolean; message: string }>('/users/me', {
      data: confirmation,
    });
  }

  // 获取账户删除状态
  static async getAccountDeletionStatus(): Promise<{
    pending: boolean;
    scheduledDate?: string;
    daysRemaining?: number;
  }> {
    return apiRequest.get('/users/me/deletion-status');
  }

  // 取消账户删除
  static async cancelAccountDeletion(): Promise<{ success: boolean; message: string }> {
    return apiRequest.post<{ success: boolean; message: string }>('/users/me/cancel-deletion');
  }

  // 获取推荐用户
  static async getRecommendedUsers(
    type: 'teachers' | 'students' | 'similar',
    limit: number = 10
  ): Promise<User[]> {
    return apiRequest.get<User[]>('/users/recommended', {
      params: { type, limit },
    });
  }

  // 更新最后活动时间
  static async updateLastActivity(): Promise<{ success: boolean }> {
    return apiRequest.post<{ success: boolean }>('/users/me/ping');
  }

  // 获取用户徽章
  static async getUserBadges(userId?: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
    category: 'achievement' | 'milestone' | 'special';
  }>> {
    const endpoint = userId ? `/users/${userId}/badges` : '/users/me/badges';
    return apiRequest.get(endpoint);
  }
}

// 导出默认实例
export default UserService;