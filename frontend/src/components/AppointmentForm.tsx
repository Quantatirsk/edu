import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  BookOpen, 
  MapPin, 
  DollarSign,
  Check,
  AlertCircle
} from 'lucide-react';

// Store hooks
import { useAuthUser } from '../stores/authStore';
import { useAppointmentActions } from '../stores/appointmentStore';
import { useNotificationActions } from '../stores/uiStore';

// Services
import { TeacherService } from '../services/teacherService';

// Types
import type { Teacher } from '../types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AppointmentFormProps {
  teacherId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
  price: number;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  teacherId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { createAppointment } = useAppointmentActions();
  const { showError, showSuccess } = useNotificationActions();

  // State
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // 加载可用时间槽
  const loadAvailableSlots = useCallback(async (teacherPrice: number = 200) => {
    try {
      // 模拟生成接下来7天的可用时间槽
      const slots: AvailableSlot[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // 生成时间槽 (9:00-21:00)
        for (let hour = 9; hour <= 20; hour++) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          const available = Math.random() > 0.3; // 70% 概率可用
          
          slots.push({
            date: dateStr,
            time: timeStr,
            available,
            price: teacherPrice
          });
        }
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('加载时间槽失败:', error);
    }
  }, []);

  // 加载教师信息
  useEffect(() => {
    const loadTeacher = async () => {
      if (!teacherId) return;
      
      try {
        setIsLoading(true);
        const teacherData = await TeacherService.getTeacher(teacherId);
        setTeacher(teacherData);
        
        // 设置默认科目
        if (teacherData.subject && teacherData.subject.length > 0) {
          setSelectedSubject(teacherData.subject[0]);
        }
        
        // 加载可用时间槽
        await loadAvailableSlots(teacherData.price);
        
      } catch (error) {
        console.error('加载教师信息失败:', error);
        showError('加载失败', '无法加载教师信息');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadTeacher();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, isOpen, showError]);

  // 获取可用日期
  const getAvailableDates = () => {
    const dates = [...new Set(availableSlots
      .filter(slot => slot.available)
      .map(slot => slot.date)
    )];
    
    return dates.map(date => ({
      value: date,
      label: new Date(date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    }));
  };

  // 获取指定日期的可用时间
  const getAvailableTimesForDate = (date: string) => {
    return availableSlots
      .filter(slot => slot.date === date && slot.available)
      .map(slot => ({
        value: slot.time,
        label: slot.time,
        price: slot.price
      }));
  };

  // 计算总价
  const calculateTotalPrice = () => {
    if (!selectedDate || !selectedTime || !teacher) return 0;
    
    const slot = availableSlots.find(
      s => s.date === selectedDate && s.time === selectedTime
    );
    
    const basePrice = slot?.price || teacher.price;
    const durationMultiplier = parseInt(duration) / 60;
    
    return Math.round(basePrice * durationMultiplier);
  };

  // 验证表单
  const validateForm = () => {
    if (!user) {
      showError('请先登录', '需要登录后才能预约');
      return false;
    }
    
    if (!selectedDate || !selectedTime) {
      showError('请选择时间', '请选择预约日期和时间');
      return false;
    }
    
    if (!selectedSubject) {
      showError('请选择科目', '请选择要学习的科目');
      return false;
    }
    
    if (!studentName.trim()) {
      showError('请填写姓名', '请填写学生姓名');
      return false;
    }
    
    return true;
  };

  // 提交预约
  const handleSubmit = async () => {
    if (!validateForm() || !teacher) return;
    
    try {
      setIsSubmitting(true);
      
      const appointmentData = {
        teacherId: teacher.id,
        teacherName: teacher.name,
        studentId: user!.id,
        studentName: studentName,
        subject: selectedSubject,
        lessonType: 'one-on-one' as const,
        date: selectedDate,
        time: selectedTime,
        duration: parseInt(duration),
        price: calculateTotalPrice(),
        notes: notes.trim(),
        studentPhone: studentPhone.trim(),
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await createAppointment(appointmentData);
      
      showSuccess('预约成功', '您的预约已提交，等待教师确认');
      onSuccess?.();
      onClose();
      
      // 可选：跳转到预约列表页面
      navigate('/appointments');
      
    } catch (error) {
      console.error('提交预约失败:', error);
      showError('预约失败', '提交预约失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {currentStep > step ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-8 h-0.5 ${
                currentStep > step ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            预约教师课程
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : teacher ? (
          <div className="space-y-6">
            {/* 步骤指示器 */}
            {renderStepIndicator()}
            
            {/* 教师信息卡片 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={teacher.avatar} 
                    alt={teacher.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{teacher.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{teacher.subject.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>¥{teacher.price}/小时</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{teacher.location.district}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 表单内容 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">选择时间和科目</h3>
                
                {/* 日期选择 */}
                <div>
                  <Label htmlFor="date">选择日期</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择日期" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDates().map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 时间选择 */}
                {selectedDate && (
                  <div>
                    <Label htmlFor="time">选择时间</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {getAvailableTimesForDate(selectedDate).map((time) => (
                        <Button
                          key={time.value}
                          variant={selectedTime === time.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time.value)}
                          className="h-10"
                        >
                          {time.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 科目选择 */}
                <div>
                  <Label htmlFor="subject">选择科目</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacher.subject.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 课程时长 */}
                <div>
                  <Label htmlFor="duration">课程时长</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1小时</SelectItem>
                      <SelectItem value="90">1.5小时</SelectItem>
                      <SelectItem value="120">2小时</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">填写个人信息</h3>
                
                <div>
                  <Label htmlFor="studentName">学生姓名 *</Label>
                  <Input
                    id="studentName"
                    placeholder="请输入学生姓名"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="studentPhone">联系电话</Label>
                  <Input
                    id="studentPhone"
                    placeholder="请输入联系电话"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">备注说明</Label>
                  <Textarea
                    id="notes"
                    placeholder="请输入特殊要求或备注..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">确认预约信息</h3>
                
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">教师：</span>
                      <span className="font-medium">{teacher.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">科目：</span>
                      <span className="font-medium">{selectedSubject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">时间：</span>
                      <span className="font-medium">
                        {new Date(selectedDate).toLocaleDateString('zh-CN')} {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">时长：</span>
                      <span className="font-medium">{parseInt(duration) / 60}小时</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">学生：</span>
                      <span className="font-medium">{studentName}</span>
                    </div>
                    {studentPhone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">电话：</span>
                        <span className="font-medium">{studentPhone}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>总费用：</span>
                        <span className="text-primary">¥{calculateTotalPrice()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {notes && (
                  <div>
                    <Label>备注说明</Label>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-1">
                      {notes}
                    </p>
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    提交后将等待教师确认，确认后即可开始上课。
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {currentStep > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={isSubmitting}
                  >
                    上一步
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  取消
                </Button>
                
                {currentStep < 3 ? (
                  <Button 
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (currentStep === 1 && (!selectedDate || !selectedTime || !selectedSubject)) ||
                      (currentStep === 2 && !studentName.trim())
                    }
                  >
                    下一步
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '提交中...' : '确认预约'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>无法加载教师信息</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;