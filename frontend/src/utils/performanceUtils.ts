// Performance monitoring utility types and functions
import React from 'react';

// 网络连接信息类型
export interface NetworkConnection {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

// 内存信息类型
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// 性能指标数据类型
export interface PerformanceMetricData {
  latest?: number;
  average: number;
}

// 性能指标记录类型
export type PerformanceMetrics = Record<string, PerformanceMetricData>;

// Web Vitals颜色编码
export const getVitalColor = (name: string, value: number): string => {
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'text-white';

  if (value <= threshold.good) return 'text-green-400';
  if (value <= threshold.poor) return 'text-yellow-400';
  return 'text-red-400';
};

// 获取网络连接信息
export const getNetworkConnection = (): NetworkConnection | null => {
  if ('connection' in navigator) {
    return (navigator as unknown as { connection: NetworkConnection }).connection;
  }
  return null;
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

// 性能分析函数
export const analyzePerformanceMetrics = (metrics: PerformanceMetrics): string[] => {
  const recommendations: string[] = [];
  
  Object.entries(metrics).forEach(([name, data]) => {
    if (data.average > 1000) {
      recommendations.push(`${name} 平均执行时间较长 (${data.average.toFixed(2)}ms)`);
    }
  });

  return recommendations;
};

// 内存分析函数
export const analyzeMemoryUsage = (memory: MemoryInfo | null): string[] => {
  const recommendations: string[] = [];
  
  if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
    recommendations.push('内存使用接近限制，考虑优化内存管理');
  }

  return recommendations;
};

// 网络分析函数
export const analyzeNetworkConditions = (): string[] => {
  const recommendations: string[] = [];
  const connection = getNetworkConnection();
  
  if (connection) {
    if (connection.saveData) {
      recommendations.push('用户启用了数据节省模式，减少资源加载');
    }
    if (connection.effectiveType === '2g') {
      recommendations.push('网络连接较慢，启用更激进的优化策略');
    }
  }

  return recommendations;
};