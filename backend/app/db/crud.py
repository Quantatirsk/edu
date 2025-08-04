"""
数据库CRUD操作
提供通用的数据库操作方法
"""

from typing import List, Optional, Dict, Any, Type, TypeVar
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from app.models.database import User, Appointment, Review, ScoreRecord
from app.models import schemas

# 泛型类型定义
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

class CRUDBase:
    """基础CRUD操作类"""
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get(self, db: Session, id: str) -> Optional[ModelType]:
        """根据ID获取单条记录"""
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        order_desc: bool = False
    ) -> List[ModelType]:
        """获取多条记录"""
        query = db.query(self.model)
        
        # 应用过滤条件
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.filter(getattr(self.model, key) == value)
        
        # 应用排序
        if order_by and hasattr(self.model, order_by):
            order_func = desc if order_desc else asc
            query = query.order_by(order_func(getattr(self.model, order_by)))
        
        return query.offset(skip).limit(limit).all()
    
    def count(self, db: Session, filters: Optional[Dict[str, Any]] = None) -> int:
        """统计记录数量"""
        query = db.query(self.model)
        
        # 应用过滤条件
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.filter(getattr(self.model, key) == value)
        
        return query.count()
    
    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        """创建新记录"""
        obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, 
        db: Session, 
        db_obj: ModelType, 
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """更新记录"""
        update_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, id: str) -> Optional[ModelType]:
        """删除记录"""
        db_obj = self.get(db, id)
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj

class CRUDUser(CRUDBase):
    """用户CRUD操作"""
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()
    
    def get_by_role(self, db: Session, role: str, skip: int = 0, limit: int = 100) -> List[User]:
        """根据角色获取用户列表"""
        return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()
    
    def get_teachers(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        subject: Optional[str] = None,
        search: Optional[str] = None,
        order_by: str = "rating",
        order_desc: bool = True
    ) -> List[User]:
        """获取教师列表（支持搜索和筛选）"""
        query = db.query(User).filter(User.role == "teacher")
        
        # 搜索功能
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.name.like(search_term),
                    User.description.like(search_term),
                    User.teaching_style.like(search_term)
                )
            )
        
        # 排序
        if order_by == "rating":
            query = query.order_by(desc(User.rating) if order_desc else asc(User.rating))
        elif order_by == "price":
            query = query.order_by(desc(User.price) if order_desc else asc(User.price))
        elif order_by == "experience":
            query = query.order_by(desc(User.experience) if order_desc else asc(User.experience))
        
        # 获取结果
        teachers = query.all()
        
        # 科目筛选（在Python级别进行）
        if subject:
            filtered_teachers = []
            for teacher in teachers:
                if teacher.subject and isinstance(teacher.subject, list):
                    if subject in teacher.subject:
                        filtered_teachers.append(teacher)
            teachers = filtered_teachers
        
        # 手动分页（因为科目筛选在Python级别）
        if subject:
            return teachers[skip:skip + limit]
        else:
            return query.offset(skip).limit(limit).all()
    
    def update_teacher_rating(self, db: Session, teacher_id: str, new_rating: float, review_count: int):
        """更新教师评分"""
        teacher = self.get(db, teacher_id)
        if teacher:
            teacher.rating = new_rating
            teacher.reviews_count = review_count
            db.commit()
            db.refresh(teacher)
        return teacher

class CRUDAppointment(CRUDBase):
    """预约CRUD操作"""
    
    def get_by_teacher(self, db: Session, teacher_id: str, skip: int = 0, limit: int = 100) -> List[Appointment]:
        """获取教师的预约列表"""
        return db.query(Appointment).filter(
            Appointment.teacher_id == teacher_id
        ).offset(skip).limit(limit).all()
    
    def get_by_student(self, db: Session, student_id: str, skip: int = 0, limit: int = 100) -> List[Appointment]:
        """获取学生的预约列表"""
        return db.query(Appointment).filter(
            Appointment.student_id == student_id
        ).offset(skip).limit(limit).all()
    
    def get_by_status(self, db: Session, status: str, skip: int = 0, limit: int = 100) -> List[Appointment]:
        """根据状态获取预约列表"""
        return db.query(Appointment).filter(
            Appointment.status == status
        ).offset(skip).limit(limit).all()

class CRUDReview(CRUDBase):
    """评价CRUD操作"""
    
    def get_by_teacher(self, db: Session, teacher_id: str, skip: int = 0, limit: int = 100) -> List[Review]:
        """获取教师的评价列表"""
        return db.query(Review).filter(
            Review.teacher_id == teacher_id
        ).order_by(desc(Review.date)).offset(skip).limit(limit).all()
    
    def get_by_appointment(self, db: Session, appointment_id: str) -> Optional[Review]:
        """根据预约ID获取评价"""
        return db.query(Review).filter(Review.appointment_id == appointment_id).first()
    
    def get_teacher_rating_stats(self, db: Session, teacher_id: str) -> Dict[str, float]:
        """获取教师评分统计"""
        reviews = self.get_by_teacher(db, teacher_id, limit=1000)  # 获取足够多的评价
        
        if not reviews:
            return {
                "overall": 0.0,
                "teaching": 0.0,
                "patience": 0.0,
                "communication": 0.0,
                "effectiveness": 0.0,
                "count": 0
            }
        
        # 计算平均分
        total_overall = sum(r.ratings.get("overall", 0) for r in reviews)
        total_teaching = sum(r.ratings.get("teaching", 0) for r in reviews)
        total_patience = sum(r.ratings.get("patience", 0) for r in reviews)
        total_communication = sum(r.ratings.get("communication", 0) for r in reviews)
        total_effectiveness = sum(r.ratings.get("effectiveness", 0) for r in reviews)
        count = len(reviews)
        
        return {
            "overall": round(total_overall / count, 1),
            "teaching": round(total_teaching / count, 1),
            "patience": round(total_patience / count, 1),
            "communication": round(total_communication / count, 1),
            "effectiveness": round(total_effectiveness / count, 1),
            "count": count
        }

class CRUDScoreRecord(CRUDBase):
    """成绩记录CRUD操作"""
    
    def get_by_student(self, db: Session, student_id: str, skip: int = 0, limit: int = 100) -> List[ScoreRecord]:
        """获取学生的成绩记录"""
        return db.query(ScoreRecord).filter(
            ScoreRecord.student_id == student_id
        ).order_by(desc(ScoreRecord.date)).offset(skip).limit(limit).all()
    
    def get_by_teacher(self, db: Session, teacher_id: str, skip: int = 0, limit: int = 100) -> List[ScoreRecord]:
        """获取教师的成绩记录"""
        return db.query(ScoreRecord).filter(
            ScoreRecord.teacher_id == teacher_id
        ).order_by(desc(ScoreRecord.date)).offset(skip).limit(limit).all()
    
    def get_by_subject(self, db: Session, student_id: str, subject: str) -> List[ScoreRecord]:
        """获取学生特定科目的成绩记录"""
        return db.query(ScoreRecord).filter(
            and_(
                ScoreRecord.student_id == student_id,
                ScoreRecord.subject == subject
            )
        ).order_by(asc(ScoreRecord.date)).all()

# 创建CRUD实例
user = CRUDUser(User)
appointment = CRUDAppointment(Appointment)
review = CRUDReview(Review)
score_record = CRUDScoreRecord(ScoreRecord)