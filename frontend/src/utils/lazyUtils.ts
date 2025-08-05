// Lazy loading utility functions and types
import React from 'react';

// 智能预加载配置类型
export interface SmartPreloadConditions {
  userInteraction?: boolean;
  networkSpeed?: 'slow' | 'fast' | 'any';
  batteryLevel?: number;
  prefersReducedData?: boolean;
}

// 渐进式加载阶段配置类型
export interface ProgressiveLoadStage {
  component: React.LazyExoticComponent<React.ComponentType<unknown>>;
  fallback?: React.ComponentType;
  priority: number;
}

// 预加载函数类型
export type PreloadFunction = () => Promise<unknown>;

// 网络连接类型
export interface NetworkConnection {
  effectiveType: string;
  saveData: boolean;
}

// 电池信息类型
export interface BatteryInfo {
  level: number;
}

// 智能预加载Hook
export const useSmartPreload = (
  preloadFns: PreloadFunction[],
  conditions: SmartPreloadConditions = {}
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
        const connection = (navigator as unknown as { connection: NetworkConnection }).connection;
        if (conditions.networkSpeed === 'fast' && connection.effectiveType === '2g') {
          return false;
        }
        if (conditions.networkSpeed === 'slow' && connection.effectiveType === '4g') {
          return false;
        }
      }

      // 检查电池电量
      if (conditions.batteryLevel && 'getBattery' in navigator) {
        const nav = navigator as unknown as { getBattery: () => Promise<BatteryInfo> };
        nav.getBattery().then((battery: BatteryInfo) => {
          if (battery.level < (conditions.batteryLevel! / 100)) {
            return false;
          }
        });
      }

      // 检查数据节省偏好
      if (conditions.prefersReducedData && 'connection' in navigator) {
        const connection = (navigator as unknown as { connection: NetworkConnection }).connection;
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

// 渐进式加载Hook
export const useProgressiveLoader = (
  stages: ProgressiveLoadStage[],
  onStageLoad?: (stage: number) => void
) => {
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

  return { loadedStages, sortedStages };
};

// 性能监控Hook
export const usePerformanceMonitoring = (componentName: string) => {
  React.useEffect(() => {
    performance.mark(`${componentName}-mount-start`);
    
    return () => {
      performance.mark(`${componentName}-mount-end`);
      performance.measure(`${componentName}-mount`, `${componentName}-mount-start`, `${componentName}-mount-end`);
    };
  }, [componentName]);

  const measureOperation = React.useCallback((operationName: string) => {
    const fullName = `${componentName}-${operationName}`;
    
    return {
      start: () => performance.mark(`${fullName}-start`),
      end: () => {
        performance.mark(`${fullName}-end`);
        performance.measure(fullName, `${fullName}-start`, `${fullName}-end`);
      },
    };
  }, [componentName]);

  return { measureOperation };
};

// 渲染性能监控Hook
export const useRenderPerformance = (componentName: string) => {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}, time since last: ${timeSinceLastRender.toFixed(2)}ms`);
      
      // 警告频繁重渲染
      if (timeSinceLastRender < 16 && renderCount.current > 1) {
        console.warn(`${componentName} is re-rendering frequently (${timeSinceLastRender.toFixed(2)}ms since last render)`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
  };
};