@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 双拼练习网站部署脚本 (Windows)
REM 使用方法: deploy.bat

set HOST=root@morefine
set REMOTE_PATH=/opt/websites/shuang
set DEPLOY_DIR=deploy

echo 🚀 开始部署双拼练习网站...

REM 检查必要文件
echo 📋 检查必要文件...
if not exist "index.html" (
    echo ❌ index.html 不存在，请先运行 npm run build
    pause
    exit /b 1
)

if not exist "build" (
    echo ❌ build 目录不存在，请先运行 npm run build
    pause
    exit /b 1
)

if not exist "img" (
    echo ❌ img 目录不存在
    pause
    exit /b 1
)

REM 清理旧的部署目录
echo 🧹 清理旧的部署目录...
if exist "%DEPLOY_DIR%" (
    rmdir /s /q "%DEPLOY_DIR%"
)

REM 创建部署目录
echo 📁 创建部署目录...
mkdir "%DEPLOY_DIR%"

REM 复制文件
echo 📦 复制文件到部署目录...
copy "index.html" "%DEPLOY_DIR%\"
xcopy "build" "%DEPLOY_DIR%\build\" /E /I /Y
xcopy "img" "%DEPLOY_DIR%\img\" /E /I /Y

REM 创建部署信息文件
echo 📝 创建部署信息文件...
echo {> "%DEPLOY_DIR%\deploy-info.json"
echo   "timestamp": "%date% %time%",>> "%DEPLOY_DIR%\deploy-info.json"
echo   "version": "6.0.0",>> "%DEPLOY_DIR%\deploy-info.json"
echo   "files": ["index.html", "build", "img"]>> "%DEPLOY_DIR%\deploy-info.json"
echo }>> "%DEPLOY_DIR%\deploy-info.json"

REM 检查SSH连接
echo 🔌 检查SSH连接...
ssh -o ConnectTimeout=10 %HOST% "echo SSH连接正常" >nul 2>&1
if errorlevel 1 (
    echo ❌ 无法连接到主机 %HOST%
    echo 请确保SSH密钥已配置或使用密码认证
    pause
    exit /b 1
)

REM 创建远程目录
echo 📂 创建远程目录...
ssh %HOST% "mkdir -p %REMOTE_PATH%"

REM 上传文件
echo ⬆️  上传文件到主机...
scp -r "%DEPLOY_DIR%\*" "%HOST%:%REMOTE_PATH%/"

REM 设置文件权限
echo 🔐 设置文件权限...
ssh %HOST% "chmod -R 755 %REMOTE_PATH%"

REM 显示部署信息
echo.
echo ✅ 部署完成！
echo 📍 访问地址: http://shuang.morefine/
echo 📁 远程路径: %REMOTE_PATH%
echo ⏰ 部署时间: %date% %time%
echo.

REM 询问是否清理本地部署目录
set /p CLEANUP="是否清理本地部署目录? (y/N): "
if /i "%CLEANUP%"=="y" (
    rmdir /s /q "%DEPLOY_DIR%"
    echo 🧹 本地部署目录已清理
)

pause
