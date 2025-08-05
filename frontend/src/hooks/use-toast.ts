import React from 'react';

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

// 简单的useToast hook（不依赖Provider）
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // 自动移除toast（5秒后）
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast: addToast, removeToast };
};