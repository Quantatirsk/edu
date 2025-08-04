"""
数据库连接配置和会话管理
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.core.config import settings
from app.models.database import Base
import os

# 创建数据库引擎
# 使用SQLite的特殊配置以支持并发访问
engine = create_engine(
    settings.DATABASE_URL,
    # SQLite特定配置
    connect_args={
        "check_same_thread": False  # 允许多线程访问
    },
    # 连接池配置 - 对SQLite来说使用StaticPool
    poolclass=StaticPool,
    # 回显SQL查询（开发环境）
    echo=settings.DEBUG
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_database():
    """创建数据库表"""
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成！")

def get_database():
    """获取数据库会话的依赖函数"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db():
    """获取数据库会话的依赖函数（FastAPI依赖）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """初始化数据库"""
    # 确保数据库文件的目录存在
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    # 创建所有表
    create_database()
    
    print(f"✅ 数据库初始化完成！数据库文件位置: {db_path}")

def drop_database():
    """删除所有数据库表"""
    print("警告：正在删除所有数据库表...")
    Base.metadata.drop_all(bind=engine)
    print("✅ 数据库表删除完成！")

def reset_database():
    """重置数据库（删除后重新创建）"""
    print("正在重置数据库...")
    drop_database()
    create_database()
    print("✅ 数据库重置完成！")

# 数据库会话上下文管理器
class DatabaseSession:
    """数据库会话上下文管理器"""
    
    def __init__(self):
        self.db = None
    
    def __enter__(self) -> Session:
        self.db = SessionLocal()
        return self.db
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.db.rollback()
        else:
            self.db.commit()
        self.db.close()

# 便捷函数
def get_db_session() -> Session:
    """获取数据库会话（需手动关闭）"""
    return SessionLocal()