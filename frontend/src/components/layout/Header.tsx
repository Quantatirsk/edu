import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, BarChart3, LogOut, Settings } from 'lucide-react';
import type { User as UserType } from '../../types';
import { useAuthStatus, useAuthActions } from '../../stores/authStore';
import LoginEntryButtons from '../auth/LoginEntryButtons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  user: UserType | null;
}

const Header: React.FC<HeaderProps> = ({ user: propUser }) => {
  const location = useLocation();
  const { user: authUser, isAuthenticated } = useAuthStatus();
  const { clearAuth } = useAuthActions();
  
  // 使用认证系统的用户信息，fallback到props传递的用户信息
  const user = authUser || propUser;
  
  const isActive = (path: string, exactMatch = false) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      clearAuth();
      console.log('已成功登出');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="w-full px-2 sm:px-4">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-blue-500 mr-1.5" />
            <Link 
              to="/"
              className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors"
            >
              优教辅导
            </Link>
          </div>
          
          {/* 桌面端导航 */}
          <nav className="hidden md:flex space-x-4">
            <Link 
              to="/teachers"
              className={`flex items-center text-sm transition-colors ${
                isActive('/teachers') 
                  ? 'text-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-3.5 w-3.5 mr-1" />
              教师列表
            </Link>
            <Link 
              to="/analytics"
              className={`flex items-center text-sm transition-colors ${
                isActive('/analytics', true) 
                  ? 'text-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              学习分析
            </Link>
          </nav>
          
          {/* 用户信息/登录按钮 */}
          <div className="flex items-center">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 p-1.5">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=007AFF&color=fff`} 
                      alt={user.name} 
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-gray-700 text-sm hidden sm:block">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1 text-sm font-medium">
                    {user.name}
                  </div>
                  <div className="px-2 py-1 text-xs text-gray-500">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center text-sm">
                      <Settings className="h-3.5 w-3.5 mr-2" />
                      个人设置
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/analytics" className="flex items-center text-sm">
                      <BarChart3 className="h-3.5 w-3.5 mr-2" />
                      学习分析
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-sm text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LoginEntryButtons variant="compact" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;