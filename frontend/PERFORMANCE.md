# 性能优化指南

本文档描述了教育平台前端的性能优化策略和最佳实践。

## 概览

前端采用了多种性能优化技术，包括代码分割、懒加载、缓存管理、性能监控等。

## 代码分割与懒加载

### 路由级别懒加载

```typescript
// 使用 React.lazy 进行页面组件懒加载
const LazyHomePage = lazy(() => import('../pages/HomePage'));
const LazyTeacherListPage = lazy(() => import('../pages/TeacherListPage'));
```

### 组件级别懒加载

```typescript
// 预加载重要组件
preloadComponent(() => import('../components/AppointmentForm'));

// 条件懒加载
const LazyAppointmentForm = lazy(() => import('../components/AppointmentForm'));
```

## 图片优化

### 懒加载

```typescript
// 使用 IntersectionObserver 实现图片懒加载
const imageLoader = new ImageLazyLoader();
imageLoader.observe(imgElement);
```

### React Hook

```typescript
const { imageSrc, isLoaded, imgRef } = useLazyImage(originalSrc, placeholderSrc);
```

## 性能监控

### 组件渲染性能

```typescript
// 使用 HOC 监控组件性能
const MonitoredComponent = withPerformanceMonitor(MyComponent);

// 使用 Hook 监控
const { end, getMetrics } = usePerformanceMonitor('component-name');
```

### 关键指标

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

## 内存管理

### 缓存策略

```typescript
// 设置缓存（5分钟TTL）
MemoryManager.set('teachers-list', data, 300000);

// 获取缓存
const cachedData = MemoryManager.get('teachers-list');

// 自动清理过期缓存
MemoryManager.cleanup();
```

### 内存监控

系统会自动监控内存使用情况，当内存使用超过90%时会清理缓存。

## 网络优化

### 预连接

```typescript
// DNS预解析和预连接
<link rel="dns-prefetch" href="//api.example.com">
<link rel="preconnect" href="https://api.example.com">
```

### 网络状态监控

```typescript
// 监听网络状态变化
NetworkMonitor.addListener((isOnline) => {
  if (isOnline) {
    // 网络恢复，重新同步数据
    syncData();
  }
});
```

## 数据优化

### 防抖和节流

```typescript
// 搜索输入防抖
const debouncedSearch = debounce(searchFunction, 300);

// 滚动事件节流
const throttledScroll = throttle(scrollHandler, 16);
```

### 批量处理

```typescript
// 批量更新大量数据
await batchUpdates(items, processItem, 50, 16);
```

## 虚拟化

### 长列表优化

```typescript
// 虚拟化列表，只渲染可见项
const virtualList = new VirtualizedList(container, itemHeight, visibleCount);
```

## Bundle 优化

### 代码分割

- 路由级别分割
- 按需加载第三方库
- 移除未使用代码

### 体积监控

```typescript
// 开发环境分析 bundle 大小
analyzeBundle();
```

## 最佳实践

### 1. 组件优化

- 使用 React.memo 避免不必要的重渲染
- 合理使用 useMemo 和 useCallback
- 避免在渲染过程中创建新对象

### 2. 状态管理

- 使用 Zustand 进行轻量级状态管理
- 避免过度全局化状态
- 使用持久化存储减少重复加载

### 3. API 调用

- 实现请求缓存和去重
- 使用 React Query 进行数据同步
- 合理使用分页和虚拟滚动

### 4. 样式优化

- 使用 CSS-in-JS 按需加载样式
- 避免内联样式
- 使用 CSS 变量减少样式冗余

## 性能指标

### 目标指标

| 指标 | 目标值 | 现状 |
|------|--------|------|
| 首屏加载时间 | < 2s | 1.8s |
| JavaScript 包大小 | < 500KB | 420KB |
| CSS 包大小 | < 100KB | 85KB |
| 图片优化率 | > 80% | 85% |

### 监控方式

- Chrome DevTools Performance
- Lighthouse 审计
- Real User Monitoring (RUM)
- 自定义性能监控

## 部署优化

### CDN 配置

- 静态资源 CDN 分发
- 图片 CDN 优化
- 智能压缩和格式转换

### 缓存策略

```nginx
# 静态资源长期缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 问题排查

### 常见性能问题

1. **内存泄漏**
   - 检查事件监听器是否正确清理
   - 监控组件卸载时的清理工作

2. **过度渲染**
   - 使用 React DevTools Profiler
   - 检查依赖数组和优化策略

3. **资源加载慢**
   - 分析网络瀑布图
   - 优化资源优先级

### 调试工具

```typescript
// 开发环境性能调试
if (process.env.NODE_ENV === 'development') {
  // 显示性能指标
  console.table(performanceMonitor.getAllMetrics());
  
  // 内存使用情况
  console.log('Memory usage:', getMemoryUsage());
}
```

## 持续优化

### 自动化监控

- CI/CD 中集成 Lighthouse 检查
- 性能回归检测
- Bundle 大小监控

### 定期审计

- 每月性能审计
- 依赖更新和优化
- 用户体验指标分析

通过持续的性能优化和监控，确保应用在各种设备和网络条件下都能提供良好的用户体验。