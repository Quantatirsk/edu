import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Navigation, BarChart3, Star, CheckCircle } from 'lucide-react';
import { useAuthStatus } from '../stores/authStore';
import LoginEntryButtons from '../components/auth/LoginEntryButtons';
import ClearAuthButton from '../components/debug/ClearAuthButton';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <ClearAuthButton />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="w-full px-2 sm:px-4">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              欢迎使用优教辅导平台
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              连接优秀教师与学生，提供个性化一对一辅导服务，帮助学生提升学习成绩，实现学业目标
            </p>
            
            {/* 用户状态展示 */}
            {isAuthenticated && user ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 max-w-sm mx-auto mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-base font-semibold text-gray-900">
                    欢迎回来，{user.name}！
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {user.role === 'student' ? '继续您的学习之旅' : '管理您的教学课程'}
                </p>
                <Link 
                  to="/analytics"
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  查看分析数据
                </Link>
              </div>
            ) : (
              <div className="mb-8">
                <LoginEntryButtons variant="hero" />
              </div>
            )}

            {/* 统计数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">10,000+</div>
                <div className="text-xs text-gray-600">注册用户</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 mb-1">500+</div>
                <div className="text-xs text-gray-600">优秀教师</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600 mb-1">50,000+</div>
                <div className="text-xs text-gray-600">完成课程</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600 mb-1">4.9</div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  平均评分
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/teachers" className="bg-white/80 backdrop-blur-sm rounded-lg p-4 hover:shadow-lg transition-all duration-300 text-center">
              <User className="h-10 w-10 text-blue-600 mx-auto mb-3 p-2 bg-blue-100 rounded-full" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">浏览教师</h3>
              <p className="text-xs text-gray-600 mb-3">
                查看所有优秀教师资料，选择最适合的老师
              </p>
              <div className="text-blue-600 text-sm font-medium">立即浏览 →</div>
            </Link>
            
            <Link to="/nearby-teachers" className="bg-white/80 backdrop-blur-sm rounded-lg p-4 hover:shadow-lg transition-all duration-300 text-center">
              <Navigation className="h-10 w-10 text-green-600 mx-auto mb-3 p-2 bg-green-100 rounded-full" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">附近教师</h3>
              <p className="text-xs text-gray-600 mb-3">
                找到离你最近的优秀教师，节省通勤时间
              </p>
              <div className="text-green-600 text-sm font-medium">查找附近 →</div>
            </Link>
            
            <Link to="/analytics" className="bg-white/80 backdrop-blur-sm rounded-lg p-4 hover:shadow-lg transition-all duration-300 text-center">
              <BarChart3 className="h-10 w-10 text-purple-600 mx-auto mb-3 p-2 bg-purple-100 rounded-full" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">学习分析</h3>
              <p className="text-xs text-gray-600 mb-3">
                查看学习进度和成绩分析，制定学习计划
              </p>
              <div className="text-purple-600 text-sm font-medium">
                {isAuthenticated ? '查看分析 →' : '需要登录 →'}
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-white py-6">
        <div className="w-full px-2 sm:px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">平台特色</h2>
            <p className="text-xs text-gray-600">为什么选择优教辅导平台</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">专业教师</h3>
              <p className="text-xs text-gray-600">经过严格筛选的专业教师团队</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">个性化教学</h3>
              <p className="text-xs text-gray-600">根据学生特点定制专属学习计划</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">效果跟踪</h3>
              <p className="text-xs text-gray-600">实时跟踪学习进度和成绩提升</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">便捷服务</h3>
              <p className="text-xs text-gray-600">在线预约、支付，服务便捷高效</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-blue-600 py-8">
        <div className="w-full px-2 sm:px-4 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
            开始你的学习之旅
          </h2>
          <p className="text-sm text-blue-100 mb-6">
            立即浏览教师资料，找到最适合的老师开始学习
          </p>
          <Link 
            to="/teachers"
            className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 text-sm font-semibold rounded-md inline-block transition-colors"
          >
            浏览教师
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;