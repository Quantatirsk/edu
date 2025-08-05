# 前端架构文档

本文档描述了教育平台前端的整体架构设计和技术选型。

## 技术栈

### 核心框架
- **React 18**: 用户界面库，支持并发特性
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 快速的构建工具和开发服务器

### 状态管理
- **Zustand**: 轻量级状态管理库
- **React Query**: 服务器状态管理和缓存
- **Persist 中间件**: 状态持久化

### UI 框架
- **shadcn/ui**: 基于 Radix UI 的组件库
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Lucide React**: 图标库

### 路由和导航
- **React Router 6**: 声明式路由
- **动态导入**: 代码分割和懒加载

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用组件
│   │   ├── ui/            # 基础 UI 组件
│   │   ├── layout/        # 布局组件
│   │   ├── auth/          # 认证相关组件
│   │   └── ...            # 业务组件
│   ├── pages/             # 页面组件
│   ├── stores/            # Zustand 状态管理
│   ├── services/          # API 服务层
│   ├── hooks/             # 自定义 Hooks
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript 类型定义
│   ├── router/            # 路由配置
│   └── data/              # 模拟数据
├── tests/                 # 测试文件
└── docs/                  # 文档
```

## 架构原则

### 1. 分层架构

```
┌─────────────────┐
│   Presentation  │  <- Pages & Components
├─────────────────┤
│   Application   │  <- Hooks & Services  
├─────────────────┤
│   Domain        │  <- Stores & Types
├─────────────────┤
│   Infrastructure│  <- API & Utils
└─────────────────┘
```

### 2. 关注点分离

- **组件**: 只关注 UI 渲染和用户交互
- **Hooks**: 封装业务逻辑和状态管理
- **Services**: 处理 API 调用和数据转换
- **Stores**: 管理全局状态

### 3. 依赖注入

通过 Context 和 Hooks 实现依赖注入，提高可测试性。

## 状态管理

### Zustand 状态架构

```typescript
// 状态分片
├── authStore          # 用户认证状态
├── appointmentStore   # 预约管理状态
├── teacherStore      # 教师信息状态
├── uiStore           # UI 状态（通知、加载等）
└── ...
```

### 状态设计原则

1. **最小化状态**: 只存储必要的状态
2. **单一数据源**: 每个数据只有一个来源
3. **不可变更新**: 使用不可变的方式更新状态
4. **状态分片**: 按功能模块分离状态

## 组件设计

### 组件分类

#### 1. 基础组件 (ui/)
- Button, Input, Card 等
- 无业务逻辑，高度可复用
- 基于 shadcn/ui 和 Radix UI

#### 2. 业务组件
- AppointmentForm, TeacherCard 等
- 包含特定业务逻辑
- 可配置和扩展

#### 3. 页面组件 (pages/)
- 完整的页面视图
- 组合多个组件
- 处理路由和数据获取

#### 4. 布局组件 (layout/)
- Header, Sidebar, Footer
- 定义页面结构

### 组件设计原则

```typescript
// 1. Props 接口明确
interface ComponentProps {
  data: Data;
  onAction: (item: Data) => void;
  className?: string;
}

// 2. 职责单一
const Component: React.FC<ComponentProps> = ({ data, onAction }) => {
  // 只处理 UI 渲染，不包含复杂业务逻辑
  return <div>{/* JSX */}</div>;
};

// 3. 可测试性
export default Component;
```

## 数据流

### 1. 服务器状态流

```
API Call -> Service Layer -> React Query Cache -> Component
```

### 2. 客户端状态流

```
User Action -> Event Handler -> Zustand Store -> Component
```

### 3. 混合状态流

```
User Action -> Service Call -> Update Cache -> Update Store -> Re-render
```

## API 集成

### 服务层设计

```typescript
// services/teacherService.ts
export const TeacherService = {
  async getTeachers(params: TeacherQuery): Promise<TeacherResponse> {
    // API 调用逻辑
  },
  
  async getTeacher(id: string): Promise<Teacher> {
    // 单个教师获取
  }
};
```

### 错误处理

```typescript
// 统一错误处理
const handleApiError = (error: ApiError) => {
  // 记录错误
  console.error('API Error:', error);
  
  // 显示用户友好的错误信息
  showNotification('操作失败，请稍后重试');
  
  // 根据错误类型进行不同处理
  switch (error.code) {
    case 401:
      // 重定向到登录页
      break;
    case 403:
      // 显示权限不足
      break;
    default:
      // 通用错误处理
  }
};
```

## 路由设计

### 路由结构

```
/                    # 首页
/teachers           # 教师列表
/teachers/:id       # 教师详情
/teachers/:id/reviews # 教师评价
/appointments       # 预约管理
/analytics          # 学习分析
/notifications      # 通知中心
/schedule           # 时间表管理（教师）
```

### 路由守卫

```typescript
// 权限保护
<ProtectedRoute allowedRoles={['teacher']}>
  <TeacherSchedule />
</ProtectedRoute>

// 认证保护
<ProtectedRoute>
  <AppointmentsPage />
</ProtectedRoute>
```

## 性能优化

### 1. 代码分割

```typescript
// 路由级别懒加载
const LazyTeacherDetailPage = lazy(() => import('../pages/TeacherDetailPage'));

// 组件级别懒加载
const LazyAppointmentForm = lazy(() => import('../components/AppointmentForm'));
```

### 2. 缓存策略

- React Query 缓存服务器状态
- Zustand Persist 缓存客户端状态
- 内存缓存优化重复计算

### 3. 渲染优化

```typescript
// 使用 memo 避免不必要的重渲染
const MemoizedComponent = React.memo(Component);

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);

// 使用 useCallback 缓存函数引用
const handleClick = useCallback(() => {
  // 处理点击
}, [dependencies]);
```

## 测试策略

### 测试金字塔

```
  E2E Tests (少量)
    ↑
Integration Tests (适量)
    ↑
Unit Tests (大量)
```

### 测试类型

1. **单元测试**: 组件、Hooks、工具函数
2. **集成测试**: API 集成、用户流程
3. **E2E 测试**: 关键业务流程

### 测试工具

- **Jest**: 测试运行器
- **React Testing Library**: 组件测试
- **MSW**: API 模拟
- **Playwright**: E2E 测试

## 国际化

### 设计考虑

- 组件支持多语言
- 日期、时间格式化
- 数字和货币格式
- RTL 布局支持

## 可访问性

### 无障碍设计

- 语义化 HTML
- ARIA 属性支持
- 键盘导航
- 屏幕阅读器支持
- 颜色对比度

## 安全考虑

### 前端安全

- XSS 防护
- CSRF 保护
- 敏感信息处理
- 内容安全策略

### 认证和授权

```typescript
// JWT Token 管理
const authStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  
  login: async (credentials) => {
    const { token, user } = await AuthService.login(credentials);
    set({ token, user });
  },
  
  logout: () => {
    set({ token: null, user: null });
  }
}));
```

## 开发工作流

### 1. 功能开发流程

```
需求分析 -> 接口设计 -> 组件设计 -> 实现 -> 测试 -> 代码审查 -> 合并
```

### 2. 代码规范

- ESLint + Prettier 代码格式化
- TypeScript 严格模式
- Git commit 规范
- 代码审查要求

### 3. CI/CD 流程

```
代码提交 -> 自动测试 -> 构建 -> 部署 -> 监控
```

## 监控和分析

### 性能监控

- 页面加载时间
- 组件渲染性能
- 内存使用情况
- 网络请求监控

### 错误监控

- JavaScript 错误捕获
- 用户行为追踪
- API 错误统计

### 用户分析

- 页面访问统计
- 用户行为分析
- 转化率追踪

## 部署和运维

### 构建优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    }
  }
});
```

### 环境配置

- 开发环境（Development）
- 测试环境（Staging）  
- 生产环境（Production）

### 部署策略

- 静态文件 CDN 分发
- 增量更新
- 回滚机制
- 健康检查

## 未来规划

### 技术升级

- React 18+ 新特性采用
- 微前端架构考虑
- PWA 支持
- 服务端渲染 (SSR)

### 功能扩展

- 实时通信功能
- 离线支持
- 移动端适配
- 桌面端应用

通过这个架构设计，我们构建了一个可扩展、可维护、高性能的现代化前端应用。