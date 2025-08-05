import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Phone, 
  MessageCircle,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  MoreHorizontal
} from 'lucide-react';

// Store hooks
import {
  useAppointments,
  useAppointmentActions,
  useAppointmentFilters,
  useAppointmentLoading,
  useAppointmentErrors,
  useAppointmentStatistics,
  useAppointmentStore,
  type AppointmentStatus
} from '../stores/appointmentStore';
import { useAuthUser } from '../stores/authStore';
import { useNotificationActions } from '../stores/uiStore';

// Services
import { AppointmentService } from '../services/appointmentService';
import { TeacherService } from '../services/teacherService';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// 状态映射
const statusConfig = {
  pending: { 
    label: '待确认', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: AlertCircle 
  },
  confirmed: { 
    label: '已确认', 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle 
  },
  completed: { 
    label: '已完成', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle 
  },
  cancelled: { 
    label: '已取消', 
    color: 'bg-red-100 text-red-800', 
    icon: XCircle 
  },
  'no-show': { 
    label: '未出席', 
    color: 'bg-gray-100 text-gray-800', 
    icon: XCircle 
  },
  rescheduled: { 
    label: '已改期', 
    color: 'bg-purple-100 text-purple-800', 
    icon: Clock 
  }
};

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Store state
  const appointments = useAppointments();
  const filters = useAppointmentFilters();
  const { isLoading, updatingIds } = useAppointmentLoading();
  const { createError } = useAppointmentErrors();
  const statistics = useAppointmentStatistics();
  const user = useAuthUser();
  
  // Store actions
  const {
    setAppointments,
    setFilters,
    setSearchQuery,
    confirmAppointment,
    cancelAppointment,
    completeAppointment
  } = useAppointmentActions();
  
  // Direct store access for loading state
  const setLoading = useAppointmentStore((state) => state.setLoading);
  const { showError, showSuccess } = useNotificationActions();
  
  // Local state
  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  // 加载预约数据
  const loadAppointments = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const params = {
        status: filters.status.length > 0 ? filters.status.filter(s => s !== 'no-show' && s !== 'rescheduled') as ('pending' | 'confirmed' | 'cancelled' | 'completed' | 'missed')[] : undefined,
        dateFrom: filters.dateRange.start?.toISOString().split('T')[0],
        dateTo: filters.dateRange.end?.toISOString().split('T')[0],
        teacherId: filters.teacherId,
        studentId: user.role === 'student' ? user.id : filters.studentId,
        page: 1,
        limit: 50,
        sortBy: 'date' as const,
        sortOrder: 'desc' as const
      };
      
      let response;
      if (user.role === 'teacher') {
        response = await AppointmentService.getTeacherAppointments(user.id, params);
      } else if (user.role === 'student') {
        response = await AppointmentService.getStudentAppointments(user.id, params);
      } else {
        response = await AppointmentService.getAppointments(params);
      }
      
      setAppointments(response.appointments);
      
    } catch (error) {
      console.error('加载预约数据失败:', error);
      showError('加载失败', '无法加载预约数据，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [user, filters, setAppointments, setLoading, showError]);

  // 初始化数据
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // 筛选预约
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    switch (selectedTab) {
      case 'upcoming':
        filtered = appointments.filter(apt => 
          apt.status === 'pending' || apt.status === 'confirmed'
        );
        break;
      case 'completed':
        filtered = appointments.filter(apt => apt.status === 'completed');
        break;
      case 'cancelled':
        filtered = appointments.filter(apt => 
          apt.status === 'cancelled' || apt.status === 'no-show'
        );
        break;
    }
    
    return filtered;
  }, [appointments, selectedTab]);

  // 处理确认预约
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await confirmAppointment(appointmentId);
      showSuccess('预约已确认', '预约状态已更新为已确认');
      loadAppointments();
    } catch {
      showError('确认失败', '无法确认预约，请稍后重试');
    }
  };

  // 处理取消预约
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!cancelReason.trim()) {
      showError('请填写取消原因', '取消预约需要填写原因');
      return;
    }
    
    try {
      await cancelAppointment(appointmentId, cancelReason);
      showSuccess('预约已取消', '预约已成功取消');
      setShowCancelDialog(null);
      setCancelReason('');
      loadAppointments();
    } catch {
      showError('取消失败', '无法取消预约，请稍后重试');
    }
  };

  // 处理完成预约
  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      // 首先完成预约
      await completeAppointment(appointmentId, rating, review);
      
      // 如果有评价，提交教师评价
      if (rating && review.trim()) {
        const appointment = appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
          await TeacherService.createReview(appointment.teacherId, {
            appointmentId,
            ratings: {
              overall: rating,
              teaching: rating,
              patience: rating,
              communication: rating,
              effectiveness: rating
            },
            comment: review,
            isRecommended: rating >= 4,
            tags: rating >= 4 ? ['教学认真', '效果良好'] : []
          });
        }
      }
      
      showSuccess('预约已完成', '预约状态已更新为已完成，感谢您的评价！');
      setShowCompleteDialog(null);
      setRating(5);
      setReview('');
      loadAppointments();
    } catch {
      showError('完成失败', '无法完成预约，请稍后重试');
    }
  };

  // 获取统计数据
  const getTabCounts = () => {
    return {
      all: appointments.length,
      upcoming: appointments.filter(apt => 
        apt.status === 'pending' || apt.status === 'confirmed'
      ).length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => 
        apt.status === 'cancelled' || apt.status === 'no-show'
      ).length
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div className="min-h-screen bg-background -mx-4 -my-8">
      {/* 页面头部 */}
      <div className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">我的预约</h1>
              <Button 
                onClick={() => navigate('/teachers')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                新建预约
              </Button>
            </div>
            
            {/* 搜索和筛选 */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索预约..."
                  className="pl-10 w-64"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select onValueChange={(value) => {
                if (value === 'all') {
                  setFilters({ status: [] });
                } else {
                  setFilters({ status: [value as AppointmentStatus] });
                }
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{statistics.totalAppointments}</div>
              <div className="text-sm text-muted-foreground">总预约数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{statistics.upcomingAppointments}</div>
              <div className="text-sm text-muted-foreground">即将到来</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{statistics.completedAppointments}</div>
              <div className="text-sm text-muted-foreground">已完成</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{statistics.averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">平均评分</div>
            </CardContent>
          </Card>
        </div>

        {/* 标签页 */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: '全部' },
            { key: 'upcoming', label: '即将到来' },
            { key: 'completed', label: '已完成' },
            { key: 'cancelled', label: '已取消' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as 'all' | 'upcoming' | 'completed' | 'cancelled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                selectedTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tabCounts[tab.key as keyof typeof tabCounts] > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tabCounts[tab.key as keyof typeof tabCounts]}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* 预约列表 */}
        <div className="space-y-4">
          {isLoading ? (
            // 加载骨架屏
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48 mb-4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const status = statusConfig[appointment.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              const isUpdating = updatingIds.has(appointment.id);

              return (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {user?.role === 'student' ? appointment.teacherName : appointment.studentName}
                          </h3>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{appointment.subject}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{appointment.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mb-4 bg-muted p-3 rounded-lg">
                            {appointment.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-primary">¥{appointment.price}</span>
                            {appointment.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{appointment.rating}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2">
                            {appointment.status === 'pending' && user?.role === 'teacher' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleConfirmAppointment(appointment.id)}
                                disabled={isUpdating}
                              >
                                确认预约
                              </Button>
                            )}
                            
                            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowCancelDialog(appointment.id)}
                                  disabled={isUpdating}
                                >
                                  取消
                                </Button>
                                
                                {appointment.status === 'confirmed' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => setShowCompleteDialog(appointment.id)}
                                    disabled={isUpdating}
                                  >
                                    完成
                                  </Button>
                                )}
                              </>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  发送消息
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="h-4 w-4 mr-2" />
                                  联系电话
                                </DropdownMenuItem>
                                {appointment.status === 'completed' && !appointment.rating && (
                                  <DropdownMenuItem onClick={() => setShowCompleteDialog(appointment.id)}>
                                    <Star className="h-4 w-4 mr-2" />
                                    评价
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">暂无预约记录</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTab === 'all' ? '您还没有任何预约记录' : `暂无${selectedTab}的预约记录`}
                </p>
                <Button onClick={() => navigate('/teachers')}>
                  <Plus className="h-4 w-4 mr-2" />
                  立即预约
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 取消预约对话框 */}
      <Dialog open={!!showCancelDialog} onOpenChange={() => setShowCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取消预约</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">取消原因</Label>
              <Textarea
                id="cancelReason"
                placeholder="请输入取消原因..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancelDialog(null)}>
                取消
              </Button>
              <Button 
                variant="destructive"
                onClick={() => showCancelDialog && handleCancelAppointment(showCancelDialog)}
              >
                确认取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 完成预约对话框 */}
      <Dialog open={!!showCompleteDialog} onOpenChange={() => setShowCompleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完成预约</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>评分</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star 
                      className={`h-6 w-6 ${
                        star <= rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review">评价内容（可选）</Label>
              <Textarea
                id="review"
                placeholder="请输入您的评价..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompleteDialog(null)}>
                取消
              </Button>
              <Button 
                onClick={() => showCompleteDialog && handleCompleteAppointment(showCompleteDialog)}
              >
                确认完成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 错误提示 */}
      {createError && (
        <Alert variant="destructive" className="mx-6 mt-4">
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AppointmentsPage;