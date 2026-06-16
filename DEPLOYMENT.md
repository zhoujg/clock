# 时钟应用 - 云端同步部署指南

技术栈：PHP + MySQL（后端）+ 纯静态前端
部署架构：后端 PHP 与前端静态文件分离存放

## 1. 服务器环境要求

| 组件 | 最低版本 |
|------|---------|
| PHP | 7.4+ |
| MySQL | 5.7+ 或 MariaDB 10.3+ |
| Nginx | 1.18+ |

PHP 需要启用扩展：`pdo`、`pdo_mysql`、`json`、`mbstring`

## 2. 部署架构

```
/www/wwwroot/neihou/
├── public/clock/              ← 前端（neihou.cn/clock/ 访问）
│   ├── index.html
│   ├── styles/
│   ├── scripts/
│   │   ├── cloudSync.js       ← API 地址已配好
│   │   ├── syncAdapter.js
│   │   ├── authUI.js
│   │   └── ...
│   └── assets/
│
└── clockserver/               ← PHP 后端（Web 无法直接访问，安全）
    ├── config.php             ← 数据库和 JWT 配置【必须修改】
    ├── db.php
    ├── auth.php
    ├── helpers.php
    ├── api/
    │   ├── register.php       ← 注册
    │   ├── login.php          ← 登录
    │   ├── sync.php           ← 配置数据同步
    │   └── stories.php        ← 故事数据 CRUD
    └── sql/
        └── schema.sql         ← 数据库建表脚本
```

## 3. 部署步骤

### 3.1 上传文件

```bash
# 上传前端到 public/clock/
scp -r index.html styles/ scripts/ assets/ user@server:/www/wwwroot/neihou/public/clock/

# 上传后端到 clockserver/
scp -r server/ user@server:/www/wwwroot/neihou/clockserver/
```

### 3.2 初始化数据库

```bash
ssh user@server
mysql -u root -p < /www/wwwroot/neihou/clockserver/sql/schema.sql
```

验证：
```bash
mysql -u root -p -e "USE clock_app; SHOW TABLES;"
# 应输出：users, user_data, stories
```

### 3.3 修改后端配置

编辑 `/www/wwwroot/neihou/clockserver/config.php`：

```php
// 数据库配置
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'clock_app');
define('DB_USER', '你的数据库用户名');
define('DB_PASS', '你的数据库密码');          // ← 必改

// JWT 密钥（务必改为随机字符串）
define('JWT_SECRET', '随机64位字符');          // ← 必改
// 生成方式：php -r "echo bin2hex(random_bytes(32));"
define('JWT_EXPIRE', 86400 * 30);             // Token 有效期 30 天

// CORS
define('ALLOWED_ORIGINS', 'https://neihou.cn'); // ← 必改
```

### 3.4 配置 Nginx

在 `neihou.cn` 的 server 块中添加：

```nginx
# API 请求代理到 clockserver
location ~ ^/clockserver/api/(.+)\.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;   # 改成你的 PHP-FPM 版本
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/neihou/clockserver/api/$1.php;
    fastcgi_read_timeout 60s;
}
```

验证并重载：

```bash
nginx -t && nginx -s reload
```

### 3.5 确认前端 API 地址

`scripts/cloudSync.js` 已配置为：

```javascript
this.baseURL = '/clockserver/api';
```

**无需修改**，Nginx 会在服务端做映射。

### 3.6 设置文件权限

```bash
# clockserver 只允许 PHP-FPM 进程读取
chown -R www-data:www-data /www/wwwroot/neihou/clockserver
chmod 750 /www/wwwroot/neihou/clockserver
chmod 640 /www/wwwroot/neihou/clockserver/config.php  # 配置文件更严格

# 前端保持可读
chmod 755 /www/wwwroot/neihou/public/clock
```

## 4. 验证部署

1. 浏览器访问 `https://neihou.cn/clock` → 确认时钟页面正常显示
2. 打开 DevTools → Network 面板
3. 点击右下角"未登录"按钮，注册一个账号
4. 观察 Network，确认 API 请求成功：
   ```
   POST https://neihou.cn/clockserver/api/register.php → 200 OK
   POST https://neihou.cn/clockserver/api/login.php    → 200 OK
   GET  https://neihou.cn/clockserver/api/sync.php     → 200 OK
   ```
5. 设置背景、添加故事、收藏图片/音乐
6. 在另一台设备登录同一账号 → 确认数据自动同步

## 5. 同步逻辑

### 注册/登录
- 使用**手机号**注册和登录（支持中国大陆 11 位、中国香港 8 位）
- 密码 bcrypt 加密存储
- JWT Token 有效期 30 天

### 配置数据同步
- **设置**（flipClockSettings）→ 键值 `settings`
- **背景收藏**（picsumFavorites）→ 键值 `picsumFavorites`
- **音乐收藏**（musicFavorites）→ 键值 `musicFavorites`
- **森林数据**（forestData）→ 键值 `forestData`
- **成就**（studyAchievements）→ 键值 `achievements`
- **番茄钟**（pomodoroData）→ 键值 `pomodoroData`

### 故事数据同步
- 按日期索引，独立 `stories` 表存储
- 每个故事包含：日期、序号、标题、内容、价值维度、完成状态

### 同步时机
| 事件 | 行为 |
|------|------|
| 用户登录 | 全量拉取云端数据到本地 |
| 数据变更 | 500ms 防抖后推送到云端（last-write-wins） |
| 应用启动 | 异步从云端加载今日故事 |
| 新的一天 | 尝试从云端加载当日故事 |

## 6. 数据库表结构

### users - 用户
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| phone | VARCHAR(20) UNIQUE | 手机号 |
| password | VARCHAR(255) | bcrypt 密码 |
| created_at | DATETIME | 注册时间 |

### user_data - 配置数据
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| user_id | INT | 外键 → users.id |
| data_key | VARCHAR(50) | 键名 |
| data_value | LONGTEXT | JSON 值 |
| updated_at | DATETIME | 更新时间 |
| UNIQUE KEY (user_id, data_key) |

### stories - 故事
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| user_id | INT | 外键 → users.id |
| story_date | DATE | 日期 |
| story_index | TINYINT | 序号（1-3） |
| title | VARCHAR(200) | 标题 |
| content | MEDIUMTEXT | 内容（JSON） |
| value_dim | VARCHAR(50) | 价值维度 |
| completed | TINYINT(1) | 是否完成 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| UNIQUE KEY (user_id, story_date, story_index) |

## 7. 故障排查

| 现象 | 检查项 |
|------|--------|
| 注册/登录无响应 | `tail -f /var/log/nginx/error.log` |
| 注册返回 500 | 检查 `config.php` 数据库密码；确认 schema.sql 已执行 |
| 同步不工作 | DevTools → Network → 查看 API 返回内容 |
| CORS 错误 | 检查 `config.php` 中 `ALLOWED_ORIGINS` 是否匹配当前域名 |
| Token 失效 | 检查 `JWT_SECRET` 是否在部署后被修改过 |
| PHP 文件 502 | 确认 PHP-FPM 版本和 socket 路径匹配 |
| 数据库写入失败 | `GRANT ALL ON clock_app.* TO 'user'@'localhost';` |

## 8. 文件清单

### 需要上传到服务器的文件
```
前端（/www/wwwroot/neihou/public/clock/）：
  index.html
  styles/*.css
  scripts/*.js
  assets/*

后端（/www/wwwroot/neihou/clockserver/）：
  config.php     ← 必须编辑
  db.php
  auth.php
  helpers.php
  api/register.php
  api/login.php
  api/sync.php
  api/stories.php
  sql/schema.sql
```

### 不需要上传的文件
```
DEPLOYMENT.md          ← 本文档
nginx.conf.example     ← 参考示例
server/.htaccess       ← Nginx 不需要
android/               ← Android 构建目录
.workbuddy/            ← 开发工具数据
```
