import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle分析器（仅在构建时启用）
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  // 构建优化
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动代码分块
        manualChunks: {
          // React核心库
          'react-vendor': ['react', 'react-dom'],
          
          // 路由相关
          'router': ['react-router-dom'],
          
          // UI库和图标
          'ui-vendor': ['lucide-react'],
          
          // 状态管理
          'state-vendor': ['zustand'],
          
          // 网络请求和数据获取
          'data-vendor': ['axios', '@tanstack/react-query'],
          
          // 工具库
          'utils-vendor': ['clsx'],
        },
      },
    },
    
    // 启用源码映射（开发时）
    sourcemap: process.env.NODE_ENV === 'development',
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console
        drop_console: process.env.NODE_ENV === 'production',
        // 移除debugger
        drop_debugger: true,
        // 移除未使用的代码
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        // 保留函数名（用于调试）
        keep_fnames: process.env.NODE_ENV === 'development',
      },
    },
    
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    
    // 资源内联限制
    assetsInlineLimit: 4096,
  },
  
  // 开发服务器配置
  server: {
    // 热更新
    hmr: {
      overlay: true,
    },
  },
  
  // 预构建优化
  optimizeDeps: {
    // 强制预构建的依赖
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      '@tanstack/react-query',
      'lucide-react',
      'clsx',
    ],
    
    // 排除预构建的依赖
    exclude: [],
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  
  // CSS配置 - PostCSS 会自动读取 postcss.config.js
  css: {
    // CSS模块配置
    modules: {
      // 生成的CSS类名格式
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  
  // 定义全局常量
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
  },
  
  // 测试配置
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
