// 表单验证工具类
export type ValidationRule = {
  test: (value: any) => boolean;
  message: string;
};

export type FormValidationRules = {
  [field: string]: ValidationRule[];
};

export type ValidationResult = {
  isValid: boolean;
  errors: { [field: string]: string };
};

// 内置验证规则
export const validationRules = {
  // 必填项验证
  required: (message: string = '此字段为必填项'): ValidationRule => ({
    test: (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),

  // 邮箱验证
  email: (message: string = '请输入有效的邮箱地址'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true; // 空值通过，由required规则处理
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  // 手机号验证（中国大陆）
  phone: (message: string = '请输入有效的手机号码'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(value);
    },
    message,
  }),

  // 密码强度验证
  password: (
    minLength: number = 8,
    message: string = `密码至少${minLength}位，包含字母和数字`
  ): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      if (value.length < minLength) return false;
      // 至少包含一个字母和一个数字
      return /[a-zA-Z]/.test(value) && /\d/.test(value);
    },
    message,
  }),

  // 确认密码验证
  confirmPassword: (
    originalPassword: string,
    message: string = '两次输入的密码不一致'
  ): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      return value === originalPassword;
    },
    message,
  }),

  // 最小长度验证
  minLength: (
    min: number,
    message: string = `至少输入${min}个字符`
  ): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      return value.length >= min;
    },
    message,
  }),

  // 最大长度验证
  maxLength: (
    max: number,
    message: string = `最多输入${max}个字符`
  ): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      return value.length <= max;
    },
    message,
  }),

  // 数字验证
  number: (message: string = '请输入有效的数字'): ValidationRule => ({
    test: (value: string | number) => {
      if (value === '' || value === null || value === undefined) return true;
      return !isNaN(Number(value));
    },
    message,
  }),

  // 数字范围验证
  numberRange: (
    min: number,
    max: number,
    message: string = `请输入${min}到${max}之间的数字`
  ): ValidationRule => ({
    test: (value: string | number) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = Number(value);
      if (isNaN(num)) return false;
      return num >= min && num <= max;
    },
    message,
  }),

  // 身份证号验证
  idCard: (message: string = '请输入有效的身份证号码'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      // 18位身份证号码验证
      const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/;
      if (!idCardRegex.test(value)) return false;
      
      // 校验码验证
      const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
      
      let sum = 0;
      for (let i = 0; i < 17; i++) {
        sum += parseInt(value[i]) * factors[i];
      }
      
      const checkCodeIndex = sum % 11;
      const expectedCheckCode = checkCodes[checkCodeIndex];
      
      return value[17].toUpperCase() === expectedCheckCode;
    },
    message,
  }),

  // URL验证
  url: (message: string = '请输入有效的URL地址'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  // 日期验证
  date: (message: string = '请输入有效的日期'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message,
  }),

  // 未来日期验证
  futureDate: (message: string = '日期必须是未来时间'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      return date.getTime() > now.getTime();
    },
    message,
  }),

  // 过去日期验证
  pastDate: (message: string = '日期必须是过去时间'): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      return date.getTime() < now.getTime();
    },
    message,
  }),

  // 年龄验证
  age: (
    min: number,
    max: number,
    message: string = `年龄必须在${min}到${max}岁之间`
  ): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= min && age <= max;
    },
    message,
  }),

  // 自定义正则表达式验证
  pattern: (
    regex: RegExp,
    message: string = '格式不正确'
  ): ValidationRule => ({
    test: (value: string) => {
      if (!value) return true;
      return regex.test(value);
    },
    message,
  }),

  // 数组长度验证
  arrayLength: (
    min: number,
    max?: number,
    message?: string
  ): ValidationRule => ({
    test: (value: any[]) => {
      if (!value) return true;
      if (!Array.isArray(value)) return false;
      
      if (value.length < min) return false;
      if (max !== undefined && value.length > max) return false;
      
      return true;
    },
    message: message || `请选择${min}${max ? `到${max}` : '个以上'}项`,
  }),
};

// 表单验证器类
export class FormValidator {
  private rules: FormValidationRules;
  private errors: { [field: string]: string } = {};

  constructor(rules: FormValidationRules) {
    this.rules = rules;
  }

  // 验证单个字段
  validateField(field: string, value: any): string | null {
    const fieldRules = this.rules[field];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      if (!rule.test(value)) {
        this.errors[field] = rule.message;
        return rule.message;
      }
    }

    delete this.errors[field];
    return null;
  }

  // 验证整个表单
  validateForm(formData: { [field: string]: any }): ValidationResult {
    const errors: { [field: string]: string } = {};
    let isValid = true;

    // 验证所有定义了规则的字段
    for (const field in this.rules) {
      const value = formData[field];
      const fieldRules = this.rules[field];

      for (const rule of fieldRules) {
        if (!rule.test(value)) {
          errors[field] = rule.message;
          isValid = false;
          break; // 只显示第一个错误
        }
      }
    }

    this.errors = errors;
    return { isValid, errors };
  }

  // 获取字段错误
  getFieldError(field: string): string | null {
    return this.errors[field] || null;
  }

  // 获取所有错误
  getAllErrors(): { [field: string]: string } {
    return { ...this.errors };
  }

  // 清除字段错误
  clearFieldError(field: string): void {
    delete this.errors[field];
  }

  // 清除所有错误
  clearAllErrors(): void {
    this.errors = {};
  }

  // 检查是否有错误
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  // 设置自定义错误
  setFieldError(field: string, message: string): void {
    this.errors[field] = message;
  }

  // 动态添加规则
  addRule(field: string, rule: ValidationRule): void {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
  }

  // 移除字段规则
  removeFieldRules(field: string): void {
    delete this.rules[field];
    delete this.errors[field];
  }
}

// 异步验证器（用于服务器端验证）
export class AsyncValidator {
  private validators: { [field: string]: (value: any) => Promise<string | null> } = {};

  // 添加异步验证器
  addAsyncValidator(
    field: string, 
    validator: (value: any) => Promise<string | null>
  ): void {
    this.validators[field] = validator;
  }

  // 执行异步验证
  async validateField(field: string, value: any): Promise<string | null> {
    const validator = this.validators[field];
    if (!validator) return null;

    try {
      return await validator(value);
    } catch (error) {
      console.error(`Async validation error for field ${field}:`, error);
      return '验证失败，请稍后重试';
    }
  }

  // 执行所有异步验证
  async validateAllFields(formData: { [field: string]: any }): Promise<{ [field: string]: string }> {
    const errors: { [field: string]: string } = {};
    
    const validationPromises = Object.keys(this.validators).map(async (field) => {
      const error = await this.validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });

    await Promise.all(validationPromises);
    return errors;
  }
}

// 常用的验证规则组合
export const commonValidationRules = {
  // 用户注册表单
  userRegistration: {
    username: [
      validationRules.required('用户名不能为空'),
      validationRules.minLength(3, '用户名至少3个字符'),
      validationRules.maxLength(20, '用户名最多20个字符'),
      validationRules.pattern(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
    ],
    email: [
      validationRules.required('邮箱不能为空'),
      validationRules.email(),
    ],
    password: [
      validationRules.required('密码不能为空'),
      validationRules.password(8),
    ],
    confirmPassword: [], // 需要动态添加，因为需要原密码值
    phone: [
      validationRules.phone(),
    ],
  },

  // 用户登录表单
  userLogin: {
    email: [
      validationRules.required('邮箱不能为空'),
      validationRules.email(),
    ],
    password: [
      validationRules.required('密码不能为空'),
    ],
  },

  // 教师认证表单
  teacherVerification: {
    realName: [
      validationRules.required('真实姓名不能为空'),
      validationRules.minLength(2, '姓名至少2个字符'),
      validationRules.maxLength(10, '姓名最多10个字符'),
    ],
    idCard: [
      validationRules.required('身份证号不能为空'),
      validationRules.idCard(),
    ],
    subjects: [
      validationRules.arrayLength(1, 5, '请选择1-5个教学科目'),
    ],
    experience: [
      validationRules.required('教学经验不能为空'),
      validationRules.numberRange(0, 50, '教学经验应在0-50年之间'),
    ],
    education: [
      validationRules.required('请选择学历'),
    ],
    description: [
      validationRules.required('个人简介不能为空'),
      validationRules.minLength(20, '个人简介至少20个字符'),
      validationRules.maxLength(500, '个人简介最多500个字符'),
    ],
  },

  // 预约表单
  appointment: {
    teacherId: [
      validationRules.required('请选择教师'),
    ],
    subject: [
      validationRules.required('请选择科目'),
    ],
    date: [
      validationRules.required('请选择日期'),
      validationRules.date(),
      validationRules.futureDate('预约日期必须是未来时间'),
    ],
    startTime: [
      validationRules.required('请选择开始时间'),
    ],
    endTime: [
      validationRules.required('请选择结束时间'),
    ],
    type: [
      validationRules.required('请选择课程类型'),
    ],
  },

  // 个人资料编辑
  profileEdit: {
    displayName: [
      validationRules.required('显示名称不能为空'),
      validationRules.minLength(2, '显示名称至少2个字符'),
      validationRules.maxLength(20, '显示名称最多20个字符'),
    ],
    bio: [
      validationRules.maxLength(200, '个人简介最多200个字符'),
    ],
    location: [
      validationRules.maxLength(50, '所在地最多50个字符'),
    ],
    website: [
      validationRules.url(),
    ],
  },
};

// 表单验证Hook（用于React组件）
export const useFormValidation = (rules: FormValidationRules) => {
  const validator = new FormValidator(rules);
  
  return {
    validateField: validator.validateField.bind(validator),
    validateForm: validator.validateForm.bind(validator),
    getFieldError: validator.getFieldError.bind(validator),
    getAllErrors: validator.getAllErrors.bind(validator),
    clearFieldError: validator.clearFieldError.bind(validator),
    clearAllErrors: validator.clearAllErrors.bind(validator),
    hasErrors: validator.hasErrors.bind(validator),
    setFieldError: validator.setFieldError.bind(validator),
  };
};

// 实时验证Hook
export const useRealtimeValidation = (
  initialData: { [field: string]: any },
  rules: FormValidationRules
) => {
  const [formData, setFormData] = React.useState(initialData);
  const [errors, setErrors] = React.useState<{ [field: string]: string }>({});
  const [touched, setTouched] = React.useState<{ [field: string]: boolean }>({});
  
  const validator = new FormValidator(rules);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 只有字段被触摸过才显示错误
    if (touched[field]) {
      const error = validator.validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || '',
      }));
    }
  };

  const touchField = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // 触摸时立即验证
    const error = validator.validateField(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error || '',
    }));
  };

  const validateAllFields = () => {
    const result = validator.validateForm(formData);
    setErrors(result.errors);
    
    // 标记所有字段为已触摸
    const allTouched = Object.keys(rules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as { [field: string]: boolean });
    setTouched(allTouched);
    
    return result.isValid;
  };

  const resetForm = (newData = initialData) => {
    setFormData(newData);
    setErrors({});
    setTouched({});
    validator.clearAllErrors();
  };

  return {
    formData,
    errors,
    touched,
    updateField,
    touchField,
    validateAllFields,
    resetForm,
    isValid: !validator.hasErrors(),
  };
};

// 导入React用于hooks
import React from 'react';