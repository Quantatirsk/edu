import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  BookOpen, 
  Award, 
  MapPin, 
  Phone, 
  Star, 
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

// Store hooks
import { useAuthUser } from '../stores/authStore';
import { useNotificationActions } from '../stores/uiStore';

// Services
import { TeacherService } from '../services/teacherService';

// Types
import type { Teacher, DetailedReview } from '../types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import AppointmentForm from '../components/AppointmentForm';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TeacherDetailPageProps {}

const TeacherDetailPage: React.FC<TeacherDetailPageProps> = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId: string }>();
  const user = useAuthUser();
  const { showError, showSuccess } = useNotificationActions();
  
  // 使用 ref 缓存通知函数，避免 useCallback 依赖问题
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  showErrorRef.current = showError;
  showSuccessRef.current = showSuccess;

  // State
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [reviews, setReviews] = useState<DetailedReview[]>([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    distribution: {} as Record<number, number>
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  // 获取用户位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('获取位置失败:', error);
        }
      );
    }
  }, []);

  // 加载教师数据
  const loadTeacher = useCallback(async () => {
    if (!teacherId) return;
    
    try {
      setIsLoading(true);
      const teacherData = await TeacherService.getTeacher(teacherId);
      setTeacher(teacherData);
      
      // 检查是否已收藏
      if (user) {
        try {
          const favoriteStatus = await TeacherService.isTeacherFavorited(teacherId);
          setIsFavorited(favoriteStatus.isFavorited);
        } catch (error) {
          console.warn('获取收藏状态失败:', error);
        }
      }
      
    } catch (error) {
      console.error('加载教师数据失败:', error);
      showErrorRef.current('加载失败', '无法加载教师信息，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, user]); // Include user dependency

  // 加载评价数据
  const loadReviews = useCallback(async () => {
    if (!teacherId) return;
    
    try {
      setIsReviewsLoading(true);
      const response = await TeacherService.getTeacherReviews(teacherId, 1, 10);
      setReviews(response.reviews);
      setReviewStats({
        total: response.total,
        average: response.average,
        distribution: response.distribution
      });
    } catch (error) {
      console.error('加载评价数据失败:', error);
      showErrorRef.current('加载失败', '无法加载评价数据');
    } finally {
      setIsReviewsLoading(false);
    }
  }, [teacherId]); // 移除showError依赖

  // 初始化数据
  useEffect(() => {
    if (!teacherId) return;
    
    loadTeacher();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]); // 只依赖teacherId，避免无限循环

  // 计算距离
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

  // 处理收藏/取消收藏
  const handleFavoriteToggle = async () => {
    if (!teacherId || !user) return;
    
    try {
      if (isFavorited) {
        await TeacherService.unfavoriteTeacher(teacherId);
        showSuccessRef.current('已取消收藏', '教师已从收藏列表移除');
      } else {
        await TeacherService.favoriteTeacher(teacherId);
        showSuccessRef.current('收藏成功', '教师已添加到收藏列表');
      }
      setIsFavorited(!isFavorited);
    } catch {
      showErrorRef.current('操作失败', '收藏操作失败，请稍后重试');
    }
  };

  // 处理预约
  const handleBookAppointment = () => {
    if (!user) {
      showErrorRef.current('请先登录', '需要登录后才能预约教师');
      return;
    }
    
    setShowAppointmentForm(true);
  };

  // 处理预约成功
  const handleAppointmentSuccess = () => {
    setShowAppointmentForm(false);
    navigate('/appointments');
  };

  // 处理评价提交
  const handleReviewSubmit = async (reviewData: Partial<DetailedReview>) => {
    if (!teacherId) return;
    
    try {
      setIsSubmittingReview(true);
      await TeacherService.createReview(teacherId, reviewData);
      showSuccessRef.current('评价成功', '您的评价已提交，感谢您的反馈！');
      setShowReviewForm(false);
      
      // 重新加载评价数据
      loadReviews();
      loadTeacher(); // 重新加载教师数据以更新评分
      
    } catch (error) {
      console.error('提交评价失败:', error);
      showErrorRef.current('提交失败', '评价提交失败，请稍后重试');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 渲染星级评分
  const renderStarRating = (rating: number, showNumber = true) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      {showNumber && <span className="ml-1 font-medium">{rating}</span>}
    </div>
  );

  // 渲染评分分布
  const renderRatingDistribution = () => {
    const total = reviewStats.total;
    if (total === 0 || !reviewStats.distribution) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewStats.distribution?.[rating] || 0;
          const percentage = (count / total) * 100;
          
          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm">{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-1" />
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!teacherId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert>
          <AlertDescription>教师ID未提供</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-2 sm:px-4 py-3">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert>
          <AlertDescription>教师信息未找到</AlertDescription>
        </Alert>
      </div>
    );
  }

  const teacherDistance = userLocation && teacher.location && teacher.location.lat && teacher.location.lng ? calculateDistance(
    userLocation.lat, userLocation.lng,
    teacher.location.lat, teacher.location.lng
  ).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* 返回按钮 */}
      <div className="px-2 sm:px-4 py-2 border-b border-border">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-1.5"
          size="sm"
        >
          <ChevronLeft className="h-3 w-3" />
          返回
        </Button>
      </div>

      <div className="px-2 sm:px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* 主要内容区域 */}
          <div className="lg:col-span-2 space-y-3">
            {/* 教师基本信息 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <img 
                    src={teacher.avatar || '/default-avatar.png'} 
                    alt={teacher.name || '教师'} 
                    className="w-20 h-20 rounded-full mx-auto md:mx-0"
                  />
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                      <h1 className="text-lg sm:text-xl font-bold text-foreground">{teacher.name || '教师姓名'}</h1>
                      <div className="flex items-center gap-1.5 mt-2 md:mt-0">
                        <Button
                          variant={isFavorited ? "default" : "outline"}
                          size="xs"
                          onClick={handleFavoriteToggle}
                          className="gap-1"
                        >
                          <Heart className={`h-3 w-3 ${isFavorited ? 'fill-current' : ''}`} />
                          {isFavorited ? '已收藏' : '收藏'}
                        </Button>
                        <Button variant="outline" size="xs" className="gap-1">
                          <Share2 className="h-3 w-3" />
                          分享
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 text-muted-foreground mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{teacher.subject?.join(', ') || '科目信息暂缺'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{teacher.experience || 0}年经验</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{teacher.location?.district || '位置信息暂缺'}</span>
                        {teacherDistance && <span>• {teacherDistance}km</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      {renderStarRating(teacher.rating || 0)}
                      <span className="text-muted-foreground text-sm">({teacher.reviews || 0}条评价)</span>
                    </div>
                    
                    <div className="text-lg sm:text-xl font-bold text-primary mb-3">
                      ¥{teacher.price || 0}<span className="text-sm font-normal text-muted-foreground">/小时</span>
                    </div>
                    
                    <p className="text-foreground leading-relaxed text-sm">{teacher.description || '暂无个人介绍'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 详细信息标签页 */}
            <Card>
              <Tabs defaultValue="details" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">详细信息</TabsTrigger>
                    <TabsTrigger value="reviews">学生评价</TabsTrigger>
                    <TabsTrigger value="schedule">时间安排</TabsTrigger>
                    <TabsTrigger value="courses">课程内容</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent>
                  <TabsContent value="details" className="space-y-6">
                    {/* 详细评分 */}
                    <div>
                      <h3 className="font-semibold mb-4">教学能力评分</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {teacher.detailedRatings?.teaching || teacher.detailed_ratings?.teaching || 4.5}
                          </div>
                          <div className="text-sm text-muted-foreground">教学能力</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {teacher.detailedRatings?.patience || teacher.detailed_ratings?.patience || 4.3}
                          </div>
                          <div className="text-sm text-muted-foreground">耐心程度</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {teacher.detailedRatings?.communication || teacher.detailed_ratings?.communication || 4.4}
                          </div>
                          <div className="text-sm text-muted-foreground">沟通能力</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {teacher.detailedRatings?.effectiveness || teacher.detailed_ratings?.effectiveness || 4.2}
                          </div>
                          <div className="text-sm text-muted-foreground">教学效果</div>
                        </div>
                      </div>
                    </div>

                    {/* 教学风格 */}
                    <div>
                      <h3 className="font-semibold mb-2">教学风格</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {teacher.teachingStyle || teacher.teaching_style || '暂无教学风格描述'}
                      </p>
                    </div>

                    {/* 认证信息 */}
                    <div>
                      <h3 className="font-semibold mb-3">认证与资质</h3>
                      <div className="flex flex-wrap gap-2">
                        {teacher.certifications && teacher.certifications.length > 0 ? (
                          teacher.certifications.map((cert, index) => (
                            <Badge key={index} variant="secondary">
                              {cert}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">暂无认证信息</span>
                        )}
                      </div>
                    </div>

                    {/* 可教时间 */}
                    <div>
                      <h3 className="font-semibold mb-3">可授课时间</h3>
                      <div className="flex flex-wrap gap-2">
                        {teacher.availability && teacher.availability.length > 0 ? (
                          teacher.availability.map((time, index) => (
                            <Badge key={index} variant="outline">
                              {time}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">暂无时间安排</span>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">学生评价 ({reviewStats.total})</h3>
                      <Button
                        onClick={() => navigate(`/teachers/${teacherId}/reviews`)}
                        variant="outline"
                        size="sm"
                      >
                        查看全部
                      </Button>
                    </div>
                    
                    {isReviewsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <Skeleton className="h-20 w-full" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <ReviewCard key={review.id} review={review} compact />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>暂无评价</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="schedule">
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>时间安排功能开发中...</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="courses">
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>课程内容功能开发中...</p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 评价统计卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  评价统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {(reviewStats.average || 0).toFixed(1)}
                  </div>
                  {renderStarRating(Math.round(reviewStats.average || 0), false)}
                  <p className="text-sm text-muted-foreground mt-2">
                    基于 {reviewStats.total || 0} 条评价
                  </p>
                </div>
                
                {reviewStats.total > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">评分分布</h4>
                    {renderRatingDistribution()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 快速操作卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleBookAppointment}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Calendar className="h-4 w-4" />
                  立即预约
                </Button>
                
                {user?.role === 'student' && (
                  <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Star className="h-4 w-4" />
                        写评价
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>评价教师</DialogTitle>
                      </DialogHeader>
                      <ReviewForm
                        teacher={teacher}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                        isSubmitting={isSubmittingReview}
                      />
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button variant="outline" className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  发送消息
                </Button>
                
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  联系电话
                </Button>
              </CardContent>
            </Card>

            {/* 联系信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>联系信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{teacher.location?.address || '地址信息暂缺'}</span>
                </div>
                {teacherDistance && (
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">距离您 {teacherDistance} 公里</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">已服务 {teacher.reviews || 0} 位学生</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 预约表单 */}
      {teacherId && (
        <AppointmentForm
          teacherId={teacherId}
          isOpen={showAppointmentForm}
          onClose={() => setShowAppointmentForm(false)}
          onSuccess={handleAppointmentSuccess}
        />
      )}
    </div>
  );
};

export default TeacherDetailPage;