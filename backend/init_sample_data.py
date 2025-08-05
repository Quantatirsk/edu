#!/usr/bin/env python3
"""
初始化示例数据脚本
清空现有数据并创建完整的测试数据集
"""

import sys
import os
from datetime import datetime, timedelta, date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import Base, User, Appointment, Review, ScoreRecord
from app.core.auth import get_password_hash

# 数据库配置
DATABASE_URL = "sqlite:///./youjiaotong.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_database():
    """清空所有数据表"""
    print("🗑️  正在清空数据库...")
    
    with engine.connect() as conn:
        # 删除所有表中的数据
        conn.execute(text("DELETE FROM score_records"))
        conn.execute(text("DELETE FROM reviews"))
        conn.execute(text("DELETE FROM appointments"))
        conn.execute(text("DELETE FROM users"))
        conn.commit()
    
    print("✅ 数据库已清空")

def create_sample_users(db):
    """创建示例用户数据"""
    print("👥 正在创建示例用户...")
    
    users_data = [
        # 管理员账户
        {
            "name": "系统管理员",
            "email": "admin@youjiaotong.com",
            "password": "Admin123456",
            "phone": "13800000001",
            "role": "admin",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
            "is_active": True,
            "is_verified": True
        },
        
        # 教师账户
        {
            "name": "李数学老师",
            "email": "teacher.math@youjiaotong.com",
            "password": "Teacher123456",
            "phone": "13800000002",
            "role": "teacher",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1",
            "subject": ["数学", "物理"],
            "experience": 8,
            "price": 150.0,
            "rating": 4.8,
            "reviews_count": 25,
            "detailed_ratings": {
                "teaching": 4.9,
                "patience": 4.7,
                "communication": 4.8,
                "effectiveness": 4.8
            },
            "certifications": ["高级中学教师资格证", "数学竞赛优秀指导教师"],
            "teaching_style": "注重基础，循序渐进，善于用生活实例解释抽象概念",
            "description": "8年教学经验，专注于初高中数学和物理教学，帮助300多名学生提高成绩",
            "availability": ["周一18:00-21:00", "周三18:00-21:00", "周六09:00-17:00", "周日09:00-17:00"],
            "location": {
                "address": "北京市海淀区中关村大街1号",
                "lat": 39.9866,
                "lng": 116.3031,
                "district": "海淀区"
            }
        },
        {
            "name": "王英语老师",
            "email": "teacher.english@youjiaotong.com",
            "password": "Teacher123456",
            "phone": "13800000003",
            "role": "teacher",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2",
            "subject": ["英语"],
            "experience": 5,
            "price": 120.0,
            "rating": 4.6,
            "reviews_count": 18,
            "detailed_ratings": {
                "teaching": 4.7,
                "patience": 4.5,
                "communication": 4.6,
                "effectiveness": 4.6
            },
            "certifications": ["英语专业八级", "TESOL国际英语教师资格证"],
            "teaching_style": "情景式教学，注重口语练习和语法应用",
            "description": "5年英语教学经验，擅长提高学生听说读写综合能力",
            "availability": ["周二18:00-21:00", "周四18:00-21:00", "周六14:00-18:00", "周日14:00-18:00"],
            "location": {
                "address": "北京市朝阳区建国门外大街2号",
                "lat": 39.9097,
                "lng": 116.4358,
                "district": "朝阳区"
            }
        },
        {
            "name": "张化学老师",
            "email": "teacher.chemistry@youjiaotong.com",
            "password": "Teacher123456",
            "phone": "13800000004",
            "role": "teacher",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher3",
            "subject": ["化学", "生物"],
            "experience": 6,
            "price": 130.0,
            "rating": 4.7,
            "reviews_count": 22,
            "detailed_ratings": {
                "teaching": 4.8,
                "patience": 4.6,
                "communication": 4.7,
                "effectiveness": 4.7
            },
            "certifications": ["化学高级教师资格证", "实验安全培训师"],
            "teaching_style": "实验与理论相结合，重视学生动手能力培养",
            "description": "6年化学教学经验，擅长通过实验帮助学生理解化学原理",
            "availability": ["周一19:00-21:00", "周五18:00-21:00", "周六09:00-12:00"],
            "location": {
                "address": "北京市东城区王府井大街3号",
                "lat": 39.9135,
                "lng": 116.4107,
                "district": "东城区"
            }
        },
        
        # 学生账户
        {
            "name": "小明同学",
            "email": "student1@youjiaotong.com",
            "password": "Student123456",
            "phone": "13800000005",
            "role": "student",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=student1",
            "grade": "高二",
            "target_score": 650,
            "weak_subjects": ["数学", "物理"],
            "study_goals": ["提高数学成绩到130分以上", "掌握物理力学基础"],
            "location": {
                "address": "北京市海淀区学院路4号",
                "lat": 39.9775,
                "lng": 116.3253,
                "district": "海淀区"
            }
        },
        {
            "name": "小红同学",
            "email": "student2@youjiaotong.com",
            "password": "Student123456",
            "phone": "13800000006",
            "role": "student",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=student2",
            "grade": "初三",
            "target_score": 580,
            "weak_subjects": ["英语", "化学"],
            "study_goals": ["英语成绩提升到110分", "掌握化学基础概念"],
            "location": {
                "address": "北京市朝阳区国贸大厦5号",
                "lat": 39.9089,
                "lng": 116.4467,
                "district": "朝阳区"
            }
        },
        {
            "name": "小刚同学",
            "email": "student3@youjiaotong.com",
            "password": "Student123456",
            "phone": "13800000007",
            "role": "student",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=student3",
            "grade": "高一",
            "target_score": 600,
            "weak_subjects": ["数学"],
            "study_goals": ["巩固数学基础", "提前预习高二课程"],
            "location": {
                "address": "北京市西城区西单大街6号",
                "lat": 39.9065,
                "lng": 116.3799,
                "district": "西城区"
            }
        },
        {
            "name": "小丽同学",
            "email": "student4@youjiaotong.com",
            "password": "Student123456",
            "phone": "13800000008",
            "role": "student",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=student4",
            "grade": "初二",
            "target_score": 520,
            "weak_subjects": ["英语"],
            "study_goals": ["提高英语口语能力", "掌握英语语法"],
            "location": {
                "address": "北京市东城区天安门广场7号",
                "lat": 39.9053,
                "lng": 116.3976,
                "district": "东城区"
            }
        }
    ]
    
    created_users = {}
    
    for user_data in users_data:
        # 准备用户基本信息
        user_info = {
            "name": user_data["name"],
            "email": user_data["email"],
            "phone": user_data["phone"],
            "role": user_data["role"],
            "avatar": user_data.get("avatar"),
            "hashed_password": get_password_hash(user_data["password"]),
            "is_active": user_data.get("is_active", True),
            "is_verified": user_data.get("is_verified", True),
            "login_attempts": 0,
            "locked_until": None,
            "last_login": datetime.utcnow() - timedelta(days=1)
        }
        
        # 添加角色特定字段
        if user_data["role"] == "teacher":
            user_info.update({
                "subject": user_data.get("subject"),
                "experience": user_data.get("experience"),
                "price": user_data.get("price"),
                "rating": user_data.get("rating", 0.0),
                "reviews_count": user_data.get("reviews_count", 0),
                "detailed_ratings": user_data.get("detailed_ratings", {}),
                "certifications": user_data.get("certifications", []),
                "teaching_style": user_data.get("teaching_style"),
                "description": user_data.get("description"),
                "availability": user_data.get("availability", []),
                "location": user_data.get("location")
            })
        elif user_data["role"] == "student":
            user_info.update({
                "grade": user_data.get("grade"),
                "target_score": user_data.get("target_score"),
                "weak_subjects": user_data.get("weak_subjects", []),
                "study_goals": user_data.get("study_goals", []),
                "location": user_data.get("location")
            })
        
        user = User(**user_info)
        db.add(user)
        db.flush()  # 获取生成的ID
        
        # 保存用户引用
        created_users[user_data["email"]] = user
        print(f"  ✅ 创建用户: {user.name} ({user.role}) - ID: {user.id}")
    
    db.commit()
    print(f"✅ 成功创建 {len(users_data)} 个用户")
    return created_users

def create_sample_appointments(db, users):
    """创建示例预约数据"""
    print("📅 正在创建示例预约...")
    
    # 获取用户
    math_teacher = users["teacher.math@youjiaotong.com"]
    english_teacher = users["teacher.english@youjiaotong.com"]
    chemistry_teacher = users["teacher.chemistry@youjiaotong.com"]
    
    student1 = users["student1@youjiaotong.com"]
    student2 = users["student2@youjiaotong.com"]
    student3 = users["student3@youjiaotong.com"]
    student4 = users["student4@youjiaotong.com"]
    
    appointments_data = [
        # 小明的预约（数学和物理）
        {
            "teacher_id": math_teacher.id,
            "student_id": student1.id,
            "student_name": "小明同学",
            "subject": "数学",
            "appointment_time": datetime.now() - timedelta(days=10),
            "status": "completed",
            "price": 150.0,
            "notes": "函数基础练习",
            "lesson_type": "single"
        },
        {
            "teacher_id": math_teacher.id,
            "student_id": student1.id,
            "student_name": "小明同学",
            "subject": "物理",
            "appointment_time": datetime.now() - timedelta(days=7),
            "status": "completed",
            "price": 150.0,
            "notes": "力学基础概念",
            "lesson_type": "single"
        },
        {
            "teacher_id": math_teacher.id,
            "student_id": student1.id,
            "student_name": "小明同学",
            "subject": "数学",
            "appointment_time": datetime.now() + timedelta(days=3),
            "status": "confirmed",
            "price": 150.0,
            "notes": "三角函数专题",
            "lesson_type": "single"
        },
        
        # 小红的预约（英语和化学）
        {
            "teacher_id": english_teacher.id,
            "student_id": student2.id,
            "student_name": "小红同学",
            "subject": "英语",
            "appointment_time": datetime.now() - timedelta(days=14),
            "status": "completed",
            "price": 120.0,
            "notes": "语法基础复习",
            "lesson_type": "single"
        },
        {
            "teacher_id": chemistry_teacher.id,
            "student_id": student2.id,
            "student_name": "小红同学",
            "subject": "化学",
            "appointment_time": datetime.now() - timedelta(days=5),
            "status": "completed",
            "price": 130.0,
            "notes": "化学方程式练习",
            "lesson_type": "single"
        },
        {
            "teacher_id": english_teacher.id,
            "student_id": student2.id,
            "student_name": "小红同学",
            "subject": "英语",
            "appointment_time": datetime.now() + timedelta(days=2),
            "status": "confirmed",
            "price": 120.0,
            "notes": "阅读理解技巧",
            "lesson_type": "single"
        },
        
        # 小刚的预约（数学）
        {
            "teacher_id": math_teacher.id,
            "student_id": student3.id,
            "student_name": "小刚同学",
            "subject": "数学",
            "appointment_time": datetime.now() - timedelta(days=12),
            "status": "completed",
            "price": 150.0,
            "notes": "代数基础强化",
            "lesson_type": "single"
        },
        {
            "teacher_id": math_teacher.id,
            "student_id": student3.id,
            "student_name": "小刚同学",
            "subject": "数学",
            "appointment_time": datetime.now() + timedelta(days=5),
            "status": "pending",
            "price": 150.0,
            "notes": "几何证明专题",
            "lesson_type": "single"
        },
        
        # 小丽的预约（英语）
        {
            "teacher_id": english_teacher.id,
            "student_id": student4.id,
            "student_name": "小丽同学",
            "subject": "英语",
            "appointment_time": datetime.now() - timedelta(days=8),
            "status": "completed",
            "price": 120.0,
            "notes": "口语练习",
            "lesson_type": "single"
        },
        {
            "teacher_id": english_teacher.id,
            "student_id": student4.id,
            "student_name": "小丽同学",
            "subject": "英语",
            "appointment_time": datetime.now() + timedelta(days=1),
            "status": "confirmed",
            "price": 120.0,
            "notes": "写作技巧训练",
            "lesson_type": "single"
        }
    ]
    
    created_appointments = []
    for apt_data in appointments_data:
        appointment = Appointment(**apt_data)
        db.add(appointment)
        db.flush()
        created_appointments.append(appointment)
        print(f"  ✅ 创建预约: {apt_data['student_name']} - {apt_data['subject']} ({apt_data['status']})")
    
    db.commit()
    print(f"✅ 成功创建 {len(appointments_data)} 个预约")
    return created_appointments

def create_sample_reviews(db, users, appointments):
    """创建示例评价数据"""
    print("⭐ 正在创建示例评价...")
    
    # 只为已完成的预约创建评价
    completed_appointments = [apt for apt in appointments if apt.status == "completed"]
    
    reviews_data = [
        # 小明对李数学老师的评价
        {
            "appointment_id": completed_appointments[0].id,  # 数学课
            "teacher_id": completed_appointments[0].teacher_id,
            "student_id": completed_appointments[0].student_id,
            "student_name": "小明同学",
            "ratings": {
                "overall": 5,
                "teaching": 5,
                "patience": 4,
                "communication": 5,
                "effectiveness": 5
            },
            "comment": "李老师讲解很清楚，用了很多生活中的例子帮我理解函数概念，现在做题思路清晰多了！",
            "is_recommended": True,
            "tags": ["讲解清晰", "有耐心", "方法好"],
            "date": date.today() - timedelta(days=9)
        },
        {
            "appointment_id": completed_appointments[1].id,  # 物理课
            "teacher_id": completed_appointments[1].teacher_id,
            "student_id": completed_appointments[1].student_id,
            "student_name": "小明同学",
            "ratings": {
                "overall": 4,
                "teaching": 5,
                "patience": 4,
                "communication": 4,
                "effectiveness": 4
            },
            "comment": "物理力学部分确实比较难，但是李老师很有经验，讲得很系统，需要多练习。",
            "is_recommended": True,
            "tags": ["专业", "系统性强"],
            "date": date.today() - timedelta(days=6)
        },
        
        # 小红对王英语老师的评价
        {
            "appointment_id": completed_appointments[2].id,  # 英语课
            "teacher_id": completed_appointments[2].teacher_id,
            "student_id": completed_appointments[2].student_id,
            "student_name": "小红同学",
            "ratings": {
                "overall": 4,
                "teaching": 4,
                "patience": 5,
                "communication": 4,
                "effectiveness": 4
            },
            "comment": "王老师很有耐心，语法讲解很详细，还给了我很多练习题，感觉进步很大。",
            "is_recommended": True,
            "tags": ["有耐心", "练习充足", "负责任"],
            "date": date.today() - timedelta(days=13)
        },
        
        # 小红对张化学老师的评价
        {
            "appointment_id": completed_appointments[3].id,  # 化学课
            "teacher_id": completed_appointments[3].teacher_id,
            "student_id": completed_appointments[3].student_id,
            "student_name": "小红同学",
            "ratings": {
                "overall": 5,
                "teaching": 5,
                "patience": 4,
                "communication": 5,
                "effectiveness": 5
            },
            "comment": "张老师的实验演示太棒了！原来抽象的化学反应变得很直观，现在我对化学有兴趣了！",
            "is_recommended": True,
            "tags": ["实验教学", "生动有趣", "专业"],
            "date": date.today() - timedelta(days=4)
        },
        
        # 小刚对李数学老师的评价
        {
            "appointment_id": completed_appointments[4].id,  # 数学课
            "teacher_id": completed_appointments[4].teacher_id,
            "student_id": completed_appointments[4].student_id,
            "student_name": "小刚同学",
            "ratings": {
                "overall": 4,
                "teaching": 4,
                "patience": 4,
                "communication": 4,
                "effectiveness": 4
            },
            "comment": "代数基础确实需要多练习，李老师给的方法很实用，会继续跟着学习。",
            "is_recommended": True,
            "tags": ["方法实用", "基础扎实"],
            "date": date.today() - timedelta(days=11)
        },
        
        # 小丽对王英语老师的评价
        {
            "appointment_id": completed_appointments[5].id,  # 英语课
            "teacher_id": completed_appointments[5].teacher_id,
            "student_id": completed_appointments[5].student_id,
            "student_name": "小丽同学",
            "ratings": {
                "overall": 5,
                "teaching": 5,
                "patience": 5,
                "communication": 5,
                "effectiveness": 4
            },
            "comment": "王老师的口语课太棒了！纠正了我很多发音问题，还教了很多实用的表达，现在敢开口说英语了！",
            "is_recommended": True,
            "tags": ["口语提升", "发音纠正", "鼓励学生"],
            "date": date.today() - timedelta(days=7)
        }
    ]
    
    for review_data in reviews_data:
        review = Review(**review_data)
        db.add(review)
        db.flush()
        print(f"  ✅ 创建评价: {review_data['student_name']} -> {review_data['ratings']['overall']}星")
    
    db.commit()
    print(f"✅ 成功创建 {len(reviews_data)} 个评价")

def create_sample_score_records(db, users):
    """创建示例成绩记录"""
    print("📊 正在创建示例成绩记录...")
    
    # 获取用户
    math_teacher = users["teacher.math@youjiaotong.com"]
    english_teacher = users["teacher.english@youjiaotong.com"]
    chemistry_teacher = users["teacher.chemistry@youjiaotong.com"]
    
    student1 = users["student1@youjiaotong.com"]
    student2 = users["student2@youjiaotong.com"]
    student3 = users["student3@youjiaotong.com"]
    student4 = users["student4@youjiaotong.com"]
    
    score_records_data = [
        # 小明的成绩记录（数学进步轨迹）
        {
            "student_id": student1.id,
            "teacher_id": math_teacher.id,
            "subject": "数学",
            "test_type": "月考",
            "before_score": 85.0,
            "after_score": 95.0,
            "max_score": 150.0,
            "lesson_count": 4,
            "notes": "函数基础练习后的提升",
            "date": date.today() - timedelta(days=30)
        },
        {
            "student_id": student1.id,
            "teacher_id": math_teacher.id,
            "subject": "数学",
            "test_type": "期中考试",
            "before_score": 95.0,
            "after_score": 110.0,
            "max_score": 150.0,
            "lesson_count": 6,
            "notes": "解析几何专题训练效果",
            "date": date.today() - timedelta(days=15)
        },
        {
            "student_id": student1.id,
            "teacher_id": math_teacher.id,
            "subject": "物理",
            "test_type": "单元测试",
            "before_score": 60.0,
            "after_score": 75.0,
            "max_score": 100.0,
            "lesson_count": 3,
            "notes": "力学基础概念理解提升",
            "date": date.today() - timedelta(days=20)
        },
        
        # 小红的成绩记录（英语和化学）
        {
            "student_id": student2.id,
            "teacher_id": english_teacher.id,
            "subject": "英语",
            "test_type": "月考",
            "before_score": 75.0,
            "after_score": 85.0,
            "max_score": 120.0,
            "lesson_count": 5,
            "notes": "语法基础强化训练",
            "date": date.today() - timedelta(days=25)
        },
        {
            "student_id": student2.id,
            "teacher_id": english_teacher.id,
            "subject": "英语",
            "test_type": "期中考试",
            "before_score": 85.0,
            "after_score": 100.0,
            "max_score": 120.0,
            "lesson_count": 4,
            "notes": "阅读理解和写作提升",
            "date": date.today() - timedelta(days=10)
        },
        {
            "student_id": student2.id,
            "teacher_id": chemistry_teacher.id,
            "subject": "化学",
            "test_type": "单元测试",
            "before_score": 65.0,
            "after_score": 80.0,
            "max_score": 100.0,
            "lesson_count": 3,
            "notes": "化学方程式和反应原理掌握",
            "date": date.today() - timedelta(days=18)
        },
        
        # 小刚的成绩记录（数学基础提升）
        {
            "student_id": student3.id,
            "teacher_id": math_teacher.id,
            "subject": "数学",
            "test_type": "入学测试",
            "before_score": 70.0,
            "after_score": 80.0,
            "max_score": 150.0,
            "lesson_count": 3,
            "notes": "代数基础强化",
            "date": date.today() - timedelta(days=35)
        },
        {
            "student_id": student3.id,
            "teacher_id": math_teacher.id,
            "subject": "数学",
            "test_type": "月考",
            "before_score": 80.0,
            "after_score": 90.0,
            "max_score": 150.0,
            "lesson_count": 4,
            "notes": "基础概念理解深化",
            "date": date.today() - timedelta(days=20)
        },
        
        # 小丽的成绩记录（英语口语和基础）
        {
            "student_id": student4.id,
            "teacher_id": english_teacher.id,
            "subject": "英语",
            "test_type": "口语测试",
            "before_score": 60.0,
            "after_score": 75.0,
            "max_score": 100.0,
            "lesson_count": 2,
            "notes": "发音和口语表达能力提升",
            "date": date.today() - timedelta(days=22)
        },
        {
            "student_id": student4.id,
            "teacher_id": english_teacher.id,
            "subject": "英语",
            "test_type": "期中考试",
            "before_score": 70.0,
            "after_score": 85.0,
            "max_score": 120.0,
            "lesson_count": 4,
            "notes": "词汇量和语法应用提升",
            "date": date.today() - timedelta(days=12)
        },
        
        # 额外的历史记录，展示更长期的进步
        {
            "student_id": student1.id,
            "teacher_id": math_teacher.id,
            "subject": "数学",
            "test_type": "期末考试",
            "before_score": 110.0,
            "after_score": 125.0,
            "max_score": 150.0,
            "lesson_count": 8,
            "notes": "综合应用能力显著提升",
            "date": date.today() - timedelta(days=5)
        },
        {
            "student_id": student2.id,
            "teacher_id": chemistry_teacher.id,
            "subject": "化学",
            "test_type": "期中考试",
            "before_score": 80.0,
            "after_score": 92.0,
            "max_score": 100.0,
            "lesson_count": 5,
            "notes": "实验操作和理论理解并进",
            "date": date.today() - timedelta(days=8)
        }
    ]
    
    for record_data in score_records_data:
        score_record = ScoreRecord(**record_data)
        db.add(score_record)
        db.flush()
        improvement = record_data["after_score"] - record_data["before_score"]
        print(f"  ✅ 创建成绩记录: {record_data['subject']} - 提升 {improvement:.1f}分")
    
    db.commit()
    print(f"✅ 成功创建 {len(score_records_data)} 个成绩记录")

def verify_sample_data(db):
    """验证示例数据完整性"""
    print("🔍 正在验证数据完整性...")
    
    # 统计各表记录数
    users_count = db.query(User).count()
    appointments_count = db.query(Appointment).count()
    reviews_count = db.query(Review).count()
    scores_count = db.query(ScoreRecord).count()
    
    print(f"  📊 数据统计:")
    print(f"    - 用户: {users_count} 个")
    print(f"    - 预约: {appointments_count} 个")
    print(f"    - 评价: {reviews_count} 个")
    print(f"    - 成绩记录: {scores_count} 个")
    
    # 验证用户角色分布
    students = db.query(User).filter(User.role == "student").count()
    teachers = db.query(User).filter(User.role == "teacher").count()
    admins = db.query(User).filter(User.role == "admin").count()
    
    print(f"  👥 用户角色分布:")
    print(f"    - 学生: {students} 个")
    print(f"    - 教师: {teachers} 个")
    print(f"    - 管理员: {admins} 个")
    
    # 显示测试账户信息
    print(f"\n🔑 测试账户信息:")
    print(f"  管理员: admin@youjiaotong.com / Admin123456")
    print(f"  教师账户:")
    print(f"    - 李数学老师: teacher.math@youjiaotong.com / Teacher123456")
    print(f"    - 王英语老师: teacher.english@youjiaotong.com / Teacher123456")
    print(f"    - 张化学老师: teacher.chemistry@youjiaotong.com / Teacher123456")
    print(f"  学生账户:")
    print(f"    - 小明同学: student1@youjiaotong.com / Student123456")
    print(f"    - 小红同学: student2@youjiaotong.com / Student123456")
    print(f"    - 小刚同学: student3@youjiaotong.com / Student123456")
    print(f"    - 小丽同学: student4@youjiaotong.com / Student123456")
    
    print("✅ 数据验证完成")

def main():
    """主函数"""
    print("🚀 开始初始化示例数据...")
    print("=" * 50)
    
    try:
        # 创建数据库会话
        db = SessionLocal()
        
        # 1. 清空数据库
        clear_database()
        
        # 2. 创建用户数据
        users = create_sample_users(db)
        
        # 3. 创建预约数据
        appointments = create_sample_appointments(db, users)
        
        # 4. 创建评价数据
        create_sample_reviews(db, users, appointments)
        
        # 5. 创建成绩记录
        create_sample_score_records(db, users)
        
        # 6. 验证数据完整性
        verify_sample_data(db)
        
        print("\n" + "=" * 50)
        print("🎉 示例数据初始化完成！")
        print("现在可以使用上述账户登录系统进行测试")
        
    except Exception as e:
        print(f"❌ 初始化失败: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    main()