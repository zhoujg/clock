# 时钟应用 - 云端同步部署指南

技术栈：PHP + MySQL（后端）+ 纯静态前端

## 1. 服务器环境要求

| 组件 | 最低版本 |
|------|---------|
| PHP | 7.4+ |
| MySQL | 5.7+ 或 MariaDB 10.3+ |
| Nginx 或 Apache | 任意版本 |

PHP 需要启用扩展：`pdo`、`pdo_mysql`、`json`、`mbstring`

## 2. 部署步骤

### 2.1 上传文件

将整个项目目录上传到服务器，例如 `/var/www/clock/`。

### 2.2 初始化数据库

```bash
mysql -u root -p < server/sql/schema.sql
```

### 2.3 配置服务器

编辑 `server/config.php`，修改以下内容：

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password_here');
define('JWT_SECRET', '随机生成64位字符串');  // 运行: php -r "echo bin2hex(random_bytes(32));"
define('ALLOWED_ORIGINS', 'https://your-domain.com');  // 生产环境改为你的域名
```

### 2.4 配置 Web 服务器

**Nginx**：参考 `server/nginx.conf.example`

**Apache**：确保 `.htaccess` 已启用 RewriteEngine，PHP 文件可通过 `/api/*.php` 访问。

关键点：确保 `/api/*.php` 能被 PHP-FPM 或 mod_php 执行，其他文件作为静态文件提供。

### 2.5 修改前端 API 地址

编辑 `scripts/cloudSync.js`，修改 `baseURL`：

```javascript
this.baseURL = 'https://your-domain.com/api';  // 改为你的域名
```

开发阶段可使用相对路径 `/api`（前后端同域部署时适用）。

### 2.6 重启 Web 服务器

```bash
# Nginx
sudo systemctl reload nginx

# Apache
sudo systemctl reload apache2
```

## 3. 验证部署

1. 访问 `https://your-domain.com` 确认时钟正常显示
2. 点击右上角"未登录"按钮，注册一个账号
3. 设置背景、添加故事、收藏图片/音乐
4. 在另一台设备上登录同一账号，确认数据自动同步

## 4. 文件结构

```
clock/
├── index.html              # 前端入口
├── styles/                 # CSS 样式
├── scripts/                # 前端 JS
│   ├── cloudSync.js        # 云端 API 封装
│   ├── syncAdapter.js      # 本地/云端同步适配器
│   ├── authUI.js           # 登录/注册 UI
│   └── ...
├── server/                 # PHP 后端
│   ├── config.php          # 数据库和 JWT 配置
│   ├── db.php              # 数据库连接
│   ├── auth.php            # JWT 认证
│   ├── helpers.php         # 通用工具
│   ├── api/
│   │   ├── register.php    # 注册
│   │   ├── login.php       # 登录
│   │   ├── sync.php        # 用户数据同步
│   │   └── stories.php     # 故事 CRUD
│   ├── sql/
│   │   └── schema.sql      # 数据库建表
│   └── nginx.conf.example  # Nginx 配置示例
└── assets/                 # 静态资源
```

## 5. 故障排查

| 问题 | 检查 |
|------|------|
| 注册/登录失败 | 查看 PHP 错误日志；检查数据库连接 |
| 同步不工作 | 打开浏览器 DevTools → Network，查看 API 请求 |
| CORS 错误 | 检查 config.php 中 `ALLOWED_ORIGINS` 配置 |
| JWT 失效 | 检查 `JWT_SECRET` 是否在部署后修改过 |
| 数据库写入失败 | 检查 MySQL 用户权限 |

## 6. Android 端

Android 构建产物（`android/`）需要重新构建以包含新的前端文件。使用 Capacitor 构建：

```bash
npx cap sync android
```

然后重新编译 APK。
