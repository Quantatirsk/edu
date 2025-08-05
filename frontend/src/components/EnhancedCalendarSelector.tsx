import React, { useState, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  AlertTriangle,
  User
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimeSlot {
  time: string;
  available: boolean;
  price?: number;
  booked?: boolean;
  studentName?: string;
  subject?: string;
  conflictType?: 'overlap' | 'adjacent' | 'double-booking';
  conflictDetails?: string;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  hasSlots: boolean;
  hasConflicts: boolean;
  timeSlots: TimeSlot[];
  conflictCount: number;
}

interface ConflictDetectionRule {
  type: 'overlap' | 'adjacent' | 'double-booking' | 'capacity';
  enabled: boolean;
  buffer?: number; // 缓冲时间（分钟）
  maxCapacity?: number; // 最大容量
}

interface EnhancedCalendarSelectorProps {
  selectedDate?: string;
  selectedTime?: string;
  selectedDates?: string[]; // 支持多选
  availableSlots?: Array<{
    date: string;
    time: string;
    available: boolean;
    price?: number;
    studentName?: string;
    subject?: string;
  }>;
  existingAppointments?: Array<{
    date: string;
    time: string;
    duration: number;
    studentName: string;
    subject: string;
    status: 'pending' | 'confirmed' | 'cancelled';
  }>;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onMultiDateSelect?: (dates: string[]) => void;
  onConflictDetected?: (conflicts: Array<{ date: string; time: string; type: string; details: string }>) => void;
  minDate?: Date;
  maxDate?: Date;
  teacherSchedule?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
  conflictRules?: ConflictDetectionRule[];
  multiSelectMode?: boolean;
  showConflictWarnings?: boolean;
}

const defaultConflictRules: ConflictDetectionRule[] = [
  { type: 'overlap', enabled: true },
  { type: 'adjacent', enabled: true, buffer: 15 },
  { type: 'double-booking', enabled: true },
  { type: 'capacity', enabled: true, maxCapacity: 1 }
];

const EnhancedCalendarSelector: React.FC<EnhancedCalendarSelectorProps> = ({
  selectedDate,
  selectedTime,
  selectedDates = [],
  availableSlots = [],
  existingAppointments = [],
  onDateSelect,
  onTimeSelect,
  onMultiDateSelect,
  onConflictDetected,
  minDate = new Date(),
  maxDate,
  teacherSchedule = [],
  conflictRules = defaultConflictRules,
  multiSelectMode = false,
  showConflictWarnings = true
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [detectedConflicts, setDetectedConflicts] = useState<Array<{
    date: string;
    time: string;
    type: string;
    details: string;
  }>>([]);

  // 冲突检测逻辑
  const detectConflicts = useCallback((date: string, time: string, duration: number = 60) => {
    const conflicts: Array<{ date: string; time: string; type: string; details: string }> = [];
    const activeRules = conflictRules.filter(rule => rule.enabled);
    
    const startTime = new Date(`${date} ${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    // 检查现有预约冲突
    existingAppointments.forEach(appointment => {
      if (appointment.date === date && appointment.status !== 'cancelled') {
        const appointmentStart = new Date(`${appointment.date} ${appointment.time}`);
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
        
        // 重叠冲突
        const overlapRule = activeRules.find(r => r.type === 'overlap');
        if (overlapRule && ((startTime < appointmentEnd && endTime > appointmentStart))) {
          conflicts.push({
            date,
            time,
            type: 'overlap',
            details: `与${appointment.studentName}的${appointment.subject}课程时间重叠`
          });
        }
        
        // 相邻时间冲突（考虑缓冲时间）
        const adjacentRule = activeRules.find(r => r.type === 'adjacent');
        if (adjacentRule && adjacentRule.buffer) {
          const bufferMs = adjacentRule.buffer * 60000;
          const bufferStart = new Date(startTime.getTime() - bufferMs);
          const bufferEnd = new Date(endTime.getTime() + bufferMs);
          
          if ((bufferStart < appointmentEnd && bufferEnd > appointmentStart) && 
              !(startTime < appointmentEnd && endTime > appointmentStart)) {
            conflicts.push({
              date,
              time,
              type: 'adjacent',
              details: `与${appointment.studentName}的课程间隔不足${adjacentRule.buffer}分钟`
            });
          }
        }
        
        // 双重预约检测
        const doubleBookingRule = activeRules.find(r => r.type === 'double-booking');
        if (doubleBookingRule && appointment.time === time) {
          conflicts.push({
            date,
            time,
            type: 'double-booking',
            details: `同一时间已有${appointment.studentName}的预约`
          });
        }
      }
    });
    
    // 容量检测
    const capacityRule = activeRules.find(r => r.type === 'capacity');
    if (capacityRule && capacityRule.maxCapacity) {
      const sameTimeAppointments = existingAppointments.filter(
        app => app.date === date && app.time === time && app.status !== 'cancelled'
      );
      
      if (sameTimeAppointments.length >= capacityRule.maxCapacity) {
        conflicts.push({
          date,
          time,
          type: 'capacity',
          details: `该时间段已达到最大容量限制(${capacityRule.maxCapacity})`
        });
      }
    }
    
    return conflicts;
  }, [existingAppointments, conflictRules]);

  // 生成增强的日历数据
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
      const isSelected = multiSelectMode 
        ? selectedDates.includes(dateString)
        : dateString === selectedDate;
      
      const isInRange = date >= minDate && (!maxDate || date <= maxDate);
      
      const daySlots = availableSlots.filter(slot => slot.date === dateString);
      const hasAvailableSlots = daySlots.some(slot => slot.available);
      
      const dayOfWeek = date.getDay();
      const teacherWorksOnDay = teacherSchedule.length === 0 || 
        teacherSchedule.some(schedule => 
          schedule.dayOfWeek === dayOfWeek && schedule.available
        );
      
      // 增强时间槽冲突检测
      const enhancedTimeSlots: TimeSlot[] = daySlots.map(slot => {
        const conflicts = detectConflicts(dateString, slot.time);
        return {
          ...slot,
          conflictType: conflicts.length > 0 ? conflicts[0].type as TimeSlot['conflictType'] : undefined,
          conflictDetails: conflicts.length > 0 ? conflicts[0].details : undefined
        };
      });
      
      const hasConflicts = enhancedTimeSlots.some(slot => slot.conflictType);
      const conflictCount = enhancedTimeSlots.filter(slot => slot.conflictType).length;
      
      const isAvailable = isCurrentMonth && isInRange && teacherWorksOnDay && hasAvailableSlots;
      
      days.push({
        date,
        dateString,
        isCurrentMonth,
        isToday: date.getTime() === today.getTime(),
        isSelected,
        isAvailable,
        hasSlots: daySlots.length > 0,
        hasConflicts,
        conflictCount,
        timeSlots: enhancedTimeSlots
      });
    }
    
    return days;
  }, [currentMonth, availableSlots, selectedDate, selectedDates, minDate, maxDate, teacherSchedule, multiSelectMode, detectConflicts]);

  // 处理日期选择
  const handleDateSelect = (dateString: string) => {
    if (multiSelectMode && onMultiDateSelect) {
      const newSelectedDates = selectedDates.includes(dateString)
        ? selectedDates.filter(d => d !== dateString)
        : [...selectedDates, dateString];
      onMultiDateSelect(newSelectedDates);
    } else {
      onDateSelect(dateString);
    }
  };

  // 处理时间选择时的冲突检测
  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      const conflicts = detectConflicts(selectedDate, time);
      
      if (conflicts.length > 0) {
        setDetectedConflicts(conflicts);
        onConflictDetected?.(conflicts);
        
        if (showConflictWarnings) {
          // 显示冲突警告，但仍允许选择
          onTimeSelect(time);
          return;
        }
      } else {
        setDetectedConflicts([]);
      }
    }
    
    onTimeSelect(time);
  };

  // 获取选中日期的时间槽
  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const day = calendarData.find(d => d.dateString === selectedDate);
    return day?.timeSlots.filter(slot => slot.available) || [];
  }, [selectedDate, calendarData]);

  // 导航函数
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long'
    });
  };

  // 渲染日历网格
  const renderCalendarGrid = () => {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={day.isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => day.isAvailable && handleDateSelect(day.dateString)}
                    disabled={!day.isAvailable}
                    className={`
                      h-10 p-0 relative
                      ${!day.isCurrentMonth ? 'text-muted-foreground/50' : ''}
                      ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${day.isAvailable ? 'hover:bg-accent' : 'opacity-50 cursor-not-allowed'}
                      ${day.isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${day.hasConflicts ? 'border-red-300' : ''}
                    `}
                  >
                    <span className="text-sm">{day.date.getDate()}</span>
                    
                    {/* 可用时间指示器 */}
                    {day.hasSlots && day.isAvailable && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <div className={`w-1 h-1 rounded-full ${
                          day.hasConflicts ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                      </div>
                    )}
                    
                    {/* 冲突警告 */}
                    {day.hasConflicts && (
                      <AlertTriangle className="absolute top-0.5 right-0.5 h-3 w-3 text-red-500" />
                    )}
                    
                    {/* 多选模式的选择数量 */}
                    {multiSelectMode && day.isSelected && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                        ✓
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p>{day.date.toLocaleDateString('zh-CN')}</p>
                    {day.hasSlots && (
                      <p className="text-muted-foreground">
                        {day.timeSlots.filter(s => s.available).length} 个可用时间
                      </p>
                    )}
                    {day.hasConflicts && (
                      <p className="text-red-500">
                        {day.conflictCount} 个时间冲突
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };

  // 渲染增强的时间选择
  const renderTimeSlots = () => {
    if (!selectedDate || selectedDateSlots.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>请先选择日期</p>
        </div>
      );
    }

    const timeGroups = selectedDateSlots.reduce((groups, slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      const period = hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';
      
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(slot);
      
      return groups;
    }, {} as Record<string, TimeSlot[]>);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-medium">
            {new Date(selectedDate).toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </h3>
          <p className="text-sm text-muted-foreground">请选择上课时间</p>
        </div>
        
        {/* 冲突警告 */}
        {detectedConflicts.length > 0 && showConflictWarnings && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">检测到时间冲突：</p>
                {detectedConflicts.map((conflict, index) => (
                  <p key={index} className="text-sm">• {conflict.details}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {Object.entries(timeGroups).map(([period, slots]) => (
          <div key={period}>
            <h4 className="font-medium text-sm mb-2">{period}</h4>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const hasConflict = slot.conflictType;
                const isSelected = selectedTime === slot.time;
                
                return (
                  <TooltipProvider key={slot.time}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          className={`
                            relative
                            ${slot.available ? '' : 'opacity-50 cursor-not-allowed'}
                            ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                            ${hasConflict ? 'border-red-300 bg-red-50' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="text-sm font-medium">{slot.time}</div>
                            {slot.price && (
                              <div className="text-xs text-muted-foreground">
                                ¥{slot.price}
                              </div>
                            )}
                          </div>
                          
                          {isSelected && (
                            <Check className="absolute top-1 right-1 h-3 w-3" />
                          )}
                          
                          {hasConflict && (
                            <AlertTriangle className="absolute top-1 right-1 h-3 w-3 text-red-500" />
                          )}
                          
                          {slot.booked && (
                            <X className="absolute top-1 right-1 h-3 w-3 text-red-500" />
                          )}
                          
                          {slot.studentName && (
                            <User className="absolute bottom-1 left-1 h-3 w-3 text-blue-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm space-y-1">
                          <p>{slot.time}</p>
                          {slot.price && <p>价格: ¥{slot.price}</p>}
                          {slot.studentName && (
                            <p className="text-blue-500">学生: {slot.studentName}</p>
                          )}
                          {slot.subject && (
                            <p className="text-green-500">科目: {slot.subject}</p>
                          )}
                          {hasConflict && (
                            <p className="text-red-500">冲突: {slot.conflictDetails}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 日历选择 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {multiSelectMode ? '选择多个日期' : '选择日期'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatMonth(currentMonth)}
          </p>
        </CardHeader>
        <CardContent>
          {renderCalendarGrid()}
          
          {/* 增强的图例 */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">可用</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">冲突</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">已选择</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 border-2 border-primary rounded-full"></div>
              <span className="text-muted-foreground">今天</span>
            </div>
          </div>
          
          {/* 多选模式信息 */}
          {multiSelectMode && selectedDates.length > 0 && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">已选择 {selectedDates.length} 个日期</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedDates.map(date => (
                  <Badge key={date} variant="secondary" className="text-xs">
                    {new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 时间选择 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            选择时间
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderTimeSlots()}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCalendarSelector;