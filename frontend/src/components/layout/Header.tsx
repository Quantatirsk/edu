import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, Navigation, BarChart3 } from 'lucide-react';
import type { User as UserType } from '../../types';

interface HeaderProps {
  user: UserType | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const location = useLocation();
  
  const isActive = (path: string, exactMatch = false) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-500 mr-2" />
            <Link 
              to="/"
              className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
            >
              优教辅导
            </Link>
          </div>
          
          {/* 桌面端导航 */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/teachers"
              className={`flex items-center transition-colors ${
                isActive('/teachers') 
                  ? 'text-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 mr-1" />
              教师列表
            </Link>
            <Link 
              to="/analytics"
              className={`flex items-center transition-colors ${
                isActive('/analytics', true) 
                  ? 'text-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              学习分析
            </Link>
          </nav>
          
          {/* 用户信息 */}
          <div className="flex items-center">
            {user && (
              <div className="flex items-center">
                <img 
                  src={user.avatar || 'https://ui-avatars.com/api/?name=用户&background=007AFF&color=fff'} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full mr-2"
                />
                <span className="text-gray-700">{user.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;