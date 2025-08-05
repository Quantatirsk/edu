import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

// Store hooks
import { useAuthUser } from '../stores/authStore';
import { useNotificationActions } from '../stores/uiStore';

// Services
import { TeacherService } from '../services/teacherService';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  price?: number;
  maxStudents?: number;
  notes?: string;
}

interface WeeklySchedule {
  dayOfWeek: number; // 0-6, 0 = Sunday
  dayName: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface ScheduleSettings {
  autoAcceptBookings: boolean;
  advanceBookingDays: number;
  cancellationHours: number;
  defaultPrice: number;
  defaultDuration: number;
}

const TeacherSchedule: React.FC = () => {
  const user = useAuthUser();
  const { showError, showSuccess } = useNotificationActions();

  // State
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings>({
    autoAcceptBookings: false,
    advanceBookingDays: 7,
    cancellationHours: 24,
    defaultPrice: 200,
    defaultDuration: 60
  });
  // const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    dayIndex: number;
    slotIndex?: number;
    slot?: TimeSlot;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 初始化周计划
  const initializeSchedule = useCallback(() => {
    const weekDays = [
      '周日', '周一', '周二', '周三', '周四', '周五', '周六'
    ];
    
    return weekDays.map((dayName, index) => ({
      dayOfWeek: index,
      dayName,
      enabled: index >= 1 && index <= 5, // 默认周一到周五开放
      timeSlots: []
    }));
  }, []);

  // 加载教师时间表
  const loadSchedule = useCallback(async () => {
    if (!user || user.role !== 'teacher') return;
    
    try {
      setIsLoading(true);
      
      // 尝试加载现有时间表
      try {
        // TODO: Implement getTeacherSchedule in TeacherService
        // const teacherSchedule = await TeacherService.getTeacherSchedule(user.id);
        // setSchedule(teacherSchedule.weeklySchedule || initializeSchedule());
        // setSettings(teacherSchedule.settings || settings);
        
        // For now, initialize with default schedule
        setSchedule(initializeSchedule());
      } catch (scheduleError) {
        // 如果没有现有时间表，初始化默认时间表
        console.info('No existing schedule found, initializing default schedule', scheduleError);
        setSchedule(initializeSchedule());
      }
      
    } catch (loadError) {
      console.error('加载时间表失败:', loadError);
      showError('加载失败', '无法加载时间表数据');
      setSchedule(initializeSchedule());
    } finally {
      // setIsLoading(false);
    }
  }, [user, initializeSchedule, showError]);

  // 初始化数据
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // 保存时间表
  const saveSchedule = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const scheduleData = {
        teacherId: user.id,
        weeklySchedule: schedule,
        settings,
        updatedAt: new Date().toISOString()
      };
      
      await TeacherService.updateTeacherSchedule(user.id, scheduleData);
      showSuccess('保存成功', '时间表已更新');
      
    } catch (error) {
      console.error('保存时间表失败:', error);
      showError('保存失败', '无法保存时间表，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 切换某天的开启状态
  const toggleDayEnabled = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, enabled: !day.enabled } : day
    ));
  };

  // 添加时间槽
  const addTimeSlot = (dayIndex: number) => {
    setEditingSlot({
      dayIndex,
      slot: {
        id: Date.now().toString(),
        startTime: '09:00',
        endTime: '10:00',
        available: true,
        price: settings.defaultPrice,
        maxStudents: 1,
        notes: ''
      }
    });
  };

  // 编辑时间槽
  const editTimeSlot = (dayIndex: number, slotIndex: number) => {
    const slot = schedule[dayIndex].timeSlots[slotIndex];
    setEditingSlot({
      dayIndex,
      slotIndex,
      slot: { ...slot }
    });
  };

  // 删除时间槽
  const deleteTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { ...day, timeSlots: day.timeSlots.filter((_, i) => i !== slotIndex) }
        : day
    ));
  };

  // 保存时间槽编辑
  const saveTimeSlot = () => {
    if (!editingSlot || !editingSlot.slot) return;
    
    const { dayIndex, slotIndex, slot } = editingSlot;
    
    // 验证时间格式
    if (!slot.startTime || !slot.endTime) {
      showError('请填写完整时间', '开始时间和结束时间不能为空');
      return;
    }
    
    // 验证时间逻辑
    if (slot.startTime >= slot.endTime) {
      showError('时间设置错误', '结束时间必须晚于开始时间');
      return;
    }
    
    setSchedule(prev => prev.map((day, index) => {
      if (index !== dayIndex) return day;
      
      const newTimeSlots = [...day.timeSlots];
      if (slotIndex !== undefined) {
        // 编辑现有时间槽
        newTimeSlots[slotIndex] = slot;
      } else {
        // 添加新时间槽
        newTimeSlots.push(slot);
        newTimeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
      
      return { ...day, timeSlots: newTimeSlots };
    }));
    
    setEditingSlot(null);
  };

  // 生成时间选项
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  // 渲染时间槽编辑对话框
  const renderEditDialog = () => {
    if (!editingSlot || !editingSlot.slot) return null;
    
    const { slot } = editingSlot;
    const timeOptions = generateTimeOptions();
    
    return (
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot.slotIndex !== undefined ? '编辑时间槽' : '添加时间槽'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>开始时间</Label>
                <Select 
                  value={slot.startTime} 
                  onValueChange={(value) => setEditingSlot(prev => 
                    prev ? { ...prev, slot: { ...prev.slot!, startTime: value } } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>结束时间</Label>
                <Select 
                  value={slot.endTime} 
                  onValueChange={(value) => setEditingSlot(prev => 
                    prev ? { ...prev, slot: { ...prev.slot!, endTime: value } } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>课时费（元）</Label>
              <Input
                type="number"
                min="0"
                step="10"
                value={slot.price || ''}
                onChange={(e) => setEditingSlot(prev => 
                  prev ? { ...prev, slot: { ...prev.slot!, price: parseInt(e.target.value) || 0 } } : null
                )}
              />
            </div>
            
            <div>
              <Label>最大学生数</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={slot.maxStudents || 1}
                onChange={(e) => setEditingSlot(prev => 
                  prev ? { ...prev, slot: { ...prev.slot!, maxStudents: parseInt(e.target.value) || 1 } } : null
                )}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={slot.available}
                onCheckedChange={(checked) => setEditingSlot(prev => 
                  prev ? { ...prev, slot: { ...prev.slot!, available: checked } } : null
                )}
              />
              <Label>开放预约</Label>
            </div>
            
            <div>
              <Label>备注</Label>
              <Input
                placeholder="可选备注信息..."
                value={slot.notes || ''}
                onChange={(e) => setEditingSlot(prev => 
                  prev ? { ...prev, slot: { ...prev.slot!, notes: e.target.value } } : null
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingSlot(null)}>
                取消
              </Button>
              <Button onClick={saveTimeSlot}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // 渲染设置对话框
  const renderSettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            时间表设置
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">自动接受预约</Label>
              <p className="text-sm text-muted-foreground">
                学生预约后自动确认，无需手动审核
              </p>
            </div>
            <Switch
              checked={settings.autoAcceptBookings}
              onCheckedChange={(checked) => setSettings(prev => 
                ({ ...prev, autoAcceptBookings: checked })
              )}
            />
          </div>
          
          <Separator />
          
          <div>
            <Label>提前预约天数</Label>
            <p className="text-sm text-muted-foreground mb-2">
              学生最多可以提前多少天预约课程
            </p>
            <Input
              type="number"
              min="1"
              max="30"
              value={settings.advanceBookingDays}
              onChange={(e) => setSettings(prev => 
                ({ ...prev, advanceBookingDays: parseInt(e.target.value) || 7 })
              )}
            />
          </div>
          
          <div>
            <Label>取消课程提前时间（小时）</Label>
            <p className="text-sm text-muted-foreground mb-2">
              学生需要提前多少小时取消课程
            </p>
            <Input
              type="number"
              min="1"
              max="72"
              value={settings.cancellationHours}
              onChange={(e) => setSettings(prev => 
                ({ ...prev, cancellationHours: parseInt(e.target.value) || 24 })
              )}
            />
          </div>
          
          <div>
            <Label>默认课时费（元）</Label>
            <p className="text-sm text-muted-foreground mb-2">
              添加新时间槽时的默认价格
            </p>
            <Input
              type="number"
              min="0"
              step="10"
              value={settings.defaultPrice}
              onChange={(e) => setSettings(prev => 
                ({ ...prev, defaultPrice: parseInt(e.target.value) || 200 })
              )}
            />
          </div>
          
          <div>
            <Label>默认课程时长（分钟）</Label>
            <p className="text-sm text-muted-foreground mb-2">
              默认单节课程的时长
            </p>
            <Select 
              value={settings.defaultDuration.toString()}
              onValueChange={(value) => setSettings(prev => 
                ({ ...prev, defaultDuration: parseInt(value) })
              )}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45分钟</SelectItem>
                <SelectItem value="60">60分钟</SelectItem>
                <SelectItem value="90">90分钟</SelectItem>
                <SelectItem value="120">120分钟</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              取消
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              保存设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!user || user.role !== 'teacher') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          此功能仅限教师用户使用
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">时间表管理</h2>
          <p className="text-muted-foreground">管理您的教学时间安排和预约设置</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
          <Button onClick={saveSchedule} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '保存中...' : '保存时间表'}
          </Button>
        </div>
      </div>

      {/* 周计划 */}
      <div className="grid grid-cols-1 gap-4">
        {schedule.map((day, dayIndex) => (
          <Card key={day.dayOfWeek}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={() => toggleDayEnabled(dayIndex)}
                  />
                  <CardTitle className="text-lg">{day.dayName}</CardTitle>
                  {day.enabled && (
                    <Badge variant="secondary">
                      {day.timeSlots.length} 个时间槽
                    </Badge>
                  )}
                </div>
                
                {day.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(dayIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加时间
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {day.enabled && (
              <CardContent>
                {day.timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {day.timeSlots.map((slot, slotIndex) => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border-2 ${
                          slot.available 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editTimeSlot(dayIndex, slotIndex)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimeSlot(dayIndex, slotIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>¥{slot.price || settings.defaultPrice}</div>
                          <div>最多 {slot.maxStudents || 1} 人</div>
                          {slot.notes && <div className="text-xs">{slot.notes}</div>}
                        </div>
                        
                        <div className="mt-2">
                          <Badge variant={slot.available ? "default" : "secondary"}>
                            {slot.available ? '开放预约' : '暂停预约'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>暂无时间安排</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(dayIndex)}
                      className="mt-2"
                    >
                      添加第一个时间槽
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* 快速操作提示 */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>提示：</strong>
          开启某天后可以添加时间槽，学生只能预约已开放的时间。
          建议设置合理的提前预约天数和取消政策。
        </AlertDescription>
      </Alert>

      {/* 对话框 */}
      {renderEditDialog()}
      {renderSettingsDialog()}
    </div>
  );
};

export default TeacherSchedule;