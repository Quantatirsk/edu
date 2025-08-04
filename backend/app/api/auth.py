"""
认证API端点
包括用户注册、登录、密码重置等功能
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..core.auth import (
    verify_password, 
    get_password_hash, 
    generate_tokens,
    verify_access_token,
    verify_refresh_token,
    auth_manager
)
from ..models.database import User
from ..models.schemas import (
    UserRegister, 
    UserLogin, 
    Token, 
    RefreshTokenRequest,
    UserBase,
    APIResponse,
    PasswordResetRequest,
    PasswordReset,
    PasswordChange
)
from ..db.database import get_db

router = APIRouter(prefix="/auth", tags=["认证"])
security = HTTPBearer()

# 账户锁定配置
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

class AuthService:
    """认证服务类"""
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(db: Session, user_data: UserRegister) -> User:
        """创建新用户"""
        # 检查邮箱是否已存在
        if AuthService.get_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        
        # 创建用户
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            name=user_data.name,
            email=user_data.email,
            phone=user_data.phone,
            role=user_data.role,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False
        )
        
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户创建失败，可能邮箱已被使用"
            )
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """验证用户身份"""
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None
        
        # 检查账户是否被锁定
        if user.locked_until and user.locked_until > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"账户已被锁定，请在 {user.locked_until} 后重试"
            )
        
        # 验证密码
        if not verify_password(password, user.hashed_password):
            # 增加登录失败次数
            user.login_attempts += 1
            
            # 检查是否需要锁定账户
            if user.login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                user.login_attempts = 0
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"登录失败次数过多，账户已被锁定 {LOCKOUT_DURATION_MINUTES} 分钟"
                )
            
            db.commit()
            return None
        
        # 登录成功，重置失败次数
        user.login_attempts = 0
        user.last_login = datetime.utcnow()
        user.locked_until = None
        db.commit()
        
        return user
    
    @staticmethod
    def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
        """获取当前用户"""
        token = credentials.credentials
        token_data = verify_access_token(token)
        
        if token_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的访问令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户账户已被禁用",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user

# 实例化服务
auth_service = AuthService()

@router.post("/register", response_model=APIResponse, summary="用户注册")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册端点
    
    - **name**: 用户姓名 (2-50字符)
    - **email**: 邮箱地址
    - **password**: 密码 (至少8位，包含大小写字母和数字)
    - **phone**: 手机号码
    - **role**: 用户角色 (student/teacher)
    """
    try:
        user = auth_service.create_user(db, user_data)
        return APIResponse(
            success=True,
            message="注册成功",
            data={
                "user_id": user.id,
                "email": user.email,
                "role": user.role
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@router.post("/login", response_model=Token, summary="用户登录")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录端点
    
    - **email**: 邮箱地址
    - **password**: 密码
    
    返回访问令牌和刷新令牌
    """
    try:
        user = auth_service.authenticate_user(db, user_data.email, user_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="账户已被禁用，请联系管理员",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 生成令牌
        tokens = generate_tokens(user)
        return Token(**tokens)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.post("/refresh", response_model=Token, summary="刷新访问令牌")
async def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    刷新访问令牌
    
    - **refresh_token**: 刷新令牌
    """
    try:
        token_data = verify_refresh_token(refresh_data.refresh_token)
        if token_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 验证用户是否存在且活跃
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或已被禁用",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 生成新的令牌对
        tokens = generate_tokens(user)
        return Token(**tokens)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"令牌刷新失败: {str(e)}"
        )

@router.get("/me", response_model=UserBase, summary="获取当前用户信息")
async def get_me(current_user: User = Depends(auth_service.get_current_user)):
    """
    获取当前用户信息
    
    需要在请求头中包含有效的访问令牌
    """
    return UserBase(
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        avatar=current_user.avatar
    )

@router.post("/logout", response_model=APIResponse, summary="用户登出")
async def logout(current_user: User = Depends(auth_service.get_current_user)):
    """
    用户登出
    
    注意：JWT令牌是无状态的，实际的令牌失效需要客户端处理
    """
    return APIResponse(
        success=True,
        message=f"用户 {current_user.name} 已成功登出",
        data={"user_id": current_user.id}
    )

@router.post("/request-password-reset", response_model=APIResponse, summary="请求密码重置")
async def request_password_reset(request_data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    请求密码重置
    
    - **email**: 邮箱地址
    
    注意：在实际部署中，应该发送邮件而不是直接返回令牌
    """
    user = auth_service.get_user_by_email(db, request_data.email)
    if not user:
        # 为了安全，即使用户不存在也返回成功
        return APIResponse(
            success=True,
            message="如果邮箱存在，重置链接已发送",
            data={}
        )
    
    try:
        reset_token = auth_manager.create_password_reset_token(user.email)
        
        # TODO: 在实际部署中，这里应该发送邮件
        # send_password_reset_email(user.email, reset_token)
        
        return APIResponse(
            success=True,
            message="密码重置令牌已生成",
            data={
                "reset_token": reset_token,  # 仅用于开发测试
                "expires_in": 3600  # 1小时
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"密码重置请求失败: {str(e)}"
        )

@router.post("/reset-password", response_model=APIResponse, summary="重置密码")
async def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """
    重置密码
    
    - **token**: 密码重置令牌
    - **new_password**: 新密码
    """
    try:
        email = auth_manager.verify_password_reset_token(reset_data.token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效或已过期的重置令牌"
            )
        
        user = auth_service.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 更新密码
        user.hashed_password = get_password_hash(reset_data.new_password)
        user.login_attempts = 0  # 重置登录失败次数
        user.locked_until = None  # 解除账户锁定
        db.commit()
        
        return APIResponse(
            success=True,
            message="密码重置成功",
            data={"user_id": user.id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"密码重置失败: {str(e)}"
        )

@router.put("/change-password", response_model=APIResponse, summary="修改密码")
async def change_password(
    password_data: PasswordChange, 
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """
    修改密码
    
    - **old_password**: 旧密码
    - **new_password**: 新密码
    """
    try:
        # 验证旧密码
        if not verify_password(password_data.old_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="旧密码错误"
            )
        
        # 更新密码
        current_user.hashed_password = get_password_hash(password_data.new_password)
        db.commit()
        
        return APIResponse(
            success=True,
            message="密码修改成功",
            data={"user_id": current_user.id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"密码修改失败: {str(e)}"
        )

# 导出依赖函数，供其他API使用
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """获取当前用户 - 供其他API模块使用"""
    return auth_service.get_current_user(credentials, db)

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="用户账户已被禁用"
        )
    return current_user