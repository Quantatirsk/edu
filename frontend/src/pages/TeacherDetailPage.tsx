import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Award, MapPin, Phone, Mail, Star, ThumbsUp } from 'lucide-react';
import type { Teacher, DetailedReview } from '../types';

interface TeacherDetailPageProps {
  teacher: Teacher | null;
  reviews: DetailedReview[];
  userLocation?: {lat: number, lng: number} | null;
}

const TeacherDetailPage: React.FC<TeacherDetailPageProps> = ({ 
  teacher, 
  reviews, 
  userLocation 
}) => {
  const navigate = useNavigate();
  if (!teacher) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未选择教师</p>
      </div>
    );
  }

  // 计算距离函数
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const teacherReviews = reviews.filter(r => r.teacherId === teacher.id);
  const teacherDistance = userLocation ? calculateDistance(
    userLocation.lat, userLocation.lng,
    teacher.location.lat, teacher.location.lng
  ).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/teachers')}
        className="flex items-center text-blue-500 hover:text-blue-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> 返回教师列表
      </button>
      
      <div className="card">
        {/* 教师基本信息 */}
        <div className="card-content border-b border-gray-200">
          <div className="flex flex-col md:flex-row items-start">
            <img 
              src={teacher.avatar} 
              alt={teacher.name} 
              className="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-6"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{teacher.name}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{teacher.subject.join(', ')}</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  <span>{teacher.experience}年教学经验</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{teacher.location.district}</span>
                  {teacherDistance && <span className="ml-1">• 距离{teacherDistance}km</span>}
                </div>
              </div>
              
              {/* 详细评分 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{teacher.detailedRatings.teaching}</div>
                  <div className="text-xs text-gray-500">教学能力</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{teacher.detailedRatings.patience}</div>
                  <div className="text-xs text-gray-500">耐心程度</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{teacher.detailedRatings.communication}</div>
                  <div className="text-xs text-gray-500">沟通能力</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{teacher.detailedRatings.effectiveness}</div>
                  <div className="text-xs text-gray-500">教学效果</div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{teacher.description}</p>
              
              {/* 资质认证 */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">资质认证</h3>
                <div className="flex flex-wrap gap-2">
                  {teacher.certifications.map((cert, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* 教学风格 */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">教学风格</h3>
                <p className="text-gray-600 text-sm">{teacher.teachingStyle}</p>
              </div>

              {/* 可预约时间 */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">可预约时间</h3>
                <div className="flex flex-wrap gap-2">
                  {teacher.availability.map((time, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{teacher.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{teacher.email}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">¥{teacher.price}/小时</div>
              <div className="flex items-center justify-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(teacher.rating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-1">{teacher.rating} ({teacher.reviews}条评价)</span>
              </div>
              <button 
                onClick={() => {
                  // 预约功能待实现
                  console.log('预约教师:', teacher.name);
                }}
                className="btn-primary w-full md:w-auto px-6 py-2"
              >
                立即预约
              </button>
            </div>
          </div>
        </div>
        
        {/* 学生评价 */}
        <div className="card-content">
          <h2 className="text-xl font-bold mb-4">学生评价</h2>
          {teacherReviews.length > 0 ? (
            <div className="space-y-6">
              {teacherReviews.map(review => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.ratings.overall ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                      {review.isRecommended && (
                        <div className="flex items-center ml-3">
                          <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">推荐</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 详细评分 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">{review.ratings.teaching}.0</div>
                      <div className="text-xs text-gray-500">教学</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{review.ratings.patience}.0</div>
                      <div className="text-xs text-gray-500">耐心</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-600">{review.ratings.communication}.0</div>
                      <div className="text-xs text-gray-500">沟通</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-orange-600">{review.ratings.effectiveness}.0</div>
                      <div className="text-xs text-gray-500">效果</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  
                  {/* 标签 */}
                  {review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无评价</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailPage;