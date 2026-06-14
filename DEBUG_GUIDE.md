# 🔧 问题诊断指南

## 问题：番茄钟按钮没有反应

### 快速诊断

打开浏览器控制台（F12），依次执行以下命令：

#### 1. 检查系统是否正确加载
```javascript
// 检查主要对象是否存在
console.log('App:', window.app);
console.log('PomodoroTimer:', window.app?.pomodoroTimer);
console.log('DailyStories:', window.dailyStoriesManager);
console.log('Achievement:', window.app?.achievementSystem);
console.log('Forest:', window.app?.forestSystem);
```

**预期结果**：所有对象都应该存在（不是 null 或 undefined）

#### 2. 检查番茄钟按钮
```javascript
// 检查按钮是否存在
const pomodoroToggle = document.getElementById('pomodoroToggle');
console.log('番茄钟按钮:', pomodoroToggle);

// 检查面板是否存在
const pomodoroPanel = document.getElementById('pomodoroPanel');
console.log('番茄钟面板:', pomodoroPanel);
```

**预期结果**：两个元素都应该存在

#### 3. 检查事件监听器
```javascript
// 手动触发点击看是否有响应
const pomodoroToggle = document.getElementById('pomodoroToggle');
pomodoroToggle.click();
// 观察面板是否打开
```

#### 4. 检查控制台错误
```javascript
// 查看是否有 JavaScript 错误
// 红色的错误信息会显示在控制台
```

### 常见问题和解决方案

#### 问题 1：pomodoroTimer 是 null
**原因**：系统初始化顺序问题  
**解决**：刷新页面，等待所有脚本加载完成

#### 问题 2：按钮点击没反应
**原因**：事件监听器未绑定  
**解决**：
```javascript
// 手动绑定（临时测试）
const toggle = document.getElementById('pomodoroToggle');
const panel = document.getElementById('pomodoroPanel');
toggle.addEventListener('click', () => {
    panel.classList.toggle('active');
});
```

#### 问题 3：控制台报错
**常见错误**：
- `Cannot read property 'classList' of null` → 元素不存在
- `XXX is not defined` → 脚本未加载
- `XXX is not a function` → 方法不存在

**解决**：查看具体错误信息，检查对应的代码

### 手动测试番茄钟功能

```javascript
// 1. 获取番茄钟实例
const pomodoro = window.app.pomodoroTimer;

// 2. 检查是否正常
console.log('当前模式:', pomodoro.currentMode);
console.log('剩余时间:', pomodoro.timeRemaining);
console.log('是否运行:', pomodoro.isRunning);

// 3. 测试开始功能
pomodoro.start();
console.log('开始番茄钟');

// 4. 测试暂停功能
pomodoro.pause();
console.log('暂停番茄钟');

// 5. 测试重置功能
pomodoro.reset();
console.log('重置番茄钟');
```

### 测试每日三个故事关联

```javascript
// 1. 获取故事管理器
const stories = window.dailyStoriesManager;

// 2. 检查关联功能
console.log('当前故事:', stories.stories);

// 3. 模拟关联番茄钟
stories.currentLinkedStoryIndex = 0;
console.log('已关联故事 0');

// 4. 模拟完成番茄钟
stories.onPomodoroComplete(25);
console.log('故事数据:', stories.stories[0]);
// 应该显示 pomodoroCount: 1, timeSpent: 25
```

### 检查 LocalStorage 数据

```javascript
// 查看所有存储的数据
console.log('Stories:', localStorage.getItem('dailyStories'));
console.log('Achievements:', localStorage.getItem('studyAchievements'));
console.log('Forest:', localStorage.getItem('forestData'));
console.log('Settings:', localStorage.getItem('flipClockSettings'));
```

### 清除并重新初始化

如果以上都不行，尝试清除数据重新开始：

```javascript
// 清除所有数据
localStorage.clear();

// 刷新页面
location.reload();
```

### 验证修复

修复后，应该能够：

1. ✓ 点击 🍅 按钮打开番茄钟面板
2. ✓ 选择时长并开始计时
3. ✓ 暂停、重置功能正常
4. ✓ 完成后通知正常显示
5. ✓ 数据正确保存和加载

### 联系支持

如果以上方法都无法解决，请提供：

1. 浏览器版本（Chrome/Safari/Firefox）
2. 控制台完整错误信息
3. 执行诊断命令的结果截图
4. 重现问题的详细步骤

---

## 🎯 快速修复脚本

如果急需使用，可以在控制台执行：

```javascript
// 快速修复：强制初始化番茄钟
if (!window.app.pomodoroTimer || window.app.pomodoroTimer === null) {
    console.log('重新初始化番茄钟...');
    window.app.pomodoroTimer = new PomodoroTimer(
        clockManager, 
        window.app.achievementSystem, 
        window.app.forestSystem,
        window.dailyStoriesManager
    );
    console.log('✓ 番茄钟已重新初始化');
    console.log('请点击按钮测试');
}
```

## 🔍 深度调试

### 检查脚本加载顺序

```javascript
// 在控制台查看所有已加载的脚本
const scripts = Array.from(document.querySelectorAll('script[src]'));
scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.src.split('/').pop()}`);
});

// 应该看到：
// 1. flip.min.js
// 2. storage.js
// 3. particle.js
// 4. animation.js
// ... 等等
// 最后是 app.js
```

### 检查 DOM 加载时机

```javascript
// 查看 DOMContentLoaded 是否已触发
if (document.readyState === 'complete') {
    console.log('✓ DOM 已完全加载');
} else {
    console.log('⚠️ DOM 还在加载中');
}
```

### 监听系统事件

```javascript
// 监听番茄钟相关事件
window.addEventListener('musicPlayStateChanged', () => {
    console.log('音乐播放状态改变');
});

// 添加自定义日志
const originalStart = window.app.pomodoroTimer.start;
window.app.pomodoroTimer.start = function() {
    console.log('🍅 番茄钟开始');
    return originalStart.call(this);
};
```

---

**更新日期**: 2026-06-14  
**版本**: Debug Guide v1.0
