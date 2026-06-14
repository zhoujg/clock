# Jamendo 在线音乐集成 - 更新说明

## 📋 更新概述

已成功集成 Jamendo API，应用现在支持从 Jamendo 音乐库播放免费、合法授权的音乐。

## 🎯 主要功能

### 1. 音乐源切换
- **本地音乐**: 播放 `assets/bgm/` 目录下的音乐文件
- **在线音乐**: 从 Jamendo 音乐库随机播放音乐

### 2. 音乐类型选择
支持以下音乐类型：
- 随机类型
- 流行 (Pop)
- 摇滚 (Rock)
- 电子 (Electronic)
- 古典 (Classical)
- 爵士 (Jazz)
- 氛围 (Ambient)
- 放松 (Chillout)
- 沙发音乐 (Lounge)
- 纯音乐 (Instrumental)
- 原声 (Acoustic)

### 3. 艺术家信息显示
- 显示曲目名称和艺术家
- 在音乐列表中展示详细信息

### 4. 音乐可视化
- 背景粒子动画随音乐节奏跳动
- 提供视觉反馈

## 📁 新增文件

1. **scripts/jamendoAPI.js**
   - Jamendo API 封装类
   - 提供获取随机音乐、搜索音乐等功能
   - 内置 5 分钟缓存机制

2. **test_jamendo.html**
   - Jamendo API 测试页面
   - 可用于验证 API 功能
   - 包含搜索和播放功能

3. **JAMENDO_MUSIC_GUIDE.md**
   - 完整的使用指南
   - API 文档和开发者信息

## 🔧 修改的文件

1. **index.html**
   - 添加音乐源切换按钮
   - 添加音乐类型选择器
   - 添加艺术家信息显示区域
   - 引入 jamendoAPI.js 脚本

2. **scripts/bgmPlayer.js**
   - 集成 JamendoAPI 类
   - 添加 `switchMusicSource()` 方法
   - 添加 `loadJamendoMusic()` 方法
   - 添加 `searchJamendoMusic()` 方法
   - 添加 `playRandomJamendo()` 方法
   - 扩展音乐数据结构支持艺术家信息

3. **scripts/app.js**
   - 更新 `renderMusicPanelList()` 显示艺术家信息
   - 添加音乐源切换事件监听器
   - 添加 Jamendo 标签选择事件监听器
   - 添加 `loadJamendoMusic()` 辅助方法

4. **styles/bgmPlayer.css**
   - 添加音乐源切换按钮样式
   - 添加标签选择器样式
   - 添加加载按钮样式
   - 添加艺术家信息样式
   - 添加加载动画

## 🔑 API 配置

- **Client ID**: `18522544`
- **Client Secret**: `d09d9cf3a54849e35c93977211545fd4`
- **API Base URL**: `https://api.jamendo.com/v3.0`

## 📖 使用方法

### 基本使用
1. 点击右上角音乐按钮 (🎵) 打开音乐面板
2. 点击 "🌐 在线音乐" 切换到 Jamendo
3. 选择音乐类型
4. 点击 "🔄 加载" 获取音乐
5. 点击任意曲目开始播放

### API 调用示例

```javascript
// 播放随机音乐
await bgmPlayerManager.playRandomJamendo({
    limit: 20,
    tags: 'chillout'
});

// 按标签加载
await bgmPlayerManager.loadJamendoByTag('jazz', 20);

// 搜索音乐
await bgmPlayerManager.searchJamendoMusic('piano', {
    limit: 20,
    tags: 'instrumental'
});

// 切换音乐源
await bgmPlayerManager.switchMusicSource('jamendo');
```

## 🧪 测试

打开 `test_jamendo.html` 页面可以测试 Jamendo API 功能：
```
http://localhost:8000/test_jamendo.html
```

功能包括：
- 获取随机音乐
- 搜索音乐
- 在线播放试听
- 查看曲目详情

## ⚙️ 技术特性

### 缓存机制
- API 响应缓存 5 分钟
- 减少重复请求
- 提高加载速度

### 音频格式
- 默认: MP3 32kbps (`mp32`)
- 支持: MP3 VBR 100kbps (`mp31`)
- 支持: MP3 VBR 200kbps (`mp3`)

### 数据结构
```javascript
{
    id: 123456,              // 曲目 ID
    name: "曲目名称",         // 曲目名称
    artist: "艺术家名称",     // 艺术家名称
    duration: 180,           // 时长（秒）
    file: "https://...",     // 音频 URL
    image: "https://...",    // 封面 URL
    license: "https://...",  // CC 许可证 URL
    source: "jamendo"        // 来源标识
}
```

## 📝 许可证

所有 Jamendo 音乐均采用 Creative Commons 许可证，可免费用于个人和商业用途。

## 🐛 故障排除

### 音乐无法加载
1. 检查网络连接
2. 打开浏览器控制台查看错误
3. 尝试切换音乐类型
4. 刷新页面重试

### 播放卡顿
1. 检查网络速度
2. 尝试使用其他音乐类型
3. 关闭其他网络应用

## 🚀 后续改进建议

1. **播放列表管理**
   - 保存喜欢的曲目
   - 创建自定义播放列表

2. **音质选择**
   - 让用户选择音频质量
   - 根据网络速度自动调整

3. **离线下载**
   - 下载音乐到本地
   - 离线播放功能

4. **推荐系统**
   - 基于播放历史推荐
   - 智能推荐类似音乐

5. **社交分享**
   - 分享正在播放的音乐
   - 生成播放列表链接

## ✅ 验证清单

- [x] Jamendo API 集成
- [x] 音乐源切换功能
- [x] 音乐类型选择
- [x] 艺术家信息显示
- [x] 音乐列表渲染
- [x] 播放控制功能
- [x] 缓存机制
- [x] 错误处理
- [x] UI 样式更新
- [x] 测试页面
- [x] 使用文档

## 📞 支持

如有问题，请查看：
- `JAMENDO_MUSIC_GUIDE.md` - 详细使用指南
- `test_jamendo.html` - API 测试页面
- Jamendo API 文档: https://developer.jamendo.com/v3.0/docs

---

**更新时间**: 2026-06-14
**版本**: v1.0.0
**状态**: ✅ 完成
