import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, BookOpen, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoginEntryButtons from './LoginEntryButtons';

interface AuthGuardProps {
  title?: string;
  description?: string;
  features?: string[];
  variant?: 'default' | 'analytics' | 'minimal';
  className?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  title,
  description,
  features,
  variant = 'default',
  className = ''
}) => {
  // 根据不同场景设置默认内容
  const getDefaultContent = () => {
    if (variant === 'analytics') {
      return {
        title: '登录查看学习分析',
        description: '查看您的学习进度、成绩趋势和个性化分析报告',
        features: [
          '📊 个人学习数据分析',
          '📈 成绩进步趋势图',
          '🎯 学习目标跟踪',
          '📚 科目成绩统计',
          '🏆 学习成就展示'
        ],
        icon: BarChart3
      };
    }
    
    return {
      title: '请先登录',
      description: '登录后即可使用完整的平台功能',
      features: [
        '👨‍🏫 浏览和预约优秀教师',
        '📅 管理您的学习日程',
        '💬 与教师在线沟通',
        '📊 查看学习进度分析',
        '⭐ 参与课程评价'
      ],
      icon: User
    };
  };

  const content = {
    title: title || getDefaultContent().title,
    description: description || getDefaultContent().description,
    features: features || getDefaultContent().features,
    icon: getDefaultContent().icon
  };

  if (variant === 'minimal') {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Alert className="max-w-md mx-auto mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {content.description}
          </AlertDescription>
        </Alert>
        
        <LoginEntryButtons variant="compact" className="justify-center" />
      </div>
    );
  }

  const IconComponent = content.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-4xl w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* 左侧信息展示 */}
          <div className="text-center lg:text-left">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <IconComponent className="h-10 w-10 text-blue-600" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                {content.description}
              </p>
            </div>

            {/* 功能列表 */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                登录后您可以：
              </h3>
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* 安全提示 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="h-4 w-4 text-green-600" />
                <span>您的数据采用银行级加密保护</span>
              </div>
            </div>
          </div>

          {/* 右侧登录卡片 */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    欢迎回来
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    登录您的账户继续学习之旅
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <Link to="/login" className="block">
                      <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg">
                        <User className="h-5 w-5 mr-2" />
                        登录账户
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">或</span>
                      </div>
                    </div>
                    
                    <Link to="/register" className="block">
                      <Button variant="outline" className="w-full h-12 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg">
                        创建新账户
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      继续即表示您同意我们的服务条款和隐私政策
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 快速访问 */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-3">或者浏览公开内容</p>
                <div className="flex justify-center gap-4">
                  <Link 
                    to="/teachers"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    浏览教师
                  </Link>
                  <Link 
                    to="/"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                    返回首页
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGuard;