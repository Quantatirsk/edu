import React from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import { useAuthStatus } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuthStatus();

  // 调试信息：检查认证状态
  console.log('LoginPage: isAuthenticated =', isAuthenticated);

  // 如果已经登录，重定向到首页
  if (isAuthenticated) {
    console.log('LoginPage: Redirecting to home because user is authenticated');
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            优教辅导平台
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            连接优秀教师与学生，提供个性化一对一辅导服务
          </p>
        </div>

        {/* 登录表单 */}
        <LoginForm
          onSuccess={() => {
            // 登录成功后的处理逻辑
            console.log('Login successful');
          }}
        />

        {/* 功能特色 */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              为什么选择我们？
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">专业教师</h3>
              <p className="text-sm text-gray-600">
                经过严格筛选的专业教师团队，确保教学质量
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">个性化教学</h3>
              <p className="text-sm text-gray-600">
                根据学生特点定制专属学习计划，提高学习效率
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">效果跟踪</h3>
              <p className="text-sm text-gray-600">
                实时跟踪学习进度和成绩提升，数据化管理
              </p>
            </div>
          </div>
        </div>

        {/* 底部链接 */}
        <div className="mt-12 text-center">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <a href="/about" className="hover:text-gray-700">
              关于我们
            </a>
            <a href="/contact" className="hover:text-gray-700">
              联系客服
            </a>
            <a href="/help" className="hover:text-gray-700">
              帮助中心
            </a>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            © 2024 优教辅导平台. 保留所有权利.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;