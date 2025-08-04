// 用户相关类型
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  grade?: string;
  subject?: string[];
  experience?: number;
  rating?: number;
  reviews?: number;
  location?: Location;
  permissions?: string[];
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
  district: string;
}

export interface DetailedRatings {
  teaching: number;
  patience: number;
  communication: number;
  effectiveness: number;
}

// 教师类型
export interface Teacher extends User {
  subject: string[];
  experience: number;
  rating: number;
  reviews: number;
  price: number;
  location: Location;
  detailedRatings: DetailedRatings;
  availability: string[];
  certifications: string[];
  teachingStyle: string;
  description: string;
}

// 学生类型
export interface Student extends User {
  grade: string;
  targetScore: number;
  weakSubjects: string[];
  studyGoals: string[];
}

// 预约类型
export interface Appointment {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  notes: string;
  lessonType: 'single' | 'package';
  packageInfo?: {
    totalLessons: number;
    completedLessons: number;
  };
}

// 评价类型
export interface DetailedReview {
  id: string;
  appointmentId: string;
  studentId: string;
  teacherId: string;
  ratings: {
    overall: number;
    teaching: number;
    patience: number;
    communication: number;
    effectiveness: number;
  };
  comment: string;
  date: string;
  isRecommended: boolean;
  tags: string[];
}

// 成绩记录类型
export interface ScoreRecord {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  testType: string;
  beforeScore: number;
  afterScore: number;
  maxScore: number;
  date: string;
  lessonCount: number;
  notes: string;
}

// 页面类型
export type Page = 'home' | 'teachers' | 'teacher-detail' | 'appointments' | 'student-management' | 'profile' | 'analytics' | 'nearby-teachers';

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// 教师搜索参数
export interface TeacherSearchParams {
  search?: string;
  subject?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  location?: string;
  orderBy?: 'rating' | 'price' | 'experience';
  orderDesc?: boolean;
}