#!/bin/bash
# 本地开发环境初始化脚本
# 用法：cd server && bash init-local.sh

echo "🔧 初始化本地开发数据库..."

# 创建数据库（如果不存在）
mysql -u root -e "CREATE DATABASE IF NOT EXISTS clock_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ 无法连接 MySQL，请先启动 MySQL 服务"
    echo "   方法：Docker docker run -d --name mysql-dev -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=clock_app mysql:5.7"
    exit 1
fi

# 导入表结构
mysql -u root clock_app < sql/schema.sql
echo "✅ 表结构已创建"

# 插入默认用户（zhoumx / 111111）
mysql -u root clock_app -e "
INSERT IGNORE INTO users (phone, password, nickname)
VALUES (
    '44837939',
    '$2y$12$YKt.NGm.eDEDwhlTC3zOTOM1oyFqUn984EIBUNH7BFDV4lzmFtxKq',
    'zhoumx'
);
"
echo "✅ 默认用户已创建（手机号: 44837939，密码: 111111）"

echo ""
echo "🎉 本地数据库初始化完成！"
echo "   启动开发服务器：cd .. && php -S localhost:8080"
echo "   然后访问：http://localhost:8080"
