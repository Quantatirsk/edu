#!/bin/bash

conda init
# 快速启动脚本
conda activate edu

# 快速清理端口
echo "🧹 清理端口..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "🚀 启动开发服务器..."

# 启动后端
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

# 启动前端
cd ../frontend && npm run dev &

echo "✅ 服务启动完成！"
echo "📱 前端: http://localhost:5173"
echo "🔌 后端: http://localhost:8000"

wait