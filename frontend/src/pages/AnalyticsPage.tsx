import React, { useState } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Star,
  Target,
  Calendar,
  Award,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Clock,
  Trophy,
  Zap
} from 'lucide-react';

// Custom hooks
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuthStatus } from '../stores/authStore';

// Auth components
import AuthGuard from '../components/auth/AuthGuard';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const AnalyticsPageV2: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // 获取认证信息
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();

  // 使用新的analytics hook
  const { studentAnalytics, teacherAnalytics, isLoading, error, refetch, userRole } = useAnalytics({ timeRange });

  // 渲染趋势图标
  const renderTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  // 渲染统计卡片
  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    trend, 
    gradientClass = "from-blue-500 to-purple-600"
  }: {
    icon: React.ComponentType<React.ComponentProps<'svg'>>;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: { current: number; previous: number };
    gradientClass?: string;
  }) => (
    <Card className="overflow-hidden rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${gradientClass} text-white`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {renderTrendIcon(trend.current, trend.previous)}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className={`text-lg font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 处理未认证状态
  if (!isAuthenticated || authLoading) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
          <Alert className="rounded-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
            <AlertDescription>正在加载用户信息...</AlertDescription>
          </Alert>
        </div>
      );
    }

    return <AuthGuard variant="analytics" />;
  }

  // 处理角色权限
  if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Alert className="rounded-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
          <AlertDescription>当前角色不支持分析功能</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      
      {/* Modern Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20 shadow-lg">
        <div className="w-full px-2 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  学习分析
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {user.role === 'student' ? '追踪您的学习进度和成绩表现' : '洞察您的教学效果和学生反馈'}
                </p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* User Role Display */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <Users className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {user.role === 'student' ? '学生' : '教师'}
                </span>
              </div>
              
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                  <SelectTrigger className="h-8 pl-10 pr-3 rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm min-w-32 focus:ring-2 focus:ring-purple-500 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">最近一周</SelectItem>
                    <SelectItem value="month">最近一月</SelectItem>
                    <SelectItem value="quarter">最近三月</SelectItem>
                    <SelectItem value="year">最近一年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm"
                className="h-8 rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm gap-1.5 text-sm"
              >
                <Activity className="h-3.5 w-3.5" />
                刷新数据
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 sm:px-4 py-4">
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Card key={index} className="rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-4">
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="rounded-lg border-0 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm shadow-lg">
            <AlertDescription className="flex items-center justify-between text-sm">
              <span>{error}</span>
              <Button onClick={refetch} variant="outline" size="xs">
                重试
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Student Analytics */}
        {!isLoading && !error && userRole === 'student' && studentAnalytics && (
          <div className="space-y-4">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={Calendar}
                title="总预约数"
                value={studentAnalytics.totalAppointments}
                subtitle="累计预约课程"
                gradientClass="from-blue-500 to-cyan-600"
              />
              <StatCard
                icon={BookOpen}
                title="已完成课程"
                value={studentAnalytics.completedAppointments}
                subtitle={`完成率 ${Math.round((studentAnalytics.completedAppointments / studentAnalytics.totalAppointments) * 100)}%`}
                gradientClass="from-green-500 to-emerald-600"
              />
              <StatCard
                icon={DollarSign}
                title="累计消费"
                value={`¥${studentAnalytics.totalSpent}`}
                subtitle="教育投资"
                gradientClass="from-purple-500 to-violet-600"
              />
              <StatCard
                icon={Star}
                title="平均评分"
                value={studentAnalytics.averageRating.toFixed(1)}
                subtitle="教学质量评价"
                gradientClass="from-yellow-400 to-orange-500"
              />
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="subjects" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <TabsTrigger value="subjects" className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm">
                  科目分析
                </TabsTrigger>
                <TabsTrigger value="progress" className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm">
                  学习进度
                </TabsTrigger>
                <TabsTrigger value="trends" className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm">
                  趋势分析
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="subjects" className="space-y-3 mt-4">
                <Card className="rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      科目学习统计
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {studentAnalytics.subjects.map((subject, index) => (
                        <div key={index} className="group p-4 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/30 dark:to-gray-600/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1.5">
                                {subject.subject}
                              </h3>
                              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  <span>{subject.appointmentCount}节课</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{subject.totalHours}小时</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{subject.averageRating.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`flex items-center gap-1 text-sm font-bold ${
                                subject.improvement > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {renderTrendIcon(subject.improvement, 0)}
                                <span>+{subject.improvement.toFixed(1)}分</span>
                              </div>
                              <Badge variant="outline" className="mt-1 text-xs">
                                进步显著
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="progress" className="space-y-3 mt-4">
                <Card className="rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-4 w-4" />
                      学习进度
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 inline-block mb-4">
                        <Target className="h-12 w-12 text-blue-500 mx-auto" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                        学习进度功能即将上线
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        我们正在开发更详细的学习进度追踪功能，敬请期待！
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-3 mt-4">
                <Card className="rounded-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      趋势分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {studentAnalytics.monthlyTrend.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/30 dark:to-gray-600/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {trend.month}
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-blue-500" />
                              <span>{trend.appointments}节课</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              <span>¥{trend.spending}</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <ArrowUpRight className="h-3 w-3" />
                              <span>+{trend.progress.toFixed(1)}分</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Teacher Analytics */}
        {!isLoading && !error && userRole === 'teacher' && teacherAnalytics && (
          <div className="space-y-4">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={Users}
                title="总学生数"
                value={teacherAnalytics.totalStudents}
                subtitle="累计服务学生"
                gradientClass="from-blue-500 to-cyan-600"
              />
              <StatCard
                icon={BookOpen}
                title="总授课数"
                value={teacherAnalytics.totalAppointments}
                subtitle="累计授课时长"
                gradientClass="from-green-500 to-emerald-600"
              />
              <StatCard
                icon={DollarSign}
                title="总收入"
                value={`¥${teacherAnalytics.totalRevenue}`}
                subtitle="教学收入"
                gradientClass="from-purple-500 to-violet-600"
              />
              <StatCard
                icon={Star}
                title="平均评分"
                value={teacherAnalytics.averageRating.toFixed(1)}
                subtitle="学生满意度"
                gradientClass="from-yellow-400 to-orange-500"
              />
            </div>

            {/* Teacher Detailed Analytics */}
            <Tabs defaultValue="subjects" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <TabsTrigger value="subjects" className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm">
                  科目统计
                </TabsTrigger>
                <TabsTrigger value="revenue" className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm">
                  收入分析
                </TabsTrigger>
                <TabsTrigger value="students" className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm">
                  学生表现
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="subjects" className="space-y-6 mt-8">
                <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      科目教学统计
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {teacherAnalytics.subjects.map((subject, index) => (
                        <div key={index} className="group p-6 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/30 dark:to-gray-600/30 rounded-2xl border border-gray-200/50 dark:border-gray-600/30 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                                {subject.subject}
                              </h3>
                              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>{subject.studentCount}名学生</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span>{subject.appointmentCount}节课</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{subject.averageRating.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ¥{subject.revenue}
                              </div>
                              <Badge variant="outline" className="mt-2">
                                热门科目
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="revenue" className="space-y-6 mt-8">
                <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      收入趋势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {teacherAnalytics.monthlyTrend.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/30 dark:to-gray-600/30 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {trend.month}
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span>{trend.students}名学生</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4 text-green-500" />
                              <span>{trend.appointments}节课</span>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-green-600">
                              <DollarSign className="h-4 w-4" />
                              <span>¥{trend.revenue}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="students" className="space-y-6 mt-8">
                <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      学生表现
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 inline-block mb-6">
                        <Award className="h-16 w-16 text-purple-500 mx-auto" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        学生表现分析功能即将上线
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        我们正在开发更详细的学生表现分析功能，敬请期待！
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !studentAnalytics && !teacherAnalytics && (
          <div className="text-center py-12">
            <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg inline-block mb-4">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              暂无分析数据
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
              {user?.role === 'admin' 
                ? '管理员角色的分析功能正在开发中' 
                : '开始使用平台后，这里将显示您的分析数据'}
            </p>
            <Button 
              onClick={refetch}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-sm"
              size="sm"
            >
              <Zap className="h-3.5 w-3.5 mr-2" />
              重新加载数据
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPageV2;