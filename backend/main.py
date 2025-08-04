from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import api_router

app = FastAPI(
    title="优教通 API",
    description="在线教辅管理平台后端服务",
    version="1.0.0",
)

# CORS配置 - 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite默认端口
        "http://localhost:5174",  # Vite备用端口
        "http://localhost:3000",  # React/Next.js开发服务器
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    """健康检查接口"""
    return {"message": "优教通 API 服务运行正常", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "service": "youjiaotong-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )