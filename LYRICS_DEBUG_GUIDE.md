# 歌词显示调试指南

## 问题描述
歌词没有显示出来。

## 调试步骤

### 1. 检查 HTML 元素是否存在
打开浏览器开发者工具（F12），在 Console 中执行：

```javascript
console.log('lyricsDisplay:', document.getElementById('lyricsDisplay'));
console.log('lyricsText:', document.getElementById('lyricsText'));
console.log('lyricsInfo:', document.getElementById('lyricsInfo'));
console.log('quoteContainer:', document.querySelector('.quote-container'));
```

**预期结果**：所有元素都应该存在（不为 null）

### 2. 检查音乐播放状态
在 Console 中执行：

```javascript
console.log('currentTrack:', window.app.bgmPlayerManager.currentTrack);
console.log('isPlaying:', window.app.bgmPlayerManager.isPlaying);
```

**预期结果**：
- 播放音乐时，`currentTrack` 应该有值，`isPlaying` 应该为 `true`
- 没播放音乐时，`isPlaying` 应该为 `false`

### 3. 手动调用歌词显示更新
在 Console 中执行：

```javascript
window.app.updateLyricsDisplay();
```

查看控制台输出，会显示详细的调试信息。

### 4. 检查 CSS 样式
在 Console 中执行：

```javascript
const lyricsDisplay = document.getElementById('lyricsDisplay');
console.log('display style:', lyricsDisplay.style.display);
console.log('computed display:', window.getComputedStyle(lyricsDisplay).display);
console.log('z-index:', window.getComputedStyle(lyricsDisplay).zIndex);
```

**预期结果**：
- 播放音乐时，`display` 应该为 `'block'`
- 没播放音乐时，`display` 应该为 `'none'`

### 5. 检查事件监听器
在 Console 中执行：

```javascript
// 测试事件是否触发
window.addEventListener('musicPlayStateChanged', () => {
    console.log('🎵 musicPlayStateChanged 事件触发了！');
});

// 然后播放/暂停音乐，看是否有输出
```

### 6. 强制显示歌词（用于测试）
如果想要强制显示歌词区域来测试样式，在 Console 中执行：

```javascript
const lyricsDisplay = document.getElementById('lyricsDisplay');
lyricsDisplay.style.display = 'block';

const lyricsText = document.getElementById('lyricsText');
lyricsText.textContent = '♪ 测试歌词显示';

const lyricsInfo = document.getElementById('lyricsInfo');
lyricsInfo.textContent = '演唱：测试艺术家';
```

## 可能的问题及解决方案

### 问题 1：元素被其他样式覆盖
**症状**：元素存在，display 为 block，但看不见

**解决方案**：
```javascript
const lyricsDisplay = document.getElementById('lyricsDisplay');
lyricsDisplay.style.zIndex = '9999';
lyricsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
```

### 问题 2：励志语遮挡了歌词
**症状**：歌词和励志语同时显示

**检查**：
```javascript
const quoteContainer = document.querySelector('.quote-container');
console.log('quote display:', window.getComputedStyle(quoteContainer).display);
```

### 问题 3：事件没有触发
**症状**：播放音乐时，`updateLyricsDisplay()` 没有被调用

**解决方案**：手动添加监听
```javascript
window.addEventListener('musicPlayStateChanged', () => {
    console.log('手动监听到音乐状态改变');
    window.app.updateLyricsDisplay();
});
```

### 问题 4：app 对象未正确初始化
**症状**：`window.app` 为 undefined

**检查**：
```javascript
console.log('app:', window.app);
console.log('bgmPlayerManager:', window.app?.bgmPlayerManager);
```

## 完整测试流程

1. 刷新页面
2. 打开开发者工具（F12）
3. 点击音乐按钮
4. 选择"在线音乐"
5. 等待音乐列表加载
6. 点击播放按钮
7. 查看控制台输出，应该看到：
   ```
   🎵 updateLyricsDisplay 调用 {...}
   ✅ 显示歌词区域
   ✅ 隐藏励志语
   ```
8. 页面底部应该显示歌词，励志语应该隐藏

## 临时修复方案

如果上述调试都没有问题，但歌词仍然不显示，可以尝试在 `index.html` 中添加临时调试样式：

```html
<style>
.lyrics-display {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 9999 !important;
    background: rgba(0, 0, 0, 0.9) !important;
    padding: 30px 20px 20px !important;
    color: white !important;
}

.lyrics-text {
    font-size: 24px !important;
    color: white !important;
    text-align: center !important;
}

.lyrics-info {
    font-size: 14px !important;
    color: rgba(255, 255, 255, 0.7) !important;
    text-align: center !important;
}
</style>
```

## 调试命令快捷方式

复制以下命令到控制台，一键运行所有检查：

```javascript
console.log('=== 歌词显示调试信息 ===');
console.log('1. HTML 元素:', {
    lyricsDisplay: !!document.getElementById('lyricsDisplay'),
    lyricsText: !!document.getElementById('lyricsText'),
    lyricsInfo: !!document.getElementById('lyricsInfo'),
    quoteContainer: !!document.querySelector('.quote-container')
});
console.log('2. 播放状态:', {
    currentTrack: window.app?.bgmPlayerManager?.currentTrack,
    isPlaying: window.app?.bgmPlayerManager?.isPlaying
});
const lyricsDisplay = document.getElementById('lyricsDisplay');
console.log('3. CSS 样式:', {
    display: lyricsDisplay?.style.display,
    computedDisplay: window.getComputedStyle(lyricsDisplay).display,
    zIndex: window.getComputedStyle(lyricsDisplay).zIndex,
    bottom: window.getComputedStyle(lyricsDisplay).bottom
});
console.log('4. 手动调用 updateLyricsDisplay()');
window.app?.updateLyricsDisplay();
```
