// Service exports for centralized access
export { TeacherService } from './teacherService';
export { AppointmentService } from './appointmentService';  
export { UserService } from './userService';

// Import for internal use
import { TeacherService } from './teacherService';
import { AppointmentService } from './appointmentService';
import { UserService } from './userService';

// Type exports for convenience
export type {
  TeacherFilters,
  TeacherSearchParams,
  PaginatedTeachers,
  TeacherStatistics,
} from './teacherService';

export type {
  AppointmentStatus,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentSearchParams,
  PaginatedAppointments,
  AppointmentStatistics,
  TimeConflictCheck,
} from './appointmentService';

export type {
  UserPreferences,
  UserActivity,
  UserStatistics,
  SecuritySettings,
} from './userService';

// Service instances for direct use
export { default as teacherService } from './teacherService';
export { default as appointmentService } from './appointmentService';
export { default as userService } from './userService';

// Utility functions for service management
export const serviceRegistry = {
  teacher: TeacherService,
  appointment: AppointmentService,
  user: UserService,
};

// Global service configuration
export const configureServices = (config: {
  baseURL?: string;
  timeout?: number;
  retries?: number;
}) => {
  // Configuration logic can be added here if needed
  console.log('Services configured with:', config);
};

// Service health check utility
export const checkServiceHealth = async () => {
  const results = {
    teacher: false,
    appointment: false,
    user: false,
  };

  try {
    // These would be actual health check endpoints in a real API
    await TeacherService.getSubjects();
    results.teacher = true;
  } catch (error) {
    console.warn('Teacher service health check failed:', error);
  }

  try {
    await UserService.getCurrentUser();
    results.user = true;
  } catch (error) {
    console.warn('User service health check failed:', error);
  }

  // Appointment service doesn't have a simple health check endpoint
  // so we'll assume it's healthy if user service is healthy
  results.appointment = results.user;

  return results;
};

// Error handling utilities for services
export const handleServiceError = (error: unknown, context: string) => {
  console.error(`Service error in ${context}:`, error);
  
  // You can add global error handling logic here
  // For example, showing notifications, logging to external services, etc.
  
  return error;
};

// Service caching utilities
export const serviceCacheKeys = {
  // Teacher service cache keys
  teachers: 'teachers',
  teacher: (id: string) => `teacher:${id}`,
  teacherReviews: (id: string) => `teacher_reviews:${id}`,
  teacherSubjects: 'teacher_subjects',
  teacherLocations: 'teacher_locations',
  teacherStatistics: 'teacher_statistics',
  
  // User service cache keys
  currentUser: 'current_user',
  user: (id: string) => `user:${id}`,
  userPreferences: 'user_preferences',
  userStatistics: 'user_statistics',
  userActivity: 'user_activity',
  
  // Appointment service cache keys
  appointments: 'appointments',
  appointment: (id: string) => `appointment:${id}`,
  appointmentStatistics: 'appointment_statistics',
  upcomingAppointments: 'upcoming_appointments',
  availableSlots: (teacherId: string, date: string) => `available_slots:${teacherId}:${date}`,
};

// Development utilities
if (import.meta.env.DEV) {
  // Expose services to window for debugging
  (window as Window & { services?: Record<string, unknown> }).services = {
    teacher: TeacherService,
    appointment: AppointmentService,
    user: UserService,
    checkHealth: checkServiceHealth,
    cacheKeys: serviceCacheKeys,
  };
  
  console.log('🔧 Services available on window.services for debugging');
}