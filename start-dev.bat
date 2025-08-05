@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

REM 激活conda环境
echo 🔄 激活conda环境: edu
call conda activate edu

REM 检查conda环境是否激活成功
if not "%CONDA_DEFAULT_ENV%"=="edu" (
    echo ❌ conda环境激活失败，请确保edu环境存在
    echo 💡 创建环境: conda create -n edu python=3.9
    pause
    exit /b 1
)

echo ✅ conda环境激活成功: %CONDA_DEFAULT_ENV%

REM 函数：杀死指定端口的进程
:kill_port
set port=%1
set service_name=%2

echo 🔍 检查端口 %port% 是否被占用...

REM 查找占用端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%port%') do (
    set pid=%%a
    if not "!pid!"=="" (
        echo ⚠️  端口 %port% 被进程 !pid! 占用，正在终止...
        taskkill /f /pid !pid! > nul 2>&1
        timeout /t 1 > nul
        echo ✅ %service_name% 端口 %port% 已释放
        goto :eof
    )
)

echo ✅ %service_name% 端口 %port% 空闲
goto :eof

REM 杀死前后端占用的端口
echo 🧹 清理端口占用...
call :kill_port 5173 "前端开发服务器"
call :kill_port 8000 "后端API服务器"
call :kill_port 3000 "前端备用端口"

echo.
echo 🚀 启动开发服务器...

REM 启动后端服务器
echo 📡 启动后端服务器 (端口 8000)...
cd backend

if exist "requirements.txt" (
    echo 📦 检查Python依赖...
    pip install -r requirements.txt
)

REM 启动FastAPI服务器
if exist "main.py" (
    start "后端服务器" uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    echo ✅ 后端服务器已启动
) else if exist "src\main.py" (
    start "后端服务器" uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
    echo ✅ 后端服务器已启动
) else (
    echo ❌ 未找到后端入口文件 (main.py)
    echo 💡 请确保backend目录下存在main.py文件
)

REM 等待后端启动
echo ⏳ 等待后端服务器启动...
timeout /t 3 > nul

REM 返回根目录并启动前端
cd ..\frontend

echo 🎨 启动前端服务器 (端口 5173)...
if exist "package.json" (
    echo 📦 检查Node.js依赖...
    call npm install
    
    REM 启动Vite开发服务器
    start "前端服务器" npm run dev
    echo ✅ 前端服务器已启动
) else (
    echo ❌ 未找到前端package.json文件
    echo 💡 请确保frontend目录下存在package.json文件
)

REM 等待前端启动
echo ⏳ 等待前端服务器启动...
timeout /t 3 > nul

echo.
echo 🎉 开发环境启动完成！
echo 📱 前端地址: http://localhost:5173
echo 🔌 后端地址: http://localhost:8000
echo 📚 API文档: http://localhost:8000/docs
echo.
echo 💡 关闭此窗口或按任意键停止所有服务
pause

REM 停止服务
echo.
echo 🛑 正在停止服务...
taskkill /f /im "uvicorn.exe" > nul 2>&1
taskkill /f /im "node.exe" > nul 2>&1

REM 确保端口完全释放
call :kill_port 5173 "前端"
call :kill_port 8000 "后端"

echo 🏁 所有服务已停止
pause