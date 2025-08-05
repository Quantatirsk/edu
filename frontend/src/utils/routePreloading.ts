import React from 'react';

// 预加载组件工具函数
const preloadComponent = (componentImporter: () => Promise<{ default: React.ComponentType }>) => {
  const componentImport = componentImporter();
  return componentImport.catch((err: Error) => {
    console.warn('Failed to preload component:', err);
  });
};

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

  // 低优先级页面（在空闲时预加载）
  idle: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // preloadComponent(() => import('../pages/HelpPage'));
        // preloadComponent(() => import('../pages/AboutPage'));
      });
    }
  },
};

// 智能预加载Hook
export const useRoutePreloading = () => {
  React.useEffect(() => {
    // 页面加载完成后预加载关键路由
    const timer = setTimeout(() => {
      preloadRoutes.critical();
    }, 2000);

    // 用户交互后预加载重要路由
    const handleUserInteraction = () => {
      preloadRoutes.important();
      // 只执行一次
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };

    // 监听用户交互
    window.addEventListener('mousemove', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    // 空闲时预加载
    setTimeout(() => {
      preloadRoutes.idle();
    }, 5000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);
};

// 路由级性能监控
export const withRoutePerformance = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  routeName: string
) => {
  return React.memo((props: P) => {
    React.useEffect(() => {
      const startTime = performance.now();
      
      // TTFB 和 FCP 监控
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log(`Route ${routeName} TTFB:`, entry.responseStart);
          }
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            console.log(`Route ${routeName} FCP:`, entry.startTime);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });

      return () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        // 记录路由渲染时间
        console.log(`Route ${routeName} render time:`, loadTime);
        
        // 发送性能数据到分析服务
        if (typeof window !== 'undefined' && 'gtag' in window) {
          // @ts-expect-error - gtag is a global function that may not be typed
          window.gtag('event', 'page_view_timing', {
            route_name: routeName,
            load_time: loadTime,
          });
        }

        observer.disconnect();
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  });
};