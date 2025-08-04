"""
JWT认证和密码处理工具
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt
from pydantic import ValidationError

from ..models.schemas import TokenData, UserInDB

# 密码上下文配置
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT配置
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

class AuthManager:
    """认证管理器"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """生成密码哈希"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """创建访问令牌"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        
        try:
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
        except Exception as e:
            raise ValueError(f"Token创建失败: {str(e)}")
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """创建刷新令牌"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        try:
            encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
        except Exception as e:
            raise ValueError(f"刷新Token创建失败: {str(e)}")
    
    @staticmethod
    def create_password_reset_token(email: str) -> str:
        """创建密码重置令牌"""
        expire = datetime.utcnow() + timedelta(hours=1)  # 1小时过期
        to_encode = {"email": email, "exp": expire, "type": "password_reset"}
        
        try:
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
        except Exception as e:
            raise ValueError(f"密码重置Token创建失败: {str(e)}")
    
    @staticmethod
    def verify_access_token(token: str) -> Optional[TokenData]:
        """验证访问令牌"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # 检查Token类型
            token_type = payload.get("type")
            if token_type != "access":
                return None
            
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role")
            exp: int = payload.get("exp")
            
            if user_id is None or email is None:
                return None
            
            token_data = TokenData(
                user_id=user_id,
                email=email,
                role=role,
                exp=exp
            )
            return token_data
            
        except JWTError:
            return None
        except ValidationError:
            return None
        except Exception:
            return None
    
    @staticmethod
    def verify_refresh_token(token: str) -> Optional[TokenData]:
        """验证刷新令牌"""
        try:
            payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
            
            # 检查Token类型
            token_type = payload.get("type")
            if token_type != "refresh":
                return None
            
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role")
            exp: int = payload.get("exp")
            
            if user_id is None or email is None:
                return None
            
            token_data = TokenData(
                user_id=user_id,
                email=email,
                role=role,
                exp=exp
            )
            return token_data
            
        except JWTError:
            return None
        except ValidationError:
            return None
        except Exception:
            return None
    
    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[str]:
        """验证密码重置令牌"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # 检查Token类型
            token_type = payload.get("type")
            if token_type != "password_reset":
                return None
            
            email: str = payload.get("email")
            if email is None:
                return None
            
            return email
            
        except JWTError:
            return None
        except Exception:
            return None
    
    @staticmethod
    def generate_tokens(user: UserInDB) -> Dict[str, Any]:
        """生成访问令牌和刷新令牌"""
        # 准备Token数据
        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name
        }
        
        # 生成令牌
        access_token = AuthManager.create_access_token(token_data)
        refresh_token = AuthManager.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

# 实例化认证管理器
auth_manager = AuthManager()

def get_password_hash(password: str) -> str:
    """获取密码哈希"""
    return auth_manager.get_password_hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return auth_manager.verify_password(plain_password, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    return auth_manager.create_access_token(data, expires_delta)

def create_refresh_token(data: Dict[str, Any]) -> str:
    """创建刷新令牌"""
    return auth_manager.create_refresh_token(data)

def verify_access_token(token: str) -> Optional[TokenData]:
    """验证访问令牌"""
    return auth_manager.verify_access_token(token)

def verify_refresh_token(token: str) -> Optional[TokenData]:
    """验证刷新令牌"""
    return auth_manager.verify_refresh_token(token)

def generate_tokens(user: UserInDB) -> Dict[str, Any]:
    """生成令牌对"""
    return auth_manager.generate_tokens(user)