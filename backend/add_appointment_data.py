#!/usr/bin/env python3
"""
添加预约测试数据
"""

import sys
import os
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db_session
from app.models.database import Appointment

def create_test_appointments():
    """创建测试预约数据"""
    appointments_data = [
        {
            "id": "appointment-1",
            "teacher_id": "teacher-1",  # 张慧敏
            "student_id": "student-101",  # 小明
            "student_name": "小明",
            "subject": "数学",
            "appointment_time": datetime.now() + timedelta(days=7),  # 一周后
            "status": "confirmed",
            "price": 200.0,
            "notes": "需要重点复习二次函数",
            "lesson_type": "single",
            "package_info": None
        },
        {
            "id": "appointment-2",
            "teacher_id": "teacher-2",  # 李雅文
            "student_id": "student-102",  # 小红
            "student_name": "小红",
            "subject": "英语",
            "appointment_time": datetime.now() + timedelta(days=3),  # 三天后
            "status": "pending",
            "price": 180.0,
            "notes": "准备中考英语听力训练",
            "lesson_type": "single",
            "package_info": None
        },
        {
            "id": "appointment-3",
            "teacher_id": "teacher-3",  # 王建国
            "student_id": "student-101",  # 小明
            "student_name": "小明",
            "subject": "物理",
            "appointment_time": datetime.now() + timedelta(days=5),  # 五天后
            "status": "pending",
            "price": 220.0,
            "notes": "力学基础强化",
            "lesson_type": "single",
            "package_info": None
        },
        {
            "id": "appointment-4",
            "teacher_id": "teacher-1",  # 张慧敏
            "student_id": None,  # 匿名学生
            "student_name": "李华",
            "subject": "数学",
            "appointment_time": datetime.now() + timedelta(days=1),  # 明天
            "status": "completed",
            "price": 200.0,
            "notes": "几何证明题练习",
            "lesson_type": "single",
            "package_info": None
        }
    ]
    return appointments_data

def main():
    """主函数"""
    print("🚀 添加预约测试数据...")
    
    db = get_db_session()
    
    try:
        appointments_data = create_test_appointments()
        
        for data in appointments_data:
            # 检查是否已存在
            existing = db.query(Appointment).filter(Appointment.id == data["id"]).first()
            if not existing:
                appointment = Appointment(**data)
                db.add(appointment)
            else:
                print(f"预约 {data['id']} 已存在，跳过")
        
        db.commit()
        
        print(f"✅ 成功添加了 {len(appointments_data)} 条预约记录")
        
        # 显示统计
        total_appointments = db.query(Appointment).count()
        print(f"📊 数据库中总预约数: {total_appointments}")
        
        # 按状态统计
        pending_count = db.query(Appointment).filter(Appointment.status == "pending").count()
        confirmed_count = db.query(Appointment).filter(Appointment.status == "confirmed").count()
        completed_count = db.query(Appointment).filter(Appointment.status == "completed").count()
        
        print(f"  - 待确认: {pending_count}")
        print(f"  - 已确认: {confirmed_count}")
        print(f"  - 已完成: {completed_count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 添加预约数据失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()