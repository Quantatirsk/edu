import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, Check } from 'lucide-react';
// import { useAuthActions } from '../../stores/authStore'; // 暂时不需要
import { useFormError } from '../../hooks/useError';
import { AuthService } from '../../services/authService';
import type { UserRegister } from '../../services/authService';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

interface RegisterCredentials extends UserRegister {
  confirmPassword: string;
  agreedToTerms: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo = '/login',
  className = '',
}) => {
  // const { setAuth } = useAuthActions(); // 暂时不需要，注册成功后跳转到登录页
  const { fieldErrors, setFieldError, clearFieldError } = useFormError();
  
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
    agreedToTerms: false,
  });
  
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
    };

    Object.values(requirements).forEach(met => {
      if (met) score += 1;
    });

    if (score < 2) return { level: 'weak', color: 'red', text: '弱' };
    if (score < 4) return { level: 'medium', color: 'yellow', text: '中' };
    return { level: 'strong', color: 'green', text: '强' };
  };

  // 表单验证
  const validateForm = (): boolean => {
    let isValid = true;

    // 清除之前的错误
    Object.keys(formData).forEach(field => clearFieldError(field));

    // 姓名验证
    if (!formData.name.trim()) {
      setFieldError('name', '请输入姓名');
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      setFieldError('name', '姓名至少需要2个字符');
      isValid = false;
    } else if (formData.name.trim().length > 50) {
      setFieldError('name', '姓名不能超过50个字符');
      isValid = false;
    }

    // 邮箱验证
    if (!formData.email.trim()) {
      setFieldError('email', '请输入邮箱地址');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFieldError('email', '请输入有效的邮箱地址');
      isValid = false;
    }

    // 密码验证（符合后端要求）
    if (!formData.password) {
      setFieldError('password', '请输入密码');
      isValid = false;
    } else if (formData.password.length < 8) {
      setFieldError('password', '密码至少需要8个字符');
      isValid = false;
    } else if (formData.password.length > 128) {
      setFieldError('password', '密码不能超过128个字符');
      isValid = false;
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      setFieldError('password', '密码必须包含至少一个小写字母');
      isValid = false;
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      setFieldError('password', '密码必须包含至少一个大写字母');
      isValid = false;
    } else if (!/(?=.*\d)/.test(formData.password)) {
      setFieldError('password', '密码必须包含至少一个数字');
      isValid = false;
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      setFieldError('confirmPassword', '请确认密码');
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', '两次输入的密码不一致');
      isValid = false;
    }

    // 手机号验证（符合后端要求）
    if (!formData.phone.trim()) {
      setFieldError('phone', '请输入手机号');
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setFieldError('phone', '请输入有效的手机号');
      isValid = false;
    }

    // 协议同意验证
    if (!formData.agreedToTerms) {
      setFieldError('agreedToTerms', '请阅读并同意用户协议');
      isValid = false;
    }

    return isValid;
  };

  // 处理表单输入
  const handleInputChange = (field: keyof RegisterCredentials, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (typeof value === 'string' && value.trim()) {
      clearFieldError(field as string);
    } else if (typeof value === 'boolean' && value) {
      clearFieldError(field as string);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      // 调用真实的注册API
      const registerData: UserRegister = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
      };

      const response = await AuthService.register(registerData);
      
      if (response.success) {
        setRegisterSuccess('注册成功！请前往登录页面登录您的账户。');
        
        // 延迟跳转到登录页面
        setTimeout(() => {
          onSuccess?.();
          if (redirectTo) {
            window.location.href = redirectTo;
          }
        }, 2000);
      } else {
        setRegisterError(response.message || '注册失败，请重试');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      setRegisterError(error.message || '注册失败，请检查网络连接或联系客服');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            创建账户
          </h2>
          <p className="text-gray-600">
            加入优教辅导平台，开始学习之旅
          </p>
        </div>

        {/* 成功提示 */}
        {registerSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800">注册成功</h3>
              <p className="text-sm text-green-700 mt-1">{registerSuccess}</p>
            </div>
          </div>
        )}

        {/* 全局错误显示 */}
        {registerError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">注册失败</h3>
              <p className="text-sm text-red-700 mt-1">{registerError}</p>
            </div>
          </div>
        )}

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 姓名输入 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`input-field pl-10 ${
                  fieldErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="请输入真实姓名"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址 <span className="text-red-500">*</span>
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

          {/* 手机号输入 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              手机号 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`input-field pl-10 ${
                  fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="请输入手机号"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            )}
          </div>

          {/* 角色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              账户类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('role', 'student')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  formData.role === 'student'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={isLoading}
              >
                <div className="font-medium">学生</div>
                <div className="text-xs text-gray-500 mt-1">寻找优秀教师</div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('role', 'teacher')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  formData.role === 'teacher'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={isLoading}
              >
                <div className="font-medium">教师</div>
                <div className="text-xs text-gray-500 mt-1">分享知识经验</div>
              </button>
            </div>
          </div>

          {/* 密码输入 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码 <span className="text-red-500">*</span>
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
                placeholder="请输入密码（至少8个字符）"
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
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">密码强度:</span>
                  <span className={`font-medium text-${passwordStrength.color}-600`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="mt-1 h-1 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-${passwordStrength.color}-500 rounded transition-all`}
                    style={{
                      width: passwordStrength.level === 'weak' ? '33%' : 
                             passwordStrength.level === 'medium' ? '66%' : '100%'
                    }}
                  />
                </div>
              </div>
            )}
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* 确认密码输入 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`input-field pl-10 pr-10 ${
                  fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="请再次输入密码"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="mt-1 flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-xs">密码匹配</span>
              </div>
            )}
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* 用户协议 */}
          <div>
            <div className="flex items-start">
              <input
                id="agreedToTerms"
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 ${
                  fieldErrors.agreedToTerms ? 'border-red-300' : ''
                }`}
                disabled={isLoading}
              />
              <label htmlFor="agreedToTerms" className="ml-2 block text-sm text-gray-700">
                我已阅读并同意{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-800">
                  《用户协议》
                </Link>
                {' '}和{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-800">
                  《隐私政策》
                </Link>
              </label>
            </div>
            {fieldErrors.agreedToTerms && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.agreedToTerms}</p>
            )}
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                注册中...
              </>
            ) : (
              '注册账户'
            )}
          </button>

          {/* 登录链接 */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              已有账户？{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                立即登录
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;