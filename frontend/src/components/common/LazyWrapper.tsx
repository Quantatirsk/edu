import React, { Suspense } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { Loader2 } from 'lucide-react';

// 通用加载组件
export const PageLoader: React.FC<{ message?: string }> = ({ 
  message = '加载中...' 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// 组件级加载器
export const ComponentLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`animate-spin text-blue-600 ${sizeMap[size]}`} />
    </div>
  );
};

// 懒加载包装器
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo?: React.ErrorInfo, errorId?: string) => void;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback: Fallback = PageLoader,
  onError,
}) => {
  return (
    <ErrorBoundary onError={onError}>
      <Suspense fallback={<Fallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// 带超时的懒加载包装器
interface LazyWrapperWithTimeoutProps extends LazyWrapperProps {
  timeout?: number;
  timeoutFallback?: React.ComponentType;
}

export const LazyWrapperWithTimeout: React.FC<LazyWrapperWithTimeoutProps> = ({
  children,
  fallback: Fallback = PageLoader,
  timeout = 10000, // 10秒超时
  timeoutFallback: TimeoutFallback,
  ...props
}) => {
  const [isTimeout, setIsTimeout] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (isTimeout && TimeoutFallback) {
    return <TimeoutFallback />;
  }

  return (
    <LazyWrapper fallback={Fallback} {...props}>
      {children}
    </LazyWrapper>
  );
};

// 预加载触发器组件
interface PreloadTriggerProps {
  preloadFn: () => Promise<any>;
  children: React.ReactNode;
  triggerDistance?: number; // 触发预加载的距离（px）
}

export const PreloadTrigger: React.FC<PreloadTriggerProps> = ({
  preloadFn,
  children,
  triggerDistance = 200,
}) => {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [hasPreloaded, setHasPreloaded] = React.useState(false);

  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || hasPreloaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPreloaded) {
            preloadFn().catch(console.warn);
            setHasPreloaded(true);
          }
        });
      },
      {
        rootMargin: `${triggerDistance}px`,
      }
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [preloadFn, triggerDistance, hasPreloaded]);

  return (
    <div ref={triggerRef}>
      {children}
    </div>
  );
};

// 渐进式加载组件
interface ProgressiveLoaderProps {
  stages: Array<{
    component: React.LazyExoticComponent<any>;
    fallback?: React.ComponentType;
    priority: number;
  }>;
  onStageLoad?: (stage: number) => void;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  stages,
  onStageLoad,
}) => {
  const [loadedStages, setLoadedStages] = React.useState<number[]>([]);
  
  // 按优先级排序
  const sortedStages = React.useMemo(() => 
    stages
      .map((stage, index) => ({ ...stage, originalIndex: index }))
      .sort((a, b) => a.priority - b.priority),
    [stages]
  );

  React.useEffect(() => {
    // 逐步加载各阶段
    sortedStages.forEach((stage, index) => {
      setTimeout(() => {
        setLoadedStages(prev => [...prev, stage.originalIndex]);
        onStageLoad?.(stage.originalIndex);
      }, index * 100); // 每100ms加载一个阶段
    });
  }, [sortedStages, onStageLoad]);

  return (
    <>
      {stages.map((stage, index) => {
        const isLoaded = loadedStages.includes(index);
        const Component = stage.component;
        const Fallback = stage.fallback || ComponentLoader;

        return (
          <div key={index}>
            {isLoaded ? (
              <Suspense fallback={<Fallback />}>
                <Component />
              </Suspense>
            ) : (
              <Fallback />
            )}
          </div>
        );
      })}
    </>
  );
};

// 智能预加载Hook
export const useSmartPreload = (
  preloadFns: Array<() => Promise<any>>,
  conditions: {
    userInteraction?: boolean;
    networkSpeed?: 'slow' | 'fast' | 'any';
    batteryLevel?: number;
    prefersReducedData?: boolean;
  } = {}
) => {
  const [hasPreloaded, setHasPreloaded] = React.useState(false);
  
  React.useEffect(() => {
    if (hasPreloaded) return;

    const shouldPreload = () => {
      // 检查用户交互
      if (conditions.userInteraction && !document.hasFocus()) {
        return false;
      }

      // 检查网络速度
      if (conditions.networkSpeed && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        if (conditions.networkSpeed === 'fast' && connection.effectiveType === '2g') {
          return false;
        }
        if (conditions.networkSpeed === 'slow' && connection.effectiveType === '4g') {
          return false;
        }
      }

      // 检查电池电量
      if (conditions.batteryLevel && 'getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          if (battery.level < (conditions.batteryLevel! / 100)) {
            return false;
          }
        });
      }

      // 检查数据节省偏好
      if (conditions.prefersReducedData && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection.saveData) {
          return false;
        }
      }

      return true;
    };

    if (shouldPreload()) {
      // 在空闲时预加载
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          Promise.all(preloadFns.map(fn => fn().catch(console.warn)))
            .then(() => setHasPreloaded(true));
        });
      } else {
        setTimeout(() => {
          Promise.all(preloadFns.map(fn => fn().catch(console.warn)))
            .then(() => setHasPreloaded(true));
        }, 1000);
      }
    }
  }, [preloadFns, conditions, hasPreloaded]);

  return hasPreloaded;
};

// 分块加载组件
interface ChunkedLoaderProps<T> {
  items: T[];
  chunkSize: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMoreTrigger?: React.ComponentType<{ onLoadMore: () => void }>;
  className?: string;
}

export function ChunkedLoader<T>({
  items,
  chunkSize,
  renderItem,
  loadMoreTrigger: LoadMoreTrigger,
  className,
}: ChunkedLoaderProps<T>) {
  const [loadedChunks, setLoadedChunks] = React.useState(1);
  
  const visibleItems = items.slice(0, loadedChunks * chunkSize);
  const hasMore = visibleItems.length < items.length;

  const loadMore = React.useCallback(() => {
    setLoadedChunks(prev => prev + 1);
  }, []);

  React.useEffect(() => {
    // 自动加载更多（可选）
    if (hasMore && !LoadMoreTrigger) {
      const timer = setTimeout(loadMore, 100);
      return () => clearTimeout(timer);
    }
  }, [hasMore, LoadMoreTrigger, loadMore]);

  return (
    <div className={className}>
      {visibleItems.map(renderItem)}
      {hasMore && LoadMoreTrigger && (
        <LoadMoreTrigger onLoadMore={loadMore} />
      )}
    </div>
  );
}