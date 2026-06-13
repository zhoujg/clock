# 本地开发指南

## 问题说明

当直接在浏览器中打开 `index.html` 文件（使用 `file://` 协议）时，会遇到以下问题：

1. **CORS 错误**：浏览器阻止从本地文件系统加载资源
2. **Fetch 失败**：无法加载 `music-list.json` 和其他资源
3. **功能受限**：某些功能无法正常工作

## 解决方案

使用本地 HTTP 服务器来运行应用。

### 方法 1：使用提供的脚本（推荐）

```bash
# 在项目根目录运行
./start-server.sh
```

然后在浏览器中访问：`http://localhost:8000`

### 方法 2：使用 Python 直接启动

```bash
# Python 3
python3 -m http.server 8000

# 或者 Python 2
python -m SimpleHTTPServer 8000
```

然后在浏览器中访问：`http://localhost:8000`

### 方法 3：使用 Node.js（需要先安装）

```bash
# 安装 http-server
npm install -g http-server

# 启动服务器
http-server -p 8000
```

然后在浏览器中访问：`http://localhost:8000`

### 方法 4：使用 VS Code Live Server 扩展

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## 修复内容

本次修复包括：

1. ✅ 添加了缺失的 BGM 播放器 UI 元素
2. ✅ 添加了缺失的番茄钟 UI 元素
3. ✅ 添加了 `bgmPlayer.css` 样式引用
4. ✅ 修复了 CORS 错误处理
5. ✅ 添加了默认音乐列表回退机制
6. ✅ 创建了便捷的服务器启动脚本

## 已知音乐文件

项目中包含以下音乐文件：
- The Mass.mp3
- Victory.mp3

它们位于 `assets/bgm/` 目录中。

## 添加更多音乐

要添加更多音乐：

1. 将音乐文件（MP3、WAV、OGG 等）复制到 `assets/bgm/` 目录
2. 更新 `assets/bgm/music-list.json`（如果使用）
3. 或者修改 `scripts/bgmPlayer.js` 中的 `useDefaultMusicList()` 方法

## Android 应用

如果您要构建 Android 应用，请参考：
- `ANDROID_BUILD_GUIDE.md`
- `BGM_INSTALLATION.md`
