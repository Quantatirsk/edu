import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Star, 
  ThumbsUp, 
  Search,
  User,
  MessageCircle,
  Award
} from 'lucide-react';

// Store hooks
import { useAuthUser } from '../stores/authStore';
import { useNotificationActions } from '../stores/uiStore';

// Services
import { TeacherService } from '../services/teacherService';

// Types
import type { DetailedReview, Teacher } from '../types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId?: string }>();
  const user = useAuthUser();
  const { showError, showSuccess } = useNotificationActions();

  // State
  const [reviews, setReviews] = useState<DetailedReview[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    overall: 5,
    teaching: 5,
    patience: 5,
    communication: 5,
    effectiveness: 5,
    comment: '',
    isRecommended: true,
    tags: [] as string[]
  });

  // Statistics state
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    distribution: {} as Record<number, number>
  });

  // Load reviews data
  const loadReviews = useCallback(async (reset = false) => {
    if (!teacherId) return;
    
    try {
      if (reset) {
        setIsLoading(true);
        setReviews([]);
        setPage(1);
      }

      const response = await TeacherService.getTeacherReviews(
        teacherId,
        reset ? 1 : page,
        10
      );
      
      if (reset) {
        setReviews(response.reviews);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
      }
      
      setReviewStats({
        total: response.total,
        average: response.average,
        distribution: response.distribution
      });
      
      setHasMore(response.reviews.length === 10);
      
    } catch (error) {
      console.error('加载评价数据失败:', error);
      showError('加载失败', '无法加载评价数据，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, page, showError]);

  // Load teacher data
  const loadTeacher = useCallback(async () => {
    if (!teacherId) return;
    
    try {
      const teacherData = await TeacherService.getTeacher(teacherId);
      setTeacher(teacherData);
    } catch (error) {
      console.error('加载教师数据失败:', error);
      showError('加载失败', '无法加载教师信息');
    }
  }, [teacherId, showError]);

  // Initial data load
  useEffect(() => {
    loadReviews(true);
    loadTeacher();
  }, [loadReviews, loadTeacher]);

  // Filter and search reviews
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(review =>
        review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.ratings.overall === ratingFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.ratings.overall - a.ratings.overall;
        case 'helpful':
          // Assuming we have a helpful count (placeholder logic)
          return 0; // Would implement based on actual helpful votes
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [reviews, searchQuery, ratingFilter, sortBy]);

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!teacherId || !user) return;
    
    try {
      setIsSubmitting(true);
      
      await TeacherService.createReview(teacherId, {
        ...reviewData,
        studentId: user.id
      });
      
      showSuccess('评价成功', '您的评价已提交');
      setShowReviewForm(false);
      setReviewData({
        overall: 5,
        teaching: 5,
        patience: 5,
        communication: 5,
        effectiveness: 5,
        comment: '',
        isRecommended: true,
        tags: []
      });
      
      // Reload reviews
      loadReviews(true);
      
    } catch (error) {
      console.error('提交评价失败:', error);
      showError('提交失败', '评价提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load more reviews
  const loadMore = () => {
    if (!hasMore || isLoading) return;
    setPage(prev => prev + 1);
    loadReviews(false);
  };

  // Render star rating
  const renderStarRating = (rating: number, size = 'sm') => {
    return (
      <div className={`flex items-center gap-1`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution
  const renderRatingDistribution = () => {
    const total = reviewStats.total;
    if (total === 0) return null;

    return (
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewStats.distribution[rating] || 0;
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

  return (
    <div className="min-h-screen bg-background -mx-4 -my-8">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                ← 返回
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {teacher?.name} 的评价
                </h1>
                <p className="text-muted-foreground">
                  查看教师评价和学生反馈
                </p>
              </div>
            </div>
            
            {user?.role === 'student' && (
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Star className="h-4 w-4" />
                    写评价
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>评价教师</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Rating sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'overall', label: '总体评价' },
                        { key: 'teaching', label: '教学能力' },
                        { key: 'patience', label: '耐心程度' },
                        { key: 'communication', label: '沟通能力' },
                        { key: 'effectiveness', label: '教学效果' }
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <Label>{label}</Label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setReviewData(prev => ({
                                  ...prev,
                                  [key]: star
                                }))}
                                className="p-1"
                              >
                                <Star 
                                  className={`h-6 w-6 ${
                                    star <= (reviewData[key as keyof typeof reviewData] as number)
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Comment */}
                    <div className="space-y-2">
                      <Label htmlFor="comment">评价内容</Label>
                      <Textarea
                        id="comment"
                        placeholder="请详细描述您的学习体验..."
                        value={reviewData.comment}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          comment: e.target.value
                        }))}
                        rows={4}
                      />
                    </div>
                    
                    {/* Recommendation */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="recommend"
                        checked={reviewData.isRecommended}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          isRecommended: e.target.checked
                        }))}
                      />
                      <Label htmlFor="recommend">推荐这位教师</Label>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleSubmitReview}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '提交中...' : '提交评价'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Statistics */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  评价统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {reviewStats.average.toFixed(1)}
                  </div>
                  {renderStarRating(Math.round(reviewStats.average), 'lg')}
                  <p className="text-sm text-muted-foreground mt-2">
                    基于 {reviewStats.total} 条评价
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">评分分布</h4>
                  {renderRatingDistribution()}
                </div>
              </CardContent>
            </Card>

            {teacher && (
              <Card>
                <CardHeader>
                  <CardTitle>教师信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={teacher.avatar} 
                      alt={teacher.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{teacher.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {teacher.subject.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{teacher.experience}年教学经验</p>
                    <p>¥{teacher.price}/小时</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right content - Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索评价内容..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select 
                    value={ratingFilter.toString()} 
                    onValueChange={(value) => setRatingFilter(value === 'all' ? 'all' : parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="评分" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部评分</SelectItem>
                      <SelectItem value="5">5星</SelectItem>
                      <SelectItem value="4">4星</SelectItem>
                      <SelectItem value="3">3星</SelectItem>
                      <SelectItem value="2">2星</SelectItem>
                      <SelectItem value="1">1星</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="排序" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">最新</SelectItem>
                      <SelectItem value="rating">评分</SelectItem>
                      <SelectItem value="helpful">有用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reviews list */}
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {renderStarRating(review.ratings.overall)}
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {review.isRecommended && (
                              <Badge variant="secondary" className="gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                推荐
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-foreground mb-3 leading-relaxed">
                            {review.comment}
                          </p>
                          
                          {/* Detailed ratings */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">教学:</span>
                              <span className="font-medium">{review.ratings.teaching}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">耐心:</span>
                              <span className="font-medium">{review.ratings.patience}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">沟通:</span>
                              <span className="font-medium">{review.ratings.communication}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">效果:</span>
                              <span className="font-medium">{review.ratings.effectiveness}</span>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {review.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">暂无评价</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || ratingFilter !== 'all' 
                        ? '没有找到符合条件的评价' 
                        : '这位教师还没有收到评价'}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Load more button */}
              {hasMore && !isLoading && filteredReviews.length > 0 && (
                <div className="text-center">
                  <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                    {isLoading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;