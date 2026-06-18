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
define('DB_NAME', 'clock');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT 密钥（部署时务必改为随机字符串，可用 php -r "echo bin2hex(random_bytes(32));" 生成）
define('JWT_SECRET', '02b652b3dff49b3279d803856f127eb6607f986a7cad22e67244ead82449014e%');
define('JWT_EXPIRE', 86400 * 30);        // Token 有效期：30 天
define('JWT_ALGORITHM', 'HS256');

// CORS 允许的前端域名（支持多个）
define('ALLOWED_ORIGINS', '*');           // 开发阶段允许所有，部署时改为具体域名

// 其他
define('API_VERSION', '1.0.0');
define('MAX_STORIES_PER_DAY', 10);        // 每天最多故事数
define('SYNC_BATCH_SIZE', 50);            // 增量同步每批最大条数

// ============================================
// AI 内容生成 API 配置（智谱 BigModel）
// ============================================
// API 地址（智谱 BigModel，兼容 OpenAI 格式）
define('AI_API_URL', 'https://open.bigmodel.cn/api/paas/v4/chat/completions');

// API 密钥
define('AI_API_KEY', 'ba223647ac644e09b17ad581d8c1b40b.QwCXXtk43VzMoBUw');

// AI 模型（智谱可选: glm-4-flash / glm-4 / glm-4-plus）
define('AI_MODEL', 'glm-4-flash');
