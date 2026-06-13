# 周墨欣时钟

一个美观且功能丰富的翻转时钟应用，集成了励志语显示、动画效果、背景自定义等多种功能。

## ✨ 功能特性

- **翻转时钟动画**：采用现代翻转效果展示时间（时:分:秒）
- **日期显示**：实时显示当前日期和星期
- **励志语录**：随机显示中英文励志名言
- **BGM 音乐播放器** 🎵：
  - 自动扫描音乐文件，无需手动配置
  - 播放/暂停、上一曲/下一曲控制
  - 单曲循环模式
  - 音量调节和进度控制
  - 支持 MP3、WAV、OGG、M4A、FLAC、AAC 格式
  - 可展开/收起的浮动界面
  - [快速开始 →](./BGM_QUICK_START.md)
- **学习成就系统** ⭐：
  - 等级和经验值系统
  - 28种成就徽章
  - 学习时长统计
  - 连续学习天数追踪
  - 每日学习目标
  - 实时成就通知
- **动画线条**：可开关的动态背景线条动画效果
- **滴答声音**：可选的时钟滴答音效
- **背景自定义**：
  - 8 种预设颜色主题
  - 支持自定义图片背景
- **本地存储**：保存用户的个性化设置

## 📁 项目结构

```
clock/
├── clock.html              # 主页面
├── assets/                 # 资源文件
│   ├── bgm/               # 音乐文件目录 🎵
│   │   ├── README.md      # 音乐目录说明
│   │   └── music-list.json # 自动生成的音乐索引
│   ├── quotes.txt         # 励志语录数据
│   └── slow-tick.mp3      # 滴答声音文件
├── scripts/               # JavaScript 文件
│   ├── app.js            # 主应用逻辑
│   ├── animation.js      # 动画效果
│   ├── background.js     # 背景控制
│   ├── bgmPlayer.js      # BGM 音乐播放器 🎵
│   ├── flip.min.js       # 翻转时钟库
│   ├── particle.js       # 粒子效果
│   ├── pomodoro.js       # 番茄钟功能
│   ├── achievement.js    # 成就系统 ⭐
│   ├── quotes-data.js    # 语录数据处理
│   ├── quotes.js         # 语录显示
│   ├── storage.js        # 本地存储
│   ├── tickSound.js      # 声音控制
│   ├── generate-music-list.js  # 音乐索引生成（Node.js）
│   └── generate-music-list.sh  # 音乐索引生成（Shell）
└── styles/               # CSS 样式文件
    ├── main.css          # 主样式
    ├── controls.css      # 控制面板样式
    ├── animation.css     # 动画样式
    ├── bgmPlayer.css     # BGM 播放器样式 🎵
    ├── pomodoro.css      # 番茄钟样式
    ├── achievement.css   # 成就系统样式 ⭐
    └── flip.min.css      # 翻转时钟样式
```

## 🚀 使用方法

1. 直接在浏览器中打开 `clock.html` 文件
2. 点击右上角的设置按钮打开设置面板
3. 根据个人喜好调整各项设置：
   - 选择背景颜色或上传背景图片
   - 开启/关闭动画线条
   - 开启/关闭滴答声音
4. **使用 BGM 音乐播放器**：
   - 将音乐文件放入 `assets/bgm/` 目录
   - 运行 `./scripts/generate-music-list.sh` 生成索引
   - 点击右下角音乐图标 🎵 开始播放
   - [详细说明 →](./BGM_QUICK_START.md)

## 🎨 功能说明

### BGM 音乐播放器 🎵

点击右下角音乐图标即可展开播放器：

**自动扫描**
- 无需手动修改代码
- 自动读取 `assets/bgm/` 目录下的音乐
- 支持多种音频格式（MP3, WAV, OGG, M4A, FLAC, AAC）

**播放控制**
- 播放/暂停、上一曲/下一曲
- 单曲循环模式
- 进度条显示和跳转
- 音量调节（0-100%）

**快速开始**
```bash
# 1. 添加音乐文件
cp ~/Music/*.mp3 assets/bgm/

# 2. 生成索引
./scripts/generate-music-list.sh

# 3. 刷新页面开始使用
```

详细说明请查看 [BGM_QUICK_START.md](./BGM_QUICK_START.md)

### 成就系统 ⭐

点击右上角金色奖杯图标即可打开成就面板，包含：

**等级系统**
- 完成番茄钟和学习可获得经验值
- 经验值累积可升级
- 每提升一级所需经验增加

**成就类型**
- 番茄钟成就：完成不同数量的番茄钟解锁
- 学习时长成就：累计学习时间达标解锁
- 连续学习成就：保持每日学习习惯解锁
- 每日目标成就：单日学习时长达标（可重复）
- 特殊成就：完成特定条件解锁

**统计功能**
- 今日学习时长
- 累计学习时长
- 连续学习天数
- 已解锁成就数量

### 设置面板

- **背景颜色**：提供 8 种预设颜色主题可供选择
- **动画线条**：开启后显示动态线条背景效果
- **滴答声音**：开启后播放时钟滴答音效
- **背景图片**：支持上传自定义图片作为背景

### 励志语录

应用会随机显示中英文励志名言，帮助您保持积极向上的心态。

## 💾 本地存储

应用会自动保存以下设置和数据：
- 背景颜色/图片
- 动画线条开关状态
- 滴答声音开关状态
- 学习成就数据（等级、经验、成就记录等）
- 学习统计数据（总时长、连续天数等）

## 🔧 技术栈

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API（用于动画效果）
- LocalStorage API（用于数据持久化）

## 📱 安卓应用

本项目已配置为 **WebView 应用**，直接加载在线网页：https://neihou.cn/clock/

**优势**：更新网站内容，应用立即生效，无需重新发布应用！

### 快速开始
```bash
# 打开 Android Studio
npm run android:open

# 在 Android Studio 中构建 APK
```

### 详细说明
- **WebView 配置** → 查看 [WEBVIEW_CONFIG.md](./WEBVIEW_CONFIG.md)
- **快速开始** → 查看 [QUICK_START.md](./QUICK_START.md)
- **完整指南** → 查看 [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)
- **图标和启动画面** → 查看 [ANDROID_ICON_SPLASH_UPDATE.md](./ANDROID_ICON_SPLASH_UPDATE.md)
- **图标缓存问题修复** → 查看 [ICON_SPLASH_CACHE_FIX.md](./ICON_SPLASH_CACHE_FIX.md)
- **图标不显示修复** → 查看 [ICON_FIX_GUIDE.md](./ICON_FIX_GUIDE.md)
- **快速修复** → 查看 [QUICK_FIX.md](./QUICK_FIX.md)

## 📝 许可证

本项目仅供个人学习和使用。

## 👨‍💻 作者

周墨欣时钟项目组
