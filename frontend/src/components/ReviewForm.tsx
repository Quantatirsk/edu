import React, { useState } from 'react';
import { Star, Send, Award } from 'lucide-react';

// Types
import type { DetailedReview, Teacher } from '../types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ReviewFormProps {
  teacher: Teacher;
  appointmentId?: string;
  onSubmit: (reviewData: Partial<DetailedReview>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  teacher, 
  appointmentId,
  onSubmit, 
  onCancel,
  isSubmitting = false 
}) => {
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

  const [hoveredRating, setHoveredRating] = useState<{[key: string]: number}>({});

  // Predefined tags
  const availableTags = [
    '讲解清晰', '耐心细致', '方法独特', '经验丰富',
    '互动良好', '准时守信', '因材施教', '效果显著',
    '态度认真', '专业水平高', '善于启发', '课堂活跃'
  ];

  // Rating categories with descriptions
  const ratingCategories = [
    {
      key: 'overall',
      label: '总体评价',
      description: '对这位教师的整体满意度',
      icon: '🌟'
    },
    {
      key: 'teaching',
      label: '教学能力',
      description: '教学方法和专业水平',
      icon: '📚'
    },
    {
      key: 'patience',
      label: '耐心程度',
      description: '对学生的耐心和理解',
      icon: '🤝'
    },
    {
      key: 'communication',
      label: '沟通能力',
      description: '表达清晰度和互动效果',
      icon: '💬'
    },
    {
      key: 'effectiveness',
      label: '教学效果',
      description: '学习成果和进步情况',
      icon: '📈'
    }
  ];

  // Handle rating change
  const handleRatingChange = (category: string, rating: number) => {
    setReviewData(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    setReviewData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    const submitData: Partial<DetailedReview> = {
      appointmentId,
      teacherId: teacher.id,
      ratings: {
        overall: reviewData.overall,
        teaching: reviewData.teaching,
        patience: reviewData.patience,
        communication: reviewData.communication,
        effectiveness: reviewData.effectiveness
      },
      comment: reviewData.comment,
      isRecommended: reviewData.isRecommended,
      tags: reviewData.tags,
      date: new Date().toISOString()
    };

    await onSubmit(submitData);
  };

  // Render star rating input
  const renderRatingInput = (category: string, label: string, description: string, icon: string) => {
    const currentRating = reviewData[category as keyof typeof reviewData] as number;
    const hovered = hoveredRating[category] || 0;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div className="flex-1">
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="text-sm font-medium text-primary">
            {hovered || currentRating}/5
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [category]: star }))}
              onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [category]: 0 }))}
              onClick={() => handleRatingChange(category, star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star 
                className={`h-6 w-6 transition-colors ${
                  star <= (hovered || currentRating)
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          评价 {teacher.name}
        </CardTitle>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <img 
            src={teacher.avatar} 
            alt={teacher.name}
            className="w-8 h-8 rounded-full"
          />
          <span>{teacher.subject.join(', ')} • {teacher.experience}年经验</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Rating sections */}
        <div className="space-y-4">
          <h3 className="font-medium text-base">请为教师评分</h3>
          <div className="space-y-4">
            {ratingCategories.map(({ key, label, description, icon }) =>
              renderRatingInput(key, label, description, icon)
            )}
          </div>
        </div>

        {/* Comment section */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            详细评价 <span className="text-muted-foreground">(可选)</span>
          </Label>
          <Textarea
            id="comment"
            placeholder="请详细描述您的学习体验，您的评价将帮助其他学生更好地选择教师..."
            value={reviewData.comment}
            onChange={(e) => setReviewData(prev => ({
              ...prev,
              comment: e.target.value
            }))}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {reviewData.comment.length}/500字符
          </p>
        </div>

        {/* Tags section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">选择标签 (可选)</Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={reviewData.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          {reviewData.tags.length > 0 && (
            <p className="text-xs text-muted-foreground">
              已选择 {reviewData.tags.length} 个标签
            </p>
          )}
        </div>

        {/* Recommendation checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recommend"
            checked={reviewData.isRecommended}
            onCheckedChange={(checked) => setReviewData(prev => ({
              ...prev,
              isRecommended: checked as boolean
            }))}
          />
          <Label 
            htmlFor="recommend" 
            className="text-sm cursor-pointer flex items-center gap-2"
          >
            <span>我推荐这位教师</span>
            {reviewData.isRecommended && <span className="text-green-600">👍</span>}
          </Label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !reviewData.comment.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                提交中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                提交评价
              </>
            )}
          </Button>
        </div>

        {/* Preview */}
        {reviewData.comment.trim() && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">评价预览</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= reviewData.overall
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{reviewData.overall}/5</span>
                {reviewData.isRecommended && (
                  <Badge variant="secondary" className="text-xs">推荐</Badge>
                )}
              </div>
              <p className="text-sm">{reviewData.comment}</p>
              {reviewData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {reviewData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewForm;