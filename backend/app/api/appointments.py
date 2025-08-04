"""
预约相关API路由
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_database
from app.db.crud import appointment, user
from app.models.schemas import Appointment, AppointmentCreate, AppointmentUpdate, AppointmentList

router = APIRouter()


@router.post("/", response_model=Appointment)
async def create_appointment(
    appointment_data: AppointmentCreate,
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
        # 验证教师存在
        teacher = user.get(db=db, id=appointment_data.teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=404, detail="教师不存在")
        
        # 检查预约时间是否在未来
        if appointment_data.appointment_time <= datetime.now():
            raise HTTPException(status_code=400, detail="预约时间必须在未来")
        
        # 创建预约记录
        appointment_dict = appointment_data.dict()
        appointment_dict["price"] = teacher.price  # 使用教师的课时费
        
        db_appointment = appointment.create(db=db, obj_in=appointment_dict)
        
        # 转换为Pydantic模型
        appointment_response = {
            "id": db_appointment.id,
            "teacher_id": db_appointment.teacher_id,
            "student_id": db_appointment.student_id,
            "student_name": db_appointment.student_name,
            "subject": db_appointment.subject,
            "appointment_time": db_appointment.appointment_time,
            "status": db_appointment.status,
            "price": db_appointment.price,
            "notes": db_appointment.notes,
            "lesson_type": db_appointment.lesson_type,
            "package_info": db_appointment.package_info,
            "created_at": db_appointment.created_at,
            "updated_at": db_appointment.updated_at
        }
        
        return Appointment(**appointment_response)
        
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
        
        # 转换为Pydantic模型
        appointments = []
        for app_db in appointments_db:
            app_dict = {
                "id": app_db.id,
                "teacher_id": app_db.teacher_id,
                "student_id": app_db.student_id,
                "student_name": app_db.student_name,
                "subject": app_db.subject,
                "appointment_time": app_db.appointment_time,
                "status": app_db.status,
                "price": app_db.price,
                "notes": app_db.notes,
                "lesson_type": app_db.lesson_type,
                "package_info": app_db.package_info,
                "created_at": app_db.created_at,
                "updated_at": app_db.updated_at
            }
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
        
        # 转换为Pydantic模型
        app_dict = {
            "id": app_db.id,
            "teacher_id": app_db.teacher_id,
            "student_id": app_db.student_id,
            "student_name": app_db.student_name,
            "subject": app_db.subject,
            "appointment_time": app_db.appointment_time,
            "status": app_db.status,
            "price": app_db.price,
            "notes": app_db.notes,
            "lesson_type": app_db.lesson_type,
            "package_info": app_db.package_info,
            "created_at": app_db.created_at,
            "updated_at": app_db.updated_at
        }
        
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
        
        # 转换为Pydantic模型
        app_dict = {
            "id": updated_app.id,
            "teacher_id": updated_app.teacher_id,
            "student_id": updated_app.student_id,
            "student_name": updated_app.student_name,
            "subject": updated_app.subject,
            "appointment_time": updated_app.appointment_time,
            "status": updated_app.status,
            "price": updated_app.price,
            "notes": updated_app.notes,
            "lesson_type": updated_app.lesson_type,
            "package_info": updated_app.package_info,
            "created_at": updated_app.created_at,
            "updated_at": updated_app.updated_at
        }
        
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