#!/bin/bash

# 激活conda环境
echo "🔄 激活conda环境: edu"
conda activate edu

# 检查conda环境是否激活成功
if [ "$CONDA_DEFAULT_ENV" != "edu" ]; then
    echo "❌ conda环境激活失败，请确保edu环境存在"
    echo "💡 创建环境: conda create -n edu python=3.9"
    exit 1
fi

echo "✅ conda环境激活成功: $CONDA_DEFAULT_ENV"

# 函数：杀死指定端口的进程
kill_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 检查端口 $port 是否被占用..."
    
    # 查找占用端口的进程
    local pid=$(lsof -ti:$port)
    
    if [ -n "$pid" ]; then
        echo "⚠️  端口 $port 被进程 $pid 占用，正在终止..."
        kill -9 $pid
        sleep 1
        
        # 验证进程是否已终止
        if ! lsof -ti:$port > /dev/null; then
            echo "✅ $service_name 端口 $port 已释放"
        else
            echo "❌ 无法释放端口 $port"
            exit 1
        fi
    else
        echo "✅ $service_name 端口 $port 空闲"
    fi
}

# 杀死前后端占用的端口
echo "🧹 清理端口占用..."
kill_port 5173 "前端开发服务器"
kill_port 8000 "后端API服务器"
kill_port 3000 "前端备用端口"

echo ""
echo "🚀 启动开发服务器..."

# 启动后端服务器
echo "📡 启动后端服务器 (端口 8000)..."
cd backend
if [ -f "requirements.txt" ]; then
    echo "📦 检查Python依赖..."
    pip install -r requirements.txt
fi

# 启动FastAPI服务器
if [ -f "main.py" ]; then
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    echo "✅ 后端服务器已启动 (PID: $BACKEND_PID)"
elif [ -f "src/main.py" ]; then
    uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    echo "✅ 后端服务器已启动 (PID: $BACKEND_PID)"
else
    echo "❌ 未找到后端入口文件 (main.py)"
    echo "💡 请确保backend目录下存在main.py文件"
fi

# 等待后端启动
echo "⏳ 等待后端服务器启动..."
sleep 3

# 返回根目录并启动前端
cd ../frontend

echo "🎨 启动前端服务器 (端口 5173)..."
if [ -f "package.json" ]; then
    echo "📦 检查Node.js依赖..."
    npm install
    
    # 启动Vite开发服务器
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ 前端服务器已启动 (PID: $FRONTEND_PID)"
else
    echo "❌ 未找到前端package.json文件"
    echo "💡 请确保frontend目录下存在package.json文件"
fi

# 等待前端启动
echo "⏳ 等待前端服务器启动..."
sleep 3

echo ""
echo "🎉 开发环境启动完成！"
echo "📱 前端地址: http://localhost:5173"
echo "🔌 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "💡 使用 Ctrl+C 停止所有服务"

# 创建停止服务的函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ 后端服务器已停止"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务器已停止"
    fi
    
    # 确保端口完全释放
    kill_port 5173 "前端"
    kill_port 8000 "后端"
    
    echo "🏁 所有服务已停止"
    exit 0
}

# 捕获Ctrl+C信号
trap cleanup SIGINT SIGTERM

# 保持脚本运行
echo "⌛ 服务运行中... 按 Ctrl+C 停止"
wait