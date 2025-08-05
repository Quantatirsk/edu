// 本地存储工具类
export class StorageManager {
  private static instance: StorageManager;
  private storage: Storage;
  private storageType: 'localStorage' | 'sessionStorage';

  constructor(storageType: 'localStorage' | 'sessionStorage' = 'localStorage') {
    this.storageType = storageType;
    this.storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
  }

  static getInstance(storageType?: 'localStorage' | 'sessionStorage'): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager(storageType);
    }
    return StorageManager.instance;
  }

  // 设置数据
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null,
      };
      this.storage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  // 获取数据
  get<T>(key: string): T | null {
    try {
      const itemStr = this.storage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // 检查是否过期
      if (item.ttl && Date.now() > item.ttl) {
        this.remove(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  // 移除数据
  remove(key: string): boolean {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  // 清空所有数据
  clear(): boolean {
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // 检查键是否存在
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // 获取所有键
  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }

  // 获取存储大小
  size(): number {
    return this.storage.length;
  }

  // 获取存储使用量（字节）
  getUsage(): number {
    let total = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        const value = this.storage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  }

  // 批量设置
  setMultiple<T>(items: Record<string, T>, ttl?: number): boolean {
    try {
      for (const [key, value] of Object.entries(items)) {
        this.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      return false;
    }
  }

  // 批量获取
  getMultiple<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    return result;
  }

  // 批量移除
  removeMultiple(keys: string[]): boolean {
    try {
      for (const key of keys) {
        this.remove(key);
      }
      return true;
    } catch (error) {
      console.error('Storage removeMultiple error:', error);
      return false;
    }
  }

  // 清理过期数据
  cleanup(): number {
    let cleaned = 0;
    const keys = this.keys();
    
    for (const key of keys) {
      try {
        const itemStr = this.storage.getItem(key);
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (item.ttl && Date.now() > item.ttl) {
            this.remove(key);
            cleaned++;
          }
        }
      } catch {
        // 如果解析失败，也清理掉
        this.remove(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  // 导出数据
  export(): string {
    const data: Record<string, unknown> = {};
    const keys = this.keys();
    
    for (const key of keys) {
      data[key] = this.get(key);
    }
    
    return JSON.stringify({
      type: this.storageType,
      timestamp: Date.now(),
      data,
    });
  }

  // 导入数据
  import(jsonData: string, overwrite: boolean = false): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!overwrite) {
        // 只导入不存在的键
        for (const [key, value] of Object.entries(parsed.data)) {
          if (!this.has(key)) {
            this.set(key, value);
          }
        }
      } else {
        // 覆盖导入
        for (const [key, value] of Object.entries(parsed.data)) {
          this.set(key, value);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Storage import error:', error);
      return false;
    }
  }
}

// 缓存管理器
export class CacheManager {
  private prefix: string;
  private storage: StorageManager;
  private defaultTTL: number;

  constructor(prefix: string = 'cache_', ttl: number = 5 * 60 * 1000) {
    this.prefix = prefix;
    this.storage = StorageManager.getInstance();
    this.defaultTTL = ttl;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // 设置缓存
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.storage.set(this.getKey(key), value, ttl || this.defaultTTL);
  }

  // 获取缓存
  get<T>(key: string): T | null {
    return this.storage.get<T>(this.getKey(key));
  }

  // 移除缓存
  remove(key: string): boolean {
    return this.storage.remove(this.getKey(key));
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    return this.storage.has(this.getKey(key));
  }

  // 获取或设置缓存
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  // 清理所有缓存
  clear(): boolean {
    const keys = this.storage.keys();
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
    return this.storage.removeMultiple(cacheKeys);
  }

  // 清理过期缓存
  cleanup(): number {
    return this.storage.cleanup();
  }

  // 获取缓存统计
  getStats(): {
    total: number;
    size: number;
    usage: number;
  } {
    const keys = this.storage.keys();
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
    
    let usage = 0;
    for (const key of cacheKeys) {
      const storageManager = this.storage as unknown as { storage?: Storage };
      const value = storageManager.storage?.getItem(key);
      if (value) {
        usage += key.length + value.length;
      }
    }

    return {
      total: cacheKeys.length,
      size: this.storage.size(),
      usage,
    };
  }
}

// 离线数据管理器
export class OfflineManager {
  private storage: StorageManager;
  private syncQueue: string = 'offline_sync_queue';
  private offlineData: string = 'offline_data';

  constructor() {
    this.storage = StorageManager.getInstance();
  }

  // 添加到同步队列
  addToSyncQueue(operation: {
    id: string;
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data?: unknown;
    timestamp: number;
  }): boolean {
    const queue = this.getSyncQueue();
    queue.push(operation);
    return this.storage.set(this.syncQueue, queue);
  }

  // 获取同步队列
  getSyncQueue(): Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data?: unknown;
    timestamp: number;
  }> {
    return this.storage.get(this.syncQueue) || [];
  }

  // 清空同步队列
  clearSyncQueue(): boolean {
    return this.storage.remove(this.syncQueue);
  }

  // 移除队列中的项目
  removeFromSyncQueue(id: string): boolean {
    const queue = this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    return this.storage.set(this.syncQueue, filtered);
  }

  // 存储离线数据
  storeOfflineData<T>(key: string, data: T): boolean {
    const offlineData = this.getOfflineData();
    offlineData[key] = {
      data,
      timestamp: Date.now(),
    };
    return this.storage.set(this.offlineData, offlineData);
  }

  // 获取离线数据
  getOfflineData(): Record<string, { data: unknown; timestamp: number }> {
    return this.storage.get(this.offlineData) || {};
  }

  // 获取特定离线数据
  getOfflineItem<T>(key: string): T | null {
    const offlineData = this.getOfflineData();
    const item = offlineData[key]?.data;
    return (item as T) || null;
  }

  // 移除离线数据
  removeOfflineItem(key: string): boolean {
    const offlineData = this.getOfflineData();
    delete offlineData[key];
    return this.storage.set(this.offlineData, offlineData);
  }

  // 清空离线数据
  clearOfflineData(): boolean {
    return this.storage.remove(this.offlineData);
  }

  // 检查是否有待同步数据
  hasPendingSync(): boolean {
    return this.getSyncQueue().length > 0;
  }

  // 获取同步统计
  getSyncStats(): {
    pendingOperations: number;
    oldestPending?: number;
    offlineDataCount: number;
  } {
    const queue = this.getSyncQueue();
    const offlineData = this.getOfflineData();
    
    return {
      pendingOperations: queue.length,
      oldestPending: queue.length > 0 ? Math.min(...queue.map(item => item.timestamp)) : undefined,
      offlineDataCount: Object.keys(offlineData).length,
    };
  }
}

// 默认实例
export const storage = StorageManager.getInstance();
export const sessionStorage = StorageManager.getInstance('sessionStorage');
export const cache = new CacheManager();
export const offlineManager = new OfflineManager();

// 清理任务
export const startCleanupTask = (interval: number = 60 * 60 * 1000) => {
  const cleanup = () => {
    const cleaned = storage.cleanup();
    const cacheStats = cache.getStats();
    
    console.log(`Storage cleanup: ${cleaned} expired items removed`);
    console.log(`Cache stats:`, cacheStats);
  };

  // 立即执行一次
  cleanup();
  
  // 定期执行
  return setInterval(cleanup, interval);
};

// 存储监听器
export const addStorageListener = (callback: (event: StorageEvent) => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

// 开发工具
if (import.meta.env.DEV) {
  (window as Window & { storage?: Record<string, unknown> }).storage = {
    manager: storage,
    session: sessionStorage,
    cache,
    offline: offlineManager,
    cleanup: () => {
      storage.cleanup();
      cache.cleanup();
    },
    stats: () => ({
      storage: {
        usage: storage.getUsage(),
        size: storage.size(),
      },
      cache: cache.getStats(),
      offline: offlineManager.getSyncStats(),
    }),
  };
  
  console.log('💾 Storage utilities available on window.storage for debugging');
}