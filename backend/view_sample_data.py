#!/usr/bin/env python3
"""
查看示例数据脚本
验证数据库中的测试数据
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import User, Appointment, Review, ScoreRecord

# 数据库配置
DATABASE_URL = "sqlite:///./youjiaotong.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def view_users():
    """查看用户数据"""
    print("👥 用户数据:")
    print("-" * 80)
    
    db = SessionLocal()
    users = db.query(User).all()
    
    for user in users:
        print(f"📝 {user.name} ({user.role})")
        print(f"   📧 邮箱: {user.email}")
        print(f"   📱 电话: {user.phone}")
        print(f"   🆔 ID: {user.id}")
        if user.role == "teacher":
            print(f"   📚 科目: {user.subject}")
            print(f"   💰 价格: ¥{user.price}/小时")
            print(f"   ⭐ 评分: {user.rating} ({user.reviews_count}条评价)")
        elif user.role == "student":
            print(f"   🎓 年级: {user.grade}")
            print(f"   🎯 目标分数: {user.target_score}")
            print(f"   📉 薄弱科目: {user.weak_subjects}")
        print()
    
    db.close()

def view_appointments():
    """查看预约数据"""
    print("📅 预约数据:")
    print("-" * 80)
    
    db = SessionLocal()
    appointments = db.query(Appointment).all()
    
    for apt in appointments:
        print(f"📋 {apt.student_name} - {apt.subject}")
        print(f"   🎯 状态: {apt.status}")
        print(f"   💰 价格: ¥{apt.price}")
        print(f"   📅 时间: {apt.appointment_time}")
        print(f"   📝 备注: {apt.notes}")
        print()
    
    db.close()

def view_reviews():
    """查看评价数据"""
    print("⭐ 评价数据:")
    print("-" * 80)
    
    db = SessionLocal()
    reviews = db.query(Review).all()
    
    for review in reviews:
        print(f"💬 {review.student_name} 的评价")
        print(f"   ⭐ 评分: {review.ratings}")
        print(f"   💭 评论: {review.comment}")
        print(f"   👍 推荐: {'是' if review.is_recommended else '否'}")
        print(f"   🏷️ 标签: {review.tags}")
        print()
    
    db.close()

def view_score_records():
    """查看成绩记录"""
    print("📊 成绩记录:")
    print("-" * 80)
    
    db = SessionLocal()
    scores = db.query(ScoreRecord).all()
    
    for score in scores:
        improvement = score.after_score - score.before_score
        print(f"📈 {score.subject} - {score.test_type}")
        print(f"   📊 成绩: {score.before_score} → {score.after_score} (提升{improvement}分)")
        print(f"   📚 课时: {score.lesson_count}节")
        print(f"   📅 日期: {score.date}")
        print(f"   📝 备注: {score.notes}")
        print()
    
    db.close()

def main():
    """主函数"""
    print("🔍 查看示例数据")
    print("=" * 80)
    
    try:
        view_users()
        view_appointments()
        view_reviews()
        view_score_records()
        
        print("✅ 数据查看完成")
        
    except Exception as e:
        print(f"❌ 查看失败: {str(e)}")
        raise

if __name__ == "__main__":
    main()