from fastapi import APIRouter
from app.api import teachers, appointments, analytics, auth

# 主API路由器
api_router = APIRouter()

# 注册路由
api_router.include_router(auth.router, tags=["认证"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# 健康检查路由
@api_router.get("/ping")
async def ping():
    """简单的健康检查"""
    return {"message": "pong"}