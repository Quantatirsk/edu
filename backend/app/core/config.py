from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # 项目基础配置
    PROJECT_NAME: str = "优教通 API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./youjiaotong.db"
    
    # 开发环境配置
    DEBUG: bool = True
    
    # CORS配置
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 创建全局配置实例
settings = Settings()