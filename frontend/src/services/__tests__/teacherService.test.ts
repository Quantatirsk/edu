import { TeacherService } from '../teacherService';
import { apiClient } from '../../utils/apiClient';

// Mock the API client
jest.mock('../../utils/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TeacherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeachers', () => {
    it('fetches teachers successfully', async () => {
      const mockResponse = {
        data: {
          teachers: [
            {
              id: '1',
              name: '王老师',
              subject: ['数学'],
              price: 200,
              rating: 4.8
            }
          ],
          total: 1,
          page: 1,
          limit: 20
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TeacherService.getTeachers({
        page: 1,
        limit: 20,
        subject: '数学'
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/teachers', {
        params: { page: 1, limit: 20, subject: '数学' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('returns mock data when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await TeacherService.getTeachers({});

      expect(result.teachers).toBeDefined();
      expect(Array.isArray(result.teachers)).toBe(true);
    });
  });

  describe('getTeacher', () => {
    it('fetches single teacher successfully', async () => {
      const mockTeacher = {
        id: '1',
        name: '王老师',
        subject: ['数学'],
        price: 200,
        rating: 4.8
      };

      mockApiClient.get.mockResolvedValue({ data: mockTeacher });

      const result = await TeacherService.getTeacher('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/teachers/1');
      expect(result).toEqual(mockTeacher);
    });

    it('throws error when teacher not found', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Teacher not found'));

      await expect(TeacherService.getTeacher('invalid-id')).rejects.toThrow('Teacher not found');
    });
  });

  describe('getTeacherReviews', () => {
    it('fetches teacher reviews successfully', async () => {
      const mockResponse = {
        data: {
          reviews: [
            {
              id: '1',
              studentName: '张三',
              comment: '老师很好',
              ratings: { overall: 5 },
              createdAt: '2024-01-01'
            }
          ],
          total: 1,
          average: 5,
          distribution: { 5: 1 }
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TeacherService.getTeacherReviews('1', 1, 10);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/teachers/1/reviews', {
        params: { page: 1, limit: 10 }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createReview', () => {
    it('creates review successfully', async () => {
      const reviewData = {
        appointmentId: '1',
        ratings: { overall: 5 },
        comment: '很好的老师',
        isRecommended: true,
        tags: ['认真']
      };

      const mockResponse = { data: { id: '1', ...reviewData } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TeacherService.createReview('teacher-1', reviewData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/teachers/teacher-1/reviews', reviewData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('favoriteTeacher', () => {
    it('adds teacher to favorites successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      await TeacherService.favoriteTeacher('teacher-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/teachers/teacher-1/favorite');
    });
  });

  describe('unfavoriteTeacher', () => {
    it('removes teacher from favorites successfully', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await TeacherService.unfavoriteTeacher('teacher-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/teachers/teacher-1/favorite');
    });
  });

  describe('isTeacherFavorited', () => {
    it('checks favorite status successfully', async () => {
      const mockResponse = { data: { isFavorited: true } };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TeacherService.isTeacherFavorited('teacher-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/teachers/teacher-1/favorite');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTeacherStatistics', () => {
    it('fetches teacher statistics successfully', async () => {
      const mockStats = {
        totalStudents: 50,
        totalHours: 200,
        averageRating: 4.8,
        totalRevenue: 40000
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await TeacherService.getTeacherStatistics('teacher-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/teachers/teacher-1/statistics');
      expect(result).toEqual(mockStats);
    });

    it('returns mock data when API fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await TeacherService.getTeacherStatistics('teacher-1');

      expect(result.totalStudents).toBeDefined();
      expect(typeof result.totalStudents).toBe('number');
    });
  });

  describe('getTeacherSchedule', () => {
    it('fetches teacher schedule successfully', async () => {
      const mockSchedule = {
        weeklySchedule: [],
        settings: {
          autoAcceptBookings: false,
          advanceBookingDays: 7,
          cancellationHours: 24,
          defaultPrice: 200,
          defaultDuration: 60
        }
      };

      mockApiClient.get.mockResolvedValue({ data: mockSchedule });

      const result = await TeacherService.getTeacherSchedule('teacher-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/teachers/teacher-1/schedule');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('updateTeacherSchedule', () => {
    it('updates teacher schedule successfully', async () => {
      const scheduleData = {
        teacherId: 'teacher-1',
        weeklySchedule: [],
        settings: {
          autoAcceptBookings: false,
          advanceBookingDays: 7,
          cancellationHours: 24,
          defaultPrice: 200,
          defaultDuration: 60
        },
        updatedAt: '2024-01-01'
      };

      mockApiClient.put.mockResolvedValue({ data: { success: true } });

      await TeacherService.updateTeacherSchedule('teacher-1', scheduleData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/teachers/teacher-1/schedule', scheduleData);
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      // Should not throw for methods that return mock data
      const result = await TeacherService.getTeachers({});
      expect(result).toBeDefined();
    });

    it('logs errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiClient.get.mockRejectedValue(new Error('API error'));

      await TeacherService.getTeachers({});

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});