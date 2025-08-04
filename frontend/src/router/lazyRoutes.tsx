import { createLazyComponent, preloadComponent } from '../utils/performance';

// 页面组件懒加载
export const LazyHomePage = createLazyComponent(
  () => import('../pages/HomePage'),
  'HomePage'
);

export const LazyLoginPage = createLazyComponent(
  () => import('../pages/LoginPage'),
  'LoginPage'
);

export const LazyRegisterPage = createLazyComponent(
  () => import('../pages/RegisterPage'),
  'RegisterPage'
);

// 暂时注释不存在的页面组件
// export const LazyDashboardPage = createLazyComponent(
//   () => import('../pages/DashboardPage'),
//   'DashboardPage'
// );

// 其他页面组件类似处理...

// 功能组件懒加载（暂时注释不存在的组件）
// export const LazyTeacherCard = createLazyComponent(
//   () => import('../components/teachers/TeacherCard'),
//   'TeacherCard'
// );

// 其他组件类似处理...

// 预加载策略（仅包含存在的模块）
export const preloadRoutes = {
  // 高优先级页面（用户可能立即访问）
  critical: () => {
    preloadComponent(() => import('../pages/LoginPage'));
    preloadComponent(() => import('../pages/RegisterPage'));
    // preloadComponent(() => import('../pages/DashboardPage'));
  },

  // 中优先级页面（用户可能很快访问）
  important: () => {
    // preloadComponent(() => import('../pages/TeacherProfilePage'));
    // preloadComponent(() => import('../pages/AppointmentsPage'));
    // preloadComponent(() => import('../pages/ProfilePage'));
  },

  // 低优先级页面（用户可能稍后访问）
  optional: () => {
    // preloadComponent(() => import('../pages/SettingsPage'));
    // preloadComponent(() => import('../pages/TeacherVerificationPage'));
    // preloadComponent(() => import('../components/chat/Chat'));
    // preloadComponent(() => import('../components/video/VideoCall'));
  },

  // 根据用户角色预加载
  byRole: {
    student: () => {
      // preloadComponent(() => import('../pages/StudentDashboardPage'));
      // preloadComponent(() => import('../components/teachers/TeacherCard'));
      // preloadComponent(() => import('../components/appointments/AppointmentForm'));
    },

    teacher: () => {
      // preloadComponent(() => import('../pages/TeacherDashboardPage'));
      // preloadComponent(() => import('../components/calendar/Calendar'));
      // preloadComponent(() => import('../pages/TeacherVerificationPage'));
    },
  },

  // 根据页面预加载相关组件
  byPage: {
    home: () => {
      // preloadComponent(() => import('../components/teachers/TeacherCard'));
      preloadComponent(() => import('../pages/LoginPage'));
    },

    dashboard: () => {
      // preloadComponent(() => import('../components/appointments/AppointmentForm'));
      // preloadComponent(() => import('../components/calendar/Calendar'));
    },

    profile: () => {
      // preloadComponent(() => import('../pages/SettingsPage'));
      // preloadComponent(() => import('../components/chat/Chat'));
    },
  },
};

// 智能预加载Hook
export const useRoutePreloading = () => {
  React.useEffect(() => {
    // 页面加载完成后预加载关键路由
    const timer = setTimeout(() => {
      preloadRoutes.critical();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // 用户交互后预加载重要路由
    const handleUserInteraction = () => {
      preloadRoutes.important();
      // 移除事件监听器，只执行一次
      document.removeEventListener('mousedown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('mousedown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('mousedown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  React.useEffect(() => {
    // 网络空闲时预加载可选路由
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadRoutes.optional();
      }, { timeout: 10000 });
    } else {
      setTimeout(() => {
        preloadRoutes.optional();
      }, 5000);
    }
  }, []);
};

// 路由级性能监控
export const withRoutePerformance = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  routeName: string
) => {
  return React.memo((props: P) => {
    React.useEffect(() => {
      // 记录路由加载开始时间
      performance.mark(`route-${routeName}-start`);
      
      return () => {
        // 记录路由加载结束时间
        performance.mark(`route-${routeName}-end`);
        performance.measure(
          `route-${routeName}`,
          `route-${routeName}-start`,
          `route-${routeName}-end`
        );
      };
    }, []);

    return <WrappedComponent {...props} />;
  });
};

// 路由切换动画优化
export const RouteTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [isEntering, setIsEntering] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [children]);

  return (
    <div 
      className={`
        transition-opacity duration-150 ease-in-out
        ${isEntering ? 'opacity-0' : 'opacity-100'}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
};

// 导入React
import React from 'react';