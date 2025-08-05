"""
预约相关API路由 - 修复版本
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_database
from app.db.crud import appointment, user
from app.models.schemas import Appointment, AppointmentCreate, AppointmentUpdate, AppointmentList

router = APIRouter()


def convert_appointment_to_dict(app_db, db: Session = None):
    """Convert database appointment to dict with proper lesson_type handling"""
    # Convert lesson_type to frontend-compatible format
    lesson_type = app_db.lesson_type
    if lesson_type == "one-on-one":
        lesson_type = "single"  # Map to valid enum value
    
    # Get teacher info for display if database session available
    teacher_name = "未知教师"
    if db:
        teacher_info = user.get(db=db, id=app_db.teacher_id)
        teacher_name = teacher_info.name if teacher_info else "未知教师"
    
    # Format date and time for frontend
    date_str = app_db.appointment_time.strftime("%Y-%m-%d")
    time_str = app_db.appointment_time.strftime("%H:%M")
    
    return {
        "id": app_db.id,
        "teacher_id": app_db.teacher_id,
        "teacherId": app_db.teacher_id,  # Frontend compatibility
        "teacherName": teacher_name,
        "student_id": app_db.student_id,
        "studentId": app_db.student_id,  # Frontend compatibility
        "student_name": app_db.student_name,
        "studentName": app_db.student_name,  # Frontend compatibility
        "subject": app_db.subject,
        "appointment_time": app_db.appointment_time,
        "date": date_str,  # Frontend needs separate date
        "time": time_str,  # Frontend needs separate time
        "status": app_db.status,
        "price": app_db.price,
        "notes": app_db.notes,
        "lesson_type": lesson_type,  # Use converted value
        "package_info": app_db.package_info,
        "created_at": app_db.created_at,
        "updated_at": app_db.updated_at
    }


@router.post("/", response_model=dict)
async def create_appointment(
    appointment_data: dict,  # Accept raw dict to handle frontend format
    db: Session = Depends(get_database)
):
    """
    创建新预约
    
    - **teacher_id**: 教师ID
    - **student_name**: 学生姓名
    - **subject**: 预约科目
    - **appointment_time**: 预约时间
    - **notes**: 备注信息
    - **lesson_type**: 课程类型 (single|package)
    """
    try:
        # 处理前端数据格式转换
        teacher_id = appointment_data.get("teacherId") or appointment_data.get("teacher_id")
        if not teacher_id:
            raise HTTPException(status_code=400, detail="缺少教师ID")
        
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 处理时间格式 - 前端发送 date 和 time，需要合并为 appointment_time
        date_str = appointment_data.get("date")
        time_str = appointment_data.get("time")
        if not date_str or not time_str:
            raise HTTPException(status_code=400, detail="缺少预约日期或时间")
        
        # 解析日期和时间
        try:
            appointment_datetime = datetime.fromisoformat(f"{date_str}T{time_str}:00")
        except ValueError:
            raise HTTPException(status_code=400, detail="日期或时间格式错误")
        
        # 检查预约时间是否在未来
        if appointment_datetime <= datetime.now():
            raise HTTPException(status_code=400, detail="预约时间必须在未来")
        
        # 创建预约记录 - 转换为后端期望的格式
        appointment_dict = {
            "teacher_id": teacher_id,
            "student_id": appointment_data.get("studentId"),
            "student_name": appointment_data.get("studentName"),
            "subject": appointment_data.get("subject"),
            "appointment_time": appointment_datetime,
            "notes": appointment_data.get("notes", ""),
            "lesson_type": appointment_data.get("lessonType", "one-on-one"),
            "price": appointment_data.get("price", teacher.price),  # 使用前端计算的价格或教师的课时费
            "status": appointment_data.get("status", "pending"),
        }
        
        db_appointment = appointment.create(db=db, obj_in=appointment_dict)
        
        # 转换为Pydantic模型 - 包含前端需要的字段
        appointment_response = {
            "id": db_appointment.id,
            "teacher_id": db_appointment.teacher_id,
            "teacherId": db_appointment.teacher_id,  # 前端兼容性
            "teacherName": teacher.name,  # 添加教师姓名
            "student_id": db_appointment.student_id,
            "studentId": db_appointment.student_id,  # 前端兼容性
            "student_name": db_appointment.student_name,
            "studentName": db_appointment.student_name,  # 前端兼容性
            "subject": db_appointment.subject,
            "appointment_time": db_appointment.appointment_time,
            "date": db_appointment.appointment_time.strftime("%Y-%m-%d"),  # 前端需要的日期格式
            "time": db_appointment.appointment_time.strftime("%H:%M"),  # 前端需要的时间格式
            "duration": appointment_data.get("duration", 60),  # 前端发送的时长
            "status": db_appointment.status,
            "price": db_appointment.price,
            "notes": db_appointment.notes,
            "lesson_type": db_appointment.lesson_type,
            "lessonType": db_appointment.lesson_type,  # 前端兼容性
            "package_info": db_appointment.package_info,
            "created_at": db_appointment.created_at,
            "createdAt": db_appointment.created_at.isoformat() if db_appointment.created_at else None,  # 前端兼容性
            "updated_at": db_appointment.updated_at,
            "updatedAt": db_appointment.updated_at.isoformat() if db_appointment.updated_at else None,  # 前端兼容性
        }
        
        # Return raw dict to include all frontend-compatible fields
        return appointment_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建预约失败: {str(e)}")


@router.get("/", response_model=AppointmentList)
async def get_appointments(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    teacher_id: Optional[str] = Query(None, description="教师ID筛选"),
    student_id: Optional[str] = Query(None, description="学生ID筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    db: Session = Depends(get_database)
):
    """
    获取预约列表
    
    - **skip**: 跳过的记录数
    - **limit**: 返回的记录数
    - **teacher_id**: 教师ID筛选
    - **student_id**: 学生ID筛选
    - **status**: 状态筛选 (pending|confirmed|completed|cancelled)
    """
    try:
        appointments_db = []
        total = 0
        
        # 根据筛选条件获取预约
        if teacher_id:
            appointments_db = appointment.get_by_teacher(db=db, teacher_id=teacher_id, skip=skip, limit=limit)
            total = appointment.count(db=db, filters={"teacher_id": teacher_id})
        elif student_id:
            appointments_db = appointment.get_by_student(db=db, student_id=student_id, skip=skip, limit=limit)
            total = appointment.count(db=db, filters={"student_id": student_id})
        elif status:
            appointments_db = appointment.get_by_status(db=db, status=status, skip=skip, limit=limit)
            total = appointment.count(db=db, filters={"status": status})
        else:
            appointments_db = appointment.get_multi(db=db, skip=skip, limit=limit)
            total = appointment.count(db=db)
        
        # 转换为Pydantic模型 - 使用helper函数
        appointments = []
        for app_db in appointments_db:
            app_dict = convert_appointment_to_dict(app_db, db)
            appointments.append(Appointment(**app_dict))
        
        return AppointmentList(
            appointments=appointments,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取预约列表失败: {str(e)}")


@router.get("/{appointment_id}", response_model=Appointment)
async def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_database)
):
    """
    获取预约详情
    
    - **appointment_id**: 预约ID
    """
    try:
        app_db = appointment.get(db=db, id=appointment_id)
        
        if not app_db:
            raise HTTPException(status_code=404, detail="预约不存在")
        
        # 转换为Pydantic模型 - 使用helper函数
        app_dict = convert_appointment_to_dict(app_db, db)
        return Appointment(**app_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取预约详情失败: {str(e)}")


@router.put("/{appointment_id}", response_model=Appointment)
async def update_appointment(
    appointment_id: str,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_database)
):
    """
    更新预约状态
    
    - **appointment_id**: 预约ID
    - **status**: 新状态 (pending|confirmed|completed|cancelled)
    - **notes**: 备注信息
    """
    try:
        app_db = appointment.get(db=db, id=appointment_id)
        
        if not app_db:
            raise HTTPException(status_code=404, detail="预约不存在")
        
        # 更新预约
        updated_app = appointment.update(db=db, db_obj=app_db, obj_in=appointment_update)
        
        # 转换为Pydantic模型 - 使用helper函数
        app_dict = convert_appointment_to_dict(updated_app, db)
        return Appointment(**app_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新预约失败: {str(e)}")


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    db: Session = Depends(get_database)
):
    """
    删除预约
    
    - **appointment_id**: 预约ID
    """
    try:
        app_db = appointment.get(db=db, id=appointment_id)
        
        if not app_db:
            raise HTTPException(status_code=404, detail="预约不存在")
        
        # 只能删除pending状态的预约
        if app_db.status != "pending":
            raise HTTPException(status_code=400, detail="只能删除待确认状态的预约")
        
        appointment.delete(db=db, id=appointment_id)
        
        return {"message": "预约删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除预约失败: {str(e)}")


@router.get("/students/{student_id}/appointments", response_model=AppointmentList)
async def get_student_appointments(
    student_id: str,
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    status: Optional[str] = Query(None, description="状态筛选"),
    db: Session = Depends(get_database)
):
    """
    获取学生的预约列表
    
    - **student_id**: 学生ID
    - **skip**: 跳过的记录数
    - **limit**: 返回的记录数
    - **status**: 状态筛选 (pending|confirmed|completed|cancelled)
    """
    try:
        # 验证学生存在
        student = user.get(db=db, id=student_id)
        if not student or student.role != "student":
            raise HTTPException(status_code=404, detail="学生不存在")
        
        appointments_db = appointment.get_by_student(db=db, student_id=student_id, skip=skip, limit=limit)
        total = appointment.count(db=db, filters={"student_id": student_id})
        
        # 如果有状态筛选，重新查询
        if status:
            filters = {"student_id": student_id, "status": status}
            appointments_db = appointment.get_multi(db=db, filters=filters, skip=skip, limit=limit)
            total = appointment.count(db=db, filters=filters)
        
        # 转换为Pydantic模型 - 使用helper函数避免enum错误
        appointments = []
        for app_db in appointments_db:
            app_dict = convert_appointment_to_dict(app_db, db)
            appointments.append(Appointment(**app_dict))
        
        return AppointmentList(
            appointments=appointments,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error in get_student_appointments: {str(e)}")
        print(f"DEBUG: Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取学生预约列表失败: {str(e)}")


@router.get("/teachers/{teacher_id}/appointments", response_model=AppointmentList)
async def get_teacher_appointments(
    teacher_id: str,
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    status: Optional[str] = Query(None, description="状态筛选"),
    db: Session = Depends(get_database)
):
    """
    获取教师的预约列表
    
    - **teacher_id**: 教师ID
    - **skip**: 跳过的记录数
    - **limit**: 返回的记录数
    - **status**: 状态筛选 (pending|confirmed|completed|cancelled)
    """
    try:
        # 验证教师存在
        teacher = user.get(db=db, id=teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        appointments_db = appointment.get_by_teacher(db=db, teacher_id=teacher_id, skip=skip, limit=limit)
        total = appointment.count(db=db, filters={"teacher_id": teacher_id})
        
        # 如果有状态筛选，重新查询
        if status:
            filters = {"teacher_id": teacher_id, "status": status}
            appointments_db = appointment.get_multi(db=db, filters=filters, skip=skip, limit=limit)
            total = appointment.count(db=db, filters=filters)
        
        # 转换为Pydantic模型 - 使用helper函数避免enum错误
        appointments = []
        for app_db in appointments_db:
            app_dict = convert_appointment_to_dict(app_db, db)
            appointments.append(Appointment(**app_dict))
        
        return AppointmentList(
            appointments=appointments,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error in get_teacher_appointments: {str(e)}")
        print(f"DEBUG: Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取教师预约列表失败: {str(e)}")