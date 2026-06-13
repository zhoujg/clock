# 🚀 快速开始指南

## 3 步启动应用

### 步骤 1: 打开终端

在 Finder 中：
1. 右键点击项目文件夹
2. 选择 "服务" → "新建位于文件夹位置的终端窗口"

或者：
1. 打开 Terminal.app
2. 输入: `cd /Users/zhoujingen/Documents/BangSuite/clock`

### 步骤 2: 启动服务器

在终端中输入：

```bash
./start-server.sh
```

您会看到类似这样的输出：
```
🚀 启动本地服务器...
📍 访问地址: http://localhost:8000
⏹️  按 Ctrl+C 停止服务器

Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

### 步骤 3: 打开浏览器

在浏览器地址栏输入以下任一地址：

- **测试页面**（推荐先访问）: `http://localhost:8000/test-local.html`
- **时钟应用**: `http://localhost:8000/index.html`
- **或直接**: `http://localhost:8000`

## ✨ 功能说明

### 🎵 BGM 音乐播放器

1. 点击右下角的 **播放按钮图标** 展开播放器
2. 选择音乐列表中的歌曲
3. 使用播放控制：
   - ▶️ 播放/暂停
   - ⏮️ 上一曲
   - ⏭️ 下一曲
   - 🔁 单曲循环
   - 🔊 音量调节

### 🍅 番茄钟

1. 点击右侧的 **番茄图标** 打开番茄钟
2. 设置专注时间和休息时间
3. 点击 "开始" 启动计时
4. 可以暂停或重置计时器

### ⚙️ 其他设置

点击左上角的 **齿轮图标** 可以：
- 更改背景颜色
- 开启/关闭动画线条
- 开启/关闭滴答声音
- 上传自定义背景图片

## 🛑 停止服务器

在运行服务器的终端窗口中按 `Ctrl+C`

## 💡 提示

### 如果端口被占用

如果看到 "Address already in use" 错误，使用其他端口：

```bash
python3 -m http.server 8080
```

然后访问: `http://localhost:8080`

### 如果脚本无法运行

手动启动服务器：

```bash
python3 -m http.server 8000
```

### 浏览器推荐

推荐使用以下浏览器以获得最佳体验：
- ✅ Google Chrome
- ✅ Safari
- ✅ Microsoft Edge
- ✅ Firefox

## ❓ 遇到问题？

### 问题 1: 音乐无法播放

**检查清单**：
- ✅ 使用 HTTP 服务器（不是直接打开 HTML）
- ✅ 音乐文件在 `assets/bgm/` 目录
- ✅ 浏览器控制台没有错误

### 问题 2: 界面显示异常

**解决方案**：
1. 强制刷新页面：`Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows)
2. 清除浏览器缓存
3. 重启服务器

### 问题 3: 控制台有错误

**检查**：
1. 打开开发者工具：`F12` 或 `Cmd+Option+I`
2. 查看 Console 标签页
3. 如果有红色错误，检查文件路径是否正确

## 📚 更多信息

- 详细修复说明: `CORS_FIX_SUMMARY.md`
- 开发指南: `LOCAL_DEVELOPMENT.md`
- Android 构建: `ANDROID_BUILD_GUIDE.md`
- BGM 功能: `BGM_FEATURES.md`

## 🎉 享受使用！

您的周墨欣时钟应用已经准备就绪！

如有任何问题，请查看上述文档或检查浏览器控制台的错误信息。
