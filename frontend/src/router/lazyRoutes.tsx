import React from 'react';
import { createLazyComponent } from '../utils/performance';

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