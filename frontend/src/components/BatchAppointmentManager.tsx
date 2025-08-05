import React, { useState, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Copy,
  Download,
  Upload
} from 'lucide-react';

// Store hooks
import { useNotificationActions } from '../stores/uiStore';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedCalendarSelector from './EnhancedCalendarSelector';

interface BatchAppointmentData {
  id: string;
  teacherId: string;
  teacherName: string;
  studentName: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  notes?: string;
  status: 'draft' | 'pending' | 'confirmed' | 'error';
  errorMessage?: string;
}

interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  duration: number;
  notes: string;
  recurringPattern?: {
    type: 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
  };
  createdAt: string;
}

interface BatchAppointmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
  teacherName?: string;
  availableSlots?: Array<{
    date: string;
    time: string;
    available: boolean;
    price: number;
  }>;
  onSuccess?: () => void;
}

const BatchAppointmentManager: React.FC<BatchAppointmentManagerProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  availableSlots = [],
  onSuccess
}) => {
  const { showError, showSuccess, showInfo } = useNotificationActions();

  // State
  const [appointments, setAppointments] = useState<BatchAppointmentData[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  
  // Form state
  const [batchSettings, setBatchSettings] = useState({
    subject: '',
    duration: 60,
    studentName: '',
    notes: '',
    autoConfirm: false,
    skipConflicts: true,
    price: 0
  });

  // Template state
  const [templates, setTemplates] = useState<BatchTemplate[]>([
    {
      id: '1',
      name: '数学周课程',
      description: '每周数学课程安排',
      subjects: ['数学'],
      duration: 60,
      notes: '定期数学课程',
      recurringPattern: {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5]
      },
      createdAt: new Date().toISOString()
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    subjects: [''],
    duration: 60,
    notes: ''
  });

  // 生成批量预约
  const generateBatchAppointments = useCallback(() => {
    if (!teacherId || !teacherName) {
      showError('缺少教师信息', '请先选择教师');
      return;
    }

    if (selectedDates.length === 0 || selectedTimes.length === 0) {
      showError('请选择时间', '请先选择日期和时间');
      return;
    }

    if (!batchSettings.subject || !batchSettings.studentName) {
      showError('请填写必要信息', '请填写科目和学生姓名');
      return;
    }

    const newAppointments: BatchAppointmentData[] = [];

    selectedDates.forEach(date => {
      selectedTimes.forEach(time => {
        // 查找对应的价格
        const slot = availableSlots.find(s => s.date === date && s.time === time);
        const price = slot?.price || batchSettings.price;

        newAppointments.push({
          id: `${date}-${time}-${Date.now()}`,
          teacherId,
          teacherName,
          studentName: batchSettings.studentName,
          subject: batchSettings.subject,
          date,
          time,
          duration: batchSettings.duration,
          price: Math.round(price * (batchSettings.duration / 60)),
          notes: batchSettings.notes,
          status: 'draft'
        });
      });
    });

    setAppointments(prev => [...prev, ...newAppointments]);
    showSuccess('生成成功', `已生成 ${newAppointments.length} 个预约`);
    
    // 清空选择
    setSelectedDates([]);
    setSelectedTimes([]);
  }, [teacherId, teacherName, selectedDates, selectedTimes, batchSettings, availableSlots, showError, showSuccess]);

  // 应用模板
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setBatchSettings(prev => ({
      ...prev,
      subject: template.subjects[0] || '',
      duration: template.duration,
      notes: template.notes
    }));

    showInfo('模板已应用', `已应用模板: ${template.name}`);
  };

  // 删除预约
  const removeAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
  };

  // 复制预约
  const duplicateAppointment = (appointment: BatchAppointmentData) => {
    const newAppointment: BatchAppointmentData = {
      ...appointment,
      id: `${appointment.date}-${appointment.time}-${Date.now()}-copy`,
      status: 'draft'
    };
    setAppointments(prev => [...prev, newAppointment]);
  };


  // 提交批量预约
  const handleSubmitBatch = async () => {
    if (appointments.length === 0) {
      showError('没有预约', '请先创建预约');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const appointmentsToSubmit = appointments.filter(apt => apt.status === 'draft');
      
      if (appointmentsToSubmit.length === 0) {
        showError('没有待提交的预约', '所有预约都已提交或有错误');
        return;
      }

      // 模拟批量提交
      for (const appointment of appointmentsToSubmit) {
        try {
          // 这里应该调用实际的API
          await new Promise(resolve => setTimeout(resolve, 100)); // 模拟API调用
          
          setAppointments(prev => prev.map(apt => 
            apt.id === appointment.id 
              ? { ...apt, status: 'pending' as const }
              : apt
          ));
        } catch {
          setAppointments(prev => prev.map(apt => 
            apt.id === appointment.id 
              ? { ...apt, status: 'error' as const, errorMessage: '提交失败' }
              : apt
          ));
        }
      }

      const successCount = appointmentsToSubmit.length;
      showSuccess('批量提交完成', `成功提交 ${successCount} 个预约`);
      
      onSuccess?.();
      
    } catch (error) {
      console.error('批量提交失败:', error);
      showError('提交失败', '批量提交预约失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 导入导出功能
  const exportAppointments = () => {
    const dataStr = JSON.stringify(appointments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-appointments-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showSuccess('导出成功', '预约数据已导出');
  };

  const importAppointments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          setAppointments(prev => [...prev, ...data.map((apt: BatchAppointmentData) => ({
            ...apt,
            id: `${apt.id}-imported-${Date.now()}`,
            status: 'draft'
          }))]);
          showSuccess('导入成功', `已导入 ${data.length} 个预约`);
        }
      } catch {
        showError('导入失败', '文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  // 统计信息
  const statistics = useMemo(() => {
    const total = appointments.length;
    const draft = appointments.filter(apt => apt.status === 'draft').length;
    const pending = appointments.filter(apt => apt.status === 'pending').length;
    const confirmed = appointments.filter(apt => apt.status === 'confirmed').length;
    const errors = appointments.filter(apt => apt.status === 'error').length;
    const totalPrice = appointments.reduce((sum, apt) => sum + apt.price, 0);

    return { total, draft, pending, confirmed, errors, totalPrice };
  }, [appointments]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            批量预约管理
            {teacherName && <span className="text-muted-foreground">- {teacherName}</span>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">创建预约</TabsTrigger>
            <TabsTrigger value="manage">管理预约</TabsTrigger>
            <TabsTrigger value="templates">模板管理</TabsTrigger>
          </TabsList>

          {/* 创建预约标签页 */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 批量设置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">批量设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template">应用模板</Label>
                    <Select value={selectedTemplate} onValueChange={(value) => {
                      setSelectedTemplate(value);
                      if (value) applyTemplate(value);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模板" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">科目</Label>
                    <Input
                      id="subject"
                      placeholder="请输入科目"
                      value={batchSettings.subject}
                      onChange={(e) => setBatchSettings(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="studentName">学生姓名</Label>
                    <Input
                      id="studentName"
                      placeholder="请输入学生姓名"
                      value={batchSettings.studentName}
                      onChange={(e) => setBatchSettings(prev => ({ ...prev, studentName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">课程时长（分钟）</Label>
                    <Select 
                      value={batchSettings.duration.toString()} 
                      onValueChange={(value) => setBatchSettings(prev => ({ ...prev, duration: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60分钟</SelectItem>
                        <SelectItem value="90">90分钟</SelectItem>
                        <SelectItem value="120">120分钟</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">备注说明</Label>
                    <Textarea
                      id="notes"
                      placeholder="批量预约备注..."
                      value={batchSettings.notes}
                      onChange={(e) => setBatchSettings(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoConfirm"
                        checked={batchSettings.autoConfirm}
                        onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, autoConfirm: !!checked }))}
                      />
                      <Label htmlFor="autoConfirm">自动确认</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipConflicts"
                        checked={batchSettings.skipConflicts}
                        onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, skipConflicts: !!checked }))}
                      />
                      <Label htmlFor="skipConflicts">跳过冲突时间</Label>
                    </div>
                  </div>

                  <Button onClick={generateBatchAppointments} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    生成预约
                  </Button>
                </CardContent>
              </Card>

              {/* 日历选择 */}
              <div className="lg:col-span-2">
                <EnhancedCalendarSelector
                  selectedDates={selectedDates}
                  availableSlots={availableSlots}
                  onDateSelect={() => {}} // 不使用单选
                  onTimeSelect={() => {}} // 不使用单选
                  onMultiDateSelect={setSelectedDates}
                  multiSelectMode={true}
                  showConflictWarnings={batchSettings.skipConflicts}
                />

                {/* 时间批量选择 */}
                {selectedDates.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">选择时间段</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-2">
                        {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                          <Button
                            key={time}
                            variant={selectedTimes.includes(time) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedTimes(prev => 
                                prev.includes(time) 
                                  ? prev.filter(t => t !== time)
                                  : [...prev, time]
                              );
                            }}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        已选择 {selectedDates.length} 个日期，{selectedTimes.length} 个时间段
                        {selectedDates.length > 0 && selectedTimes.length > 0 && (
                          <span className="ml-2 font-medium">
                            将生成 {selectedDates.length * selectedTimes.length} 个预约
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 管理预约标签页 */}
          <TabsContent value="manage" className="space-y-6">
            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{statistics.total}</div>
                  <div className="text-sm text-muted-foreground">总计</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{statistics.draft}</div>
                  <div className="text-sm text-muted-foreground">草稿</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
                  <div className="text-sm text-muted-foreground">待确认</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.confirmed}</div>
                  <div className="text-sm text-muted-foreground">已确认</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{statistics.errors}</div>
                  <div className="text-sm text-muted-foreground">错误</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">¥{statistics.totalPrice}</div>
                  <div className="text-sm text-muted-foreground">总金额</div>
                </CardContent>
              </Card>
            </div>

            {/* 操作工具栏 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button onClick={handleSubmitBatch} disabled={isSubmitting || statistics.draft === 0}>
                  <Check className="h-4 w-4 mr-2" />
                  提交预约 ({statistics.draft})
                </Button>
                <Button variant="outline" onClick={exportAppointments}>
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importAppointments}
                    className="hidden"
                    id="import-file"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      导入
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {/* 预约列表 */}
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">暂无预约</h3>
                    <p className="text-muted-foreground">请先创建批量预约</p>
                  </CardContent>
                </Card>
              ) : (
                appointments.map((appointment) => {
                  const statusConfig = {
                    draft: { color: 'bg-gray-100 text-gray-800', label: '草稿' },
                    pending: { color: 'bg-yellow-100 text-yellow-800', label: '待确认' },
                    confirmed: { color: 'bg-green-100 text-green-800', label: '已确认' },
                    error: { color: 'bg-red-100 text-red-800', label: '错误' }
                  };
                  
                  const status = statusConfig[appointment.status];
                  
                  return (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{appointment.studentName}</h4>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{appointment.subject}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{appointment.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{appointment.time} ({appointment.duration}分钟)</span>
                              </div>
                              <div className="font-medium text-primary">
                                ¥{appointment.price}
                              </div>
                            </div>
                            
                            {appointment.errorMessage && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{appointment.errorMessage}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => duplicateAppointment(appointment)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeAppointment(appointment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* 模板管理标签页 */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">预约模板</h3>
              <Button onClick={() => setShowTemplateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新建模板
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>科目: {template.subjects.join(', ')}</div>
                      <div>时长: {template.duration}分钟</div>
                      {template.recurringPattern && (
                        <div>重复: {template.recurringPattern.type === 'weekly' ? '每周' : '每月'}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => applyTemplate(template.id)}
                      >
                        应用
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setTemplates(prev => prev.filter(t => t.id !== template.id));
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 新建模板对话框 */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建预约模板</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">模板名称</Label>
                <Input
                  id="templateName"
                  placeholder="请输入模板名称"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="templateDescription">模板描述</Label>
                <Input
                  id="templateDescription"
                  placeholder="请输入模板描述"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  取消
                </Button>
                <Button onClick={() => {
                  if (newTemplate.name) {
                    const template: BatchTemplate = {
                      id: Date.now().toString(),
                      ...newTemplate,
                      createdAt: new Date().toISOString()
                    };
                    setTemplates(prev => [...prev, template]);
                    setShowTemplateDialog(false);
                    setNewTemplate({ name: '', description: '', subjects: [''], duration: 60, notes: '' });
                  }
                }}>
                  创建
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAppointmentManager;