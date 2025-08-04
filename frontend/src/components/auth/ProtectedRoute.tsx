import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStatus } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuthStatus();
  
  // 权限检查逻辑 - 使用useMemo避免无限循环
  const canAccess = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    if (!requiredRole) return true;
    return user.role === requiredRole;
  }, [isAuthenticated, user, requiredRole]);
  
  const shouldRedirect = !isLoading && !canAccess;

  // 如果正在加载认证状态，显示加载组件
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 如果需要重定向
  if (shouldRedirect) {
    if (!isAuthenticated) {
      // 未登录，重定向到登录页面
      return (
        <Navigate
          to={fallbackPath}
          state={{ from: location.pathname }}
          replace
        />
      );
    } else if (!canAccess) {
      // 已登录但权限不足，重定向到首页
      return <Navigate to="/" replace />;
    }
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
};

// 高阶组件版本
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: 'student' | 'teacher' | 'admin';
    fallbackPath?: string;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// 角色权限检查组件
export const RoleGuard: React.FC<{
  children: React.ReactNode;
  allowedRoles: Array<'student' | 'teacher' | 'admin'>;
  fallback?: React.ReactNode;
}> = ({ children, allowedRoles, fallback = null }) => {
  const { user } = useAuthStatus();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// 权限显示组件
export const PermissionGuard: React.FC<{
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, permissions, requireAll = false, fallback = null }) => {
  const { user } = useAuthStatus();

  if (!user || !user.permissions) {
    return <>{fallback}</>;
  }

  const userPermissions = user.permissions;
  const hasPermission = requireAll
    ? permissions.every(p => userPermissions.includes(p))
    : permissions.some(p => userPermissions.includes(p));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// 登录状态显示组件
export const AuthGuard: React.FC<{
  children: React.ReactNode;
  authenticated?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, authenticated = true, fallback = null }) => {
  const { isAuthenticated } = useAuthStatus();

  if (isAuthenticated !== authenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;