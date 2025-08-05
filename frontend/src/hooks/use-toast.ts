import React from 'react';
import { useUIStore } from '../stores/uiStore';

// Toast类型定义
export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

// Toast context类型（暂未使用）
// interface ToastContextType {
//   toasts: ToastItem[];
//   addToast: (toast: Omit<ToastItem, 'id'>) => void;
//   removeToast: (id: string) => void;
// }

// 创建Toast context（暂未使用）
// const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// useToast hook 连接到 UI Store
export const useToast = () => {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  // 将 UI Store notifications 转换为 toast 格式
  const toasts: ToastItem[] = React.useMemo(() => {
    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    }));
  }, [notifications]);

  const removeToast = React.useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  // 为了兼容性，也提供 addToast 方法
  const addNotification = useUIStore((state) => state.addNotification);
  const addToast = React.useCallback((toast: Omit<ToastItem, 'id'>) => {
    addNotification({
      type: toast.variant === 'destructive' ? 'error' : 'success',
      title: toast.title || '',
      message: toast.description
    });
  }, [addNotification]);

  return { toasts, addToast, removeToast };
};