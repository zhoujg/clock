# Jamendo 在线音乐播放功能使用指南

## 功能概述

该应用现已集成 Jamendo API，支持从 Jamendo 音乐库随机播放免费、合法授权的音乐。用户可以在本地音乐和在线音乐之间自由切换。

## Jamendo API 配置

- **Client ID**: `18522544`
- **Client Secret**: `d09d9cf3a54849e35c93977211545fd4`
- **API 文档**: https://developer.jamendo.com/v3.0/docs

## 使用方法

### 1. 打开音乐播放器

点击页面右上角的音乐按钮（🎵）打开音乐面板。

### 2. 切换音乐源

在音乐面板顶部，您会看到两个按钮：
- **📁 本地音乐**: 播放本地 `assets/bgm/` 目录下的音乐文件
- **🌐 在线音乐**: 从 Jamendo 在线音乐库播放

点击 "🌐 在线音乐" 切换到 Jamendo 音乐源。

### 3. 选择音乐类型

切换到在线音乐后，会显示音乐类型选择器，包含以下类型：

- 🎲 **随机类型**: 随机获取各种类型的音乐
- 🎤 **流行 (Pop)**: 流行音乐
- 🎸 **摇滚 (Rock)**: 摇滚音乐
- 🎹 **电子 (Electronic)**: 电子音乐
- 🎻 **古典 (Classical)**: 古典音乐
- 🎺 **爵士 (Jazz)**: 爵士音乐
- 🌙 **氛围 (Ambient)**: 氛围音乐
- 😌 **放松 (Chillout)**: 轻松音乐
- 🛋️ **沙发 (Lounge)**: 沙发音乐
- 🎼 **纯音乐 (Instrumental)**: 无人声纯音乐
- 🎸 **原声 (Acoustic)**: 原声吉他等

### 4. 加载音乐

1. 从下拉菜单选择您喜欢的音乐类型
2. 点击 "🔄 加载" 按钮
3. 系统会从 Jamendo 获取该类型的 20 首随机音乐
4. 音乐列表会显示在面板下方

### 5. 播放音乐

- 点击列表中的任意曲目开始播放
- 使用控制按钮进行播放、暂停、上一曲、下一曲等操作
- 当前播放的音乐会显示曲名和艺术家信息

### 6. 音乐可视化

播放 Jamendo 音乐时，背景的粒子动画会随音乐节奏跳动，提供视觉反馈。

## 技术特性

### 音频格式
- 默认使用 MP3 32kbps 格式（`mp32`）
- 支持更高质量的 `mp31` (VBR ~100kbps) 和 `mp3` (VBR ~200kbps)

### 随机机制
- 使用 popularity_week 排序结合随机偏移量
- 客户端使用 Fisher-Yates 算法随机打乱结果
- 每次请求获取不同的音乐集合

### 缓存机制
- API 响应会缓存 5 分钟，减少重复请求
- 切换标签或重新加载会获取新的音乐列表

### 自动播放
- 当一首歌曲播放完毕后，会自动播放下一曲
- 支持单曲循环模式（需要手动设置）

### 音量控制
- 音量设置在本地音乐和在线音乐之间共享
- 音量调节范围：0-100%

## API 使用说明

### 主要方法

#### 1. 获取随机音乐
```javascript
await bgmPlayerManager.playRandomJamendo({
    limit: 20,
    tags: 'chillout'
});
```

#### 2. 按标签加载音乐
```javascript
await bgmPlayerManager.loadJamendoByTag('jazz', 20);
```

#### 3. 搜索音乐
```javascript
await bgmPlayerManager.searchJamendoMusic('piano', {
    limit: 20,
    tags: 'instrumental'
});
```

#### 4. 切换音乐源
```javascript
await bgmPlayerManager.switchMusicSource('jamendo');
// 或
await bgmPlayerManager.switchMusicSource('local');
```

### JamendoAPI 类方法

```javascript
// 创建实例
const jamendoAPI = new JamendoAPI();

// 获取随机曲目
const tracks = await jamendoAPI.getRandomTracks({
    limit: 20,
    tags: 'electronic'
});

// 搜索曲目
const searchResults = await jamendoAPI.searchTracks({
    query: 'relaxing',
    tags: 'ambient',
    limit: 20
});

// 获取可用标签
const tags = jamendoAPI.getPopularTags();

// 清除缓存
jamendoAPI.clearCache();
```

## 音乐数据结构

```javascript
{
    id: 123456,              // Jamendo 曲目 ID
    name: "曲目名称",         // 曲目名称
    artist: "艺术家名称",     // 艺术家名称
    duration: 180,           // 时长（秒）
    file: "https://...",     // 音频文件 URL
    image: "https://...",    // 专辑封面 URL
    license: "https://...",  // Creative Commons 许可证 URL
    source: "jamendo"        // 音乐来源标识
}
```

## 许可证信息

所有来自 Jamendo 的音乐都采用 Creative Commons 许可证，可免费用于个人和商业用途。每首曲目的具体许可证信息存储在 `license` 字段中。

## 注意事项

1. **网络连接**: 播放在线音乐需要稳定的网络连接
2. **CORS**: Jamendo API 支持跨域请求，无需额外配置
3. **API 限制**: 建议合理使用 API，避免过度请求
4. **缓存**: 音乐列表会缓存 5 分钟，如需刷新请切换标签或重新加载
5. **音频质量**: 默认使用较低比特率以节省流量，如需更高质量可修改 `audioformat` 参数

## 故障排除

### 音乐无法加载
- 检查网络连接
- 查看浏览器控制台的错误信息
- 尝试切换不同的音乐类型
- 清除浏览器缓存后重试

### 播放卡顿
- 检查网络速度
- 尝试使用更低比特率的音频格式
- 关闭其他占用网络的应用

### 无法切换音乐源
- 刷新页面重试
- 检查浏览器控制台是否有 JavaScript 错误

## 开发者信息

### 文件结构
```
scripts/
├── jamendoAPI.js          # Jamendo API 封装类
├── bgmPlayer.js           # 音乐播放器管理器（已扩展）
└── app.js                 # 主应用逻辑（已扩展）

styles/
└── bgmPlayer.css          # 音乐播放器样式（已扩展）

index.html                 # 主页面（已添加 UI 元素）
```

### API 端点
- 基础 URL: `https://api.jamendo.com/v3.0`
- 曲目端点: `/tracks/`
- 文档: https://developer.jamendo.com/v3.0/docs

## 更新日志

### v1.0.0 (2026-06-14)
- ✅ 集成 Jamendo API
- ✅ 添加音乐源切换功能
- ✅ 添加音乐类型选择器
- ✅ 显示艺术家信息
- ✅ 支持音乐可视化
- ✅ 添加缓存机制
- ✅ 支持随机播放、搜索等功能
