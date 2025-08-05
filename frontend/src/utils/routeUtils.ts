// Route utility functions and constants

export const getDefaultRedirectPath = (userRole?: string): string => {
  switch (userRole) {
    case 'teacher':
      return '/teacher/dashboard';
    case 'student':
      return '/student/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

export const isProtectedRoute = (pathname: string): boolean => {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/appointments',
    '/teacher',
    '/admin'
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
};