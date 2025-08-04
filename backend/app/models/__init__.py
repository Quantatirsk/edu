# 数据模型模块

# 导入所有模型以便于使用
from .schemas import *
from .database import *
from .converters import *

# 模块版本
__version__ = "1.0.0"

# 导出的主要类
__all__ = [
    # Pydantic模型
    "User", "Teacher", "Student", "TeacherCreate", "StudentCreate",
    "Appointment", "AppointmentCreate", "AppointmentUpdate",
    "Review", "ReviewCreate", "ReviewRatings",
    "ScoreRecord", "ScoreRecordCreate",
    "Location", "DetailedRatings", "PackageInfo",
    "SubjectImprovement", "StudentAnalytics", "TeacherAnalytics",
    "APIResponse", "PaginatedResponse",
    
    # 枚举类型
    "UserRole", "AppointmentStatus", "LessonType",
    
    # 数据库模型
    "Base",
    
    # 转换函数
    "db_user_to_teacher", "db_user_to_student",
    "teacher_create_to_db_user", "student_create_to_db_user",
    "db_appointment_to_pydantic", "appointment_create_to_db",
    "db_review_to_pydantic", "review_create_to_db",
    "db_score_record_to_pydantic", "score_record_create_to_db",
    "calculate_teacher_ratings", "calculate_overall_rating"
]