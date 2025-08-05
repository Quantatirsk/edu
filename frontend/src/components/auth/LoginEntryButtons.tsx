import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LoginEntryButtonsProps {
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
  showRegister?: boolean;
}

const LoginEntryButtons: React.FC<LoginEntryButtonsProps> = ({ 
  variant = 'default', 
  className = '',
  showRegister = true 
}) => {
  if (variant === 'hero') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            开始你的学习之旅
          </h3>
          <p className="text-gray-600 text-lg">
            登录或注册账户，体验个性化教育服务
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/login" 
            className="block"
            onClick={() => console.log('Navigating to login page')}
          >
            <Button size="lg" className="w-full sm:w-auto min-w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <LogIn className="h-5 w-5 mr-2" />
              立即登录
            </Button>
          </Link>
          
          {showRegister && (
            <Link 
              to="/register" 
              className="block"
              onClick={() => console.log('Navigating to register page')}
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[140px] border-blue-600 text-blue-600 hover:bg-blue-50">
                <UserPlus className="h-5 w-5 mr-2" />
                免费注册
              </Button>
            </Link>
          )}
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>已有超过 10,000+ 用户选择我们的平台</p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Link 
          to="/login" 
          className="block"
          onClick={() => console.log('Compact: Navigating to login page')}
        >
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            登录
          </Button>
        </Link>
        
        {showRegister && (
          <Link 
            to="/register" 
            className="block"
            onClick={() => console.log('Compact: Navigating to register page')}
          >
            <Button size="sm" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              注册
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Default variant - card style
  return (
    <Card className={`border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            访问个人中心
          </h3>
          <p className="text-gray-600">
            登录查看学习进度、预约课程和更多功能
          </p>
        </div>
        
        <div className="space-y-3">
          <Link to="/login" className="block">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <LogIn className="h-4 w-4 mr-2" />
              登录账户
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          
          {showRegister && (
            <Link to="/register" className="block">
              <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                <UserPlus className="h-4 w-4 mr-2" />
                创建新账户
              </Button>
            </Link>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            安全登录 • 数据保护 • 隐私第一
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginEntryButtons;