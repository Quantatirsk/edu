import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { vi, expect } from 'vitest';

// 测试用的QueryClient配置
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

// 所有Provider的包装器
interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
}) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// 自定义render函数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, initialEntries, ...rtlOptions } = options;
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient} initialEntries={initialEntries}>
      {children}
    </AllTheProviders>
  );

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...rtlOptions }),
  };
};

// 创建mock函数的工具
export const createMockFunction = (implementation?: any) => {
  return vi.fn(implementation);
};

// 等待异步操作完成
export const waitForAsync = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Mock API响应
export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Mock API错误
export const mockApiError = (message = 'API Error', status = 500) => {
  const error = new Error(message) as any;
  error.response = {
    status,
    data: { message },
  };
  return Promise.reject(error);
};

// 测试数据工厂
export const createTestUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student' as const,
  avatar: null,
  verified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createTestTeacher = (overrides = {}) => ({
  id: '1',
  userId: '1',
  user: createTestUser({ role: 'teacher' }),
  subjects: ['math', 'physics'],
  experience: 5,
  education: 'bachelor',
  university: 'Test University',
  major: 'Mathematics',
  description: 'Test description',
  hourlyRate: 100,
  rating: 4.5,
  reviewCount: 10,
  isVerified: true,
  isAvailable: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createTestAppointment = (overrides = {}) => ({
  id: '1',
  teacherId: '1',
  studentId: '2',
  teacher: createTestTeacher(),
  student: createTestUser(),
  subject: 'math',
  date: '2024-12-25',
  startTime: '10:00',
  endTime: '11:00',
  type: 'regular' as const,
  status: 'confirmed' as const,
  location: {
    type: 'online' as const,
    platform: 'zoom',
    meetingId: '123456789',
  },
  price: 100,
  notes: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Mock Zustand stores
export const createMockAuthStore = (initialState = {}) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  ...initialState,
});

export const createMockUIStore = (initialState = {}) => ({
  theme: 'light' as const,
  sidebarOpen: false,
  loading: false,
  setTheme: vi.fn(),
  toggleSidebar: vi.fn(),
  setLoading: vi.fn(),
  ...initialState,
});

// 测试中的延迟函数
export const delay = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

// 等待元素出现
export const waitForElement = async (
  getElement: () => HTMLElement | null,
  timeout = 1000
) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = getElement();
    if (element) return element;
    await delay(50);
  }
  throw new Error('Element not found within timeout');
};

// 模拟文件对象
export const createMockFile = (
  name = 'test.txt',
  size = 1024,
  type = 'text/plain'
) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// 模拟FormData
export const createMockFormData = (data: Record<string, any> = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

// 断言助手
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

export const expectToHaveTextContent = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

// 导出所有工具
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };
export { vi } from 'vitest';