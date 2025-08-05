import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// 错误边界状态类型
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// 错误边界属性类型
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态以便下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.group('🚨 React Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // 更新状态以包含错误详情
    this.setState({
      error,
      errorInfo,
    });

    // 调用父组件的错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 发送错误报告到监控服务
    this.reportErrorToService(error, errorInfo);
  }

  // 发送错误报告到监控服务
  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry、Bugsnag 等
    if (import.meta.env.PROD) {
      try {
        // 示例: 发送到错误监控服务
        // errorMonitoringService.captureException(error, { extra: errorInfo });
        console.log('Error reported:', error.message, errorInfo.componentStack);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  };

  // 重置错误状态
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  // 刷新页面
  private handleRefresh = () => {
    window.location.reload();
  };

  // 返回首页
  private handleGoHome = () => {
    window.location.href = '/';
  };

  // 获取错误详情文本
  private getErrorDetails = (): string => {
    const { error, errorInfo } = this.state;
    
    if (!error || !errorInfo) return '';
    
    return `
错误信息: ${error.message}
错误堆栈: ${error.stack || 'N/A'}
组件堆栈: ${errorInfo.componentStack}
    `.trim();
  };

  // 复制错误详情到剪贴板
  private handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(this.getErrorDetails());
      alert('错误详情已复制到剪贴板');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定义降级 UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              {/* 错误图标 */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* 错误标题 */}
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                页面出现错误
              </h1>

              {/* 错误描述 */}
              <p className="text-gray-600 mb-6">
                很抱歉，页面遇到了一个意外错误。我们已经记录了这个问题，请尝试以下操作：
              </p>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </button>

                <button
                  onClick={this.handleRefresh}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  刷新页面
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  返回首页
                </button>
              </div>

              {/* 开发环境下显示错误详情 */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-6 text-left">
                  <details className="bg-gray-100 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                      错误详情 (开发模式)
                    </summary>
                    <div className="text-xs font-mono text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border max-h-40 overflow-y-auto">
                      {this.getErrorDetails()}
                    </div>
                    <button
                      onClick={this.handleCopyError}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      复制错误详情
                    </button>
                  </details>
                </div>
              )}

              {/* 帮助信息 */}
              <div className="mt-6 text-xs text-gray-500">
                如果问题持续存在，请联系技术支持
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;

