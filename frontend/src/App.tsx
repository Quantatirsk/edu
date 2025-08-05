import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { Teacher, DetailedReview, ScoreRecord } from './types';
import { mockTeachers, mockDetailedReviews, mockScoreRecords } from './data/mockData';

// API and State Management
import { queryClient } from './utils/queryClient';
import { useAuthStatus } from './stores/authStore';
import { useError } from './hooks/useError';

// Router
import AppRouter from './router/AppRouter';

// Error Boundary Component
import ErrorBoundary from './components/ErrorBoundary';

// Toast notifications
import { Toaster } from './components/ui/toaster';

// 应用主组件
function AppContent() {
  // 认证状态管理
  const { user, isAuthenticated, isLoading } = useAuthStatus();
  
  // 错误处理
  const { error: globalError } = useError({
    showNotification: true,
    logError: true,
  });
  
  // 临时使用 mock 数据，后续会替换为 API 调用
  const [teachers] = useState<Teacher[]>(mockTeachers);
  const [detailedReviews] = useState<DetailedReview[]>(mockDetailedReviews);
  const [scoreRecords] = useState<ScoreRecord[]>(mockScoreRecords);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // 获取用户位置的函数 (需要用户手势触发) - 暂时未使用，后续可通过按钮点击触发
  /*
  const getUserLocation = async () => {
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 300000, // 5分钟缓存
          });
        });
        
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } else {
        // 浏览器不支持地理定位，使用默认位置（北京市中心）
        setUserLocation({ lat: 39.9042, lng: 116.4074 });
      }
    } catch (error) {
      console.warn('获取地理位置失败:', error);
      // 获取位置失败，使用默认位置（北京市中心）
      setUserLocation({ lat: 39.9042, lng: 116.4074 });
    }
  };
  */

  // 初始化时使用默认位置，避免自动请求地理位置
  useEffect(() => {
    // 使用默认位置（北京市中心）
    setUserLocation({ lat: 39.9042, lng: 116.4074 });
  }, []);
  
  // 全局错误处理
  useEffect(() => {
    if (globalError) {
      console.error('Global Error:', globalError);
      // 这里可以显示全局错误提示
      // 或者重定向到错误页面
    }
  }, [globalError]);
  
  // 如果正在加载认证状态，显示加载界面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppRouter
        user={user} // 使用真实的用户认证状态
        teachers={teachers}
        detailedReviews={detailedReviews}
        scoreRecords={scoreRecords}
        onSelectTeacher={setSelectedTeacher}
        userLocation={userLocation}
        isAuthenticated={isAuthenticated}
        selectedTeacher={selectedTeacher}
      />
      <Toaster />
    </ErrorBoundary>
  );
}

// 主 App 组件，包含 Provider 配置
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      {/* 开发环境下显示 React Query DevTools */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
