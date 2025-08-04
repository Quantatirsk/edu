import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthActions, useAuthLoading } from '../../stores/authStore';
import { useFormError } from '../../hooks/useError';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = '/',
  className = '',
}) => {
  const { setAuth } = useAuthActions();
  const isLoading = useAuthLoading();
  const { fieldErrors, setFieldError, clearFieldError } = useFormError();
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 表单验证
  const validateForm = (): boolean => {
    let isValid = true;

    // 清除之前的错误
    clearFieldError('email');
    clearFieldError('password');

    // 邮箱验证
    if (!formData.email.trim()) {
      setFieldError('email', '请输入邮箱地址');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFieldError('email', '请输入有效的邮箱地址');
      isValid = false;
    }

    // 密码验证
    if (!formData.password) {
      setFieldError('password', '请输入密码');
      isValid = false;
    } else if (formData.password.length < 6) {
      setFieldError('password', '密码至少需要6个字符');
      isValid = false;
    }

    return isValid;
  };

  // 处理表单输入
  const handleInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (typeof value === 'string' && value.trim()) {
      clearFieldError(field as string);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoginError(null);
      
      // 调用真实的登录API
      const { AuthService } = await import('../../services/authService');
      
      const tokens = await AuthService.login({
        email: formData.email,
        password: formData.password,
      });

      // 获取用户信息
      const userProfile = await AuthService.getCurrentUser();

      // 转换用户数据格式以匹配前端类型
      const user = {
        id: userProfile.email, // 使用email作为临时ID
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        role: userProfile.role as 'student' | 'teacher' | 'admin',
        avatar: userProfile.avatar,
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // 使用 authStore 设置认证状态
      setAuth({
        user,
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        rememberMe: formData.rememberMe,
      });
      
      onSuccess?.();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('登录失败，请检查邮箱和密码');
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            登录账户
          </h2>
          <p className="text-gray-600">
            欢迎回到优教辅导平台
          </p>
        </div>

        {/* 全局错误显示 */}
        {loginError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">登录失败</h3>
              <p className="text-sm text-red-700 mt-1">{loginError}</p>
            </div>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`input-field pl-10 ${
                  fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="请输入邮箱地址"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* 密码输入 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`input-field pl-10 pr-10 ${
                  fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="请输入密码"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* 记住我 & 忘记密码 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                记住我
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              忘记密码？
            </Link>
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>

          {/* 注册链接 */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              还没有账户？{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                立即注册
              </Link>
            </span>
          </div>
        </form>

        {/* 其他登录方式 */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或使用以下方式登录</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={isLoading}
            >
              <span>微信登录</span>
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={isLoading}
            >
              <span>QQ登录</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;