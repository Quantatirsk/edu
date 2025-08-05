"""
Pydantic数据模型定义
基于demo.tsx中的TypeScript接口创建相应的Python模型
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict
from datetime import datetime, date
from enum import Enum

# 枚举类型定义
class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class LessonType(str, Enum):
    SINGLE = "single"
    ONE_ON_ONE = "one-on-one"
    PACKAGE = "package"

# 基础数据模型
class Location(BaseModel):
    """位置信息模型"""
    address: str = Field(..., description="详细地址")
    lat: float = Field(..., description="纬度", ge=-90, le=90)
    lng: float = Field(..., description="经度", ge=-180, le=180)
    district: str = Field(..., description="所在区域")

class DetailedRatings(BaseModel):
    """详细评分模型"""
    teaching: float = Field(..., description="教学能力评分", ge=0, le=5)
    patience: float = Field(..., description="耐心程度评分", ge=0, le=5)
    communication: float = Field(..., description="沟通能力评分", ge=0, le=5)
    effectiveness: float = Field(..., description="教学效果评分", ge=0, le=5)

# 用户相关模型
class UserBase(BaseModel):
    """用户基础模型"""
    name: str = Field(..., description="用户姓名")
    email: EmailStr = Field(..., description="邮箱地址")
    phone: str = Field(..., description="手机号码")
    role: UserRole = Field(..., description="用户角色")
    avatar: Optional[str] = Field(None, description="头像URL")

class User(UserBase):
    """用户完整模型"""
    id: str = Field(..., description="用户ID")
    location: Optional[Location] = Field(None, description="位置信息")

class TeacherCreate(UserBase):
    """创建教师请求模型"""
    subject: List[str] = Field(..., description="教学科目")
    experience: int = Field(..., description="教学经验年数", ge=0)
    price: float = Field(..., description="课时费", ge=0)
    location: Location = Field(..., description="位置信息")
    certifications: List[str] = Field(default=[], description="资质认证")
    teaching_style: str = Field(..., description="教学风格")
    description: str = Field(..., description="个人描述")
    availability: List[str] = Field(default=[], description="可预约时间")

class Teacher(TeacherCreate):
    """教师完整模型"""
    id: str = Field(..., description="教师ID")
    rating: float = Field(default=0.0, description="平均评分", ge=0, le=5)
    reviews: int = Field(default=0, description="评价数量", ge=0)
    detailed_ratings: DetailedRatings = Field(default_factory=lambda: DetailedRatings(
        teaching=0.0, patience=0.0, communication=0.0, effectiveness=0.0
    ), description="详细评分")

class StudentCreate(UserBase):
    """创建学生请求模型"""
    grade: str = Field(..., description="年级")
    target_score: int = Field(..., description="目标分数", ge=0)
    weak_subjects: List[str] = Field(default=[], description="薄弱科目")
    study_goals: List[str] = Field(default=[], description="学习目标")

class Student(StudentCreate):
    """学生完整模型"""
    id: str = Field(..., description="学生ID")
    location: Optional[Location] = Field(None, description="位置信息")

# 预约相关模型
class PackageInfo(BaseModel):
    """课程包信息模型"""
    total_lessons: int = Field(..., description="总课时数", ge=1)
    completed_lessons: int = Field(default=0, description="已完成课时数", ge=0)

class AppointmentCreate(BaseModel):
    """创建预约请求模型"""
    teacher_id: str = Field(..., description="教师ID")
    student_name: str = Field(..., description="学生姓名")  # MVP阶段简化
    subject: str = Field(..., description="预约科目")
    appointment_time: datetime = Field(..., description="预约时间")
    notes: str = Field(default="", description="备注信息")
    lesson_type: LessonType = Field(default=LessonType.SINGLE, description="课程类型")
    package_info: Optional[PackageInfo] = Field(None, description="课程包信息")

class Appointment(AppointmentCreate):
    """预约完整模型"""
    id: str = Field(..., description="预约ID")
    student_id: Optional[str] = Field(None, description="学生ID")  # MVP阶段可选
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING, description="预约状态")
    price: float = Field(..., description="课程费用", ge=0)
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")

class AppointmentUpdate(BaseModel):
    """更新预约模型"""
    status: Optional[AppointmentStatus] = Field(None, description="预约状态")
    notes: Optional[str] = Field(None, description="备注信息")

# 评价相关模型
class ReviewRatings(BaseModel):
    """评价评分模型"""
    overall: int = Field(..., description="总体评分", ge=1, le=5)
    teaching: int = Field(..., description="教学能力评分", ge=1, le=5)
    patience: int = Field(..., description="耐心程度评分", ge=1, le=5)
    communication: int = Field(..., description="沟通能力评分", ge=1, le=5)
    effectiveness: int = Field(..., description="教学效果评分", ge=1, le=5)

class ReviewCreate(BaseModel):
    """创建评价请求模型"""
    appointment_id: str = Field(..., description="预约ID")
    student_name: str = Field(..., description="学生姓名")  # MVP阶段简化
    ratings: ReviewRatings = Field(..., description="评分信息")
    comment: str = Field(..., description="评价内容")
    is_recommended: bool = Field(default=True, description="是否推荐")
    tags: List[str] = Field(default=[], description="评价标签")

class Review(ReviewCreate):
    """评价完整模型"""
    id: str = Field(..., description="评价ID")
    teacher_id: str = Field(..., description="教师ID")
    student_id: Optional[str] = Field(None, description="学生ID")  # MVP阶段可选
    review_date: date = Field(default_factory=date.today, description="评价日期")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")

# 成绩记录相关模型
class ScoreRecordCreate(BaseModel):
    """创建成绩记录请求模型"""
    student_id: str = Field(..., description="学生ID")
    subject: str = Field(..., description="科目")
    test_type: str = Field(..., description="考试类型")
    before_score: float = Field(..., description="课前成绩", ge=0)
    after_score: float = Field(..., description="课后成绩", ge=0)
    max_score: float = Field(..., description="满分", gt=0)
    lesson_count: int = Field(..., description="课时数", ge=1)
    notes: str = Field(default="", description="备注")

class ScoreRecord(ScoreRecordCreate):
    """成绩记录完整模型"""
    id: str = Field(..., description="记录ID")
    teacher_id: str = Field(..., description="教师ID")
    record_date: date = Field(default_factory=date.today, description="记录日期")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")

    @validator('after_score')
    def after_score_must_be_valid(cls, v, values):
        if 'max_score' in values and v > values['max_score']:
            raise ValueError('课后成绩不能超过满分')
        return v

    @validator('before_score')
    def before_score_must_be_valid(cls, v, values):
        if 'max_score' in values and v > values['max_score']:
            raise ValueError('课前成绩不能超过满分')
        return v

# 分析统计相关模型
class SubjectImprovement(BaseModel):
    """科目进步统计模型"""
    subject: str = Field(..., description="科目名称")
    total_improvement: float = Field(..., description="总提升分数")
    average_improvement: float = Field(..., description="平均提升分数")
    improvement_percent: float = Field(..., description="提升百分比")
    record_count: int = Field(..., description="记录数量")
    lesson_count: int = Field(..., description="总课时数")
    latest_score: float = Field(..., description="最新成绩")
    initial_score: float = Field(..., description="初始成绩")

class StudentAnalytics(BaseModel):
    """学生分析统计模型"""
    student_id: str = Field(..., description="学生ID")
    total_improvement: float = Field(..., description="总提升分数")
    total_lessons: int = Field(..., description="总课时数")
    subjects_count: int = Field(..., description="学习科目数")
    improvements_by_subject: Dict[str, SubjectImprovement] = Field(..., description="各科目进步详情")

class TeacherAnalytics(BaseModel):
    """教师分析统计模型"""
    teacher_id: str = Field(..., description="教师ID")
    students_count: int = Field(..., description="教授学生数")
    average_improvement: float = Field(..., description="平均提分")
    total_lessons: int = Field(..., description="总课时数")
    recommendation_rate: float = Field(..., description="推荐率", ge=0, le=100)
    total_reviews: int = Field(..., description="总评价数")

# API响应模型
class TeacherList(BaseModel):
    """教师列表响应模型"""
    teachers: List[Teacher] = Field(..., description="教师列表")
    total: int = Field(..., description="总数量")
    skip: int = Field(..., description="跳过数量")
    limit: int = Field(..., description="限制数量")

class AppointmentList(BaseModel):
    """预约列表响应模型"""
    appointments: List[Appointment] = Field(..., description="预约列表")
    total: int = Field(..., description="总数量")
    skip: int = Field(..., description="跳过数量")
    limit: int = Field(..., description="限制数量")

class ReviewList(BaseModel):
    """评价列表响应模型"""
    reviews: List[Review] = Field(..., description="评价列表")
    total: int = Field(..., description="总数量")
    skip: int = Field(..., description="跳过数量")
    limit: int = Field(..., description="限制数量")

class APIResponse(BaseModel):
    """API统一响应模型"""
    success: bool = Field(..., description="请求是否成功")
    message: str = Field(..., description="响应消息")
    data: Optional[Dict] = Field(None, description="响应数据")

class PaginatedResponse(BaseModel):
    """分页响应模型"""
    items: List[Dict] = Field(..., description="数据列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="页面大小")
    pages: int = Field(..., description="总页数")

# 认证相关模型
class UserProfile(BaseModel):
    """用户个人资料模型 - 包含ID字段用于/auth/me端点"""
    id: str = Field(..., description="用户ID")
    name: str = Field(..., description="用户姓名")
    email: EmailStr = Field(..., description="邮箱地址")
    phone: str = Field(..., description="手机号码")
    role: UserRole = Field(..., description="用户角色")
    avatar: Optional[str] = Field(None, description="头像URL")

class UserRegister(BaseModel):
    """用户注册请求模型"""
    name: str = Field(..., min_length=2, max_length=50, description="用户姓名")
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., min_length=8, max_length=128, description="密码")
    phone: str = Field(..., pattern=r'^1[3-9]\d{9}$', description="手机号码")
    role: UserRole = Field(..., description="用户角色")
    
    @validator('password')
    def validate_password(cls, v):
        """密码强度验证"""
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not any(c.islower() for c in v):
            raise ValueError('密码必须包含至少一个小写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含至少一个数字')
        return v

class UserLogin(BaseModel):
    """用户登录请求模型"""
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., description="密码")

class UserInDB(UserBase):
    """数据库中的用户模型"""
    id: str = Field(..., description="用户ID")
    hashed_password: str = Field(..., description="加密后的密码")
    is_active: bool = Field(default=True, description="是否激活")
    is_verified: bool = Field(default=False, description="邮箱是否已验证")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")

class Token(BaseModel):
    """Token响应模型"""
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间（秒）")

class TokenData(BaseModel):
    """Token数据模型"""
    user_id: Optional[str] = Field(None, description="用户ID")
    email: Optional[str] = Field(None, description="邮箱")
    role: Optional[str] = Field(None, description="用户角色")
    exp: Optional[int] = Field(None, description="过期时间戳")

class RefreshTokenRequest(BaseModel):
    """刷新Token请求模型"""
    refresh_token: str = Field(..., description="刷新令牌")

class PasswordResetRequest(BaseModel):
    """密码重置请求模型"""
    email: EmailStr = Field(..., description="邮箱地址")

class PasswordReset(BaseModel):
    """密码重置模型"""
    token: str = Field(..., description="重置令牌")
    new_password: str = Field(..., min_length=8, max_length=128, description="新密码")
    
    @validator('new_password')
    def validate_password(cls, v):
        """密码强度验证"""
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not any(c.islower() for c in v):
            raise ValueError('密码必须包含至少一个小写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含至少一个数字')
        return v

class PasswordChange(BaseModel):
    """修改密码模型"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=8, max_length=128, description="新密码")
    
    @validator('new_password')
    def validate_password(cls, v):
        """密码强度验证"""
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not any(c.islower() for c in v):
            raise ValueError('密码必须包含至少一个小写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含至少一个数字')
        return v

# 配置模型
class Config:
    """Pydantic配置"""
    # 允许字段别名
    allow_population_by_field_name = True
    # JSON编码器
    json_encoders = {
        datetime: lambda v: v.isoformat(),
        date: lambda v: v.isoformat(),
    }