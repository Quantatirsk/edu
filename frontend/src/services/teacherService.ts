import { apiRequest } from '../utils/api';
import type { Teacher, DetailedReview } from '../types';

// 教师筛选参数类型
export interface TeacherFilters {
  subject?: string[];
  priceMin?: number;
  priceMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  ratingMin?: number;
  location?: {
    district?: string;
    lat?: number;
    lng?: number;
    radius?: number; // 搜索半径(公里)
  };
  availability?: string[];
  certifications?: string[];
}

// 教师搜索参数类型
export interface TeacherSearchParams {
  query?: string;
  filters?: TeacherFilters;
  sortBy?: 'rating' | 'price' | 'experience' | 'distance' | 'reviews';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 分页响应类型
export interface PaginatedTeachers {
  teachers: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 教师统计类型
export interface TeacherStatistics {
  totalTeachers: number;
  averageRating: number;
  averagePrice: number;
  subjectDistribution: Array<{
    subject: string;
    count: number;
    percentage: number;
  }>;
  locationDistribution: Array<{
    district: string;
    count: number;
  }>;
  experienceDistribution: Array<{
    range: string;
    count: number;
  }>;
}

// 教师服务类
export class TeacherService {
  // 获取教师列表
  static async getTeachers(params: TeacherSearchParams = {}): Promise<PaginatedTeachers> {
    const response = await apiRequest.get<PaginatedResponse<Teacher>>('/teachers', { params });
    
    // 转换后端返回的数据结构为前端期望的格式
    return {
      teachers: response.teachers || [],
      total: response.total || 0,
      page: Math.floor((response.skip || 0) / (response.limit || 20)) + 1,
      limit: response.limit || 20,
      totalPages: Math.ceil((response.total || 0) / (response.limit || 20)),
      hasNext: (response.skip || 0) + (response.limit || 20) < (response.total || 0),
      hasPrev: (response.skip || 0) > 0
    };
  }

  // 获取教师详情
  static async getTeacher(id: string): Promise<Teacher> {
    return apiRequest.get<Teacher>(`/teachers/${id}`);
  }

  // 搜索教师
  static async searchTeachers(params: TeacherSearchParams): Promise<PaginatedTeachers> {
    return apiRequest.get<PaginatedTeachers>('/teachers/search', { params });
  }

  // 获取附近教师
  static async getNearbyTeachers(
    lat: number,
    lng: number,
    radius: number = 10,
    params: Omit<TeacherSearchParams, 'filters'> = {}
  ): Promise<PaginatedTeachers> {
    return apiRequest.get<PaginatedTeachers>('/teachers/nearby', {
      params: {
        ...params,
        lat,
        lng,
        radius,
      },
    });
  }

  // 获取热门教师
  static async getPopularTeachers(limit: number = 10): Promise<Teacher[]> {
    return apiRequest.get<Teacher[]>('/teachers/popular', { params: { limit } });
  }

  // 获取推荐教师
  static async getRecommendedTeachers(userId?: string, limit: number = 5): Promise<Teacher[]> {
    return apiRequest.get<Teacher[]>('/teachers/recommended', {
      params: { userId, limit },
    });
  }

  // 获取教师评价
  static async getTeacherReviews(
    teacherId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: DetailedReview[];
    total: number;
    average: number;
    distribution: Record<number, number>;
  }> {
    return apiRequest.get(`/teachers/${teacherId}/reviews`, {
      params: { page, limit },
    });
  }

  // 创建教师评价
  static async createReview(teacherId: string, review: Partial<DetailedReview>): Promise<DetailedReview> {
    return apiRequest.post<DetailedReview>(`/teachers/${teacherId}/reviews`, review);
  }

  // 获取教师统计信息
  static async getTeacherStatistics(): Promise<TeacherStatistics> {
    return apiRequest.get<TeacherStatistics>('/teachers/statistics');
  }

  // 获取教师科目列表
  static async getSubjects(): Promise<Array<{ subject: string; count: number }>> {
    const response = await apiRequest.get<Array<{ subject: string; count: number }>>('/teachers/subjects');
    // 后端直接返回数组，不需要额外处理
    return Array.isArray(response) ? response : [];
  }

  // 获取教师地区列表
  static async getLocations(): Promise<Array<{ district: string; count: number }>> {
    return apiRequest.get<Array<{ district: string; count: number }>>('/teachers/locations');
  }

  // 收藏教师
  static async favoriteTeacher(teacherId: string): Promise<{ success: boolean }> {
    return apiRequest.post<{ success: boolean }>(`/teachers/${teacherId}/favorite`);
  }

  // 取消收藏教师
  static async unfavoriteTeacher(teacherId: string): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>(`/teachers/${teacherId}/favorite`);
  }

  // 获取收藏的教师
  static async getFavoriteTeachers(page: number = 1, limit: number = 10): Promise<PaginatedTeachers> {
    return apiRequest.get<PaginatedTeachers>('/users/favorites/teachers', {
      params: { page, limit },
    });
  }

  // 检查教师是否被收藏
  static async isTeacherFavorited(teacherId: string): Promise<{ isFavorited: boolean }> {
    return apiRequest.get<{ isFavorited: boolean }>(`/teachers/${teacherId}/is-favorited`);
  }

  // 上传教师头像
  static async uploadAvatar(teacherId: string, file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiRequest.post<{ avatarUrl: string }>(`/teachers/${teacherId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 更新教师资料
  static async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<Teacher> {
    return apiRequest.put<Teacher>(`/teachers/${teacherId}`, updates);
  }

  // 删除教师账户
  static async deleteTeacher(teacherId: string): Promise<{ success: boolean }> {
    return apiRequest.delete<{ success: boolean }>(`/teachers/${teacherId}`);
  }

  // 验证教师资质
  static async verifyTeacher(teacherId: string, documents: File[]): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    documents.forEach((file, index) => {
      formData.append(`document_${index}`, file);
    });

    return apiRequest.post<{ success: boolean; message: string }>(
      `/teachers/${teacherId}/verify`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // 举报教师
  static async reportTeacher(
    teacherId: string,
    report: {
      reason: string;
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
      `/teachers/${teacherId}/report`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // 获取教师可用时间
  static async getTeacherAvailability(
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      price?: number;
    }>;
  }>> {
    return apiRequest.get(`/teachers/${teacherId}/availability`, {
      params: { startDate, endDate },
    });
  }

  // 更新教师可用时间
  static async updateTeacherAvailability(
    teacherId: string,
    availability: Array<{
      date: string;
      timeSlots: Array<{
        startTime: string;
        endTime: string;
        available: boolean;
        price?: number;
      }>;
    }>
  ): Promise<{ success: boolean }> {
    return apiRequest.put<{ success: boolean }>(`/teachers/${teacherId}/availability`, {
      availability,
    });
  }
}

// 导出默认实例
export default TeacherService;