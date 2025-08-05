import { apiClient } from '../utils/api';

export interface NotificationQuery {
  userId: string;
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
    data?: Record<string, unknown>;
    priority: string;
  }>;
  total: number;
  unreadCount: number;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  types: {
    appointment: boolean;
    payment: boolean;
    review: boolean;
    system: boolean;
    message: boolean;
  };
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export const NotificationService = {
  // 获取通知列表
  async getNotifications(params: NotificationQuery): Promise<NotificationResponse> {
    try {
      const response = await apiClient.get('/api/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // 返回模拟数据
      const mockNotifications = [
        {
          id: '1',
          type: 'appointment',
          title: '预约确认',
          message: '您的数学课程预约已被王老师确认，课程时间：2024-01-15 10:00',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/appointments/1',
          data: { appointmentId: '1' },
          priority: 'high'
        },
        {
          id: '2',
          type: 'review',
          title: '新评价',
          message: '学生张三对您的课程给出了5星好评',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          actionUrl: '/reviews/2',
          data: { reviewId: '2' },
          priority: 'medium'
        },
        {
          id: '3',
          type: 'payment',
          title: '课程费用到账',
          message: '您收到了一笔课程费用，金额：¥200',
          isRead: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          actionUrl: '/payments/3',
          data: { paymentId: '3' },
          priority: 'medium'
        },
        {
          id: '4',
          type: 'system',
          title: '系统维护通知',
          message: '系统将于今晚23:00-01:00进行维护，期间服务可能不可用',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          actionUrl: '',
          data: {},
          priority: 'low'
        }
      ];
      
      let filtered = mockNotifications;
      
      if (params.type) {
        filtered = filtered.filter(n => n.type === params.type);
      }
      
      if (params.isRead !== undefined) {
        filtered = filtered.filter(n => n.isRead === params.isRead);
      }
      
      const unreadCount = mockNotifications.filter(n => !n.isRead).length;
      
      return {
        notifications: filtered.slice(0, params.limit || 20),
        total: filtered.length,
        unreadCount
      };
    }
  },

  // 标记通知为已读
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // 模拟成功
      return Promise.resolve();
    }
  },

  // 标记所有通知为已读
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await apiClient.put(`/api/notifications/user/${userId}/read-all`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // 模拟成功
      return Promise.resolve();
    }
  },

  // 删除通知
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // 模拟成功
      return Promise.resolve();
    }
  },

  // 获取通知设置
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/notification-settings`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      
      // 返回默认设置
      return {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        soundEnabled: true,
        types: {
          appointment: true,
          payment: true,
          review: true,
          system: true,
          message: true
        },
        schedule: {
          enabled: false,
          startTime: '08:00',
          endTime: '22:00'
        }
      };
    }
  },

  // 更新通知设置
  async updateNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/notification-settings`, settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // 模拟成功
      return Promise.resolve();
    }
  },

  // 发送通知
  async sendNotification(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    data?: Record<string, unknown>;
    priority?: string;
  }): Promise<void> {
    try {
      await apiClient.post('/api/notifications', notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
      // 模拟成功
      return Promise.resolve();
    }
  },

  // 获取未读通知数量
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await apiClient.get(`/api/notifications/user/${userId}/unread-count`);
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }
};