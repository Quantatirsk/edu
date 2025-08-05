#!/usr/bin/env python3
"""
调试认证问题的脚本
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import User
from app.core.auth import generate_tokens, verify_access_token
from app.db.crud import user as user_crud

# 数据库配置
DATABASE_URL = "sqlite:///./youjiaotong.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_teacher_auth():
    """测试教师认证"""
    print("🔍 调试教师认证问题...")
    print("-" * 50)
    
    db = SessionLocal()
    
    try:
        # 1. 查找数学老师
        teacher = user_crud.get_by_email(db, "teacher.math@youjiaotong.com")
        if not teacher:
            print("❌ 找不到数学老师账户")
            return
        
        print(f"✅ 找到教师账户:")
        print(f"   ID: {teacher.id}")
        print(f"   姓名: {teacher.name}")
        print(f"   邮箱: {teacher.email}")
        print(f"   角色: {teacher.role}")
        print(f"   是否激活: {teacher.is_active}")
        print()
        
        # 2. 生成JWT token
        tokens = generate_tokens(teacher)
        print(f"✅ 生成JWT token:")
        print(f"   访问token: {tokens['access_token'][:50]}...")
        print()
        
        # 3. 验证JWT token
        token_data = verify_access_token(tokens['access_token'])
        if not token_data:
            print("❌ JWT token验证失败")
            return
        
        print(f"✅ JWT token验证成功:")
        print(f"   用户ID: {token_data.user_id}")
        print(f"   邮箱: {token_data.email}")
        print(f"   角色: {token_data.role}")
        print()
        
        # 4. 验证用户ID匹配
        if token_data.user_id == teacher.id:
            print("✅ 用户ID匹配正确")
        else:
            print(f"❌ 用户ID不匹配:")
            print(f"   Token中的ID: {token_data.user_id}")
            print(f"   数据库中的ID: {teacher.id}")
        print()
        
        # 5. 测试用户查询
        found_user = user_crud.get(db, teacher.id)
        if found_user:
            print(f"✅ 通过ID查询用户成功:")
            print(f"   ID: {found_user.id}")
            print(f"   角色: {found_user.role}")
            print(f"   是否激活: {found_user.is_active}")
        else:
            print(f"❌ 通过ID查询用户失败: {teacher.id}")
        
        # 6. 检查成绩记录
        from app.db.crud import score_record
        records = score_record.get_by_teacher(db, teacher.id, limit=10)
        print(f"✅ 教师成绩记录数量: {len(records)}")
        if records:
            print("   前几条记录:")
            for i, record in enumerate(records[:3]):
                print(f"     {i+1}. {record.subject} - 学生ID: {record.student_id}")
        
        # 7. 检查评价
        from app.db.crud import review
        reviews = review.get_by_teacher(db, teacher.id, limit=10)
        print(f"✅ 教师评价数量: {len(reviews)}")
        if reviews:
            print("   前几条评价:")
            for i, rev in enumerate(reviews[:3]):
                print(f"     {i+1}. {rev.ratings.get('overall', 0)}星 - {rev.student_name}")
        
    except Exception as e:
        print(f"❌ 调试过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def test_analytics_function():
    """测试分析函数"""
    print("\n🔍 测试分析函数...")
    print("-" * 50)
    
    from app.api.analytics import get_teacher_analytics
    from app.db.database import get_database
    
    db = SessionLocal()
    
    try:
        # 获取教师
        teacher = user_crud.get_by_email(db, "teacher.math@youjiaotong.com")
        if not teacher:
            print("❌ 找不到教师账户")
            return
        
        print(f"🧪 调用 get_teacher_analytics 函数...")
        print(f"   教师ID: {teacher.id}")
        print(f"   当前用户: {teacher.name} ({teacher.role})")
        
        # 直接调用分析函数
        import asyncio
        result = asyncio.run(get_teacher_analytics(teacher.id, db, teacher))
        
        print(f"✅ 分析函数调用成功:")
        print(f"   学生数量: {result.students_count}")
        print(f"   平均提分: {result.average_improvement}")
        print(f"   总课时: {result.total_lessons}")
        print(f"   推荐率: {result.recommendation_rate}%")
        print(f"   总评价数: {result.total_reviews}")
        
    except Exception as e:
        print(f"❌ 分析函数调用失败: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def main():
    """主函数"""
    print("🚀 开始调试认证问题...")
    print("=" * 60)
    
    test_teacher_auth()
    test_analytics_function()
    
    print("\n" + "=" * 60)
    print("🏁 调试完成")

if __name__ == "__main__":
    main()