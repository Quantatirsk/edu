import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, X, Settings } from 'lucide-react';
import type { Teacher } from '../types';

// shadcn/ui components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeacherListPageProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  userLocation?: {lat: number, lng: number} | null;
}

type SortOption = 'rating' | 'price' | 'experience' | 'distance';

interface TeacherWithDistance extends Teacher {
  distance?: number;
}

const TeacherListPage: React.FC<TeacherListPageProps> = ({ 
  teachers, 
  onSelectTeacher, 
  userLocation
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(userLocation || null);
  
  // 从localStorage加载排序偏好
  useEffect(() => {
    const savedSort = localStorage.getItem('teacher-sort-preference');
    if (savedSort) {
      setSortBy(savedSort as SortOption);
    }
  }, []);
  
  // 保存排序偏好到localStorage
  const saveSort = useCallback((newSort: SortOption) => {
    localStorage.setItem('teacher-sort-preference', newSort);
  }, []);

  // 请求位置权限和获取当前位置
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state as any);
      
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 300000, // 5分钟缓存
          });
        });
        
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(newLocation);
        setLocationPermission('granted');
      }
    } catch (error) {
      console.warn('获取位置失败:', error);
      setLocationPermission('denied');
      // 使用默认位置（北京市中心）
      setCurrentLocation({ lat: 39.9042, lng: 116.4074 });
    }
  }, []);
  
  // 页面加载时自动请求位置(用于显示距离)
  useEffect(() => {
    if (!currentLocation && locationPermission !== 'denied') {
      requestLocation();
    }
  }, [currentLocation, locationPermission, requestLocation]);
  
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

  // 排序方式改变函数
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    saveSort(newSort);
  }, [saveSort]);
  
  // 始终显示距离(如果有位置信息)
  const shouldShowDistance = currentLocation !== null;
  
  // 筛选和排序教师
  const filteredTeachers = useMemo(() => {
    let filtered = teachers.filter(teacher => {
      const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = !filterSubject || filterSubject === 'all' || teacher.subject.includes(filterSubject);
      return matchesSearch && matchesSubject;
    });

    // 添加距离信息（仅在距离模式下且有位置信息时）
    let teachersWithDistance: TeacherWithDistance[] = filtered;
    if (shouldShowDistance) {
      teachersWithDistance = filtered.map(teacher => ({
        ...teacher,
        distance: calculateDistance(
          currentLocation!.lat, currentLocation!.lng,
          teacher.location.lat, teacher.location.lng
        )
      }));
    }

    // 排序
    return teachersWithDistance.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.price - b.price;
        case 'experience':
          return b.experience - a.experience;
        default:
          return 0;
      }
    });
  }, [teachers, searchTerm, filterSubject, sortBy, shouldShowDistance, currentLocation]);

  const handleTeacherClick = (teacher: Teacher) => {
    onSelectTeacher(teacher);
    navigate(`/teachers/${teacher.id}`);
  };

  const clearFilters = () => {
    setFilterSubject('');
    setSearchTerm('');
  };
  
  // 获取可用的排序选项
  const getAvailableSortOptions = () => {
    const baseOptions = [
      { value: 'rating' as SortOption, label: '评分最高' },
      { value: 'price' as SortOption, label: '价格最低' },
      { value: 'experience' as SortOption, label: '经验最丰富' }
    ];
    
    if (currentLocation) {
      return [{ value: 'distance' as SortOption, label: '距离最近' }, ...baseOptions];
    }
    
    return baseOptions;
  };

  return (
    <div className="min-h-screen bg-background -mx-4 -my-8">
      {/* 统一的顶部工具栏 - 全宽设计 */}
      <div className="bg-card border-b border-border sticky top-16 z-10">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* 左侧：标题 */}
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-foreground">教师列表</h1>
              {currentLocation && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  已启用距离显示
                </Badge>
              )}
            </div>
            
            {/* 右侧：搜索和筛选器 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
              {/* 搜索框 */}
              <div className="relative min-w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索教师姓名或关键词"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* 筛选器 */}
              <div className="flex items-center gap-3">
                <Select value={filterSubject || undefined} onValueChange={(value) => setFilterSubject(value || '')}>
                  <SelectTrigger className="min-w-28">
                    <SelectValue placeholder="全部科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部科目</SelectItem>
                    <SelectItem value="数学">数学</SelectItem>
                    <SelectItem value="英语">英语</SelectItem>
                    <SelectItem value="物理">物理</SelectItem>
                    <SelectItem value="化学">化学</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="min-w-32">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSortOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {(filterSubject || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    清除
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 状态提示条 */}
      {locationPermission === 'denied' && (
        <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">位置权限被拒绝</span>
            <span className="ml-2">
              无法显示教师距离信息，
              <Button
                variant="link"
                size="sm"
                onClick={requestLocation}
                className="h-auto p-0 ml-1 text-destructive underline hover:text-destructive/80"
              >
                重新授权位置访问
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      {locationPermission !== 'denied' && !currentLocation && (
        <Alert variant="info" className="rounded-none border-x-0 border-t-0">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          <AlertDescription>
            正在获取您的位置信息以显示教师距离...
          </AlertDescription>
        </Alert>
      )}

      {/* 教师列表 - 全宽网格布局 */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map(teacher => {
              return (
                <Card
                  key={teacher.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  onClick={() => handleTeacherClick(teacher)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                      <img 
                        src={teacher.avatar} 
                        alt={teacher.name} 
                        className="w-16 h-16 rounded-full mr-4 ring-2 ring-border"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{teacher.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-1 flex-wrap gap-1">
                          <span className="truncate">{teacher.subject.join(', ')}</span>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="flex-shrink-0">{teacher.experience}年经验</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{teacher.location.district}</span>
                          {shouldShowDistance && teacher.distance && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {teacher.distance.toFixed(1)}km
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(teacher.rating) ? 'fill-current' : ''}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">
                        {teacher.rating} ({teacher.reviews}条评价)
                      </span>
                    </div>
                    
                    {/* 详细评分条 */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">教学</div>
                        <Badge variant="outline" className="text-primary border-primary/20">
                          {teacher.detailedRatings.teaching}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">效果</div>
                        <Badge variant="outline" className="text-secondary border-secondary/20">
                          {teacher.detailedRatings.effectiveness}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                      {teacher.teachingStyle}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-primary">¥{teacher.price}</span>
                      <span className="text-sm text-muted-foreground">/小时</span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('预约教师:', teacher.name);
                      }}
                    >
                      预约
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-muted-foreground mb-4">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              </div>
              <p className="text-lg text-muted-foreground mb-2">没有找到符合条件的教师</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterSubject ? '尝试调整搜索条件或筛选器' : '暂无教师数据'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherListPage;