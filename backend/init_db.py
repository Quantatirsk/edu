#!/usr/bin/env python3
"""
数据库初始化脚本
运行此脚本来创建数据库表结构
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import init_database, reset_database
from app.core.config import settings

def main():
    """主函数"""
    print("🚀 优教通数据库初始化脚本")
    print(f"数据库URL: {settings.DATABASE_URL}")
    print("-" * 50)
    
    try:
        # 初始化数据库
        init_database()
        
        print("-" * 50)
        print("✅ 数据库初始化成功完成！")
        print("📋 已创建的表:")
        print("  - users (用户表)")
        print("  - appointments (预约表)")
        print("  - reviews (评价表)")
        print("  - score_records (成绩记录表)")
        print()
        print("🎉 现在可以启动FastAPI服务器了！")
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        sys.exit(1)

def reset():
    """重置数据库"""
    print("🔄 重置数据库...")
    print("⚠️  警告：这将删除所有现有数据！")
    
    confirm = input("确认重置数据库？ (输入 'yes' 确认): ")
    if confirm.lower() == 'yes':
        try:
            reset_database()
            print("✅ 数据库重置完成！")
        except Exception as e:
            print(f"❌ 数据库重置失败: {e}")
            sys.exit(1)
    else:
        print("取消重置操作。")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        reset()
    else:
        main()