from fastapi import APIRouter
from app.api import teachers, appointments, analytics, auth

# 主API路由器
api_router = APIRouter()

# 注册路由
api_router.include_router(auth.router, tags=["认证"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
# 添加学生和教师预约路由（不带前缀，直接匹配 /students/{id}/appointments 和 /teachers/{id}/appointments）
from app.api.appointments import get_student_appointments, get_teacher_appointments
api_router.add_api_route("/students/{student_id}/appointments", get_student_appointments, methods=["GET"], tags=["appointments"])
api_router.add_api_route("/teachers/{teacher_id}/appointments", get_teacher_appointments, methods=["GET"], tags=["appointments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# 健康检查路由
@api_router.get("/ping")
async def ping():
    """简单的健康检查"""
    return {"message": "pong"}