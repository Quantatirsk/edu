import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

// 应用配置类型
export interface AppConfig {
  apiUrl: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableOfflineMode: boolean;
    enableExperimentalFeatures: boolean;
  };
  limits: {
    maxFileSize: number;
    maxUploadCount: number;
    sessionTimeout: number;
    requestTimeout: number;
  };
}

// 用户位置类型
export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  district?: string;
  accuracy?: number;
  timestamp: number;
}

// 搜索历史类型
export interface SearchHistory {
  id: string;
  query: string;
  type: 'teacher' | 'course' | 'general';
  timestamp: number;
  results: number;
}

// 最近查看项目类型
export interface RecentItem {
  id: string;
  type: 'teacher' | 'course' | 'student';
  data: Record<string, unknown>;
  timestamp: number;
}

// 应用统计类型
export interface AppStatistics {
  sessions: number;
  totalTime: number;
  lastActiveDate: string;
  featuresUsed: Record<string, number>;
  crashes: number;
  errors: number;
}

// 网络状态类型
export interface NetworkState {
  isOnline: boolean;
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
  speed: 'fast' | 'slow' | 'unknown';
  latency: number;
}

// 应用状态接口
export interface AppState {
  // 应用基本信息
  config: AppConfig;
  isInitialized: boolean;
  lastUpdateCheck: number;
  needsUpdate: boolean;
  
  // 用户位置
  userLocation: UserLocation | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  
  // 搜索和历史
  searchHistory: SearchHistory[];
  recentItems: RecentItem[];
  bookmarks: string[]; // 收藏的教师或课程ID
  
  // 应用统计
  statistics: AppStatistics;
  
  // 网络状态
  network: NetworkState;
  
  // 缓存策略
  cache: {
    maxAge: number;
    maxSize: number;
    currentSize: number;
    strategies: Record<string, 'cache-first' | 'network-first' | 'cache-only'>;
  };
  
  // 同步状态
  sync: {
    lastSync: number;
    pendingOperations: Array<{
      id: string;
      type: string;
      data: unknown;
      timestamp: number;
    }>;
    conflicts: Array<{
      id: string;
      type: string;
      localData: unknown;
      remoteData: unknown;
      timestamp: number;
    }>;
  };
  
  // 应用设置
  settings: {
    autoSave: boolean;
    syncEnabled: boolean;
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
    backgroundSync: boolean;
    compression: boolean;
  };
}

// 应用操作接口
export interface AppActions {
  // 初始化
  initialize: () => Promise<void>;
  setInitialized: (initialized: boolean) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  
  // 位置管理
  setUserLocation: (location: UserLocation) => void;
  clearUserLocation: () => void;
  setLocationPermission: (permission: AppState['locationPermission']) => void;
  requestLocation: () => Promise<UserLocation | null>;
  
  // 搜索历史管理
  addSearchHistory: (search: Omit<SearchHistory, 'id' | 'timestamp'>) => void;
  clearSearchHistory: () => void;
  removeSearchHistory: (id: string) => void;
  getPopularSearches: () => SearchHistory[];
  
  // 最近项目管理
  addRecentItem: (item: Omit<RecentItem, 'timestamp'>) => void;
  clearRecentItems: () => void;
  removeRecentItem: (id: string) => void;
  
  // 收藏管理
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  
  // 统计管理
  incrementFeatureUsage: (feature: string) => void;
  recordSession: (duration: number) => void;
  recordError: (error: string) => void;
  recordCrash: (crash: string) => void;
  
  // 网络状态管理
  updateNetworkState: (network: Partial<NetworkState>) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // 缓存管理
  updateCacheSize: (size: number) => void;
  setCacheStrategy: (key: string, strategy: AppState['cache']['strategies'][string]) => void;
  clearCache: () => void;
  
  // 同步管理
  addPendingOperation: (operation: Omit<AppState['sync']['pendingOperations'][0], 'id' | 'timestamp'>) => void;
  removePendingOperation: (id: string) => void;
  addSyncConflict: (conflict: Omit<AppState['sync']['conflicts'][0], 'timestamp'>) => void;
  resolveSyncConflict: (id: string, resolution: 'local' | 'remote') => void;
  updateLastSync: () => void;
  
  // 设置管理
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  toggleSetting: (key: keyof AppState['settings']) => void;
  
  // 更新管理
  checkForUpdates: () => Promise<boolean>;
  setNeedsUpdate: (needsUpdate: boolean) => void;
  
  // 工具方法
  exportData: () => string;
  importData: (data: string) => boolean;
  reset: () => void;
}

// 默认配置
const defaultConfig: AppConfig = {
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  version: '1.0.0',
  environment: (import.meta.env.MODE as AppConfig['environment']) || 'development',
  features: {
    enableNotifications: true,
    enableAnalytics: true,
    enableOfflineMode: true,
    enableExperimentalFeatures: false,
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxUploadCount: 5,
    sessionTimeout: 30 * 60 * 1000, // 30分钟
    requestTimeout: 15 * 1000, // 15秒
  },
};

// 默认状态
const initialState: AppState = {
  config: defaultConfig,
  isInitialized: false,
  lastUpdateCheck: 0,
  needsUpdate: false,
  userLocation: null,
  locationPermission: 'unknown',
  searchHistory: [],
  recentItems: [],
  bookmarks: [],
  statistics: {
    sessions: 0,
    totalTime: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    featuresUsed: {},
    crashes: 0,
    errors: 0,
  },
  network: {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    speed: 'unknown',
    latency: 0,
  },
  cache: {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    maxSize: 50 * 1024 * 1024, // 50MB
    currentSize: 0,
    strategies: {
      teachers: 'cache-first',
      students: 'cache-first',
      reviews: 'network-first',
      appointments: 'network-first',
    },
  },
  sync: {
    lastSync: 0,
    pendingOperations: [],
    conflicts: [],
  },
  settings: {
    autoSave: true,
    syncEnabled: true,
    analyticsEnabled: true,
    crashReportingEnabled: true,
    backgroundSync: true,
    compression: true,
  },
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 创建应用 Store
export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 初始化
        initialize: async () => {
          set({ isInitialized: true });
          
          // 记录新会话
          const { statistics } = get();
          set({
            statistics: {
              ...statistics,
              sessions: statistics.sessions + 1,
              lastActiveDate: new Date().toISOString().split('T')[0],
            },
          });
          
          // 检查网络状态
          get().updateNetworkState({
            isOnline: navigator.onLine,
          });
          
          // 设置网络状态监听器
          window.addEventListener('online', () => get().setOnlineStatus(true));
          window.addEventListener('offline', () => get().setOnlineStatus(false));
        },
        
        setInitialized: (initialized) => {
          set({ isInitialized: initialized });
        },
        
        updateConfig: (config) => {
          set((state) => ({
            config: { ...state.config, ...config },
          }));
        },
        
        // 位置管理
        setUserLocation: (location) => {
          set({ userLocation: location });
        },
        
        clearUserLocation: () => {
          set({ userLocation: null });
        },
        
        setLocationPermission: (permission) => {
          set({ locationPermission: permission });
        },
        
        requestLocation: async () => {
          try {
            if (!navigator.geolocation) {
              get().setLocationPermission('denied');
              return null;
            }
            
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true,
                maximumAge: 300000,
              });
            });
            
            const location: UserLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now(),
            };
            
            get().setUserLocation(location);
            get().setLocationPermission('granted');
            
            return location;
          } catch {
            get().setLocationPermission('denied');
            return null;
          }
        },
        
        // 搜索历史管理
        addSearchHistory: (search) => {
          const id = generateId();
          const newSearch: SearchHistory = {
            ...search,
            id,
            timestamp: Date.now(),
          };
          
          set((state) => {
            // 移除重复的搜索
            const filtered = state.searchHistory.filter(s => s.query !== search.query);
            // 只保留最近50条搜索
            const limited = [...filtered, newSearch].slice(-50);
            
            return { searchHistory: limited };
          });
        },
        
        clearSearchHistory: () => {
          set({ searchHistory: [] });
        },
        
        removeSearchHistory: (id) => {
          set((state) => ({
            searchHistory: state.searchHistory.filter(s => s.id !== id),
          }));
        },
        
        getPopularSearches: () => {
          const { searchHistory } = get();
          const queryCount = searchHistory.reduce((acc, search) => {
            acc[search.query] = (acc[search.query] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          return Object.entries(queryCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([query, count]) => {
              const lastSearch = searchHistory
                .filter(s => s.query === query)
                .sort((a, b) => b.timestamp - a.timestamp)[0];
              return { ...lastSearch, results: count };
            });
        },
        
        // 最近项目管理
        addRecentItem: (item) => {
          const newItem: RecentItem = {
            ...item,
            timestamp: Date.now(),
          };
          
          set((state) => {
            // 移除重复项目
            const filtered = state.recentItems.filter(i => i.id !== item.id || i.type !== item.type);
            // 只保留最近20个项目
            const limited = [newItem, ...filtered].slice(0, 20);
            
            return { recentItems: limited };
          });
        },
        
        clearRecentItems: () => {
          set({ recentItems: [] });
        },
        
        removeRecentItem: (id) => {
          set((state) => ({
            recentItems: state.recentItems.filter(i => i.id !== id),
          }));
        },
        
        // 收藏管理
        addBookmark: (id) => {
          set((state) => ({
            bookmarks: [...new Set([...state.bookmarks, id])],
          }));
        },
        
        removeBookmark: (id) => {
          set((state) => ({
            bookmarks: state.bookmarks.filter(b => b !== id),
          }));
        },
        
        isBookmarked: (id) => {
          return get().bookmarks.includes(id);
        },
        
        // 统计管理
        incrementFeatureUsage: (feature) => {
          set((state) => ({
            statistics: {
              ...state.statistics,
              featuresUsed: {
                ...state.statistics.featuresUsed,
                [feature]: (state.statistics.featuresUsed[feature] || 0) + 1,
              },
            },
          }));
        },
        
        recordSession: (duration) => {
          set((state) => ({
            statistics: {
              ...state.statistics,
              totalTime: state.statistics.totalTime + duration,
            },
          }));
        },
        
        recordError: (error) => {
          set((state) => ({
            statistics: {
              ...state.statistics,
              errors: state.statistics.errors + 1,
            },
          }));
          
          console.error('App Error:', error);
        },
        
        recordCrash: (crash) => {
          set((state) => ({
            statistics: {
              ...state.statistics,
              crashes: state.statistics.crashes + 1,
            },
          }));
          
          console.error('App Crash:', crash);
        },
        
        // 网络状态管理
        updateNetworkState: (network) => {
          set((state) => ({
            network: { ...state.network, ...network },
          }));
        },
        
        setOnlineStatus: (isOnline) => {
          set((state) => ({
            network: { ...state.network, isOnline },
          }));
        },
        
        // 缓存管理
        updateCacheSize: (size) => {
          set((state) => ({
            cache: { ...state.cache, currentSize: size },
          }));
        },
        
        setCacheStrategy: (key, strategy) => {
          set((state) => ({
            cache: {
              ...state.cache,
              strategies: { ...state.cache.strategies, [key]: strategy },
            },
          }));
        },
        
        clearCache: () => {
          set((state) => ({
            cache: { ...state.cache, currentSize: 0 },
          }));
        },
        
        // 同步管理
        addPendingOperation: (operation) => {
          const id = generateId();
          const newOperation = {
            ...operation,
            id,
            timestamp: Date.now(),
          };
          
          set((state) => ({
            sync: {
              ...state.sync,
              pendingOperations: [...state.sync.pendingOperations, newOperation],
            },
          }));
        },
        
        removePendingOperation: (id) => {
          set((state) => ({
            sync: {
              ...state.sync,
              pendingOperations: state.sync.pendingOperations.filter(op => op.id !== id),
            },
          }));
        },
        
        addSyncConflict: (conflict) => {
          const newConflict = {
            ...conflict,
            timestamp: Date.now(),
          };
          
          set((state) => ({
            sync: {
              ...state.sync,
              conflicts: [...state.sync.conflicts, newConflict],
            },
          }));
        },
        
        resolveSyncConflict: (id, resolution) => {
          set((state) => ({
            sync: {
              ...state.sync,
              conflicts: state.sync.conflicts.filter(c => c.id !== id),
            },
          }));
          
          // 根据解决方案执行相应操作
          console.log(`Sync conflict ${id} resolved with ${resolution}`);
        },
        
        updateLastSync: () => {
          set((state) => ({
            sync: { ...state.sync, lastSync: Date.now() },
          }));
        },
        
        // 设置管理
        updateSettings: (settings) => {
          set((state) => ({
            settings: { ...state.settings, ...settings },
          }));
        },
        
        toggleSetting: (key) => {
          set((state) => ({
            settings: { ...state.settings, [key]: !state.settings[key] },
          }));
        },
        
        // 更新管理
        checkForUpdates: async () => {
          try {
            // 这里可以实现实际的更新检查逻辑
            const needsUpdate = false; // 示例
            
            set({
              needsUpdate,
              lastUpdateCheck: Date.now(),
            });
            
            return needsUpdate;
          } catch (error) {
            console.error('Update check failed:', error);
            return false;
          }
        },
        
        setNeedsUpdate: (needsUpdate) => {
          set({ needsUpdate });
        },
        
        // 工具方法
        exportData: () => {
          const state = get();
          return JSON.stringify({
            searchHistory: state.searchHistory,
            recentItems: state.recentItems,
            bookmarks: state.bookmarks,
            settings: state.settings,
            statistics: state.statistics,
          });
        },
        
        importData: (data) => {
          try {
            const parsed = JSON.parse(data);
            set((state) => ({
              ...state,
              ...parsed,
            }));
            return true;
          } catch (error) {
            console.error('Data import failed:', error);
            return false;
          }
        },
        
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          searchHistory: state.searchHistory,
          recentItems: state.recentItems,
          bookmarks: state.bookmarks,
          statistics: state.statistics,
          settings: state.settings,
          userLocation: state.userLocation,
          locationPermission: state.locationPermission,
        }),
        version: 1,
      }
    )
  )
);

// 选择器 Hooks
export const useAppConfig = () => useAppStore((state) => state.config);
export const useUserLocation = () => useAppStore((state) => state.userLocation);
export const useSearchHistory = () => useAppStore((state) => state.searchHistory);
export const useRecentItems = () => useAppStore((state) => state.recentItems);
export const useBookmarks = () => useAppStore((state) => state.bookmarks);
export const useAppStatistics = () => useAppStore((state) => state.statistics);
export const useNetworkState = () => useAppStore((state) => state.network);
export const useAppSettings = () => useAppStore((state) => state.settings);
export const useSyncState = () => useAppStore((state) => state.sync);

// 操作 Hooks
export const useAppActions = () => useAppStore((state) => ({
  initialize: state.initialize,
  updateConfig: state.updateConfig,
  setUserLocation: state.setUserLocation,
  requestLocation: state.requestLocation,
  addSearchHistory: state.addSearchHistory,
  addRecentItem: state.addRecentItem,
  addBookmark: state.addBookmark,
  removeBookmark: state.removeBookmark,
  isBookmarked: state.isBookmarked,
  incrementFeatureUsage: state.incrementFeatureUsage,
  updateSettings: state.updateSettings,
  toggleSetting: state.toggleSetting,
}));