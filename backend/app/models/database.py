"""
SQLAlchemy数据库模型定义
用于数据库表结构定义和ORM操作
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    """生成UUID字符串"""
    return str(uuid.uuid4())

class BaseModel:
    """数据库模型基类"""
    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class User(Base, BaseModel):
    """用户表"""
    __tablename__ = "users"
    
    name = Column(String(100), nullable=False, comment="用户姓名")
    email = Column(String(255), unique=True, nullable=False, comment="邮箱地址")
    phone = Column(String(20), nullable=False, comment="手机号码")
    role = Column(String(20), nullable=False, comment="用户角色: student/teacher/admin")
    avatar = Column(String(500), comment="头像URL")
    
    # 认证相关字段
    hashed_password = Column(String(255), nullable=False, comment="加密后的密码")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_verified = Column(Boolean, default=False, comment="邮箱是否已验证")
    last_login = Column(DateTime, comment="最后登录时间")
    login_attempts = Column(Integer, default=0, comment="登录尝试次数")
    locked_until = Column(DateTime, comment="账户锁定到期时间")
    
    # 位置信息 (JSON格式存储)
    location = Column(JSON, comment="位置信息")
    
    # 学生特有字段
    grade = Column(String(50), comment="年级")
    target_score = Column(Integer, comment="目标分数")
    weak_subjects = Column(JSON, comment="薄弱科目")
    study_goals = Column(JSON, comment="学习目标")
    
    # 教师特有字段
    subject = Column(JSON, comment="教学科目")
    experience = Column(Integer, comment="教学经验年数")
    price = Column(Float, comment="课时费")
    rating = Column(Float, default=0.0, comment="平均评分")
    reviews_count = Column(Integer, default=0, comment="评价数量")
    detailed_ratings = Column(JSON, comment="详细评分")
    certifications = Column(JSON, comment="资质认证")
    teaching_style = Column(Text, comment="教学风格")
    description = Column(Text, comment="个人描述")
    availability = Column(JSON, comment="可预约时间")

class Appointment(Base, BaseModel):
    """预约表"""
    __tablename__ = "appointments"
    
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False, comment="教师ID")
    student_id = Column(String, ForeignKey("users.id"), comment="学生ID")
    student_name = Column(String(100), nullable=False, comment="学生姓名")  # MVP阶段使用
    subject = Column(String(50), nullable=False, comment="预约科目")
    appointment_time = Column(DateTime, nullable=False, comment="预约时间")
    status = Column(String(20), default="pending", comment="预约状态")
    price = Column(Float, nullable=False, comment="课程费用")
    notes = Column(Text, comment="备注信息")
    lesson_type = Column(String(20), default="single", comment="课程类型")
    package_info = Column(JSON, comment="课程包信息")
    
    # 建立关系
    teacher = relationship("User", foreign_keys=[teacher_id], backref="teacher_appointments")
    student = relationship("User", foreign_keys=[student_id], backref="student_appointments")

class Review(Base, BaseModel):
    """评价表"""
    __tablename__ = "reviews"
    
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=False, comment="预约ID")
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False, comment="教师ID")
    student_id = Column(String, ForeignKey("users.id"), comment="学生ID")
    student_name = Column(String(100), nullable=False, comment="学生姓名")  # MVP阶段使用
    
    # 评分信息 (JSON格式存储)
    ratings = Column(JSON, nullable=False, comment="评分信息")
    
    comment = Column(Text, nullable=False, comment="评价内容")
    is_recommended = Column(Boolean, default=True, comment="是否推荐")
    tags = Column(JSON, comment="评价标签")
    date = Column(Date, default=func.current_date(), comment="评价日期")
    
    # 建立关系
    appointment = relationship("Appointment", backref="reviews")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="received_reviews")
    student = relationship("User", foreign_keys=[student_id], backref="given_reviews")

class ScoreRecord(Base, BaseModel):
    """成绩记录表"""
    __tablename__ = "score_records"
    
    student_id = Column(String, ForeignKey("users.id"), nullable=False, comment="学生ID")
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False, comment="教师ID")
    subject = Column(String(50), nullable=False, comment="科目")
    test_type = Column(String(50), nullable=False, comment="考试类型")
    before_score = Column(Float, nullable=False, comment="课前成绩")
    after_score = Column(Float, nullable=False, comment="课后成绩")
    max_score = Column(Float, nullable=False, comment="满分")
    lesson_count = Column(Integer, nullable=False, comment="课时数")
    notes = Column(Text, comment="备注")
    date = Column(Date, default=func.current_date(), comment="记录日期")
    
    # 建立关系
    student = relationship("User", foreign_keys=[student_id], backref="score_records")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="teaching_records")

# 索引定义
from sqlalchemy import Index

# 为常用查询添加索引
Index('idx_user_email', User.email)
Index('idx_user_role', User.role)
Index('idx_appointment_teacher', Appointment.teacher_id)
Index('idx_appointment_student', Appointment.student_id)
Index('idx_appointment_time', Appointment.appointment_time)
Index('idx_appointment_status', Appointment.status)
Index('idx_review_teacher', Review.teacher_id)
Index('idx_review_date', Review.date)
Index('idx_score_student', ScoreRecord.student_id)
Index('idx_score_teacher', ScoreRecord.teacher_id)
Index('idx_score_subject', ScoreRecord.subject)