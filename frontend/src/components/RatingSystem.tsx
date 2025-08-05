import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Award, 
  Users,
  Target,
  CheckCircle,
} from 'lucide-react';

// Store hooks
// import { useAuthUser } from '../stores/authStore';
import { useNotificationActions } from '../stores/uiStore';

// Services
import { TeacherService } from '../services/teacherService';

// Types
import type { Teacher, DetailedReview } from '../types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RatingCriteria {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  weight: number;
}

interface RatingFormData {
  overall: number;
  teaching: number;
  patience: number;
  communication: number;
  effectiveness: number;
  comment: string;
  isRecommended: boolean;
  tags: string[];
  isAnonymous: boolean;
}

interface RatingSystemProps {
  teacher: Teacher;
  appointmentId?: string;
  existingReview?: DetailedReview;
  onSubmit: (rating: RatingFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  showDialog?: boolean;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  teacher,
  existingReview,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showDialog = true
}) => {
  // const user = useAuthUser();
  const { showError, showSuccess } = useNotificationActions();

  // 评分标准
  const ratingCriteria = useMemo<RatingCriteria[]>(() => [
    {
      key: 'teaching',
      label: '教学能力',
      description: '知识传授的清晰度和有效性',
      icon: <Award className="h-4 w-4" />,
      weight: 0.3
    },
    {
      key: 'patience',
      label: '耐心程度',
      description: '对学生问题的耐心和包容度',
      icon: <Users className="h-4 w-4" />,
      weight: 0.25
    },
    {
      key: 'communication',
      label: '沟通能力',
      description: '表达和互动的效果',
      icon: <MessageCircle className="h-4 w-4" />,
      weight: 0.25
    },
    {
      key: 'effectiveness',
      label: '教学效果',
      description: '学习目标的达成程度',
      icon: <Target className="h-4 w-4" />,
      weight: 0.2
    }
  ], []);

  // 预设标签
  const availableTags = [
    '教学认真', '耐心细致', '幽默风趣', '专业权威', '方法独特',
    '效果显著', '准时守信', '态度和蔼', '讲解清晰', '答疑及时',
    '课堂活跃', '因材施教', '经验丰富', '责任心强', '值得推荐'
  ];

  // State
  const [formData, setFormData] = useState<RatingFormData>({
    overall: existingReview?.ratings.overall || 5,
    teaching: existingReview?.ratings.teaching || 5,
    patience: existingReview?.ratings.patience || 5,
    communication: existingReview?.ratings.communication || 5,
    effectiveness: existingReview?.ratings.effectiveness || 5,
    comment: existingReview?.comment || '',
    isRecommended: existingReview?.isRecommended ?? true,
    tags: existingReview?.tags || [],
    isAnonymous: false
  });

  const [hoveredRating, setHoveredRating] = useState<{[key: string]: number}>({});
  const [teacherStats, setTeacherStats] = useState<unknown>(null);
  const [currentTab, setCurrentTab] = useState('rating');

  // 加载教师统计数据
  useEffect(() => {
    const loadTeacherStats = async () => {
      try {
        const stats = await TeacherService.getTeacherStatistics();
        setTeacherStats(stats);
      } catch (statsError) {
        console.warn('Failed to load teacher stats:', statsError);
      }
    };
    
    if (teacher.id) {
      loadTeacherStats();
    }
  }, [teacher.id]);

  // 计算综合评分
  const calculateOverallRating = useCallback(() => {
    const weightedSum = ratingCriteria.reduce((sum, criteria) => {
      return sum + formData[criteria.key as keyof RatingFormData] * criteria.weight;
    }, 0);
    return Math.round(weightedSum);
  }, [formData, ratingCriteria]);

  // 更新综合评分
  useEffect(() => {
    const newOverall = calculateOverallRating();
    if (newOverall !== formData.overall) {
      setFormData(prev => ({ ...prev, overall: newOverall }));
    }
  }, [formData.teaching, formData.patience, formData.communication, formData.effectiveness, calculateOverallRating, formData.overall]);

  // 更新评分
  const updateRating = (criteria: string, rating: number) => {
    setFormData(prev => ({ ...prev, [criteria]: rating }));
  };

  // 切换标签
  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // 验证表单
  const validateForm = () => {
    if (formData.comment.trim().length < 10) {
      showError('评价内容太短', '请至少写10个字的评价内容');
      return false;
    }
    return true;
  };

  // 提交评价
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
      showSuccess('评价提交成功', '感谢您的反馈！');
    } catch (submitError) {
      console.error('评价提交失败:', submitError);
      showError('提交失败', '评价提交失败，请稍后重试');
    }
  };

  // 渲染星级评分
  const renderStarRating = (
    criteria: string,
    currentRating: number,
    onUpdate: (rating: number) => void,
    label: string,
    description?: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">{label}</Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium min-w-[40px]">
            {hoveredRating[criteria] || currentRating} 分
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [criteria]: star }))}
            onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [criteria]: 0 }))}
            onClick={() => onUpdate(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoveredRating[criteria] || currentRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染统计信息
  const renderTeacherStats = () => {
    if (!teacherStats) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">教师统计</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {teacherStats.totalStudents || 0}
              </div>
              <div className="text-sm text-muted-foreground">累计学生</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {teacherStats.totalHours || 0}
              </div>
              <div className="text-sm text-muted-foreground">授课时长</div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">各项评分分布</h4>
          <div className="space-y-2">
            {ratingCriteria.map((criteria) => {
              const avgRating = teacher.detailedRatings[criteria.key as keyof typeof teacher.detailedRatings] || 0;
              return (
                <div key={criteria.key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    {criteria.icon}
                    <span className="text-sm">{criteria.label}</span>
                  </div>
                  <Progress value={avgRating * 20} className="flex-1" />
                  <span className="text-sm font-medium min-w-[40px]">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const content = (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rating">评分</TabsTrigger>
          <TabsTrigger value="comment">评价</TabsTrigger>
          <TabsTrigger value="stats">统计</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rating" className="space-y-6">
          {/* 综合评分显示 */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {formData.overall}.0
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= formData.overall
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">综合评分</p>
              </div>
            </CardContent>
          </Card>

          {/* 详细评分 */}
          <div className="space-y-6">
            {ratingCriteria.map((criteria) => (
              <Card key={criteria.key}>
                <CardContent className="p-4">
                  {renderStarRating(
                    criteria.key,
                    formData[criteria.key as keyof RatingFormData] as number,
                    (rating) => updateRating(criteria.key, rating),
                    criteria.label,
                    criteria.description
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="comment" className="space-y-6">
          {/* 评价内容 */}
          <div>
            <Label htmlFor="comment">评价内容 *</Label>
            <Textarea
              id="comment"
              placeholder="请分享您的学习体验和感受..."
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              至少10个字，您的评价将帮助其他学生选择合适的老师
            </p>
          </div>

          {/* 标签选择 */}
          <div>
            <Label>选择标签（可选）</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 推荐选项 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isRecommended: true }))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                  formData.isRecommended
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                推荐
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isRecommended: false }))}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                  !formData.isRecommended
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
                不推荐
              </button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          {renderTeacherStats()}
        </TabsContent>
      </Tabs>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : existingReview ? '更新评价' : '提交评价'}
        </Button>
      </div>
      
      {/* 提示信息 */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          您的评价将在审核后公开显示，帮助其他学生做出选择。评价一旦提交将无法修改。
        </AlertDescription>
      </Alert>
    </div>
  );

  if (!showDialog) {
    return <div className="max-w-2xl mx-auto">{content}</div>;
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            评价教师 - {teacher.name}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default RatingSystem;