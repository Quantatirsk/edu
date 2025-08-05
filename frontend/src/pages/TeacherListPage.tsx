import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Star, 
  MapPin, 
  X, 
  Settings, 
  Filter,
  SortAsc,
  Users,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';

// Custom hooks
import { useTeachers } from '../hooks/useTeachers';
import { useGeolocation } from '../hooks/useGeolocation';

// Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { Teacher } from '../types';

interface TeacherWithDistance extends Teacher {
  distance?: number;
}

type SortOption = 'rating-desc' | 'price-asc' | 'experience-desc' | 'distance-asc';

const TeacherListPageV2: React.FC = () => {
  const navigate = useNavigate();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating-desc');
  
  // Step 3: Restore geolocation with stable references
  const { location, permission, requestLocation } = useGeolocation();
  
  // Stable currentLocation reference
  const currentLocation = useMemo(() => {
    return location ? { lat: location.latitude, lng: location.longitude } : null;
  }, [location]);

  // Stable parameters object
  const teachersParams = useMemo(() => ({
    searchQuery: searchQuery.trim() || undefined,
    selectedSubject: selectedSubject === 'all' ? undefined : selectedSubject,
    sortBy,
    currentLocation
  }), [searchQuery, selectedSubject, sortBy, currentLocation]);

  const { teachers, subjects, isLoading, error, refetch } = useTeachers(teachersParams);

  // Calculate distance
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

  // Teachers with distance calculation
  const teachersWithDistance: TeacherWithDistance[] = useMemo(() => {
    if (!currentLocation) return teachers;
    
    return teachers.map(teacher => ({
      ...teacher,
      distance: calculateDistance(
        currentLocation.lat, currentLocation.lng,
        teacher.location.lat, teacher.location.lng
      )
    }));
  }, [teachers, currentLocation]);

  // Sort options with location-based sorting
  const sortOptions = useMemo(() => {
    const baseOptions = [
      { value: 'rating-desc' as SortOption, label: '评分最高', icon: Star },
      { value: 'price-asc' as SortOption, label: '价格最低', icon: Zap },
      { value: 'experience-desc' as SortOption, label: '经验最丰富', icon: Award }
    ];
    
    if (currentLocation) {
      return [
        { value: 'distance-asc' as SortOption, label: '距离最近', icon: MapPin },
        ...baseOptions
      ];
    }
    
    return baseOptions;
  }, [currentLocation]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setSortBy('rating-desc');
  };

  // Navigate to teacher detail
  const handleTeacherClick = (teacher: Teacher) => {
    navigate(`/teachers/${teacher.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20 shadow-lg">
        <div className="w-full px-2 sm:px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  发现优秀教师
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {teachers.length} 位专业教师为您服务
                  {currentLocation && (
                    <Badge variant="secondary" className="ml-1 gap-1 text-xs">
                      <MapPin className="h-2.5 w-2.5" />
                      已启用位置服务
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:min-w-80">
              
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜索教师姓名或关键词..."
                  className="pl-10 h-8 rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Subject Filter - Using shadcn Select */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-8 pl-10 pr-3 rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm min-w-28 focus:ring-2 focus:ring-blue-500 text-sm">
                    <SelectValue placeholder="全部科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部科目</SelectItem>
                    {subjects.length > 0 && subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Option - Using shadcn Select */}
              <div className="relative">
                <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-8 pl-10 pr-3 rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm min-w-32 focus:ring-2 focus:ring-blue-500 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedSubject !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm gap-1 text-sm"
                >
                  <X className="h-3 w-3" />
                  清除
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Permission Alert */}
      {permission === 'denied' && (
        <Alert className="mx-2 sm:mx-4 mt-2 rounded-lg border-0 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm">
          <Settings className="h-3.5 w-3.5" />
          <AlertDescription className="text-sm">
            <span className="font-medium">位置权限被拒绝</span>
            <span className="ml-2">
              无法显示教师距离信息，
              <Button
                variant="link"
                size="xs"
                onClick={requestLocation}
                className="h-auto p-0 ml-1 text-amber-700 dark:text-amber-300 underline text-sm"
              >
                重新授权位置访问
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="w-full px-2 sm:px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full mb-1.5" />
                  <Skeleton className="h-3 w-3/4 mb-3" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="w-full px-2 sm:px-4 py-4">
          <Alert className="rounded-lg border-0 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm">
            <AlertDescription className="flex items-center justify-between text-sm">
              <span>{error}</span>
              <Button onClick={refetch} variant="outline" size="xs">
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Teachers Grid */}
      {!isLoading && !error && (
        <div className="w-full px-2 sm:px-4 py-4">
          {teachersWithDistance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {teachersWithDistance.map(teacher => (
                <Card
                  key={teacher.id}
                  className="group cursor-pointer overflow-hidden rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300"
                  onClick={() => handleTeacherClick(teacher)}
                >
                  <CardContent className="p-4">
                    {/* Teacher Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <img 
                        src={teacher.avatar} 
                        alt={teacher.name} 
                        className="w-12 h-12 rounded-lg object-cover ring-2 ring-white/50 shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {teacher.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                          <BookOpen className="h-2.5 w-2.5" />
                          <span className="truncate">{teacher.subject.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Award className="h-2.5 w-2.5" />
                          <span>{teacher.experience}年经验</span>
                          {currentLocation && teacher.distance && (
                            <>
                              <span>•</span>
                              <MapPin className="h-2.5 w-2.5" />
                              <span>{teacher.distance.toFixed(1)}km</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < Math.floor(teacher.rating) ? 'fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {teacher.rating}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({teacher.reviews_count || teacher.reviews || 0}条评价)
                      </span>
                    </div>

                    {/* Teaching Style */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                      {teacher.teaching_style || teacher.teachingStyle || teacher.description || '暂无描述'}
                    </p>

                    {/* Detailed Ratings */}
                    <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-gray-50/80 dark:bg-gray-700/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">教学</div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 text-xs">
                          {teacher.detailed_ratings?.teaching || teacher.detailedRatings?.teaching || teacher.rating || 'N/A'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">效果</div>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50 text-xs">
                          {teacher.detailed_ratings?.effectiveness || teacher.detailedRatings?.effectiveness || teacher.rating || 'N/A'}
                        </Badge>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200/50 dark:border-gray-600/30">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ¥{teacher.price}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/小时</span>
                      </div>
                      <Button 
                        size="xs"
                        className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('预约教师:', teacher.name);
                        }}
                      >
                        立即预约
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg inline-block mb-4">
                <Search className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                没有找到符合条件的教师
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                {searchQuery || selectedSubject !== 'all' 
                  ? '尝试调整搜索条件或筛选器，或许能找到更多优秀的教师' 
                  : '暂无教师数据，请稍后再试'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="rounded-lg text-sm"
                  size="sm"
                >
                  清除筛选条件
                </Button>
                <Button 
                  onClick={refetch}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm"
                  size="sm"
                >
                  重新加载
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherListPageV2;