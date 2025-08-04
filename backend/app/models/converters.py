"""
模型转换工具
在Pydantic模型和SQLAlchemy模型之间进行转换
"""

from typing import List, Optional, Dict, Any
from . import schemas, database

def db_user_to_teacher(db_user: database.User) -> schemas.Teacher:
    """将数据库用户模型转换为教师Pydantic模型"""
    if db_user.role != "teacher":
        raise ValueError("用户角色不是教师")
    
    return schemas.Teacher(
        id=db_user.id,
        name=db_user.name,
        email=db_user.email,
        phone=db_user.phone,
        role=db_user.role,
        avatar=db_user.avatar,
        subject=db_user.subject or [],
        experience=db_user.experience or 0,
        price=db_user.price or 0.0,
        rating=db_user.rating or 0.0,
        reviews=db_user.reviews_count or 0,
        location=schemas.Location(**db_user.location) if db_user.location else None,
        detailed_ratings=schemas.DetailedRatings(**db_user.detailed_ratings) if db_user.detailed_ratings else schemas.DetailedRatings(
            teaching=0.0, patience=0.0, communication=0.0, effectiveness=0.0
        ),
        certifications=db_user.certifications or [],
        teaching_style=db_user.teaching_style or "",
        description=db_user.description or "",
        availability=db_user.availability or []
    )

def db_user_to_student(db_user: database.User) -> schemas.Student:
    """将数据库用户模型转换为学生Pydantic模型"""
    if db_user.role != "student":
        raise ValueError("用户角色不是学生")
    
    return schemas.Student(
        id=db_user.id,
        name=db_user.name,
        email=db_user.email,
        phone=db_user.phone,
        role=db_user.role,
        avatar=db_user.avatar,
        grade=db_user.grade or "",
        target_score=db_user.target_score or 0,
        weak_subjects=db_user.weak_subjects or [],
        study_goals=db_user.study_goals or [],
        location=schemas.Location(**db_user.location) if db_user.location else None
    )

def teacher_create_to_db_user(teacher: schemas.TeacherCreate) -> database.User:
    """将创建教师请求转换为数据库用户模型"""
    return database.User(
        name=teacher.name,
        email=teacher.email,
        phone=teacher.phone,
        role=teacher.role.value,
        avatar=teacher.avatar,
        subject=teacher.subject,
        experience=teacher.experience,
        price=teacher.price,
        location=teacher.location.dict() if teacher.location else None,
        detailed_ratings={
            "teaching": 0.0,
            "patience": 0.0,
            "communication": 0.0,
            "effectiveness": 0.0
        },
        certifications=teacher.certifications,
        teaching_style=teacher.teaching_style,
        description=teacher.description,
        availability=teacher.availability,
        rating=0.0,
        reviews_count=0
    )

def student_create_to_db_user(student: schemas.StudentCreate) -> database.User:
    """将创建学生请求转换为数据库用户模型"""
    return database.User(
        name=student.name,
        email=student.email,
        phone=student.phone,
        role=student.role.value,
        avatar=student.avatar,
        grade=student.grade,
        target_score=student.target_score,
        weak_subjects=student.weak_subjects,
        study_goals=student.study_goals
    )

def db_appointment_to_pydantic(db_appointment: database.Appointment) -> schemas.Appointment:
    """将数据库预约模型转换为Pydantic模型"""
    return schemas.Appointment(
        id=db_appointment.id,
        teacher_id=db_appointment.teacher_id,
        student_id=db_appointment.student_id,
        student_name=db_appointment.student_name,
        subject=db_appointment.subject,
        appointment_time=db_appointment.appointment_time,
        status=db_appointment.status,
        price=db_appointment.price,
        notes=db_appointment.notes or "",
        lesson_type=db_appointment.lesson_type or "single",
        package_info=schemas.PackageInfo(**db_appointment.package_info) if db_appointment.package_info else None,
        created_at=db_appointment.created_at,
        updated_at=db_appointment.updated_at
    )

def appointment_create_to_db(appointment: schemas.AppointmentCreate, teacher_price: float) -> database.Appointment:
    """将创建预约请求转换为数据库模型"""
    return database.Appointment(
        teacher_id=appointment.teacher_id,
        student_name=appointment.student_name,
        subject=appointment.subject,
        appointment_time=appointment.appointment_time,
        price=teacher_price,  # 从教师信息获取价格
        notes=appointment.notes,
        lesson_type=appointment.lesson_type.value,
        package_info=appointment.package_info.dict() if appointment.package_info else None,
        status="pending"
    )

def db_review_to_pydantic(db_review: database.Review) -> schemas.Review:
    """将数据库评价模型转换为Pydantic模型"""
    return schemas.Review(
        id=db_review.id,
        appointment_id=db_review.appointment_id,
        teacher_id=db_review.teacher_id,
        student_id=db_review.student_id,
        student_name=db_review.student_name,
        ratings=schemas.ReviewRatings(**db_review.ratings),
        comment=db_review.comment,
        is_recommended=db_review.is_recommended,
        tags=db_review.tags or [],
        review_date=db_review.date,
        created_at=db_review.created_at
    )

def review_create_to_db(review: schemas.ReviewCreate, teacher_id: str) -> database.Review:
    """将创建评价请求转换为数据库模型"""
    return database.Review(
        appointment_id=review.appointment_id,
        teacher_id=teacher_id,
        student_name=review.student_name,
        ratings=review.ratings.dict(),
        comment=review.comment,
        is_recommended=review.is_recommended,
        tags=review.tags
    )

def db_score_record_to_pydantic(db_record: database.ScoreRecord) -> schemas.ScoreRecord:
    """将数据库成绩记录转换为Pydantic模型"""
    return schemas.ScoreRecord(
        id=db_record.id,
        student_id=db_record.student_id,
        teacher_id=db_record.teacher_id,
        subject=db_record.subject,
        test_type=db_record.test_type,
        before_score=db_record.before_score,
        after_score=db_record.after_score,
        max_score=db_record.max_score,
        lesson_count=db_record.lesson_count,
        notes=db_record.notes or "",
        record_date=db_record.date,
        created_at=db_record.created_at
    )

def score_record_create_to_db(record: schemas.ScoreRecordCreate, teacher_id: str) -> database.ScoreRecord:
    """将创建成绩记录请求转换为数据库模型"""
    return database.ScoreRecord(
        student_id=record.student_id,
        teacher_id=teacher_id,
        subject=record.subject,
        test_type=record.test_type,
        before_score=record.before_score,
        after_score=record.after_score,
        max_score=record.max_score,
        lesson_count=record.lesson_count,
        notes=record.notes
    )

def calculate_teacher_ratings(reviews: List[schemas.Review]) -> schemas.DetailedRatings:
    """计算教师的详细评分"""
    if not reviews:
        return schemas.DetailedRatings(
            teaching=0.0, patience=0.0, communication=0.0, effectiveness=0.0
        )
    
    total_teaching = sum(r.ratings.teaching for r in reviews)
    total_patience = sum(r.ratings.patience for r in reviews)
    total_communication = sum(r.ratings.communication for r in reviews)
    total_effectiveness = sum(r.ratings.effectiveness for r in reviews)
    count = len(reviews)
    
    return schemas.DetailedRatings(
        teaching=round(total_teaching / count, 1),
        patience=round(total_patience / count, 1),
        communication=round(total_communication / count, 1),
        effectiveness=round(total_effectiveness / count, 1)
    )

def calculate_overall_rating(reviews: List[schemas.Review]) -> float:
    """计算教师的总体评分"""
    if not reviews:
        return 0.0
    
    total_rating = sum(r.ratings.overall for r in reviews)
    return round(total_rating / len(reviews), 1)