"""
教师相关API路由
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.db.database import get_database
from app.db.crud import user, review
from app.models.schemas import Teacher, TeacherList, Review, ReviewCreate, ReviewList

router = APIRouter()


@router.get("/", response_model=TeacherList)
async def get_teachers(
    request: Request,
    # 基础分页参数
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    
    # 搜索参数
    query: Optional[str] = Query(None, description="搜索关键词"),
    
    # 排序参数
    sortBy: str = Query("rating", description="排序字段"),
    sortOrder: str = Query("desc", description="排序顺序"),
    
    db: Session = Depends(get_database)
):
    """
    获取教师列表
    
    - **page**: 页码
    - **limit**: 每页记录数
    - **query**: 搜索关键词
    - **sortBy**: 排序字段
    - **sortOrder**: 排序顺序
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * limit
        
        # 从查询参数中提取筛选条件
        subject = None
        
        # 检查各种可能的subject参数格式
        if 'filters[subject]' in request.query_params:
            subject_val = request.query_params.get('filters[subject]')
            if subject_val:
                subject = subject_val
        
        # 转换排序参数
        order_by = sortBy if sortBy in ['rating', 'price', 'experience'] else 'rating'
        order_desc = sortOrder.lower() == 'desc'
        
        # 获取教师列表
        teachers_db = user.get_teachers(
            db=db,
            skip=skip,
            limit=limit,
            subject=subject,
            search=query,
            order_by=order_by,
            order_desc=order_desc
        )
        
        # 转换为Pydantic模型
        teachers = []
        for teacher_db in teachers_db:
            teacher_dict = {
                "id": teacher_db.id,
                "name": teacher_db.name,
                "email": teacher_db.email,
                "phone": teacher_db.phone,
                "role": teacher_db.role,
                "avatar": teacher_db.avatar,
                "location": teacher_db.location,
                "subject": teacher_db.subject,
                "experience": teacher_db.experience,
                "price": teacher_db.price,
                "rating": teacher_db.rating,
                "reviews_count": teacher_db.reviews_count,
                "detailed_ratings": teacher_db.detailed_ratings,
                "certifications": teacher_db.certifications,
                "teaching_style": teacher_db.teaching_style,
                "description": teacher_db.description,
                "availability": teacher_db.availability,
                "created_at": teacher_db.created_at,
                "updated_at": teacher_db.updated_at
            }
            teachers.append(Teacher(**teacher_dict))
        
        # 获取总数（用于分页）
        count_filters = {"role": "teacher"}
        total = user.count(db=db, filters=count_filters)
        
        return TeacherList(
            teachers=teachers,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教师列表失败: {str(e)}")


@router.get("/subjects")
async def get_subjects(db: Session = Depends(get_database)):
    """
    获取所有教师科目列表
    
    返回格式: [{"subject": "数学", "count": 10}, ...]
    """
    try:
        # 获取所有教师的科目统计
        teachers_db = user.get_teachers(db=db, limit=1000)  # 获取所有教师
        
        # 统计科目分布
        subject_count = {}
        for teacher in teachers_db:
            if teacher.subject:  # 确保科目字段存在
                subjects = teacher.subject if isinstance(teacher.subject, list) else [teacher.subject]
                for subject in subjects:
                    if subject:  # 确保科目不为空
                        subject_count[subject] = subject_count.get(subject, 0) + 1
        
        # 转换为列表格式
        subjects = [
            {"subject": subject, "count": count}
            for subject, count in subject_count.items()
        ]
        
        # 按数量降序排序
        subjects.sort(key=lambda x: x["count"], reverse=True)
        
        return subjects
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取科目列表失败: {str(e)}")


@router.get("/{teacher_id}", response_model=Teacher)
async def get_teacher(
    teacher_id: str,
    db: Session = Depends(get_database)
):
    """
    获取教师详情
    
    - **teacher_id**: 教师ID
    """
    try:
        teacher_db = user.get(db=db, id=teacher_id)
        
        if not teacher_db:
            raise HTTPException(status_code=404, detail="教师不存在")
        
        if teacher_db.role != "teacher":
            raise HTTPException(status_code=404, detail="用户不是教师")
        
        # 转换为Pydantic模型
        teacher_dict = {
            "id": teacher_db.id,
            "name": teacher_db.name,
            "email": teacher_db.email,
            "phone": teacher_db.phone,
            "role": teacher_db.role,
            "avatar": teacher_db.avatar,
            "location": teacher_db.location,
            "subject": teacher_db.subject,
            "experience": teacher_db.experience,
            "price": teacher_db.price,
            "rating": teacher_db.rating,
            "reviews_count": teacher_db.reviews_count,
            "detailed_ratings": teacher_db.detailed_ratings,
            "certifications": teacher_db.certifications,
            "teaching_style": teacher_db.teaching_style,
            "description": teacher_db.description,
            "availability": teacher_db.availability,
            "created_at": teacher_db.created_at,
            "updated_at": teacher_db.updated_at
        }
        
        return Teacher(**teacher_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教师详情失败: {str(e)}")


@router.get("/{teacher_id}/stats")
async def get_teacher_stats(
    teacher_id: str,
    db: Session = Depends(get_database)
):
    """
    获取教师统计信息
    
    - **teacher_id**: 教师ID
    """
    try:
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 获取评价统计
        from app.db.crud import review
        rating_stats = review.get_teacher_rating_stats(db=db, teacher_id=teacher_id)
        
        # 获取成绩记录统计
        from app.db.crud import score_record
        score_records = score_record.get_by_teacher(db=db, teacher_id=teacher_id, limit=1000)
        
        # 计算教学效果统计
        total_students = len(set(record.student_id for record in score_records))
        avg_improvement = 0
        if score_records:
            improvements = [record.after_score - record.before_score for record in score_records]
            avg_improvement = sum(improvements) / len(improvements)
        
        return {
            "teacher_id": teacher_id,
            "rating_stats": rating_stats,
            "teaching_stats": {
                "total_students": total_students,
                "total_lessons": sum(record.lesson_count for record in score_records),
                "avg_improvement": round(avg_improvement, 1),
                "total_score_records": len(score_records)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教师统计失败: {str(e)}")


@router.post("/{teacher_id}/reviews", response_model=Review)
async def create_teacher_review(
    teacher_id: str,
    review_data: ReviewCreate,
    db: Session = Depends(get_database)
):
    """
    创建教师评价
    
    - **teacher_id**: 教师ID
    - **appointment_id**: 预约ID
    - **student_name**: 学生姓名
    - **ratings**: 评分信息
    - **comment**: 评价内容
    - **is_recommended**: 是否推荐
    - **tags**: 评价标签
    """
    try:
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 验证预约存在
        from app.db.crud import appointment
        app = appointment.get(db=db, id=review_data.appointment_id)
        if not app:
            raise HTTPException(status_code=404, detail="预约不存在")
        
        if app.teacher_id != teacher_id:
            raise HTTPException(status_code=400, detail="预约与教师不匹配")
        
        # 检查是否已经评价过
        existing_review = review.get_by_appointment(db=db, appointment_id=review_data.appointment_id)
        if existing_review:
            raise HTTPException(status_code=400, detail="该预约已经评价过")
        
        # 创建评价
        review_dict = review_data.dict()
        review_dict["teacher_id"] = teacher_id
        
        db_review = review.create(db=db, obj_in=review_dict)
        
        # 更新教师评分统计
        rating_stats = review.get_teacher_rating_stats(db=db, teacher_id=teacher_id)
        user.update_teacher_rating(
            db=db, 
            teacher_id=teacher_id, 
            new_rating=rating_stats["overall"], 
            review_count=int(rating_stats["count"])
        )
        
        # 转换为Pydantic模型
        review_response = {
            "id": db_review.id,
            "appointment_id": db_review.appointment_id,
            "teacher_id": db_review.teacher_id,
            "student_id": db_review.student_id,
            "student_name": db_review.student_name,
            "ratings": db_review.ratings,
            "comment": db_review.comment,
            "is_recommended": db_review.is_recommended,
            "tags": db_review.tags,
            "review_date": db_review.date,
            "created_at": db_review.created_at
        }
        
        return Review(**review_response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建评价失败: {str(e)}")


@router.get("/{teacher_id}/reviews", response_model=ReviewList)
async def get_teacher_reviews(
    teacher_id: str,
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    db: Session = Depends(get_database)
):
    """
    获取教师评价列表
    
    - **teacher_id**: 教师ID
    - **skip**: 跳过的记录数
    - **limit**: 返回的记录数
    """
    try:
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 获取评价列表
        reviews_db = review.get_by_teacher(db=db, teacher_id=teacher_id, skip=skip, limit=limit)
        
        # 获取总数
        total = review.count(db=db, filters={"teacher_id": teacher_id})
        
        # 转换为Pydantic模型
        reviews = []
        for review_db in reviews_db:
            review_dict = {
                "id": review_db.id,
                "appointment_id": review_db.appointment_id,
                "teacher_id": review_db.teacher_id,
                "student_id": review_db.student_id,
                "student_name": review_db.student_name,
                "ratings": review_db.ratings,
                "comment": review_db.comment,
                "is_recommended": review_db.is_recommended,
                "tags": review_db.tags,
                "review_date": review_db.date,
                "created_at": review_db.created_at
            }
            reviews.append(Review(**review_dict))
        
        return ReviewList(
            reviews=reviews,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教师评价失败: {str(e)}")


@router.get("/{teacher_id}/reviews/{review_id}", response_model=Review)
async def get_teacher_review(
    teacher_id: str,
    review_id: str,
    db: Session = Depends(get_database)
):
    """
    获取特定评价详情
    
    - **teacher_id**: 教师ID
    - **review_id**: 评价ID
    """
    try:
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 获取评价
        review_db = review.get(db=db, id=review_id)
        if not review_db:
            raise HTTPException(status_code=404, detail="评价不存在")
        
        if review_db.teacher_id != teacher_id:
            raise HTTPException(status_code=404, detail="评价不属于该教师")
        
        # 转换为Pydantic模型
        review_dict = {
            "id": review_db.id,
            "appointment_id": review_db.appointment_id,
            "teacher_id": review_db.teacher_id,
            "student_id": review_db.student_id,
            "student_name": review_db.student_name,
            "ratings": review_db.ratings,
            "comment": review_db.comment,
            "is_recommended": review_db.is_recommended,
            "tags": review_db.tags,
            "review_date": review_db.date,
            "created_at": review_db.created_at
        }
        
        return Review(**review_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取评价详情失败: {str(e)}")


