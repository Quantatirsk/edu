import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import type { User, Teacher, DetailedReview } from '../types';

// Pages
import HomePage from '../pages/HomePage';
import TeacherListPage from '../pages/TeacherListPage';
import TeacherDetailPage from '../pages/TeacherDetailPage';
import ReviewsPage from '../pages/ReviewsPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Components
import Header from '../components/layout/Header';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import TeacherSchedule from '../components/TeacherSchedule';
import NotificationSystem from '../components/NotificationSystem';

interface AppRouterProps {
  user: User | null;
  teachers: Teacher[];
  detailedReviews: DetailedReview[];
  onSelectTeacher: (teacher: Teacher) => void;
  userLocation: {lat: number, lng: number} | null;
}

// 包装组件来处理教师详情页面的路由参数
const TeacherDetailWrapper: React.FC<{
  teachers: Teacher[];
  detailedReviews: DetailedReview[];
  onSelectTeacher: (teacher: Teacher) => void;
  userLocation: {lat: number, lng: number} | null;
}> = ({ teachers, detailedReviews, onSelectTeacher, userLocation }) => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const teacher = teachers.find(t => t.id === teacherId) || null;
  
  // 如果找到教师，自动设置为选中状态
  React.useEffect(() => {
    if (teacher) {
      onSelectTeacher(teacher);
    }
  }, [teacher, onSelectTeacher]);
  
  return (
    <TeacherDetailPage
      teacher={teacher}
      reviews={detailedReviews}
      userLocation={userLocation}
    />
  );
};

const AppRouter: React.FC<AppRouterProps> = ({
  user,
  teachers,
  detailedReviews,
  onSelectTeacher,
  userLocation
}) => {
  return (
    <Router>
      <Routes>
        {/* 认证相关路由 - 独立布局 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 主应用路由 - 全宽紧凑布局 */}
        <Route path="/" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <HomePage />
          </div>
        } />
        
        <Route path="/teachers" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <main className="w-full px-2 py-4 sm:px-4 sm:py-6">
              <TeacherListPage />
            </main>
          </div>
        } />
        
        <Route path="/teachers/:teacherId" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <main className="w-full">
              <TeacherDetailWrapper
                teachers={teachers}
                detailedReviews={detailedReviews}
                onSelectTeacher={onSelectTeacher}
                userLocation={userLocation}
              />
            </main>
          </div>
        } />
        
        <Route path="/teachers/:teacherId/reviews" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <main className="w-full px-2 py-4 sm:px-4 sm:py-6">
              <ReviewsPage />
            </main>
          </div>
        } />
        
        <Route path="/appointments" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <main className="w-full px-2 py-4 sm:px-4 sm:py-6">
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            </main>
          </div>
        } />
        
        <Route path="/analytics" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <AnalyticsPage />
          </div>
        } />
        
        <Route path="/schedule" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <main className="w-full px-2 py-4 sm:px-4 sm:py-6">
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherSchedule />
              </ProtectedRoute>
            </main>
          </div>
        } />
        
        <Route path="/notifications" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <main className="w-full px-2 py-4 sm:px-4 sm:py-6">
              <ProtectedRoute>
                <NotificationSystem />
              </ProtectedRoute>
            </main>
          </div>
        } />
        
        {/* 重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;