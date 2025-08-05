import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  MessageCircle, 
  Calendar, 
  Star, 
  DollarSign,
  AlertCircle,
  X,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
} from 'lucide-react';

// Store hooks
import { useAuthUser } from '../stores/authStore';
import { useNotificationActions, useNotifications } from '../stores/uiStore';

// Services
import { NotificationService } from '../services/notificationService';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'review' | 'system' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  data?: unknown;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  types: {
    appointment: boolean;
    payment: boolean;
    review: boolean;
    system: boolean;
    message: boolean;
  };
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

const NotificationSystem: React.FC = () => {
  const user = useAuthUser();
  const { showError, showSuccess } = useNotificationActions();
  // Use global notifications from store
  useNotifications();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    soundEnabled: true,
    types: {
      appointment: true,
      payment: true,
      review: true,
      system: true,
      message: true
    },
    schedule: {
      enabled: false,
      startTime: '08:00',
      endTime: '22:00'
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // 通知类型配置
  const notificationTypes = {
    appointment: {
      label: '预约通知',
      description: '预约确认、取消、提醒等',
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    payment: {
      label: '支付通知',
      description: '付款成功、退款等',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    review: {
      label: '评价通知',
      description: '新评价、评价回复等',
      icon: <Star className="h-4 w-4" />,
      color: 'bg-yellow-500'
    },
    system: {
      label: '系统通知',
      description: '系统更新、维护等',
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'bg-red-500'
    },
    message: {
      label: '消息通知',
      description: '私信、聊天消息等',
      icon: <MessageCircle className="h-4 w-4" />,
      color: 'bg-purple-500'
    }
  };

  // 加载通知列表
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await NotificationService.getNotifications({
        userId: user.id,
        limit: 50,
        type: filter !== 'all' && filter !== 'unread' ? filter : undefined,
        isRead: filter === 'unread' ? false : undefined
      });
      
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      
    } catch (loadError) {
      console.error('加载通知失败:', loadError);
      showError('加载失败', '无法加载通知列表');
    } finally {
      setIsLoading(false);
    }
  }, [user, filter, showError]);

  // 加载通知设置
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const userSettings = await NotificationService.getNotificationSettings(user.id);
      setSettings(userSettings);
    } catch (settingsError) {
      console.warn('加载通知设置失败:', settingsError);
      // 使用默认设置
    }
  }, [user]);

  // 初始化数据
  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [loadNotifications, loadSettings]);

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showError('不支持通知', '您的浏览器不支持推送通知');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showSuccess('权限已授予', '您将接收到推送通知');
      return true;
    } else {
      showError('权限被拒绝', '无法发送推送通知');
      return false;
    }
  };

  // 标记为已读
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记全部为已读
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(user!.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('操作成功', '已标记全部通知为已读');
    } catch (markReadError) {
      console.error('标记已读失败:', markReadError);
      showError('操作失败', '标记已读失败');
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showSuccess('删除成功', '通知已删除');
    } catch (deleteError) {
      console.error('删除通知失败:', deleteError);
      showError('删除失败', '无法删除通知');
    }
  };

  // 保存设置
  const saveSettings = async () => {
    if (!user) return;
    
    try {
      await NotificationService.updateNotificationSettings(user.id, settings);
      showSuccess('设置已保存', '通知设置已更新');
      setShowSettings(false);
    } catch (saveError) {
      console.error('保存设置失败:', saveError);
      showError('保存失败', '无法保存通知设置');
    }
  };

  // 发送测试通知
  const sendTestNotification = () => {
    if (settings.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('测试通知', {
        body: '这是一条测试通知，您的通知设置正常工作！',
        icon: '/favicon.ico'
      });
    }
  };

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    const typeConfig = notificationTypes[type as keyof typeof notificationTypes];
    const IconComponent = typeConfig?.icon || <Bell className="h-4 w-4" />;
    
    return (
      <div className={`p-2 rounded-full ${typeConfig?.color || 'bg-gray-500'} text-white`}>
        {IconComponent}
      </div>
    );
  };

  // 渲染通知项
  const renderNotificationItem = (notification: Notification) => (
    <Card key={notification.id} className={`transition-colors ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getNotificationIcon(notification.type, notification.priority)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium ${!notification.isRead ? 'text-blue-900' : 'text-foreground'}`}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <Badge variant="default" className="h-2 w-2 p-0 bg-blue-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                >
                  标记已读
                </Button>
              )}
              
              {notification.actionUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    // 这里可以添加路由跳转逻辑
                    console.log('Navigate to:', notification.actionUrl);
                  }}
                >
                  查看详情
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteNotification(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 渲染设置对话框
  const renderSettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            通知设置
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">通知方式</TabsTrigger>
            <TabsTrigger value="types">通知类型</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <div>
                    <Label className="font-medium">推送通知</Label>
                    <p className="text-xs text-muted-foreground">浏览器推送通知</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      requestNotificationPermission().then((granted) => {
                        if (granted) {
                          setSettings(prev => ({ ...prev, pushEnabled: true }));
                        }
                      });
                    } else {
                      setSettings(prev => ({ ...prev, pushEnabled: false }));
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <div>
                    <Label className="font-medium">邮件通知</Label>
                    <p className="text-xs text-muted-foreground">发送到注册邮箱</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, emailEnabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <Label className="font-medium">短信通知</Label>
                    <p className="text-xs text-muted-foreground">发送到手机号码</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, smsEnabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <div>
                    <Label className="font-medium">声音提醒</Label>
                    <p className="text-xs text-muted-foreground">播放提示音</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label className="font-medium">免打扰时间</Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">启用免打扰模式</p>
                  <p className="text-xs text-muted-foreground">在指定时间段内不发送通知</p>
                </div>
                <Switch
                  checked={settings.schedule.enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      schedule: { ...prev.schedule, enabled: checked }
                    }))
                  }
                />
              </div>
              
              {settings.schedule.enabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">开始时间</Label>
                    <Select
                      value={settings.schedule.startTime}
                      onValueChange={(value) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          schedule: { ...prev.schedule, startTime: value }
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const time = `${i.toString().padStart(2, '0')}:00`;
                          return (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">结束时间</Label>
                    <Select
                      value={settings.schedule.endTime}
                      onValueChange={(value) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          schedule: { ...prev.schedule, endTime: value }
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const time = `${i.toString().padStart(2, '0')}:00`;
                          return (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="types" className="space-y-4">
            <div className="space-y-4">
              {Object.entries(notificationTypes).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <div>
                      <Label className="font-medium">{config.label}</Label>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.types[key as keyof typeof settings.types]}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        types: { ...prev.types, [key]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={sendTestNotification}>
            发送测试通知
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              取消
            </Button>
            <Button onClick={saveSettings}>
              保存设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            通知中心
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="unread">未读</SelectItem>
              {Object.entries(notificationTypes).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              全部标记已读
            </Button>
          )}
        </div>
      </div>

      {/* 通知列表 */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">加载中...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(renderNotificationItem)
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">暂无通知</h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' ? '所有通知都已阅读' : '您还没有收到任何通知'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* 设置对话框 */}
      {renderSettingsDialog()}
    </div>
  );
};

export default NotificationSystem;