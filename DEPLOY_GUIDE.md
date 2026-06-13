# 云服务器部署指南

## 问题诊断

您遇到的错误分析：

1. **`GET https://neihou.cn/clock/none 404`** - 某个资源路径为 "none" 或 undefined
2. **`GET https://neihou.cn/clock/assets/bgm/ 403 (Forbidden)`** - 服务器禁止目录浏览
3. **`GET https://neihou.cn/favicon.svg 404`** - favicon 路径错误（使用了绝对路径 `/favicon.svg` 而非相对路径）

## 已修复的问题

### 1. Favicon 路径问题
- **修改前**: `href="/favicon.svg"` （从根目录查找）
- **修改后**: `href="./favicon.svg"` （从当前目录查找）

### 2. BGM 目录访问问题（403 Forbidden）

**问题原因**：大多数生产服务器出于安全考虑，会禁止目录浏览，导致应用无法动态读取音乐文件列表。

**解决方案**：使用 `music-list.json` 索引文件

应用会按以下顺序尝试加载音乐：
1. **首选**：读取 `assets/bgm/music-list.json` 文件（推荐用于生产环境）
2. **备选**：直接读取目录列表（需要服务器支持，适合开发环境）
3. **后备**：显示空列表并提示用户

### 3. 音乐列表索引文件

已生成 `assets/bgm/music-list.json` 文件，包含所有音乐文件的列表。这个文件的优势：
- ✅ 不需要服务器支持目录浏览
- ✅ 加载速度更快
- ✅ 更安全（不暴露目录结构）
- ✅ 支持任何 Web 服务器配置

## 部署前准备

### 生成音乐列表索引

**重要**：每次添加或删除音乐文件后，都需要重新生成索引文件。

```bash
# 在项目根目录运行
./scripts/generate-music-list.sh
```

这会扫描 `assets/bgm/` 目录并生成 `music-list.json` 文件。

## 部署步骤

### 方式一：使用自动部署脚本（推荐）

```bash
# 在项目根目录运行
./deploy.sh user@neihou.cn /var/www/html/clock
```

脚本会自动：
1. 检查本地文件
2. 打包项目（排除不必要的文件）
3. 上传到服务器
4. 设置正确的权限
5. 清理临时文件

### 方式二：手动部署

#### 1. 生成音乐列表
```bash
./scripts/generate-music-list.sh
```

#### 2. 上传文件到服务器
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'android' \
      ./ user@neihou.cn:/var/www/html/clock/
```

#### 3. 在服务器上设置权限
```bash
ssh user@neihou.cn

# 设置所有者（Apache）
sudo chown -R www-data:www-data /var/www/html/clock
# 或者（Nginx）
sudo chown -R nginx:nginx /var/www/html/clock

# 设置权限
find /var/www/html/clock -type f -exec chmod 644 {} \;
find /var/www/html/clock -type d -exec chmod 755 {} \;
```

### 方式三：使用 Docker 部署

创建 `Dockerfile`:
```dockerfile
FROM nginx:alpine

# 复制项目文件
COPY . /usr/share/nginx/html/clock/

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/clock.conf

# 设置权限
RUN chmod -R 755 /usr/share/nginx/html/clock

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

构建和运行：
```bash
docker build -t clock-app .
docker run -d -p 80:80 clock-app
```

## 服务器配置

### Apache 配置

项目包含 `.htaccess` 文件，需要确保：

1. 启用 `mod_rewrite` 模块：
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. 允许 `.htaccess` 覆盖配置（在主配置文件中）：
   ```apache
   <Directory /var/www/html/clock>
       AllowOverride All
       Require all granted
   </Directory>
   ```

3. 重新加载配置：
   ```bash
   sudo systemctl reload apache2
   ```

### Nginx 配置

使用提供的 `nginx.conf` 文件作为参考：

1. 编辑站点配置文件：
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```

2. 添加 location 配置（参考 `nginx.conf` 文件）

3. 测试并重新加载：
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

**关键配置项**：
- 禁用目录浏览：`autoindex off;`
- 正确的 MIME 类型设置
- CORS 头（允许音频跨域）
- 缓存策略

## 验证部署

部署完成后，请检查：

### 1. 基础功能检查
- [ ] 访问 `https://neihou.cn/clock/` 页面正常显示
- [ ] Favicon 正确显示
- [ ] 浏览器控制台无 404 或 403 错误

### 2. 音乐功能检查
- [ ] 点击音乐按钮，面板正常打开
- [ ] 音乐列表显示所有音乐文件
- [ ] 可以播放音乐
- [ ] 音乐控制按钮（播放/暂停/上一曲/下一曲）正常工作

### 3. 控制台检查
打开浏览器开发者工具，应该看到：
- ✅ `从 music-list.json 加载了 X 首音乐`
- ❌ 不应该有 403 或 404 错误

## 添加新音乐

当您需要添加新音乐时：

1. 将音乐文件上传到服务器的 `assets/bgm/` 目录
2. 在本地将音乐文件添加到 `assets/bgm/` 目录
3. 运行生成脚本：
   ```bash
   ./scripts/generate-music-list.sh
   ```
4. 上传更新后的 `music-list.json` 到服务器：
   ```bash
   scp assets/bgm/music-list.json user@neihou.cn:/var/www/html/clock/assets/bgm/
   ```
5. 刷新页面即可看到新音乐

## 常见问题

### Q1: 音乐列表显示为空
**A**: 
1. 检查 `music-list.json` 是否存在且已上传
2. 检查文件路径是否正确
3. 查看浏览器控制台的错误信息

```bash
# 在服务器上检查
ls -la /var/www/html/clock/assets/bgm/
cat /var/www/html/clock/assets/bgm/music-list.json
```

### Q2: 音乐文件无法播放
**A**: 
1. 检查文件权限（应该是 644）
2. 检查 MIME 类型配置
3. 检查浏览器控制台是否有 CORS 错误

```bash
# 检查权限
ls -l /var/www/html/clock/assets/bgm/*.mp3

# 设置正确权限
chmod 644 /var/www/html/clock/assets/bgm/*.mp3
```

### Q3: 仍然看到 403 错误
**A**: 这是正常的，如果您看到：
```
无法读取 bgm 目录列表: 无法访问 bgm 目录
从 music-list.json 加载了 X 首音乐
```
说明应用已正确回退到使用 `music-list.json`，403 错误可以忽略。

如果完全没有加载音乐，请检查 `music-list.json` 文件。

### Q4: 部署后看到 "none" 404 错误
**A**: 这可能是某个资源路径未正确设置。检查：
1. 所有静态资源是否使用相对路径
2. 查看具体哪个文件引发了这个请求
3. 检查 JavaScript 代码中是否有硬编码的路径

### Q5: 如何启用服务器目录浏览？
**A**: 虽然不推荐（出于安全考虑），但如果您确实需要：

**Apache**：
```apache
<Directory /var/www/html/clock/assets/bgm>
    Options +Indexes
</Directory>
```

**Nginx**：
```nginx
location /clock/assets/bgm/ {
    autoindex on;
}
```

但使用 `music-list.json` 是更好的解决方案。

## 性能优化建议

1. **启用 Gzip 压缩** - 减少传输大小
2. **设置适当的缓存策略** - 提高加载速度
3. **使用 CDN** - 加速静态资源访问
4. **压缩音乐文件** - 使用适当的比特率（如 128kbps 或 192kbps）

## 本地开发环境

本地开发时，可以启动一个支持目录浏览的简单服务器：

```bash
# 使用 Python（推荐）
python3 -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000

# 或使用提供的脚本
./start-server.sh
```

本地环境会自动使用目录浏览方式加载音乐，无需 `music-list.json`。

## 支持

如果遇到其他问题，请检查：
1. 服务器错误日志：
   - Apache: `/var/log/apache2/error.log`
   - Nginx: `/var/log/nginx/error.log`
2. 浏览器开发者工具的控制台和网络面板
3. 文件权限和所有权设置

---

**最后更新**: 已支持动态音乐列表和自动索引生成
