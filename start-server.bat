@echo off
REM 本地开发服务器启动脚本（Windows 版本）
REM 使用 PHP 内置服务器（支持 PHP 后端 API）

set PORT=8080

echo 🚀 启动本地 PHP 开发服务器...
echo 📍 前端: http://localhost:%PORT%
echo 📍 API:  http://localhost:%PORT%/server/api/
echo ⏹️  按 Ctrl+C 停止服务器
echo.

REM 使用 PHP 内置服务器（从项目根目录提供文件）
php -S localhost:%PORT%
