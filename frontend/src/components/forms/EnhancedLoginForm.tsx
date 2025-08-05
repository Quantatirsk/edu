import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuthActions } from '../../stores/authStore';
import { useFormValidation } from '../../hooks/useFormValidation';
import { commonValidationRules } from '../../utils/validation';
import { 
  Form, 
  FormInput, 
  FormCheckbox, 
  FormButtons, 
  FormErrorSummary 
} from '../ui/Form';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface EnhancedLoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({
  onSuccess,
  redirectTo = '/',
  className = '',
}) => {
  const { setAuth } = useAuthActions();
  const [showPassword, setShowPassword] = React.useState(false);

  // 使用增强的表单验证系统
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    touchField,
    setErrors,
    handleSubmit,
  } = useFormValidation(
    {
      email: '',
      password: '',
      rememberMe: false,
    },
    commonValidationRules.userLogin,
    {
      validateOnChange: true,
      validateOnBlur: true,
      showErrorsOnSubmit: true,
    }
  );

  const onSubmit = async (formData: LoginFormData) => {
    try {
      // 调用AuthService进行登录
      const { AuthService } = await import('../../services/authService');
      
      const tokens = await AuthService.login({
        email: formData.email,
        password: formData.password,
      });

      // 获取用户信息
      const userProfile = await AuthService.getCurrentUser();

      // 转换用户数据格式
      const user = {
        id: userProfile.email,
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
    } catch (error: unknown) {
      // 处理不同类型的错误
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 401) {
        setErrors({ 
          email: '邮箱或密码错误，请重新输入',
          password: '邮箱或密码错误，请重新输入'
        });
      } else if (apiError.response?.status === 423) {
        setErrors({ email: '账户已被锁定，请联系客服' });
      } else if (apiError.response?.status === 429) {
        setErrors({ email: '登录尝试过于频繁，请稍后再试' });
      } else if ((apiError as { response?: { data?: { errors?: Record<string, string> } } }).response?.data?.errors) {
        // 服务器返回的字段级错误
        const errorResponse = apiError as { response: { data: { errors: Record<string, string> } } };
        setErrors(errorResponse.response.data.errors);
      } else if ((apiError as { response?: { data?: { message?: string } } }).response?.data?.message) {
        // 服务器返回的通用错误消息
        const messageResponse = apiError as { response: { data: { message: string } } };
        setErrors({ email: messageResponse.response.data.message });
      } else if ((error as Error).name === 'NetworkError' || !(apiError as { response?: unknown }).response) {
        setErrors({ email: '网络连接失败，请检查网络设置' });
      } else {
        // 其他未知错误
        setErrors({ email: '登录失败，请稍后重试' });
      }
      throw error; // 重新抛出错误以便handleSubmit知道失败了
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

        {/* 错误总结 - 显示所有错误的汇总 */}
        <FormErrorSummary errors={errors} className="mb-6" />

        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* 邮箱输入 */}
          <FormInput
            type="email"
            label="邮箱地址"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
            onBlur={() => touchField('email')}
            error={touched.email ? errors.email : undefined}
            placeholder="请输入邮箱地址"
            autoComplete="email"
            required
            disabled={isSubmitting}
            inputClassName="pl-10"
            helpText="请使用注册时的邮箱地址"
          />

          {/* 密码输入 */}
          <div className="relative">
            <FormInput
              type={showPassword ? 'text' : 'password'}
              label="密码"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              onBlur={() => touchField('password')}
              error={touched.password ? errors.password : undefined}
              placeholder="请输入密码"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              inputClassName="pl-10 pr-10"
            />
            
            {/* 图标和密码显示/隐藏按钮 */}
            <div className="absolute left-3 top-[2.1rem] pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[2.1rem] text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* 记住我和忘记密码 */}
          <div className="flex items-center justify-between">
            <FormCheckbox
              checked={values.rememberMe}
              onChange={(e) => setValue('rememberMe', e.target.checked)}
              disabled={isSubmitting}
            >
              记住我
            </FormCheckbox>
            
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              忘记密码？
            </Link>
          </div>

          {/* 提交按钮 */}
          <FormButtons>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </FormButtons>
        </Form>

        {/* 注册链接 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            还没有账户？{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
            >
              立即注册
            </Link>
          </p>
        </div>

        {/* 社交登录选项 */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">其他登录方式</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              微信登录
            </button>

            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#00D4FF" d="M21.395 15.035a39.798 39.798 0 0 0-.9-2.395c-.4-1.081-.9-2.395-1.5-3.676-.6-1.281-1.281-2.695-2.095-4.176-.9-1.631-1.98-3.676-3.676-6.176C12.324-2.275 11.625-1.576 10.125.625c-1.5 2.201-2.475 4.246-3.375 5.877-.814 1.481-1.495 2.895-2.095 4.176-.6 1.281-1.1 2.595-1.5 3.676-.3.901-.6 1.631-.9 2.395-.3.9-.6 1.5-.9 1.951-.3.45-.45.9-.45 1.35 0 1.35.6 2.475 1.8 3.375 1.2.9 2.7 1.35 4.5 1.35h6c1.8 0 3.3-.45 4.5-1.35 1.2-.9 1.8-2.025 1.8-3.375 0-.45-.15-.9-.45-1.35-.301-.451-.601-1.051-.901-1.951z"/>
              </svg>
              QQ登录
            </button>
          </div>
        </div>

        {/* 安全提示 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                为了保护您的账户安全，请不要在公共设备上保存登录状态，登录后请及时退出。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};