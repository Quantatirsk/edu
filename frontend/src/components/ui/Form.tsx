import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';

// 表单字段基础接口
interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  helpText?: string;
  disabled?: boolean;
}

// 表单容器组件
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  className?: string;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={clsx('space-y-6', className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

// 表单字段容器
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('space-y-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// 表单标签
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ children, required, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx(
          'block text-sm font-medium text-gray-700',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

// 输入框组件
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  inputClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    error, 
    required, 
    helpText, 
    className, 
    inputClassName,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <FormField className={className}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            inputClassName
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
        {helpText && !error && (
          <p id={`${inputId}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormInput.displayName = 'FormInput';

// 文本区域组件
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  textareaClassName?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ 
    label, 
    error, 
    required, 
    helpText, 
    className, 
    textareaClassName,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <FormField className={className}>
        {label && (
          <FormLabel htmlFor={textareaId} required={required}>
            {label}
          </FormLabel>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'resize-vertical',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            textareaClassName
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined
          }
          {...props}
        />
        {helpText && !error && (
          <p id={`${textareaId}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

// 选择框组件
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  selectClassName?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ 
    label, 
    error, 
    required, 
    helpText, 
    className, 
    selectClassName,
    options,
    placeholder,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <FormField className={className}>
        {label && (
          <FormLabel htmlFor={selectId} required={required}>
            {label}
          </FormLabel>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            selectClassName
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {helpText && !error && (
          <p id={`${selectId}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormSelect.displayName = 'FormSelect';

// 复选框组件
interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  className?: string;
  checkboxClassName?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ 
    label, 
    error, 
    helpText, 
    className, 
    checkboxClassName,
    id,
    children,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <FormField className={className}>
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={clsx(
              'h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded',
              'focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-300 focus:ring-red-500',
              checkboxClassName
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${checkboxId}-error` : helpText ? `${checkboxId}-help` : undefined
            }
            {...props}
          />
          <div className="ml-3">
            {(label || children) && (
              <label 
                htmlFor={checkboxId} 
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                {label || children}
              </label>
            )}
            {helpText && !error && (
              <p id={`${checkboxId}-help`} className="text-sm text-gray-500">
                {helpText}
              </p>
            )}
            {error && (
              <p id={`${checkboxId}-error`} className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </FormField>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';

// 单选按钮组
interface FormRadioGroupProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const FormRadioGroup = forwardRef<HTMLDivElement, FormRadioGroupProps>(
  ({ 
    label, 
    error, 
    required, 
    helpText, 
    className,
    name,
    value,
    onChange,
    options,
    ...props 
  }, ref) => {
    const groupId = useId();

    return (
      <FormField className={className} ref={ref} {...props}>
        {label && (
          <FormLabel required={required}>
            {label}
          </FormLabel>
        )}
        <div className="space-y-2">
          {options.map((option) => {
            const radioId = `${groupId}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={radioId}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={option.disabled}
                  className={clsx(
                    'h-4 w-4 text-blue-600 border-gray-300',
                    'focus:ring-2 focus:ring-blue-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error && 'border-red-300 focus:ring-red-500'
                  )}
                />
                <label 
                  htmlFor={radioId} 
                  className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
        {helpText && !error && (
          <p className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormRadioGroup.displayName = 'FormRadioGroup';

// 文件上传组件
interface FormFileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  accept?: string;
  maxSize?: number; // 字节数
  preview?: boolean;
  onFileSelect?: (files: FileList | null) => void;
}

export const FormFileInput = forwardRef<HTMLInputElement, FormFileInputProps>(
  ({ 
    label, 
    error, 
    required, 
    helpText, 
    className,
    accept,
    maxSize,
    preview,
    onFileSelect,
    onChange,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      
      // 文件大小验证
      if (files && maxSize) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].size > maxSize) {
            // 这里可以设置错误状态或调用错误处理函数
            console.error(`文件 ${files[i].name} 大小超过限制`);
            return;
          }
        }
      }

      // 预览功能
      if (preview && files && files[0] && files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(files[0]);
      } else {
        setPreviewUrl(null);
      }

      onFileSelect?.(files);
      onChange?.(e);
    };

    return (
      <FormField className={className}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <input
          ref={ref}
          type="file"
          id={inputId}
          accept={accept}
          onChange={handleFileChange}
          className={clsx(
            'block w-full text-sm text-gray-500',
            'file:mr-4 file:py-2 file:px-4',
            'file:rounded-full file:border-0',
            'file:text-sm file:font-semibold',
            'file:bg-blue-50 file:text-blue-700',
            'hover:file:bg-blue-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'text-red-500'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
        
        {preview && previewUrl && (
          <div className="mt-2">
            <img 
              src={previewUrl} 
              alt="预览" 
              className="h-20 w-20 object-cover rounded-md border border-gray-300"
            />
          </div>
        )}
        
        {helpText && !error && (
          <p id={`${inputId}-help`} className="text-sm text-gray-500">
            {helpText}
            {maxSize && ` (最大 ${Math.round(maxSize / 1024)}KB)`}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

FormFileInput.displayName = 'FormFileInput';

// 表单按钮组
interface FormButtonsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const FormButtons: React.FC<FormButtonsProps> = ({ 
  children, 
  className, 
  align = 'right' 
}) => {
  return (
    <div 
      className={clsx(
        'flex gap-3 pt-6',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className
      )}
    >
      {children}
    </div>
  );
};

// 表单错误总结组件
interface FormErrorSummaryProps {
  errors: { [field: string]: string };
  className?: string;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ 
  errors, 
  className 
}) => {
  const errorList = Object.entries(errors).filter(([_, message]) => message);
  
  if (errorList.length === 0) return null;

  return (
    <div 
      className={clsx(
        'bg-red-50 border border-red-200 rounded-md p-4',
        className
      )}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            请修正以下错误：
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errorList.map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};