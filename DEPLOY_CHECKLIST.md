# 部署检查清单

快速参考，确保部署成功。

## 部署前 📋

- [ ] 检查所有代码已提交到 Git
- [ ] 运行 `./scripts/generate-music-list.sh` 生成音乐索引
- [ ] 确认 `assets/bgm/music-list.json` 文件已生成
- [ ] 本地测试所有功能正常

## 执行部署 🚀

选择一种方式：

### 方式 A: 自动部署（推荐）
```bash
./deploy.sh user@neihou.cn /var/www/html/clock
```

### 方式 B: 手动部署
```bash
# 1. 上传文件
rsync -avz --exclude 'node_modules' --exclude '.git' \
      ./ user@neihou.cn:/var/www/html/clock/

# 2. 设置权限
ssh user@neihou.cn
sudo chown -R www-data:www-data /var/www/html/clock
find /var/www/html/clock -type f -exec chmod 644 {} \;
find /var/www/html/clock -type d -exec chmod 755 {} \;
```

## 部署后验证 ✅

### 基础检查
- [ ] 访问 https://neihou.cn/clock/ 页面正常显示
- [ ] Favicon 在标签页显示正确
- [ ] 浏览器控制台无 404 错误（favicon.svg, index.html 等）
- [ ] 所有 CSS 和 JS 文件正常加载

### 音乐功能检查
- [ ] 点击音乐按钮（🎵）打开播放器面板
- [ ] 音乐列表显示所有歌曲（应该有 3 首）
- [ ] 控制台显示：`✅ 从 music-list.json 加载了 X 首音乐`
- [ ] 点击任意歌曲可以播放
- [ ] 播放/暂停按钮工作正常
- [ ] 上一曲/下一曲按钮工作正常
- [ ] 音乐播放时暂停滴答声
- [ ] 音乐暂停时恢复滴答声

### 其他功能检查
- [ ] 时钟翻转动画正常
- [ ] 日期和星期显示正确
- [ ] 励志语正常显示
- [ ] 背景颜色可以更改
- [ ] 动画线条可以开关
- [ ] 滴答声可以开关
- [ ] 成就功能正常
- [ ] 番茄钟功能正常
- [ ] 森林种树功能正常

### 控制台检查

✅ **正常输出**（可以忽略一个 403）:
```
未找到 music-list.json，尝试读取目录...
无法读取 bgm 目录列表: 无法访问 bgm 目录
✅ 从 music-list.json 加载了 3 首音乐
```

或者（如果服务器支持目录浏览）:
```
✅ 从目录读取了 3 首音乐
```

❌ **异常输出**（需要修复）:
```
❌ 404 错误: favicon.svg, music-list.json, 或其他文件
❌ 403 错误: 音乐文件 (.mp3)
❌ 未找到音乐文件
❌ 音乐播放失败
```

## 问题排查 🔍

如果遇到问题，按此顺序检查：

### 1. 文件完整性
```bash
ssh user@neihou.cn
ls -la /var/www/html/clock/
ls -la /var/www/html/clock/assets/bgm/
```

确认：
- [ ] index.html 存在
- [ ] favicon.svg 存在
- [ ] music-list.json 存在
- [ ] 所有音乐文件存在

### 2. 文件权限
```bash
ssh user@neihou.cn
ls -la /var/www/html/clock/assets/bgm/
```

应该看到：
```
-rw-r--r-- 1 www-data www-data ... music-list.json
-rw-r--r-- 1 www-data www-data ... The Mass.mp3
-rw-r--r-- 1 www-data www-data ... Victory.mp3
```

如果权限不对，修复：
```bash
chmod 644 /var/www/html/clock/assets/bgm/*
```

### 3. 服务器配置
```bash
# Apache 用户
sudo apache2ctl -t
sudo systemctl status apache2

# Nginx 用户
sudo nginx -t
sudo systemctl status nginx
```

### 4. 错误日志
```bash
# Apache
sudo tail -f /var/log/apache2/error.log

# Nginx
sudo tail -f /var/log/nginx/error.log
```

## 快速修复命令 🛠️

### 重新生成音乐索引
```bash
./scripts/generate-music-list.sh
scp assets/bgm/music-list.json user@neihou.cn:/var/www/html/clock/assets/bgm/
```

### 修复文件权限
```bash
ssh user@neihou.cn "sudo chown -R www-data:www-data /var/www/html/clock && \
                    find /var/www/html/clock -type f -exec chmod 644 {} \; && \
                    find /var/www/html/clock -type d -exec chmod 755 {} \;"
```

### 重新上传所有文件
```bash
./deploy.sh user@neihou.cn /var/www/html/clock
```

### 只更新音乐相关文件
```bash
scp assets/bgm/music-list.json user@neihou.cn:/var/www/html/clock/assets/bgm/
scp assets/bgm/*.mp3 user@neihou.cn:/var/www/html/clock/assets/bgm/
scp scripts/bgmPlayer.js user@neihou.cn:/var/www/html/clock/scripts/
```

## 性能检查 ⚡

部署成功后，可选的性能优化检查：

- [ ] 启用 Gzip 压缩（检查响应头）
- [ ] 设置缓存策略（检查响应头）
- [ ] 压缩音乐文件大小（如需要）
- [ ] 检查页面加载时间（< 3秒）

使用浏览器开发者工具的 Network 面板检查：
- gzip 压缩已启用（Content-Encoding: gzip）
- 静态资源有缓存（Cache-Control 头）
- 没有重复加载资源

## 回滚计划 ↩️

如果部署出现严重问题：

```bash
# 1. 从备份恢复（如果有）
ssh user@neihou.cn
sudo cp -r /backup/clock /var/www/html/

# 2. 或从 Git 回滚到上一个版本
git checkout <previous-commit>
./deploy.sh user@neihou.cn /var/www/html/clock
```

## 文档参考 📚

- **详细部署指南**: `DEPLOY_GUIDE.md`
- **音乐部署说明**: `MUSIC_DEPLOYMENT.md`
- **部署修复总结**: `DEPLOYMENT_SUMMARY.md`

## 完成 🎉

- [ ] 所有检查项通过
- [ ] 记录部署日期和版本
- [ ] 通知相关人员
- [ ] 更新部署文档（如有变化）

---

**部署日期**: _______________
**部署版本**: _______________
**部署人员**: _______________
**备注**: _______________
