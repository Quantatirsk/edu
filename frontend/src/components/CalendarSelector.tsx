import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Check,
  X
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeSlot {
  time: string;
  available: boolean;
  price?: number;
  booked?: boolean;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  hasSlots: boolean;
  timeSlots: TimeSlot[];
}

interface CalendarSelectorProps {
  selectedDate?: string;
  selectedTime?: string;
  availableSlots?: Array<{
    date: string;
    time: string;
    available: boolean;
    price?: number;
  }>;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  minDate?: Date;
  maxDate?: Date;
  teacherSchedule?: Array<{
    dayOfWeek: number; // 0-6, 0 = Sunday
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  selectedDate,
  selectedTime,
  availableSlots = [],
  onDateSelect,
  onTimeSelect,
  minDate = new Date(),
  maxDate,
  teacherSchedule = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 生成日历数据
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 生成6周的日历数据
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isSelected = dateString === selectedDate;
      
      // 检查日期是否在允许范围内
      const isInRange = date >= minDate && (!maxDate || date <= maxDate);
      
      // 获取该日期的时间槽
      const daySlots = availableSlots.filter(slot => slot.date === dateString);
      const hasAvailableSlots = daySlots.some(slot => slot.available);
      
      // 检查教师是否在该天工作
      const dayOfWeek = date.getDay();
      const teacherWorksOnDay = teacherSchedule.length === 0 || 
        teacherSchedule.some(schedule => 
          schedule.dayOfWeek === dayOfWeek && schedule.available
        );
      
      const isAvailable = isCurrentMonth && isInRange && teacherWorksOnDay && hasAvailableSlots;
      
      days.push({
        date,
        dateString,
        isCurrentMonth,
        isToday,
        isSelected,
        isAvailable,
        hasSlots: daySlots.length > 0,
        timeSlots: daySlots.map(slot => ({
          time: slot.time,
          available: slot.available,
          price: slot.price,
          booked: !slot.available
        }))
      });
    }
    
    return days;
  }, [currentMonth, availableSlots, selectedDate, minDate, maxDate, teacherSchedule]);

  // 获取选中日期的时间槽
  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const day = calendarData.find(d => d.dateString === selectedDate);
    return day?.timeSlots.filter(slot => slot.available) || [];
  }, [selectedDate, calendarData]);

  // 导航到上个月
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // 导航到下个月
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // 格式化月份显示
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
        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, index) => (
            <Button
              key={index}
              variant={day.isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => day.isAvailable && onDateSelect(day.dateString)}
              disabled={!day.isAvailable}
              className={`
                h-10 p-0 relative
                ${!day.isCurrentMonth ? 'text-muted-foreground/50' : ''}
                ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${day.isAvailable ? 'hover:bg-accent' : 'opacity-50 cursor-not-allowed'}
                ${day.isSelected ? 'bg-primary text-primary-foreground' : ''}
              `}
            >
              <span className="text-sm">{day.date.getDate()}</span>
              {day.hasSlots && day.isAvailable && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // 渲染时间选择
  const renderTimeSlots = () => {
    if (!selectedDate || selectedDateSlots.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>请先选择日期</p>
        </div>
      );
    }

    // 按时间分组时间槽
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
        
        {Object.entries(timeGroups).map(([period, slots]) => (
          <div key={period}>
            <h4 className="font-medium text-sm mb-2">{period}</h4>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`
                    relative
                    ${slot.available ? '' : 'opacity-50 cursor-not-allowed'}
                    ${selectedTime === slot.time ? 'bg-primary text-primary-foreground' : ''}
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
                  
                  {selectedTime === slot.time && (
                    <Check className="absolute top-1 right-1 h-3 w-3" />
                  )}
                  
                  {slot.booked && (
                    <X className="absolute top-1 right-1 h-3 w-3 text-red-500" />
                  )}
                </Button>
              ))}
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
              选择日期
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
          
          {/* 图例 */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">有课时</span>
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

export default CalendarSelector;