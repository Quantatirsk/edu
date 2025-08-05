"""
学习分析API路由
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_database
from app.db.crud import user, score_record, review
from app.models.schemas import StudentAnalytics, TeacherAnalytics, SubjectImprovement
from app.models.database import User
from app.api.auth import get_current_active_user

router = APIRouter()


@router.get("/student/{student_id}", response_model=StudentAnalytics)
async def get_student_analytics(
    student_id: str,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取学生进步统计
    
    - **student_id**: 学生ID
    
    权限控制：
    - 学生只能查看自己的数据
    - 教师可以查看自己学生的数据
    - 管理员可以查看所有数据
    """
    try:
        # 验证学生存在
        student = user.get(db=db, id=student_id)
        if not student:
            raise HTTPException(status_code=404, detail="用户不存在")
        if student.role != "student":
            raise HTTPException(status_code=404, detail="用户不是学生角色")
        
        # 权限检查
        if current_user.role == "student":
            # 学生只能查看自己的数据
            if current_user.id != student_id:
                raise HTTPException(status_code=403, detail="无权限访问其他学生的数据")
        elif current_user.role == "teacher":
            # 教师只能查看自己学生的数据
            # TODO: 添加师生关系检查，这里暂时允许所有教师查看
            pass
        elif current_user.role != "admin":
            # 非管理员角色无权限
            raise HTTPException(status_code=403, detail="无权限访问此数据")
        
        # 获取学生的所有成绩记录
        score_records = score_record.get_by_student(db=db, student_id=student_id, limit=1000)
        
        if not score_records:
            # 没有成绩记录的情况
            return StudentAnalytics(
                student_id=student_id,
                total_improvement=0.0,
                total_lessons=0,
                subjects_count=0,
                improvements_by_subject={}
            )
        
        # 按科目分组统计
        subjects_data = {}
        for record in score_records:
            subject = record.subject
            if subject not in subjects_data:
                subjects_data[subject] = {
                    "records": [],
                    "total_lessons": 0
                }
            subjects_data[subject]["records"].append(record)
            subjects_data[subject]["total_lessons"] += record.lesson_count
        
        # 计算每个科目的进步统计
        improvements_by_subject = {}
        total_improvement = 0.0
        total_lessons = 0
        
        for subject, data in subjects_data.items():
            records = sorted(data["records"], key=lambda x: x.date)
            
            # 计算总提升和平均提升
            subject_improvements = [r.after_score - r.before_score for r in records]
            total_subject_improvement = sum(subject_improvements)
            avg_improvement = total_subject_improvement / len(records) if records else 0
            
            # 计算提升百分比
            initial_score = records[0].before_score
            latest_score = records[-1].after_score
            improvement_percent = ((latest_score - initial_score) / initial_score * 100) if initial_score > 0 else 0
            
            improvements_by_subject[subject] = SubjectImprovement(
                subject=subject,
                total_improvement=total_subject_improvement,
                average_improvement=avg_improvement,
                improvement_percent=round(improvement_percent, 1),
                record_count=len(records),
                lesson_count=data["total_lessons"],
                latest_score=latest_score,
                initial_score=initial_score
            )
            
            total_improvement += total_subject_improvement
            total_lessons += data["total_lessons"]
        
        return StudentAnalytics(
            student_id=student_id,
            total_improvement=round(total_improvement, 1),
            total_lessons=total_lessons,
            subjects_count=len(subjects_data),
            improvements_by_subject=improvements_by_subject
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取学生分析失败: {str(e)}")


@router.get("/teacher/{teacher_id}", response_model=TeacherAnalytics)
async def get_teacher_analytics(
    teacher_id: str,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取教师教学统计
    
    - **teacher_id**: 教师ID
    
    权限控制：
    - 教师只能查看自己的数据
    - 管理员可以查看所有数据
    - 学生无权限访问教师数据
    """
    try:
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 权限检查
        if current_user.role == "teacher":
            # 教师只能查看自己的数据
            if current_user.id != teacher_id:
                raise HTTPException(status_code=403, detail="无权限访问其他教师的数据")
        elif current_user.role == "student":
            # 学生无权限访问教师分析数据
            raise HTTPException(status_code=403, detail="学生无权限访问教师分析数据")
        elif current_user.role != "admin":
            # 非管理员角色无权限
            raise HTTPException(status_code=403, detail="无权限访问此数据")
        
        # 获取教师的所有成绩记录
        score_records = score_record.get_by_teacher(db=db, teacher_id=teacher_id, limit=1000)
        
        # 获取教师的所有评价
        reviews = review.get_by_teacher(db=db, teacher_id=teacher_id, limit=1000)
        
        # 计算基础统计
        students_count = len(set(record.student_id for record in score_records))
        total_lessons = sum(record.lesson_count for record in score_records)
        
        # 计算平均提分
        avg_improvement = 0.0
        if score_records:
            improvements = [record.after_score - record.before_score for record in score_records]
            avg_improvement = sum(improvements) / len(improvements)
        
        # 计算推荐率
        recommendation_rate = 0.0
        if reviews:
            recommended_count = sum(1 for r in reviews if r.is_recommended)
            recommendation_rate = (recommended_count / len(reviews)) * 100
        
        return TeacherAnalytics(
            teacher_id=teacher_id,
            students_count=students_count,
            average_improvement=round(avg_improvement, 1),
            total_lessons=total_lessons,
            recommendation_rate=round(recommendation_rate, 1),
            total_reviews=len(reviews)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教师分析失败: {str(e)}")


@router.get("/subject/{subject}")
async def get_subject_analytics(
    subject: str,
    db: Session = Depends(get_database)
):
    """
    获取科目统计分析
    
    - **subject**: 科目名称
    """
    try:
        # 获取该科目的所有成绩记录
        all_records = score_record.get_multi(db=db, limit=10000)
        subject_records = [r for r in all_records if r.subject == subject]
        
        if not subject_records:
            return {
                "subject": subject,
                "total_students": 0,
                "total_teachers": 0,
                "total_lessons": 0,
                "average_improvement": 0.0,
                "success_rate": 0.0
            }
        
        # 统计基础数据
        students = set(r.student_id for r in subject_records)
        teachers = set(r.teacher_id for r in subject_records)
        total_lessons = sum(r.lesson_count for r in subject_records)
        
        # 计算平均提分
        improvements = [r.after_score - r.before_score for r in subject_records]
        avg_improvement = sum(improvements) / len(improvements)
        
        # 计算成功率（提分超过10分的比例）
        success_count = sum(1 for imp in improvements if imp >= 10)
        success_rate = (success_count / len(improvements)) * 100
        
        return {
            "subject": subject,
            "total_students": len(students),
            "total_teachers": len(teachers),
            "total_lessons": total_lessons,
            "average_improvement": round(avg_improvement, 1),
            "success_rate": round(success_rate, 1),
            "total_records": len(subject_records)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取科目分析失败: {str(e)}")


@router.get("/my-analytics")
async def get_my_analytics(
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前用户的分析数据
    
    自动根据用户角色返回相应的分析数据：
    - 学生：返回学生分析数据
    - 教师：返回教师分析数据
    """
    try:
        if current_user.role == "student":
            # 调用学生分析逻辑
            return await get_student_analytics(current_user.id, db, current_user)
        elif current_user.role == "teacher":
            # 调用教师分析逻辑
            return await get_teacher_analytics(current_user.id, db, current_user)
        else:
            raise HTTPException(status_code=400, detail="当前角色不支持分析功能")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分析数据失败: {str(e)}")


@router.get("/users/students")
async def get_students(
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取所有学生用户列表
    
    权限控制：仅管理员可访问
    """
    try:
        # 权限检查：仅管理员可访问
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="仅管理员可访问学生列表")
            
        students = user.get_multi(db=db, limit=1000)
        student_list = [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role
            }
            for u in students if u.role == "student"
        ]
        
        return {"students": student_list}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取学生列表失败: {str(e)}")


@router.get("/overview")
async def get_platform_overview(
    db: Session = Depends(get_database)
):
    """
    获取平台总体统计概览
    """
    try:
        # 获取基础统计
        all_users = user.get_multi(db=db, limit=10000)
        teachers = [u for u in all_users if u.role == "teacher"]
        students = [u for u in all_users if u.role == "student"]
        
        # 获取成绩记录统计
        all_score_records = score_record.get_multi(db=db, limit=10000)
        
        # 获取评价统计
        all_reviews = review.get_multi(db=db, limit=10000)
        
        # 计算总体统计
        total_lessons = sum(r.lesson_count for r in all_score_records)
        avg_improvement = 0.0
        if all_score_records:
            improvements = [r.after_score - r.before_score for r in all_score_records]
            avg_improvement = sum(improvements) / len(improvements)
        
        # 统计科目分布
        subjects = {}
        for record in all_score_records:
            subject = record.subject
            if subject not in subjects:
                subjects[subject] = 0
            subjects[subject] += 1
        
        # 平均评分
        avg_rating = 0.0
        if all_reviews:
            ratings = [r.ratings.get("overall", 0) for r in all_reviews if r.ratings]
            avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        return {
            "platform_stats": {
                "total_teachers": len(teachers),
                "total_students": len(students),
                "total_lessons": total_lessons,
                "total_reviews": len(all_reviews),
                "total_score_records": len(all_score_records)
            },
            "performance_stats": {
                "average_improvement": round(avg_improvement, 1),
                "average_rating": round(avg_rating, 1),
                "active_subjects": len(subjects)
            },
            "subject_distribution": subjects
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取平台概览失败: {str(e)}")