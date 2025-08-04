import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useFormValidation, useAsyncValidation } from '../../hooks/useFormValidation';
import { commonValidationRules, validationRules } from '../../utils/validation';
import {
  Form,
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormFileInput,
  FormButtons,
  FormErrorSummary,
} from '../ui/Form';

interface TeacherVerificationData {
  realName: string;
  idCard: string;
  phone: string;
  subjects: string[];
  experience: number;
  education: string;
  university: string;
  major: string;
  graduationYear: number;
  description: string;
  certificates: File[];
  profileImage: File | null;
  termsAccepted: boolean;
  marketingConsent: boolean;
}

const SUBJECT_OPTIONS = [
  { value: 'math', label: '数学' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'chinese', label: '语文' },
  { value: 'english', label: '英语' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'politics', label: '政治' },
  { value: 'programming', label: '编程' },
];

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: '高中' },
  { value: 'college', label: '大专' },
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
];

export const TeacherVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>([]);
  const [uploadedCertificates, setUploadedCertificates] = React.useState<File[]>([]);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | null>(null);

  // 创建自定义验证规则
  const customValidationRules = {
    ...commonValidationRules.teacherVerification,
    phone: [
      validationRules.required('请输入手机号码'),
      validationRules.phone(),
    ],
    university: [
      validationRules.required('请输入毕业院校'),
      validationRules.minLength(2, '院校名称至少2个字符'),
    ],
    major: [
      validationRules.required('请输入专业'),
      validationRules.minLength(2, '专业名称至少2个字符'),
    ],
    graduationYear: [
      validationRules.required('请选择毕业年份'),
      validationRules.numberRange(1980, new Date().getFullYear(), '请选择有效的毕业年份'),
    ],
    certificates: [
      validationRules.required('请上传至少一个证书'),
    ],
    termsAccepted: [
      validationRules.required('请同意服务条款'),
      {
        test: (value: boolean) => value === true,
        message: '必须同意服务条款才能继续',
      },
    ],
  };

  // 主表单验证
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    touchField,
    setErrors,
    handleSubmit,
  } = useFormValidation(
    {
      realName: '',
      idCard: '',
      phone: '',
      subjects: [],
      experience: 0,
      education: '',
      university: '',
      major: '',
      graduationYear: new Date().getFullYear(),
      description: '',
      certificates: [],
      profileImage: null,
      termsAccepted: false,
      marketingConsent: false,
    },
    customValidationRules,
    {
      validateOnChange: true,
      validateOnBlur: true,
      showErrorsOnSubmit: true,
    }
  );

  // 异步验证（检查身份证和手机号是否已注册）
  const {
    asyncErrors,
    validatingFields,
    validateAsyncField,
  } = useAsyncValidation(
    { values, errors, touched, isSubmitting, isValid, setValue, setValues, touchField, setErrors, handleSubmit } as any,
    {
      idCard: {
        validator: async (idCard: string) => {
          if (!idCard || idCard.length < 18) return null;
          
          try {
            // 模拟API调用检查身份证是否已注册
            await new Promise(resolve => setTimeout(resolve, 1000));
            const isRegistered = Math.random() < 0.1; // 10%概率已注册
            return isRegistered ? '该身份证号已被注册' : null;
          } catch {
            return '验证失败，请稍后重试';
          }
        },
        debounceMs: 500,
      },
      phone: {
        validator: async (phone: string) => {
          if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return null;
          
          try {
            // 模拟API调用检查手机号是否已注册
            await new Promise(resolve => setTimeout(resolve, 800));
            const isRegistered = Math.random() < 0.15; // 15%概率已注册
            return isRegistered ? '该手机号已被注册' : null;
          } catch {
            return '验证失败，请稍后重试';
          }
        },
        debounceMs: 500,
      },
    }
  );

  // 处理科目选择
  const handleSubjectToggle = (subjectValue: string) => {
    const newSubjects = selectedSubjects.includes(subjectValue)
      ? selectedSubjects.filter(s => s !== subjectValue)
      : [...selectedSubjects, subjectValue];
    
    setSelectedSubjects(newSubjects);
    setValue('subjects', newSubjects);
  };

  // 处理证书上传
  const handleCertificateUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const updatedCertificates = [...uploadedCertificates, ...newFiles];
    
    setUploadedCertificates(updatedCertificates);
    setValue('certificates', updatedCertificates);
  };

  // 移除证书
  const removeCertificate = (index: number) => {
    const updatedCertificates = uploadedCertificates.filter((_, i) => i !== index);
    setUploadedCertificates(updatedCertificates);
    setValue('certificates', updatedCertificates);
  };

  // 处理头像上传
  const handleProfileImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setValue('profileImage', file);
    
    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 表单提交
  const onSubmit = async (formData: TeacherVerificationData) => {
    try {
      // 创建FormData对象用于文件上传
      const submitData = new FormData();
      
      // 添加基本信息
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'subjects') {
          submitData.append(key, JSON.stringify(value));
        } else if (key === 'certificates') {
          // 证书文件单独处理
          (value as File[]).forEach((file, index) => {
            submitData.append(`certificate_${index}`, file);
          });
        } else if (key === 'profileImage' && value) {
          submitData.append('profileImage', value as File);
        } else if (typeof value !== 'object') {
          submitData.append(key, String(value));
        }
      });

      // 模拟API调用提交认证申请
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('认证申请已提交', submitData);
      
      // 提交成功后跳转到审核页面
      navigate('/teacher/verification-pending');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || '提交失败，请稍后重试' 
        });
      }
      throw error;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        {/* 标题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            教师认证申请
          </h2>
          <p className="text-gray-600">
            请填写真实信息，我们将在3个工作日内完成审核
          </p>
        </div>

        {/* 错误总结 */}
        <FormErrorSummary errors={{ ...errors, ...asyncErrors }} className="mb-6" />

        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* 基本信息 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="真实姓名"
                value={values.realName}
                onChange={(e) => setValue('realName', e.target.value)}
                onBlur={() => touchField('realName')}
                error={touched.realName ? errors.realName : undefined}
                placeholder="请输入真实姓名"
                required
                disabled={isSubmitting}
              />

              <div className="relative">
                <FormInput
                  label="身份证号"
                  value={values.idCard}
                  onChange={(e) => {
                    setValue('idCard', e.target.value);
                    validateAsyncField('idCard');
                  }}
                  onBlur={() => touchField('idCard')}
                  error={touched.idCard ? (errors.idCard || asyncErrors.idCard) : undefined}
                  placeholder="请输入18位身份证号"
                  required
                  disabled={isSubmitting}
                />
                {validatingFields.includes('idCard') && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              <div className="relative">
                <FormInput
                  label="手机号码"
                  value={values.phone}
                  onChange={(e) => {
                    setValue('phone', e.target.value);
                    validateAsyncField('phone');
                  }}
                  onBlur={() => touchField('phone')}
                  error={touched.phone ? (errors.phone || asyncErrors.phone) : undefined}
                  placeholder="请输入手机号码"
                  required
                  disabled={isSubmitting}
                />
                {validatingFields.includes('phone') && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              <FormInput
                type="number"
                label="教学经验"
                value={values.experience}
                onChange={(e) => setValue('experience', Number(e.target.value))}
                onBlur={() => touchField('experience')}
                error={touched.experience ? errors.experience : undefined}
                placeholder="请输入教学经验年数"
                min={0}
                max={50}
                required
                disabled={isSubmitting}
                helpText="年"
              />
            </div>
          </div>

          {/* 教学科目 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">教学科目</h3>
            <FormField>
              <FormLabel required>选择教学科目（1-5个）</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
                {SUBJECT_OPTIONS.map((subject) => (
                  <label
                    key={subject.value}
                    className={`
                      flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                      ${selectedSubjects.includes(subject.value)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedSubjects.includes(subject.value)}
                      onChange={() => handleSubjectToggle(subject.value)}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium">{subject.label}</span>
                  </label>
                ))}
              </div>
              {touched.subjects && errors.subjects && (
                <p className="mt-2 text-sm text-red-600">{errors.subjects}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                已选择 {selectedSubjects.length} 个科目
              </p>
            </FormField>
          </div>

          {/* 教育背景 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">教育背景</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                label="最高学历"
                value={values.education}
                onChange={(e) => setValue('education', e.target.value)}
                onBlur={() => touchField('education')}
                error={touched.education ? errors.education : undefined}
                options={EDUCATION_OPTIONS}
                placeholder="请选择最高学历"
                required
                disabled={isSubmitting}
              />

              <FormInput
                label="毕业院校"
                value={values.university}
                onChange={(e) => setValue('university', e.target.value)}
                onBlur={() => touchField('university')}
                error={touched.university ? errors.university : undefined}
                placeholder="请输入毕业院校"
                required
                disabled={isSubmitting}
              />

              <FormInput
                label="专业"
                value={values.major}
                onChange={(e) => setValue('major', e.target.value)}
                onBlur={() => touchField('major')}
                error={touched.major ? errors.major : undefined}
                placeholder="请输入专业"
                required
                disabled={isSubmitting}
              />

              <FormSelect
                label="毕业年份"
                value={values.graduationYear.toString()}
                onChange={(e) => setValue('graduationYear', Number(e.target.value))}
                onBlur={() => touchField('graduationYear')}
                error={touched.graduationYear ? errors.graduationYear : undefined}
                options={Array.from({ length: 44 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return { value: year.toString(), label: `${year}年` };
                })}
                placeholder="请选择毕业年份"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* 个人简介 */}
          <div className="mb-8">
            <FormTextarea
              label="个人简介"
              value={values.description}
              onChange={(e) => setValue('description', e.target.value)}
              onBlur={() => touchField('description')}
              error={touched.description ? errors.description : undefined}
              placeholder="请介绍您的教学经验、教学风格和教学成果等"
              rows={6}
              required
              disabled={isSubmitting}
              helpText={`${values.description.length}/500字符`}
            />
          </div>

          {/* 文件上传 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">认证材料</h3>
            
            {/* 头像上传 */}
            <div className="mb-6">
              <FormLabel>个人头像（可选）</FormLabel>
              <div className="mt-2 flex items-center space-x-4">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="头像预览"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">暂无头像</span>
                  </div>
                )}
                <FormFileInput
                  accept="image/*"
                  onFileSelect={handleProfileImageUpload}
                  disabled={isSubmitting}
                  maxSize={2 * 1024 * 1024} // 2MB
                  helpText="支持JPG、PNG格式，文件大小不超过2MB"
                />
              </div>
            </div>

            {/* 证书上传 */}
            <div>
              <FormFileInput
                label="相关证书"
                accept="image/*,.pdf"
                multiple
                onFileSelect={handleCertificateUpload}
                error={touched.certificates ? errors.certificates : undefined}
                disabled={isSubmitting}
                maxSize={5 * 1024 * 1024} // 5MB
                helpText="请上传教师资格证、学历证书等相关证明材料，支持图片和PDF格式"
                required
              />
              
              {/* 已上传的证书列表 */}
              {uploadedCertificates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    已上传证书 ({uploadedCertificates.length})
                  </p>
                  <div className="space-y-2">
                    {uploadedCertificates.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.round(file.size / 1024)}KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertificate(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 协议和同意 */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <FormCheckbox
                checked={values.termsAccepted}
                onChange={(e) => setValue('termsAccepted', e.target.checked)}
                error={touched.termsAccepted ? errors.termsAccepted : undefined}
                disabled={isSubmitting}
                required
              >
                我已阅读并同意{' '}
                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  《用户服务协议》
                </a>
                {' '}和{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  《隐私政策》
                </a>
              </FormCheckbox>

              <FormCheckbox
                checked={values.marketingConsent}
                onChange={(e) => setValue('marketingConsent', e.target.checked)}
                disabled={isSubmitting}
                className="mt-3"
              >
                同意接收平台相关的营销信息和优惠活动通知（可选）
              </FormCheckbox>
            </div>
          </div>

          {/* 提交按钮 */}
          <FormButtons align="center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || !values.termsAccepted}
              className="px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  提交中...
                </>
              ) : (
                '提交申请'
              )}
            </button>
          </FormButtons>
        </Form>

        {/* 提示信息 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <AlertCircle className="flex-shrink-0 h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>审核说明：</strong>
                提交申请后，我们将在3个工作日内完成审核。审核通过后，您将收到邮件和短信通知，并可以开始接收学生预约。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};