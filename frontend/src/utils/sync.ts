import React from 'react';
import { apiClient } from './api';
import { offlineManager } from './storage';
import { queryClient } from './queryClient';

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// 同步操作类型
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

// 同步配置类型
export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  timeout: number;
  priorityOrder: Array<'high' | 'medium' | 'low'>;
}

// 同步结果类型
export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    operation: SyncOperation;
    error: string;
  }>;
}

// 同步事件类型
export type SyncEvent = 
  | { type: 'sync_start'; payload: { operationsCount: number } }
  | { type: 'sync_progress'; payload: { processed: number; total: number } }
  | { type: 'sync_complete'; payload: SyncResult }
  | { type: 'sync_error'; payload: { error: string } }
  | { type: 'operation_success'; payload: { operation: SyncOperation } }
  | { type: 'operation_error'; payload: { operation: SyncOperation; error: string } };

// 数据同步管理器
export class DataSyncManager {
  private config: SyncConfig;
  private status: SyncStatus = 'idle';
  private listeners: Array<(event: SyncEvent) => void> = [];
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private retryTimeouts: Map<string, number> = new Map();

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 5,
      timeout: 30000,
      priorityOrder: ['high', 'medium', 'low'],
      ...config,
    };

    this.setupNetworkListeners();
  }

  // 设置网络状态监听
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit({ type: 'sync_start', payload: { operationsCount: 0 } });
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // 添加事件监听器
  addEventListener(listener: (event: SyncEvent) => void): void {
    this.listeners.push(listener);
  }

  // 移除事件监听器
  removeEventListener(listener: (event: SyncEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 触发事件
  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Sync event listener error:', error);
      }
    });
  }

  // 添加同步操作
  addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries' | 'maxRetries'>): string {
    const id = this.generateId();
    const syncOperation: SyncOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.config.maxRetries,
    };

    offlineManager.addToSyncQueue(syncOperation);
    
    // 如果在线且空闲，立即尝试同步
    if (this.isOnline && this.status === 'idle') {
      this.sync();
    }

    return id;
  }

  // 主同步方法
  async sync(): Promise<SyncResult> {
    if (this.status === 'syncing' || !this.isOnline) {
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    this.status = 'syncing';
    const operations = this.getSortedOperations();
    
    if (operations.length === 0) {
      this.status = 'idle';
      return { success: true, processed: 0, failed: 0, errors: [] };
    }

    this.emit({ type: 'sync_start', payload: { operationsCount: operations.length } });

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // 批量处理操作
    for (let i = 0; i < operations.length; i += this.config.batchSize) {
      const batch = operations.slice(i, i + this.config.batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(operation => this.executeOperation(operation))
      );

      batchResults.forEach((batchResult, index) => {
        const operation = batch[index];
        
        if (batchResult.status === 'fulfilled' && batchResult.value.success) {
          result.processed++;
          offlineManager.removeFromSyncQueue(operation.id);
          this.emit({ type: 'operation_success', payload: { operation } });
        } else {
          result.failed++;
          const error = batchResult.status === 'rejected' 
            ? batchResult.reason 
            : batchResult.value.error;
          
          result.errors.push({ operation, error });
          this.emit({ type: 'operation_error', payload: { operation, error } });
          
          // 处理重试逻辑
          this.handleOperationFailure(operation, error);
        }

        this.emit({ 
          type: 'sync_progress', 
          payload: { processed: result.processed + result.failed, total: operations.length } 
        });
      });
    }

    this.status = result.failed === 0 ? 'success' : 'error';
    this.emit({ type: 'sync_complete', payload: result });

    // 如果有失败的操作，设置下次同步
    if (result.failed > 0) {
      this.scheduleNextSync();
    }

    return result;
  }

  // 执行单个操作
  private async executeOperation(operation: SyncOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      switch (operation.type) {
        case 'create':
          await apiClient.post(operation.endpoint, operation.data, {
            signal: controller.signal,
          });
          break;
        case 'update':
          await apiClient.put(operation.endpoint, operation.data, {
            signal: controller.signal,
          });
          break;
        case 'delete':
          await apiClient.delete(operation.endpoint, {
            signal: controller.signal,
          });
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      clearTimeout(timeoutId);

      // 更新相关查询缓存
      this.invalidateRelatedQueries(operation);

      return { success: true };
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // 处理操作失败
  private handleOperationFailure(operation: SyncOperation, error: string): void {
    operation.retries++;
    
    if (operation.retries < operation.maxRetries) {
      // 计算重试延迟（指数退避）
      const delay = this.config.retryDelay * Math.pow(2, operation.retries - 1);
      
      // 清除之前的重试定时器
      const existingTimeout = this.retryTimeouts.get(operation.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // 设置新的重试定时器
      const retryTimeout = window.setTimeout(() => {
        this.retryTimeouts.delete(operation.id);
        if (this.isOnline && this.status !== 'syncing') {
          this.sync();
        }
      }, delay);
      
      this.retryTimeouts.set(operation.id, retryTimeout);
    } else {
      // 达到最大重试次数，记录错误日志
      console.error(`Operation failed after ${operation.maxRetries} retries:`, {
        operation,
        error,
      });
    }
  }

  // 获取排序后的操作
  private getSortedOperations(): SyncOperation[] {
    const queueOperations = offlineManager.getSyncQueue();
    
    // 转换为完整的SyncOperation对象
    const operations: SyncOperation[] = queueOperations.map(op => ({
      ...op,
      retries: 0,
      maxRetries: this.config.maxRetries,
      priority: 'medium' as const
    }));
    
    return operations.sort((a, b) => {
      // 首先按优先级排序
      const priorityA = this.config.priorityOrder.indexOf(a.priority);
      const priorityB = this.config.priorityOrder.indexOf(b.priority);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 然后按时间戳排序（较早的优先）
      return a.timestamp - b.timestamp;
    });
  }

  // 使相关查询缓存失效
  private invalidateRelatedQueries(operation: SyncOperation): void {
    // 根据端点路径确定需要失效的查询
    const endpoint = operation.endpoint;
    
    if (endpoint.includes('/teachers')) {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    }
    
    if (endpoint.includes('/appointments')) {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
    
    if (endpoint.includes('/users')) {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
    
    if (endpoint.includes('/reviews')) {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    }
  }

  // 安排下次同步
  private scheduleNextSync(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
    }
    
    // 5分钟后重试
    this.syncInterval = window.setTimeout(() => {
      if (this.isOnline && this.status !== 'syncing') {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  // 生成唯一ID
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // 获取同步状态
  getStatus(): SyncStatus {
    return this.status;
  }

  // 获取待同步操作数量
  getPendingCount(): number {
    return offlineManager.getSyncQueue().length;
  }

  // 清除所有待同步操作
  clearPendingOperations(): void {
    offlineManager.clearSyncQueue();
    
    // 清除所有重试定时器
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 手动触发同步
  async forcSync(): Promise<SyncResult> {
    return this.sync();
  }

  // 启用自动同步
  startAutoSync(interval: number = 5 * 60 * 1000): void {
    this.stopAutoSync();
    
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && this.status !== 'syncing' && this.getPendingCount() > 0) {
        this.sync();
      }
    }, interval);
  }

  // 停止自动同步
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 销毁管理器
  destroy(): void {
    this.stopAutoSync();
    this.clearPendingOperations();
    this.listeners = [];
    
    window.removeEventListener('online', this.setupNetworkListeners);
    window.removeEventListener('offline', this.setupNetworkListeners);
  }
}

// 全局同步管理器实例
export const syncManager = new DataSyncManager();

// 同步状态 Hook (React)
export const useSyncStatus = () => {
  const [status, setStatus] = React.useState<SyncStatus>(syncManager.getStatus());
  const [pendingCount, setPendingCount] = React.useState(syncManager.getPendingCount());
  const [lastSyncResult, setLastSyncResult] = React.useState<SyncResult | null>(null);

  React.useEffect(() => {
    const handleSyncEvent = (event: SyncEvent) => {
      switch (event.type) {
        case 'sync_start':
          setStatus('syncing');
          break;
        case 'sync_complete':
          setStatus(event.payload.success ? 'success' : 'error');
          setLastSyncResult(event.payload);
          setPendingCount(syncManager.getPendingCount());
          break;
        case 'sync_error':
          setStatus('error');
          break;
      }
    };

    syncManager.addEventListener(handleSyncEvent);
    
    return () => {
      syncManager.removeEventListener(handleSyncEvent);
    };
  }, []);

  return {
    status,
    pendingCount,
    lastSyncResult,
    sync: () => syncManager.forcSync(),
    clearPending: () => syncManager.clearPendingOperations(),
  };
};

// 便捷的同步操作方法
export const syncOperations = {
  // 创建操作
  create: (endpoint: string, data: unknown, priority: SyncOperation['priority'] = 'medium') => {
    return syncManager.addOperation({ type: 'create', endpoint, data, priority });
  },
  
  // 更新操作  
  update: (endpoint: string, data: unknown, priority: SyncOperation['priority'] = 'medium') => {
    return syncManager.addOperation({ type: 'update', endpoint, data, priority });
  },
  
  // 删除操作
  delete: (endpoint: string, priority: SyncOperation['priority'] = 'medium') => {
    return syncManager.addOperation({ type: 'delete', endpoint, priority });
  },
};

// 离线数据持久化工具
export const offlineData = {
  // 保存页面数据到离线存储
  savePage: <T>(pageKey: string, data: T) => {
    offlineManager.storeOfflineData(pageKey, data);
  },
  
  // 从离线存储获取页面数据
  loadPage: <T>(pageKey: string): T | null => {
    return offlineManager.getOfflineItem<T>(pageKey);
  },
  
  // 保存表单数据
  saveForm: (formId: string, formData: Record<string, unknown>) => {
    offlineManager.storeOfflineData(`form_${formId}`, formData);
  },
  
  // 加载表单数据
  loadForm: (formId: string): Record<string, unknown> | null => {
    return offlineManager.getOfflineItem(`form_${formId}`);
  },
  
  // 清除表单数据
  clearForm: (formId: string) => {
    offlineManager.removeOfflineItem(`form_${formId}`);
  },
};

// 初始化同步系统
export const initializeSync = () => {
  // 启动自动同步
  syncManager.startAutoSync();
  
  // 如果在线且有待同步数据，立即同步
  if (navigator.onLine && syncManager.getPendingCount() > 0) {
    syncManager.sync();
  }
  
  console.log('🔄 Data sync system initialized');
};

// 开发工具
if (import.meta.env.DEV) {
  (window as Window & { syncManager?: unknown; syncOperations?: unknown; offlineData?: unknown }).syncManager = syncManager;
  (window as Window & { syncManager?: unknown; syncOperations?: unknown; offlineData?: unknown }).syncOperations = syncOperations;
  (window as Window & { syncManager?: unknown; syncOperations?: unknown; offlineData?: unknown }).offlineData = offlineData;
  
  console.log('🔄 Sync utilities available on window for debugging');
}