import React from 'react';
import { Star, ThumbsUp, User, Calendar } from 'lucide-react';

// Types
import type { DetailedReview } from '../types';

// Components
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReviewCardProps {
  review: DetailedReview;
  showStudentInfo?: boolean;
  compact?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  showStudentInfo = false,
  compact = false 
}) => {
  // Render star rating
  const renderStarRating = (rating: number) => (
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
      <span className="ml-1 text-sm font-medium">{rating}</span>
    </div>
  );

  if (compact) {
    return (
      <Card className="border-l-4 border-l-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {renderStarRating(review.ratings.overall)}
                <span className="text-xs text-muted-foreground">
                  {new Date(review.date).toLocaleDateString()}
                </span>
                {review.isRecommended && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ThumbsUp className="h-2 w-2" />
                    推荐
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-foreground line-clamp-2 mb-2">
                {review.comment}
              </p>
              
              {review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {review.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {review.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{review.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {renderStarRating(review.ratings.overall)}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
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
            
            <p className="text-foreground mb-4 leading-relaxed">
              {review.comment}
            </p>
            
            {/* Detailed ratings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">教学</div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 fill-blue-400 text-blue-400" />
                  <span className="text-sm font-medium">{review.ratings.teaching}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">耐心</div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 fill-green-400 text-green-400" />
                  <span className="text-sm font-medium">{review.ratings.patience}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">沟通</div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 fill-purple-400 text-purple-400" />
                  <span className="text-sm font-medium">{review.ratings.communication}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">效果</div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                  <span className="text-sm font-medium">{review.ratings.effectiveness}</span>
                </div>
              </div>
            </div>
            
            {/* Tags */}
            {review.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {review.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {showStudentInfo && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  来自学生的评价 • ID: {review.studentId.slice(-6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;