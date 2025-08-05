import React from 'react';
import { measureWebVitals, performanceMonitor, getMemoryUsage } from '../../utils/performance';
import {
  getVitalColor,
  NetworkConnection,
  MemoryInfo,
  PerformanceMetrics,
  getNetworkConnection,
  analyzePerformanceMetrics,
  analyzeMemoryUsage,
  analyzeNetworkConditions
} from '../../utils/performanceUtils';

// 性能指标显示组件（仅开发环境）
export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({});
  const [webVitals, setWebVitals] = React.useState<Record<string, number>>({});
  const [memoryInfo, setMemoryInfo] = React.useState<MemoryInfo | null>(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // 收集Web Vitals
    measureWebVitals((metric) => {
      setWebVitals(prev => ({
        ...prev,
        [metric.name]: metric.value,
      }));
    });

    // 定期更新性能指标
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getAllMetrics());
      setMemoryInfo(getMemoryUsage());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <h3 className="font-bold mb-2">性能监控</h3>
      
      {/* Web Vitals */}
      <div className="mb-2">
        <h4 className="font-semibold text-yellow-300">Core Web Vitals:</h4>
        {Object.entries(webVitals).map(([name, value]) => (
          <div key={name} className="flex justify-between">
            <span>{name}:</span>
            <span className={getVitalColor(name, value)}>{value.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* 自定义指标 */}
      <div className="mb-2">
        <h4 className="font-semibold text-blue-300">App Metrics:</h4>
        {Object.entries(metrics).map(([name, data]) => (
          <div key={name} className="flex justify-between">
            <span>{name}:</span>
            <span>{data.latest?.toFixed(2)}ms</span>
          </div>
        ))}
      </div>

      {/* 内存使用 */}
      {memoryInfo && (
        <div className="mb-2">
          <h4 className="font-semibold text-green-300">Memory:</h4>
          <div className="flex justify-between">
            <span>Used:</span>
            <span>{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span>{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB</span>
          </div>
          <div className="flex justify-between">
            <span>Limit:</span>
            <span>{(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB</span>
          </div>
        </div>
      )}
    </div>
  );
};


// 性能警告组件
export const PerformanceWarning: React.FC<{
  threshold?: number;
  onWarning?: (message: string) => void;
}> = ({ threshold = 5000, onWarning }) => {
  const [warnings, setWarnings] = React.useState<string[]>([]);

  React.useEffect(() => {
    const checkPerformance = () => {
      const entries = performance.getEntriesByType('measure');
      entries.forEach((entry) => {
        if (entry.duration > threshold) {
          const message = `Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`;
          setWarnings(prev => [...prev.slice(-4), message]);
          onWarning?.(message);
        }
      });
    };

    const interval = setInterval(checkPerformance, 5000);
    return () => clearInterval(interval);
  }, [threshold, onWarning]);

  if (warnings.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm z-40">
      <h3 className="font-semibold text-yellow-800 mb-2">性能警告</h3>
      {warnings.map((warning, index) => (
        <div key={index} className="text-sm text-yellow-700 mb-1">
          {warning}
        </div>
      ))}
    </div>
  );
};



// 网络性能监控
export const NetworkMonitor: React.FC = () => {
  const [networkInfo, setNetworkInfo] = React.useState<NetworkConnection | null>(null);
  const [requests, setRequests] = React.useState<PerformanceResourceTiming[]>([]);

  React.useEffect(() => {
    // 监控网络连接信息
    const connection = getNetworkConnection();
    if (connection) {
      setNetworkInfo(connection);

      const handleConnectionChange = () => {
        setNetworkInfo(getNetworkConnection());
      };

      connection.addEventListener('change', handleConnectionChange);
      return () => connection.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  React.useEffect(() => {
    // 监控网络请求
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      setRequests(prev => [...prev.slice(-20), ...entries]);
    });

    observer.observe({ entryTypes: ['resource'] });
    return () => observer.disconnect();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <h3 className="font-bold mb-2">网络监控</h3>
      
      {networkInfo && (
        <div className="mb-2">
          <h4 className="font-semibold text-blue-300">Connection:</h4>
          <div className="flex justify-between">
            <span>Type:</span>
            <span>{networkInfo.effectiveType}</span>
          </div>
          <div className="flex justify-between">
            <span>Downlink:</span>
            <span>{networkInfo.downlink} Mbps</span>
          </div>
          <div className="flex justify-between">
            <span>RTT:</span>
            <span>{networkInfo.rtt}ms</span>
          </div>
          {networkInfo.saveData && (
            <div className="text-yellow-300">Data Saver: ON</div>
          )}
        </div>
      )}

      <div>
        <h4 className="font-semibold text-green-300">Recent Requests:</h4>
        {requests.slice(-5).map((request, index) => (
          <div key={index} className="text-xs">
            <div className="truncate">{request.name.split('/').pop()}</div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{request.duration.toFixed(2)}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 性能优化建议组件
export const PerformanceRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = React.useState<string[]>([]);

  React.useEffect(() => {
    const analyzePerformance = () => {
      const newRecommendations: string[] = [];
      
      // 分析内存使用
      const memory = getMemoryUsage();
      newRecommendations.push(...analyzeMemoryUsage(memory));

      // 分析网络连接
      newRecommendations.push(...analyzeNetworkConditions());

      // 分析性能指标
      const metrics = performanceMonitor.getAllMetrics();
      newRecommendations.push(...analyzePerformanceMetrics(metrics));

      setRecommendations(newRecommendations);
    };

    const interval = setInterval(analyzePerformance, 10000);
    return () => clearInterval(interval);
  }, []);

  if (recommendations.length === 0 || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm z-40">
      <h3 className="font-semibold text-blue-800 mb-2">性能建议</h3>
      {recommendations.map((recommendation, index) => (
        <div key={index} className="text-sm text-blue-700 mb-1">
          • {recommendation}
        </div>
      ))}
    </div>
  );
};