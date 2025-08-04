import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Navigation, BarChart3 } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="text-center py-20">
        <div className="max-w-4xl mx-auto px-4">
          <BookOpen className="h-20 w-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            欢迎使用优教辅导平台
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            连接优秀教师与学生，提供个性化一对一辅导服务，帮助学生提升学习成绩，实现学业目标
          </p>
          
          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Link to="/teachers" className="card hover:shadow-lg transition-shadow">
              <div className="card-content text-center py-8">
                <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">浏览教师</h3>
                <p className="text-gray-600">
                  查看所有优秀教师资料，选择最适合的老师
                </p>
              </div>
            </Link>
            
            <Link to="/nearby-teachers" className="card hover:shadow-lg transition-shadow">
              <div className="card-content text-center py-8">
                <Navigation className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">附近教师</h3>
                <p className="text-gray-600">
                  找到离你最近的优秀教师，节省通勤时间
                </p>
              </div>
            </Link>
            
            <Link to="/analytics" className="card hover:shadow-lg transition-shadow">
              <div className="card-content text-center py-8">
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">学习分析</h3>
                <p className="text-gray-600">
                  查看学习进度和成绩分析，制定学习计划
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">平台特色</h2>
            <p className="text-lg text-gray-600">为什么选择优教辅导平台</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">专业教师</h3>
              <p className="text-gray-600">经过严格筛选的专业教师团队</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">个性化教学</h3>
              <p className="text-gray-600">根据学生特点定制专属学习计划</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">效果跟踪</h3>
              <p className="text-gray-600">实时跟踪学习进度和成绩提升</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">便捷服务</h3>
              <p className="text-gray-600">在线预约、支付，服务便捷高效</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            开始你的学习之旅
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            立即浏览教师资料，找到最适合的老师开始学习
          </p>
          <Link 
            to="/teachers"
            className="btn-primary bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-lg inline-block"
          >
            浏览教师
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;