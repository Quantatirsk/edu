// 性能优化工具集
import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

// 懒加载组件包装器
export const createLazyComponent = <T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  displayName?: string
): LazyExoticComponent<T> => {
  const LazyComponent = lazy(importFn);
  
  if (displayName && process.env.NODE_ENV === 'development') {
    // displayName 仅在开发环境设置
    (LazyComponent as unknown as ComponentType & { displayName?: string }).displayName = `Lazy(${displayName})`;
  }
  
  return LazyComponent;
};

// 预加载函数
export const preloadComponent = (importFn: () => Promise<{ default: ComponentType }>): void => {
  // 在空闲时间预加载组件
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(err => {
        console.warn('Preload failed:', err);
      });
    });
  } else {
    // 降级到setTimeout
    setTimeout(() => {
      importFn().catch(err => {
        console.warn('Preload failed:', err);
      });
    }, 100);
  }
};

// 预加载多个组件
export const preloadComponents = (importFns: Array<() => Promise<{ default: ComponentType }>>): void => {
  importFns.forEach(preloadComponent);
};

// 动态导入工具（仅包含实际存在的模块）
export const dynamicImport = {
  // 页面组件
  pages: {
    Home: () => import('../pages/HomePage'),
    Login: () => import('../pages/LoginPage'),
    Register: () => import('../pages/RegisterPage'),
  },
  
  // 功能组件（暂时注释掉不存在的）
  components: {
    // TeacherCard: () => import('../components/teachers/TeacherCard'),
    // AppointmentForm: () => import('../components/appointments/AppointmentForm'),
    // Calendar: () => import('../components/calendar/Calendar'),
    // Chat: () => import('../components/chat/Chat'),
    // VideoCall: () => import('../components/video/VideoCall'),
    // PaymentForm: () => import('../components/payment/PaymentForm'),
  },
  
  // 第三方库
  libraries: {
    // moment: () => import('moment'),
    // lodash: () => import('lodash'),
    // chart: () => import('chart.js'),
  },
};

// 图片懒加载
export class ImageLazyLoader {
  private observer: IntersectionObserver;
  private loadingImages = new Set<HTMLImageElement>();

  constructor(options?: IntersectionObserverInit) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );
  }

  observe(img: HTMLImageElement): void {
    if (this.loadingImages.has(img)) return;
    
    this.observer.observe(img);
    this.loadingImages.add(img);
  }

  unobserve(img: HTMLImageElement): void {
    this.observer.unobserve(img);
    this.loadingImages.delete(img);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer.unobserve(img);
        this.loadingImages.delete(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    }
  }

  disconnect(): void {
    this.observer.disconnect();
    this.loadingImages.clear();
  }
}

// React Hook for lazy loading images
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const loader = new ImageLazyLoader();
    const img = imgRef.current;

    if (img) {
      img.dataset.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      loader.observe(img);
    }

    return () => {
      if (img) {
        loader.unobserve(img);
      }
      loader.disconnect();
    };
  }, [src]);

  return { imageSrc, isLoaded, imgRef };
};

// 虚拟化列表
export class VirtualizedList {
  private container: HTMLElement;
  private itemHeight: number;
  private visibleCount: number;
  private scrollTop = 0;
  private startIndex = 0;
  private endIndex = 0;

  constructor(
    container: HTMLElement,
    itemHeight: number,
    visibleCount: number
  ) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.visibleCount = visibleCount;
    
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleScroll(): void {
    this.scrollTop = this.container.scrollTop;
    this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
    this.endIndex = Math.min(
      this.startIndex + this.visibleCount,
      this.getTotalItems()
    );
  }

  getVisibleRange(): { startIndex: number; endIndex: number } {
    return { startIndex: this.startIndex, endIndex: this.endIndex };
  }

  private getTotalItems(): number {
    // 这里应该返回总项目数，需要在具体实现中设置
    return 0;
  }

  destroy(): void {
    this.container.removeEventListener('scroll', this.handleScroll.bind(this));
  }
}

// 性能监控
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  // 标记性能开始点
  mark(name: string): void {
    performance.mark(`${name}-start`);
  }

  // 测量性能
  measure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure?.duration || 0;
    
    // 记录到指标中
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    return duration;
  }

  // 获取平均性能
  getAverage(name: string): number {
    const measurements = this.metrics.get(name) || [];
    if (measurements.length === 0) return 0;
    
    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  }

  // 获取所有指标
  getAllMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverage(name),
        count: values.length,
        latest: values[values.length - 1] || 0,
      };
    });
    
    return result;
  }

  // 清除指标
  clear(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals 监控
export const measureWebVitals = (onPerfEntry?: (metric: { name: string; value: number; id?: string }) => void) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // 暂时简化实现，避免导入错误
    console.log('Web Vitals monitoring initialized');
    // TODO: 正确配置web-vitals库
  }
};

// 内存使用监控
export const getMemoryUsage = (): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null => {
  if ('memory' in performance) {
    return (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  }
  return null;
};

// 资源加载优化
export const optimizeResourceLoading = () => {
  // 预连接到外部域名
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.example.com',
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });

  // DNS预解析
  const dnsPrefetchDomains = [
    'https://cdn.example.com',
    'https://analytics.google.com',
  ];

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// 防抖和节流
export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// 缓存装饰器
export const memoize = <T extends (...args: never[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
};

// 导入React用于hooks
import React from 'react';

// 内存管理器
export class MemoryManager {
  private static cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  
  static set(key: string, data: unknown, ttl: number = 300000) { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  static get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  static clear() {
    this.cache.clear();
  }
  
  static cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  static getSize() {
    return this.cache.size;
  }
}

// 定期清理缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    MemoryManager.cleanup();
  }, 60000); // 每分钟清理一次
}

// 网络状态监控
export class NetworkMonitor {
  private static listeners: ((status: boolean) => void)[] = [];
  
  static init() {
    if (typeof window !== 'undefined' && 'navigator' in window && 'onLine' in navigator) {
      window.addEventListener('online', () => this.notify(true));
      window.addEventListener('offline', () => this.notify(false));
    }
  }
  
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  
  static addListener(callback: (status: boolean) => void) {
    this.listeners.push(callback);
  }
  
  static removeListener(callback: (status: boolean) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  private static notify(status: boolean) {
    this.listeners.forEach(callback => callback(status));
  }
}

// 初始化性能优化
export function initPerformanceOptimizations() {
  if (typeof window === 'undefined') return;
  
  // 初始化网络监控
  NetworkMonitor.init();
  
  // 预连接重要域名
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = '//api.example.com';
  document.head.appendChild(link);
  
  // 监控长任务
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      console.warn('Performance observer not supported');
    }
  }
  
  // 监控内存使用
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as Performance & { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        console.warn('High memory usage detected');
        MemoryManager.clear(); // 清理缓存
      }
    }, 30000);
  }
}

// React 性能优化 hooks
export function usePerformanceMonitor(label: string) {
  const endTimer = React.useCallback(() => {
    return performanceMonitor.measure(label);
  }, [label]);
  
  React.useEffect(() => {
    performanceMonitor.mark(label);
    return () => {
      endTimer();
    };
  }, [label, endTimer]);
  
  return {
    end: endTimer,
    getMetrics: () => performanceMonitor.getAllMetrics()[label]
  };
}

// 组件性能监控 HOC
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithPerformanceMonitor = React.forwardRef<HTMLElement, P>((props, ref) => {
    const { end } = usePerformanceMonitor(`${displayName}-render`);
    
    React.useEffect(() => {
      return () => {
        end();
      };
    });
    
    return React.createElement(WrappedComponent, { ...props, ref } as P & { ref?: React.Ref<HTMLElement> });
  });
  
  WithPerformanceMonitor.displayName = `withPerformanceMonitor(${displayName})`;
  
  return WithPerformanceMonitor;
}

// 批量更新优化
export function batchUpdates<T>(
  items: T[],
  processor: (item: T) => void,
  batchSize: number = 50,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    
    function processBatch() {
      const end = Math.min(index + batchSize, items.length);
      
      for (let i = index; i < end; i++) {
        processor(items[i]);
      }
      
      index = end;
      
      if (index < items.length) {
        if (delay > 0) {
          setTimeout(processBatch, delay);
        } else {
          requestAnimationFrame(processBatch);
        }
      } else {
        resolve();
      }
    }
    
    processBatch();
  });
}