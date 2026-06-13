# BGM 音乐播放器 - 快速开始

## 🎵 三步开始使用

### 步骤 1: 添加音乐文件

将你的音乐文件（MP3、WAV、OGG、M4A 等）直接复制到 `assets/bgm/` 目录：

```bash
# 示例
cp ~/Music/my-music.mp3 assets/bgm/
cp ~/Downloads/piano.mp3 assets/bgm/
```

**支持的格式：**
- `.mp3` (推荐) 
- `.wav`
- `.ogg`
- `.m4a`
- `.flac`
- `.aac`

### 步骤 2: 生成音乐索引

运行以下命令自动扫描并生成音乐列表：

```bash
# 使用 Shell 脚本（推荐）
./scripts/generate-music-list.sh

# 或使用 Node.js 脚本
node scripts/generate-music-list.js
```

**输出示例：**
```
🔍 正在扫描音乐文件...
📁 找到 5 个音乐文件:
   1. Victory.mp3
   2. calm.mp3
   3. focus.mp3
   4. piano.mp3
   5. rain.mp3

✅ 成功生成索引文件: music-list.json
📊 共计 5 首音乐
🎵 现在可以刷新页面，音乐播放器会自动加载这些音乐！
```

### 步骤 3: 使用播放器

1. 打开或刷新时钟应用
2. 点击右下角的音乐图标 🎵
3. 从列表中选择音乐开始播放

**就这么简单！** 🎉

---

## 🔧 自动化

### 在构建 Android 应用时自动生成

构建脚本 `build-android.sh` 会自动执行音乐列表生成，无需手动运行。

### 添加到 Git Hooks（可选）

如果想在每次提交前自动更新音乐列表：

```bash
# 创建 pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./scripts/generate-music-list.sh
git add assets/bgm/music-list.json
EOF

chmod +x .git/hooks/pre-commit
```

---

## 📝 文件命名建议

音乐文件会自动提取文件名作为显示名称：

| 文件名 | 显示名称 |
|--------|----------|
| `calm-piano.mp3` | Calm Piano |
| `nature_sounds.mp3` | Nature Sounds |
| `Focus Music.mp3` | Focus Music |
| `lofi-study-01.mp3` | Lofi Study 01 |

**建议：**
- ✅ 使用有意义的英文文件名
- ✅ 用连字符 `-` 或下划线 `_` 分隔单词
- ❌ 避免使用特殊字符
- ❌ 不要使用纯中文文件名（可能有兼容性问题）

---

## 🎮 播放器功能

打开播放器后，你可以：

- **播放/暂停** - 点击中央大按钮
- **上一曲/下一曲** - 点击两侧按钮
- **单曲循环** - 点击循环按钮（🔁）
- **调节音量** - 拖动音量滑块
- **跳转播放** - 点击进度条
- **选择音乐** - 点击列表中的任意曲目

---

## 🔍 故障排除

### 问题：没有找到音乐文件

**检查：**
1. 音乐文件是否在 `assets/bgm/` 目录？
2. 文件扩展名是否正确？（.mp3, .wav 等）
3. 是否运行了 `generate-music-list.sh`？

### 问题：音乐无法播放

**检查：**
1. 浏览器控制台有错误吗？
2. 音乐文件是否损坏？
3. 文件路径是否正确？

**测试方法：**
直接在浏览器打开音乐文件 URL：
```
http://localhost:8000/assets/bgm/your-music.mp3
```

### 问题：列表显示但点击无反应

**原因：** 浏览器自动播放策略阻止
**解决：** 用户必须先与页面交互（点击任何地方）后才能播放音频

---

## 📱 Android 应用

对于 Android 应用：

1. 将音乐文件同时放入：
   - `assets/bgm/`（开发版）
   - `android/app/src/main/assets/public/assets/bgm/`（应用内）

2. 或者在 `build-android.sh` 中添加自动复制：

```bash
# 复制音乐文件到 Android assets
echo "📁 复制音乐文件..."
mkdir -p android/app/src/main/assets/public/assets/bgm
cp assets/bgm/*.mp3 android/app/src/main/assets/public/assets/bgm/ 2>/dev/null || true
```

---

## 🌐 Web 部署

部署到 Web 服务器时，确保：

1. `assets/bgm/` 目录及文件被上传
2. `music-list.json` 文件被上传
3. 服务器支持跨域音频播放（通常默认支持）

---

## 💡 推荐音乐源

### 免费音乐资源

- [YouTube Audio Library](https://studio.youtube.com/channel/UCuHzIaI_AKlWhFPFhie2K4w/music) - 免费无版权音乐
- [Free Music Archive](https://freemusicarchive.org/) - CC 授权音乐
- [Incompetech](https://incompetech.com/music/) - Kevin MacLeod 的免费音乐
- [Bensound](https://www.bensound.com/) - 免费背景音乐
- [Pixabay Music](https://pixabay.com/music/) - 免费音乐库

### 适合专注的音乐类型

- 🎹 轻音乐 / 纯音乐
- 🎼 古典音乐（巴赫、莫扎特）
- 📻 Lo-fi / Chill Beats
- 🌊 自然音效（雨声、海浪、森林）
- 🎵 环境音乐 / Ambient
- ☕ 咖啡厅白噪音

---

## ⚖️ 版权说明

请确保你有权使用添加的音乐文件：

- ✅ 个人创作
- ✅ 免费授权（CC0, CC BY）
- ✅ 购买的正版授权
- ❌ 盗版音乐
- ❌ 未授权商业音乐

---

**现在开始享受你的专注时光吧！** 🎵✨
