import React from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuthStatus } from '../stores/authStore';

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuthStatus();

  // 如果已经登录，重定向到首页
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 左侧内容区域 */}
        <div className="lg:w-1/2 flex flex-col justify-center px-8 py-12">
          <div className="max-w-md mx-auto w-full">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                加入优教辅导平台
              </h1>
            </div>

            {/* 注册表单 */}
            <RegisterForm
              onSuccess={() => {
                console.log('Registration successful');
              }}
            />
          </div>
        </div>

        {/* 右侧特色展示区域 */}
        <div className="lg:w-1/2 bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col justify-center px-8 py-12 text-white">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                开启您的学习之旅
              </h2>
              <p className="text-xl text-blue-100">
                无论您是学生还是教师，我们都有适合您的解决方案
              </p>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10,000+</div>
                <div className="text-blue-200">注册用户</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">2,000+</div>
                <div className="text-blue-200">专业教师</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">50,000+</div>
                <div className="text-blue-200">完成课程</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-blue-200">满意度</div>
              </div>
            </div>

            {/* 功能特色 */}
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold mb-2">专业教师团队</h3>
                  <p className="text-blue-100">
                    经过严格筛选和培训的专业教师，为您提供高质量的一对一辅导服务
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold mb-2">个性化教学</h3>
                  <p className="text-blue-100">
                    根据每个学生的学习特点和需求，制定专属的个性化学习计划
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold mb-2">学习效果跟踪</h3>
                  <p className="text-blue-100">
                    实时跟踪学习进度，通过数据分析帮助学生和教师优化学习效果
                  </p>
                </div>
              </div>
            </div>

            {/* 用户评价 */}
            <div className="mt-12 p-6 bg-blue-700 rounded-lg">
              <div className="flex items-center mb-4">
                <img
                  src="/api/placeholder/40/40"
                  alt="用户头像"
                  className="w-10 h-10 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold">张同学</div>
                  <div className="text-blue-200 text-sm">高三学生</div>
                </div>
              </div>
              <p className="text-blue-100 italic">
                "在这里找到了非常适合我的数学老师，成绩提升了很多。老师很耐心，教学方法也很有效！"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;