import { useState, useCallback, useMemo } from 'react';
import { FormValidator } from '../utils/validation';
import type { FormValidationRules } from '../utils/validation';

export interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsOnSubmit?: boolean;
}

export interface FormValidationState {
  values: { [field: string]: any };
  errors: { [field: string]: string };
  touched: { [field: string]: boolean };
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
}

export interface FormValidationActions {
  setValue: (field: string, value: any) => void;
  setValues: (values: { [field: string]: any }) => void;
  setError: (field: string, error: string) => void;
  setErrors: (errors: { [field: string]: string }) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  touchField: (field: string) => void;
  touchFields: (fields: string[]) => void;
  validateField: (field: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  resetForm: (values?: { [field: string]: any }) => void;
  handleSubmit: (onSubmit: (values: any) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
}

export interface UseFormValidationReturn extends FormValidationState, FormValidationActions {}

export const useFormValidation = (
  initialValues: { [field: string]: any },
  validationRules: FormValidationRules,
  options: UseFormValidationOptions = {}
): UseFormValidationReturn => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showErrorsOnSubmit = true,
  } = options;

  // 状态管理
  const [values, setValuesState] = useState(initialValues);
  const [errors, setErrorsState] = useState<{ [field: string]: string }>({});
  const [touched, setTouchedState] = useState<{ [field: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // 创建验证器实例
  const validator = useMemo(() => new FormValidator(validationRules), [validationRules]);

  // 计算是否有效
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           Object.values(errors).every(error => !error);
  }, [errors]);

  // 设置单个字段值
  const setValue = useCallback((field: string, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));

    // 如果启用了实时验证且字段已被触摸
    if (validateOnChange && touched[field]) {
      const error = validator.validateField(field, value);
      setErrorsState(prev => ({
        ...prev,
        [field]: error || '',
      }));
    }
  }, [validateOnChange, touched, validator]);

  // 设置多个字段值
  const setValues = useCallback((newValues: { [field: string]: any }) => {
    setValuesState(prev => ({ ...prev, ...newValues }));

    // 如果启用了实时验证，验证所有已触摸的字段
    if (validateOnChange) {
      const newErrors: { [field: string]: string } = {};
      Object.keys(newValues).forEach(field => {
        if (touched[field]) {
          const error = validator.validateField(field, newValues[field]);
          if (error) {
            newErrors[field] = error;
          }
        }
      });
      
      if (Object.keys(newErrors).length > 0) {
        setErrorsState(prev => ({ ...prev, ...newErrors }));
      }
    }
  }, [validateOnChange, touched, validator]);

  // 设置单个字段错误
  const setError = useCallback((field: string, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }));
  }, []);

  // 设置多个字段错误
  const setErrors = useCallback((newErrors: { [field: string]: string }) => {
    setErrorsState(prev => ({ ...prev, ...newErrors }));
  }, []);

  // 清除单个字段错误
  const clearError = useCallback((field: string) => {
    setErrorsState(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // 清除所有错误
  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  // 标记字段为已触摸
  const touchField = useCallback((field: string) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));

    // 如果启用了失焦验证，立即验证该字段
    if (validateOnBlur) {
      const error = validator.validateField(field, values[field]);
      if (error) {
        setErrorsState(prev => ({ ...prev, [field]: error }));
      } else {
        clearError(field);
      }
    }
  }, [validateOnBlur, validator, values, clearError]);

  // 标记多个字段为已触摸
  const touchFields = useCallback((fields: string[]) => {
    const touchedUpdates = fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as { [field: string]: boolean });

    setTouchedState(prev => ({ ...prev, ...touchedUpdates }));

    // 如果启用了失焦验证，验证所有字段
    if (validateOnBlur) {
      const newErrors: { [field: string]: string } = {};
      fields.forEach(field => {
        const error = validator.validateField(field, values[field]);
        if (error) {
          newErrors[field] = error;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrorsState(prev => ({ ...prev, ...newErrors }));
      }
    }
  }, [validateOnBlur, validator, values]);

  // 验证单个字段
  const validateField = useCallback(async (field: string): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const error = validator.validateField(field, values[field]);
      
      if (error) {
        setErrorsState(prev => ({ ...prev, [field]: error }));
        return false;
      } else {
        clearError(field);
        return true;
      }
    } finally {
      setIsValidating(false);
    }
  }, [validator, values, clearError]);

  // 验证整个表单
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const result = validator.validateForm(values);
      setErrorsState(result.errors);
      
      // 如果需要，标记所有字段为已触摸
      if (showErrorsOnSubmit && !result.isValid) {
        const allFields = Object.keys(validationRules);
        const touchedUpdates = allFields.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {} as { [field: string]: boolean });
        setTouchedState(prev => ({ ...prev, ...touchedUpdates }));
      }
      
      return result.isValid;
    } finally {
      setIsValidating(false);
    }
  }, [validator, values, validationRules, showErrorsOnSubmit]);

  // 重置表单
  const resetForm = useCallback((newValues = initialValues) => {
    setValuesState(newValues);
    setErrorsState({});
    setTouchedState({});
    setIsSubmitting(false);
    setIsValidating(false);
  }, [initialValues]);

  // 处理表单提交
  const handleSubmit = useCallback((
    onSubmit: (values: any) => void | Promise<void>
  ) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitting(true);
      
      try {
        // 先验证表单
        const isFormValid = await validateForm();
        
        if (!isFormValid) {
          return;
        }

        // 执行提交逻辑
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        // 可以在这里处理提交错误
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [validateForm, values]);

  // 返回状态和操作方法
  return {
    // 状态
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    isValid,
    
    // 操作方法
    setValue,
    setValues,
    setError,
    setErrors,
    clearError,
    clearErrors,
    touchField,
    touchFields,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
  };
};

// 异步验证Hook
export interface AsyncValidationRule {
  validator: (value: any, allValues: { [field: string]: any }) => Promise<string | null>;
  debounceMs?: number;
}

export interface UseAsyncValidationOptions {
  debounceMs?: number;
}

export const useAsyncValidation = (
  formValidation: UseFormValidationReturn,
  asyncRules: { [field: string]: AsyncValidationRule },
  options: UseAsyncValidationOptions = {}
) => {
  const { debounceMs = 300 } = options;
  const [asyncErrors, setAsyncErrors] = useState<{ [field: string]: string }>({});
  const [validatingFields, setValidatingFields] = useState<Set<string>>(new Set());

  // 防抖验证函数
  const debouncedValidate = useCallback(
    debounce(async (field: string, value: any, allValues: { [field: string]: any }) => {
      const rule = asyncRules[field];
      if (!rule) return;

      setValidatingFields(prev => new Set([...prev, field]));

      try {
        const error = await rule.validator(value, allValues);
        
        setAsyncErrors(prev => ({
          ...prev,
          [field]: error || '',
        }));

        // 同步到主表单错误状态
        if (error) {
          formValidation.setError(field, error);
        } else {
          formValidation.clearError(field);
        }
      } catch (err) {
        console.error(`Async validation error for field ${field}:`, err);
        const errorMessage = '验证失败，请稍后重试';
        setAsyncErrors(prev => ({ ...prev, [field]: errorMessage }));
        formValidation.setError(field, errorMessage);
      } finally {
        setValidatingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
      }
    }, debounceMs),
    [asyncRules, formValidation, debounceMs]
  );

  // 验证单个字段
  const validateAsyncField = useCallback((field: string) => {
    const value = formValidation.values[field];
    debouncedValidate(field, value, formValidation.values);
  }, [formValidation.values, debouncedValidate]);

  // 验证所有异步字段
  const validateAllAsyncFields = useCallback(async () => {
    const promises = Object.keys(asyncRules).map(async (field) => {
      const rule = asyncRules[field];
      const value = formValidation.values[field];
      
      setValidatingFields(prev => new Set([...prev, field]));
      
      try {
        const error = await rule.validator(value, formValidation.values);
        return { field, error };
      } catch (err) {
        console.error(`Async validation error for field ${field}:`, err);
        return { field, error: '验证失败，请稍后重试' };
      } finally {
        setValidatingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
      }
    });

    const results = await Promise.all(promises);
    const newAsyncErrors: { [field: string]: string } = {};
    
    results.forEach(({ field, error }) => {
      if (error) {
        newAsyncErrors[field] = error;
        formValidation.setError(field, error);
      } else {
        formValidation.clearError(field);
      }
    });

    setAsyncErrors(newAsyncErrors);
    return Object.keys(newAsyncErrors).length === 0;
  }, [asyncRules, formValidation]);

  return {
    asyncErrors,
    validatingFields: Array.from(validatingFields),
    isValidatingAny: validatingFields.size > 0,
    validateAsyncField,
    validateAllAsyncFields,
  };
};

// 防抖工具函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}