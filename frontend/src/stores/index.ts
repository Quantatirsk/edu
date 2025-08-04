// Store exports for centralized access
export * from './authStore';
export * from './uiStore';
export * from './appStore';
export * from './teacherStore';

// Type exports for convenience
export type {
  AuthState,
  AuthActions,
} from './authStore';

export type {
  UIState,
  UIActions,
  Notification,
  Modal,
  LoadingState,
} from './uiStore';

export type {
  AppState,
  AppActions,
  AppConfig,
  UserLocation,
  SearchHistory,
  RecentItem,
} from './appStore';

export type {
  TeacherState,
  TeacherActions,
  TeacherFilters,
  TeacherSortOption,
  TeacherViewMode,
} from './teacherStore';

// Store combination utilities
import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';
import { useAppStore } from './appStore';
import { useTeacherStore } from './teacherStore';

// Combined state selectors
export const useGlobalState = () => ({
  auth: useAuthStore.getState(),
  ui: useUIStore.getState(),
  app: useAppStore.getState(),
  teacher: useTeacherStore.getState(),
});

// Global reset function
export const resetAllStores = () => {
  useAuthStore.getState().reset();
  useUIStore.getState().reset();
  useAppStore.getState().reset();
  useTeacherStore.getState().reset();
};

// Store subscription utilities
export const subscribeToStores = (callback: () => void) => {
  const unsubAuth = useAuthStore.subscribe(callback);
  const unsubUI = useUIStore.subscribe(callback);
  const unsubApp = useAppStore.subscribe(callback);
  const unsubTeacher = useTeacherStore.subscribe(callback);
  
  return () => {
    unsubAuth();
    unsubUI();
    unsubApp();
    unsubTeacher();
  };
};

// Development utilities
export const getStoreStats = () => {
  if (import.meta.env.DEV) {
    return {
      auth: {
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        user: useAuthStore.getState().user?.name || 'Not logged in',
      },
      ui: {
        notifications: useUIStore.getState().notifications.length,
        modals: useUIStore.getState().modals.length,
        loadingStates: useUIStore.getState().loadingStates.length,
      },
      app: {
        isInitialized: useAppStore.getState().isInitialized,
        isOnline: useAppStore.getState().network.isOnline,
        searchHistory: useAppStore.getState().searchHistory.length,
        bookmarks: useAppStore.getState().bookmarks.length,
      },
      teacher: {
        totalTeachers: useTeacherStore.getState().teachers.length,
        filteredTeachers: useTeacherStore.getState().filteredTeachers.length,
        selectedTeacher: useTeacherStore.getState().selectedTeacher?.name || 'None',
        favorites: useTeacherStore.getState().favorites.length,
      },
    };
  }
  return null;
};

// Store persistence utilities
export const exportStoreData = () => {
  return {
    auth: useAuthStore.persist.getOptions().partialize?.(useAuthStore.getState()),
    app: useAppStore.persist.getOptions().partialize?.(useAppStore.getState()),
    timestamp: Date.now(),
    version: '1.0',
  };
};

export const importStoreData = (data: any) => {
  try {
    if (data.auth) {
      useAuthStore.persist.setOptions({
        ...useAuthStore.persist.getOptions(),
      });
    }
    if (data.app) {
      useAppStore.persist.setOptions({
        ...useAppStore.persist.getOptions(),
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to import store data:', error);
    return false;
  }
};

// Debug utilities for development
if (import.meta.env.DEV) {
  // Expose stores to window for debugging
  (window as any).stores = {
    auth: useAuthStore,
    ui: useUIStore,
    app: useAppStore,
    teacher: useTeacherStore,
    getStats: getStoreStats,
    reset: resetAllStores,
    export: exportStoreData,
    import: importStoreData,
  };
  
  console.log('🏪 Stores available on window.stores for debugging');
}