#!/usr/bin/env python3
"""
认证系统数据初始化脚本
创建示例用户账户用于测试
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db
from app.models.database import User
from app.core.auth import get_password_hash
from datetime import datetime

def create_sample_users():
    """创建示例用户"""
    print("🔑 创建示例用户账户...")
    
    db = next(get_db())
    
    # 检查是否已存在用户
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"⚠️  已存在 {existing_users} 个用户，跳过用户创建")
        return
    
    # 示例用户数据
    sample_users = [
        {
            "name": "张老师",
            "email": "teacher@example.com",
            "phone": "13800138001",
            "role": "teacher",
            "password": "Teacher123",
            "subject": ["数学", "物理"],
            "experience": 5,
            "price": 150.0,
            "certifications": ["高级教师资格证", "数学竞赛教练证"],
            "teaching_style": "耐心细致，善于启发学生思维",
            "description": "有5年教学经验的数学和物理老师，擅长中高考冲刺辅导。",
            "availability": ["周一晚上", "周三晚上", "周末全天"],
            "location": {
                "address": "北京市海淀区中关村大街1号",
                "lat": 39.9042,
                "lng": 116.4074,
                "district": "海淀区"
            },
            "detailed_ratings": {
                "teaching": 4.8,
                "patience": 4.9,
                "communication": 4.7,
                "effectiveness": 4.8
            },
            "rating": 4.8,
            "reviews_count": 15
        },
        {
            "name": "李老师", 
            "email": "teacher2@example.com",
            "phone": "13800138002",
            "role": "teacher",
            "password": "Teacher123",
            "subject": ["英语", "语文"],
            "experience": 8,
            "price": 180.0,
            "certifications": ["英语专业八级", "语文特级教师"],
            "teaching_style": "生动有趣，注重实际应用",
            "description": "资深英语和语文老师，留学背景，口语纯正。",
            "availability": ["周二晚上", "周四晚上", "周末下午"],
            "location": {
                "address": "北京市朝阳区国贸大厦",
                "lat": 39.9175,
                "lng": 116.4560,
                "district": "朝阳区"
            },
            "detailed_ratings": {
                "teaching": 4.9,
                "patience": 4.6,
                "communication": 4.8,
                "effectiveness": 4.7
            },
            "rating": 4.7,
            "reviews_count": 22
        },
        {
            "name": "王同学",
            "email": "student@example.com", 
            "phone": "13800138003",
            "role": "student",
            "password": "Student123",
            "grade": "高二",
            "target_score": 650,
            "weak_subjects": ["数学", "物理"],
            "study_goals": ["提高数学成绩", "准备高考"],
            "location": {
                "address": "北京市西城区西单北大街",
                "lat": 39.9087,
                "lng": 116.3740,
                "district": "西城区"
            }
        },
        {
            "name": "管理员",
            "email": "admin@example.com",
            "phone": "13800138000", 
            "role": "admin",
            "password": "Admin123"
        }
    ]
    
    created_count = 0
    
    for user_data in sample_users:
        try:
            # 提取密码并加密
            password = user_data.pop("password")
            hashed_password = get_password_hash(password)
            
            # 创建用户实例
            user = User(
                **user_data,
                hashed_password=hashed_password,
                is_active=True,
                is_verified=True,  # 示例用户标记为已验证
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(user)
            db.commit()
            created_count += 1
            
            print(f"✅ 创建用户: {user.name} ({user.email}) - {user.role}")
            
        except Exception as e:
            print(f"❌ 创建用户失败 {user_data.get('name', 'Unknown')}: {e}")
            db.rollback()
    
    db.close()
    print(f"🎉 成功创建 {created_count} 个示例用户")
    
    # 输出登录信息
    print("\n📋 测试账户信息:")
    print("=" * 50)
    print("教师账户1:")
    print("  邮箱: teacher@example.com")
    print("  密码: Teacher123")
    print()
    print("教师账户2:")
    print("  邮箱: teacher2@example.com") 
    print("  密码: Teacher123")
    print()
    print("学生账户:")
    print("  邮箱: student@example.com")
    print("  密码: Student123")
    print()
    print("管理员账户:")
    print("  邮箱: admin@example.com")
    print("  密码: Admin123")
    print("=" * 50)

def main():
    """主函数"""
    print("🚀 认证系统数据初始化")
    print("-" * 50)
    
    try:
        create_sample_users()
        print("-" * 50)
        print("✅ 认证数据初始化完成！")
        
    except Exception as e:
        print(f"❌ 认证数据初始化失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()