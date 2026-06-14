# 音乐播放时隐藏谚语功能

## 功能说明

当播放音乐时，谚语会自动隐藏；当音乐暂停或停止后，谚语会重新显示。

## 实现细节

### 1. QuoteManager (quotes.js)

添加了以下方法：

- `hide()`: 隐藏谚语容器，并停止谚语轮播
- `show()`: 显示谚语容器，并恢复谚语轮播

### 2. BGMPlayerManager (bgmPlayer.js)

**构造函数更新：**
- 新增参数 `quoteManager`，接收谚语管理器引用

**音频事件监听更新：**
- `play` 事件：调用 `hideQuote()` 隐藏谚语
- `pause` 事件：调用 `showQuote()` 显示谚语
- `error` 事件：加载失败时调用 `showQuote()` 显示谚语

**新增方法：**
- `hideQuote()`: 调用谚语管理器的 `hide()` 方法
- `showQuote()`: 调用谚语管理器的 `show()` 方法

**其他修改：**
- `stop()` 方法：停止音乐时调用 `showQuote()`
- `playTrack()` 方法：播放失败时调用 `showQuote()`

### 3. App (app.js)

**构造函数更新：**
- 在创建 `BGMPlayerManager` 时，同时传递 `tickSoundManager` 和 `quoteManager`

### 4. CSS 样式 (main.css)

**`.quote-container` 样式更新：**
- 添加 `opacity: 1` 和 `visibility: visible` 初始状态
- 添加平滑过渡效果：`transition: opacity 0.5s ease-in-out, visibility 0.5s ease-in-out`

## 功能特性

✅ 点击播放按钮时，谚语平滑淡出并隐藏
✅ 音乐播放时，谚语保持隐藏状态
✅ 暂停或停止音乐时，谚语平滑淡入并显示
✅ 音乐加载失败时，谚语重新显示
✅ 谚语轮播在隐藏期间暂停，显示后恢复
✅ 0.5秒的平滑过渡效果，体验流畅

## 测试场景

1. ✅ 点击播放按钮 → 谚语隐藏
2. ✅ 点击暂停按钮 → 谚语显示
3. ✅ 播放音乐到结束 → 自动播放下一曲，谚语保持隐藏
4. ✅ 停止音乐 → 谚语显示
5. ✅ 音乐加载失败 → 谚语显示
6. ✅ 切换歌曲时 → 谚语保持隐藏状态

## 相关文件

- `/scripts/quotes.js` - 谚语管理器
- `/scripts/bgmPlayer.js` - 音乐播放器管理器  
- `/scripts/app.js` - 应用主控制器
- `/styles/main.css` - 谚语容器样式
