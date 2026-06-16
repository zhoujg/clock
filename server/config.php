<?php
/**
 * 时钟应用 - 服务器配置
 * 
 * 部署时请修改以下配置：
 * 1. 修改数据库连接信息
 * 2. 修改 JWT_SECRET 为随机字符串
 * 3. 修改 ALLOWED_ORIGINS 为你的前端域名
 */

// 数据库配置
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'clock_app');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT 密钥（部署时务必改为随机字符串，可用 php -r "echo bin2hex(random_bytes(32));" 生成）
define('JWT_SECRET', 'change_me_to_random_64_char_string');
define('JWT_EXPIRE', 86400 * 30);        // Token 有效期：30 天
define('JWT_ALGORITHM', 'HS256');

// CORS 允许的前端域名（支持多个）
define('ALLOWED_ORIGINS', '*');           // 开发阶段允许所有，部署时改为具体域名

// 其他
define('API_VERSION', '1.0.0');
define('MAX_STORIES_PER_DAY', 10);        // 每天最多故事数
define('SYNC_BATCH_SIZE', 50);            // 增量同步每批最大条数
