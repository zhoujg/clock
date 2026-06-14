# BGM 音乐与歌词显示更新

## 更新时间
2026年6月14日

## 更新内容

### 1. 在线音乐标签优化为 BGM 风格

#### 修改文件
- `scripts/jamendoAPI.js`

#### 具体改动

**标签列表优化** (`getPopularTags()`)
- **修改前**：包含 pop, rock, indie, folk, blues 等流行音乐标签
- **修改后**：专注于 BGM 背景音乐标签
  ```javascript
  'ambient',        // 环境音乐
  'instrumental',   // 纯音乐
  'cinematic',      // 电影感
  'chillout',       // 放松
  'lounge',         // 沙发音乐
  'classical',      // 古典
  'acoustic',       // 原声
  'soundtrack',     // 配乐
  'electronic',     // 电子
  'world',          // 世界音乐
  'jazz'            // 爵士
  ```

**时段推荐优化** (`getTagByTime()`)
- **早晨 (5:00-9:00)**：acoustic, ambient, instrumental, classical（轻柔唤醒）
- **上午 (9:00-12:00)**：instrumental, electronic, classical, ambient（专注效率）
- **下午 (12:00-17:00)**：chillout, lounge, ambient, acoustic（轻松舒缓）
- **傍晚 (17:00-21:00)**：cinematic, soundtrack, ambient, instrumental（放松电影感）
- **夜晚 (21:00-5:00)**：ambient, classical, chillout, instrumental（安静助眠）

### 2. 歌词与励志语显示互斥

#### 修改文件
- `scripts/app.js`

#### 具体改动

在 `updateLyricsDisplay()` 方法中添加了励志语显示/隐藏逻辑：

**播放音乐时**：
- ✅ 显示歌词区域（曲目信息）
- ❌ 隐藏励志语区域

**停止/暂停音乐时**：
- ❌ 隐藏歌词区域
- ✅ 显示励志语区域

```javascript
if (currentTrack && isPlaying) {
    // 显示歌词
    lyricsDisplay.style.display = 'block';
    // 隐藏励志语
    if (quoteContainer) {
        quoteContainer.style.display = 'none';
    }
} else {
    // 隐藏歌词
    lyricsDisplay.style.display = 'none';
    // 显示励志语
    if (quoteContainer) {
        quoteContainer.style.display = 'block';
    }
}
```

## 用户体验改进

### BGM 音乐标签
1. **更专注的音乐类型**：去除了流行音乐、摇滚等带人声的音乐类型
2. **适合工作学习**：所有标签都指向纯音乐、环境音乐等 BGM 风格
3. **智能时段推荐**：根据不同时段推荐适合的 BGM 类型

### 歌词与励志语
1. **互不干扰**：歌词和励志语不会同时显示，避免视觉混乱
2. **自动切换**：播放音乐时自动显示歌词，停止时自动显示励志语
3. **保持连贯性**：用户体验更加流畅和自然

## 测试建议

1. **音乐标签测试**
   - 点击"在线音乐"按钮
   - 查看推荐的音乐类型是否为 BGM 风格
   - 在不同时段测试推荐标签是否合适

2. **歌词显示测试**
   - 播放音乐 → 歌词显示，励志语隐藏
   - 暂停音乐 → 歌词隐藏，励志语显示
   - 停止音乐 → 歌词隐藏，励志语显示
   - 切换曲目 → 歌词内容更新

## 技术细节

- **歌词显示区域**：`.lyrics-display` (`#lyricsDisplay`)
- **励志语显示区域**：`.quote-container`
- **触发时机**：`play` 和 `ended` 事件监听器中调用 `updateLyricsDisplay()`
- **显示控制**：通过 CSS `display` 属性控制显示/隐藏
