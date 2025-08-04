import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import type { User, Teacher, DetailedReview, ScoreRecord } from '../types';

// Pages
import HomePage from '../pages/HomePage';
import TeacherListPage from '../pages/TeacherListPage';
import TeacherDetailPage from '../pages/TeacherDetailPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Components
import Header from '../components/layout/Header';
import ProtectedRoute from '../components/auth/ProtectedRoute';

interface AppRouterProps {
  user: User | null;
  teachers: Teacher[];
  detailedReviews: DetailedReview[];
  scoreRecords: ScoreRecord[];
  onSelectTeacher: (teacher: Teacher) => void;
  userLocation: {lat: number, lng: number} | null;
  isAuthenticated: boolean;
  selectedTeacher: Teacher | null;
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
  scoreRecords,
  onSelectTeacher,
  userLocation,
  isAuthenticated: _isAuthenticated,
  selectedTeacher: _selectedTeacher
}) => {
  return (
    <Router>
      <Routes>
        {/* 认证相关路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 主应用路由 */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route 
                  path="/teachers" 
                  element={
                    <TeacherListPage
                      teachers={teachers}
                      onSelectTeacher={onSelectTeacher}
                      userLocation={userLocation}
                    />
                  } 
                />
                <Route 
                  path="/teachers/:teacherId" 
                  element={
                    <TeacherDetailWrapper
                      teachers={teachers}
                      detailedReviews={detailedReviews}
                      onSelectTeacher={onSelectTeacher}
                      userLocation={userLocation}
                    />
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage
                        user={user}
                        scoreRecords={scoreRecords}
                      />
                    </ProtectedRoute>
                  } 
                />
                {/* 重定向到首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default AppRouter;