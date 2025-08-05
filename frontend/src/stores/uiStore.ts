import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';

// 通知类型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  timestamp: number;
}

// 模态框类型
export interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  options?: {
    closable?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    overlay?: boolean;
    centered?: boolean;
  };
}

// 加载状态类型
export interface LoadingState {
  id: string;
  message?: string;
  progress?: number;
  cancelable?: boolean;
  onCancel?: () => void;
}

// 侧边栏状态
export interface SidebarState {
  isOpen: boolean;
  width: number;
  collapsed: boolean;
  pinned: boolean;
}

// 页面状态
export interface PageState {
  title: string;
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
  actions?: Array<{
    label: string;
    icon?: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

// UI状态接口
export interface UIState {
  // 通知系统
  notifications: Notification[];
  
  // 模态框系统
  modals: Modal[];
  
  // 加载状态
  loadingStates: LoadingState[];
  globalLoading: boolean;
  
  // 布局状态
  sidebar: SidebarState;
  header: {
    height: number;
    fixed: boolean;
  };
  
  // 页面状态
  page: PageState;
  
  // 设备状态
  device: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
  };
  
  // 主题和视觉
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
    fontSize: 'sm' | 'base' | 'lg';
    animations: boolean;
  };
  
  // 交互状态
  interaction: {
    dragActive: boolean;
    focusMode: boolean;
    contextMenu: {
      visible: boolean;
      x: number;
      y: number;
      items: Array<{
        label: string;
        action: () => void;
        icon?: string;
        disabled?: boolean;
        divider?: boolean;
      }>;
    } | null;
  };
  
  // 缓存的组件状态
  componentStates: Record<string, unknown>;
}

// UI操作接口
export interface UIActions {
  // 通知管理
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  
  // 模态框管理
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModalProps: (id: string, props: Record<string, unknown>) => void;
  
  // 加载状态管理
  showLoading: (options?: Omit<LoadingState, 'id'>) => string;
  hideLoading: (id: string) => void;
  updateLoadingProgress: (id: string, progress: number) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // 布局管理
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setSidebarWidth: (width: number) => void;
  
  // 页面状态管理
  setPageTitle: (title: string) => void;
  setPageBreadcrumbs: (breadcrumbs: PageState['breadcrumbs']) => void;
  setPageActions: (actions: PageState['actions']) => void;
  updatePage: (page: Partial<PageState>) => void;
  
  // 设备状态更新
  updateDeviceState: (device: Partial<UIState['device']>) => void;
  
  // 主题管理
  setThemeMode: (mode: UIState['theme']['mode']) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: UIState['theme']['fontSize']) => void;
  toggleAnimations: () => void;
  
  // 交互状态管理
  setDragActive: (active: boolean) => void;
  setFocusMode: (active: boolean) => void;
  showContextMenu: (x: number, y: number, items: Array<{
    label: string;
    action: () => void;
    icon?: string;
    disabled?: boolean;
    divider?: boolean;
  }>) => void;
  hideContextMenu: () => void;
  
  // 组件状态缓存
  setComponentState: (key: string, state: unknown) => void;
  getComponentState: (key: string) => unknown;
  clearComponentState: (key: string) => void;
  
  // 工具方法
  reset: () => void;
}

// 默认状态
const initialState: UIState = {
  notifications: [],
  modals: [],
  loadingStates: [],
  globalLoading: false,
  sidebar: {
    isOpen: false,
    width: 280,
    collapsed: false,
    pinned: false,
  },
  header: {
    height: 64,
    fixed: true,
  },
  page: {
    title: '',
    breadcrumbs: [],
    actions: [],
  },
  device: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
  },
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    fontSize: 'base',
    animations: true,
  },
  interaction: {
    dragActive: false,
    focusMode: false,
    contextMenu: null,
  },
  componentStates: {},
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 创建UI Store
export const useUIStore = create<UIState & UIActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // 通知管理
    addNotification: (notification) => {
      const id = generateId();
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        duration: notification.duration ?? 5000,
      };
      
      set((state) => ({
        notifications: [...state.notifications, newNotification],
      }));
      
      // 自动移除非持久化通知
      if (!notification.persistent && newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          get().removeNotification(id);
        }, newNotification.duration);
      }
      
      return id;
    },
    
    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    },
    
    clearNotifications: () => {
      set({ notifications: [] });
    },
    
    showSuccess: (title, message) => {
      return get().addNotification({ type: 'success', title, message });
    },
    
    showError: (title, message) => {
      return get().addNotification({ 
        type: 'error', 
        title, 
        message,
        duration: 8000, // 错误消息显示更长时间
      });
    },
    
    showWarning: (title, message) => {
      return get().addNotification({ type: 'warning', title, message });
    },
    
    showInfo: (title, message) => {
      return get().addNotification({ type: 'info', title, message });
    },
    
    // 模态框管理
    openModal: (modal) => {
      const id = generateId();
      const newModal: Modal = { ...modal, id };
      
      set((state) => ({
        modals: [...state.modals, newModal],
      }));
      
      return id;
    },
    
    closeModal: (id) => {
      set((state) => ({
        modals: state.modals.filter(m => m.id !== id),
      }));
    },
    
    closeAllModals: () => {
      set({ modals: [] });
    },
    
    updateModalProps: (id, props) => {
      set((state) => ({
        modals: state.modals.map(modal =>
          modal.id === id ? { ...modal, props: { ...modal.props, ...props } } : modal
        ),
      }));
    },
    
    // 加载状态管理
    showLoading: (options = {}) => {
      const id = generateId();
      const loadingState: LoadingState = { ...options, id };
      
      set((state) => ({
        loadingStates: [...state.loadingStates, loadingState],
      }));
      
      return id;
    },
    
    hideLoading: (id) => {
      set((state) => ({
        loadingStates: state.loadingStates.filter(l => l.id !== id),
      }));
    },
    
    updateLoadingProgress: (id, progress) => {
      set((state) => ({
        loadingStates: state.loadingStates.map(loading =>
          loading.id === id ? { ...loading, progress } : loading
        ),
      }));
    },
    
    setGlobalLoading: (loading) => {
      set({ globalLoading: loading });
    },
    
    // 布局管理
    toggleSidebar: () => {
      set((state) => ({
        sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
      }));
    },
    
    setSidebarOpen: (open) => {
      set((state) => ({
        sidebar: { ...state.sidebar, isOpen: open },
      }));
    },
    
    setSidebarCollapsed: (collapsed) => {
      set((state) => ({
        sidebar: { ...state.sidebar, collapsed },
      }));
    },
    
    setSidebarPinned: (pinned) => {
      set((state) => ({
        sidebar: { ...state.sidebar, pinned },
      }));
    },
    
    setSidebarWidth: (width) => {
      set((state) => ({
        sidebar: { ...state.sidebar, width },
      }));
    },
    
    // 页面状态管理
    setPageTitle: (title) => {
      set((state) => ({
        page: { ...state.page, title },
      }));
      // 同时更新document title
      document.title = title ? `${title} - 优教辅导平台` : '优教辅导平台';
    },
    
    setPageBreadcrumbs: (breadcrumbs) => {
      set((state) => ({
        page: { ...state.page, breadcrumbs },
      }));
    },
    
    setPageActions: (actions) => {
      set((state) => ({
        page: { ...state.page, actions },
      }));
    },
    
    updatePage: (page) => {
      set((state) => ({
        page: { ...state.page, ...page },
      }));
    },
    
    // 设备状态更新
    updateDeviceState: (device) => {
      set((state) => ({
        device: { ...state.device, ...device },
      }));
    },
    
    // 主题管理
    setThemeMode: (mode) => {
      set((state) => ({
        theme: { ...state.theme, mode },
      }));
    },
    
    setPrimaryColor: (color) => {
      set((state) => ({
        theme: { ...state.theme, primaryColor: color },
      }));
    },
    
    setFontSize: (fontSize) => {
      set((state) => ({
        theme: { ...state.theme, fontSize },
      }));
    },
    
    toggleAnimations: () => {
      set((state) => ({
        theme: { ...state.theme, animations: !state.theme.animations },
      }));
    },
    
    // 交互状态管理
    setDragActive: (active) => {
      set((state) => ({
        interaction: { ...state.interaction, dragActive: active },
      }));
    },
    
    setFocusMode: (active) => {
      set((state) => ({
        interaction: { ...state.interaction, focusMode: active },
      }));
    },
    
    showContextMenu: (x, y, items) => {
      set((state) => ({
        interaction: {
          ...state.interaction,
          contextMenu: { visible: true, x, y, items },
        },
      }));
    },
    
    hideContextMenu: () => {
      set((state) => ({
        interaction: {
          ...state.interaction,
          contextMenu: null,
        },
      }));
    },
    
    // 组件状态缓存
    setComponentState: (key, state) => {
      set((currentState) => ({
        componentStates: {
          ...currentState.componentStates,
          [key]: state,
        },
      }));
    },
    
    getComponentState: (key) => {
      return get().componentStates[key];
    },
    
    clearComponentState: (key) => {
      set((state) => {
        const { [key]: _, ...rest } = state.componentStates;
        void _; // Explicitly acknowledge we don't use this value
        return { componentStates: rest };
      });
    },
    
    // 重置状态
    reset: () => {
      set(initialState);
    },
  }))
);

// 选择器 Hooks
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useModals = () => useUIStore((state) => state.modals);
export const useLoadingStates = () => useUIStore((state) => state.loadingStates);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const usePageState = () => useUIStore((state) => state.page);
export const useTheme = () => useUIStore((state) => state.theme);
export const useDeviceState = () => useUIStore((state) => state.device);

// 操作 Hooks - 使用 useMemo 稳定化返回对象
export const useNotificationActions = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const clearNotifications = useUIStore((state) => state.clearNotifications);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const showWarning = useUIStore((state) => state.showWarning);
  const showInfo = useUIStore((state) => state.showInfo);

  return useMemo(() => ({
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }), [addNotification, removeNotification, clearNotifications, showSuccess, showError, showWarning, showInfo]);
};

export const useModalActions = () => {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const closeAllModals = useUIStore((state) => state.closeAllModals);
  const updateModalProps = useUIStore((state) => state.updateModalProps);

  return useMemo(() => ({
    openModal,
    closeModal,
    closeAllModals,
    updateModalProps,
  }), [openModal, closeModal, closeAllModals, updateModalProps]);
};

export const useLoadingActions = () => {
  const showLoading = useUIStore((state) => state.showLoading);
  const hideLoading = useUIStore((state) => state.hideLoading);
  const updateLoadingProgress = useUIStore((state) => state.updateLoadingProgress);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);

  return useMemo(() => ({
    showLoading,
    hideLoading,
    updateLoadingProgress,
    setGlobalLoading,
  }), [showLoading, hideLoading, updateLoadingProgress, setGlobalLoading]);
};

export const useLayoutActions = () => useUIStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarPinned: state.setSidebarPinned,
  setSidebarWidth: state.setSidebarWidth,
}));

export const usePageActions = () => useUIStore((state) => ({
  setPageTitle: state.setPageTitle,
  setPageBreadcrumbs: state.setPageBreadcrumbs,
  setPageActions: state.setPageActions,
  updatePage: state.updatePage,
}));