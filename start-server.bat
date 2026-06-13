@echo off
REM 简单的本地 HTTP 服务器启动脚本（Windows 版本）
REM 用于避免 CORS 错误

set PORT=8000

echo 🚀 启动本地服务器...
echo 📍 访问地址: http://localhost:%PORT%
echo ⏹️  按 Ctrl+C 停止服务器
echo.

REM 使用 Python 3 内置的 HTTP 服务器
python -m http.server %PORT%
