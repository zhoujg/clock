# 🔧 Phase 2 功能故障排除指南

## 🚨 常见问题及解决方案

### 问题 1: "番茄钟功能暂不可用"

#### 症状
- 填写故事标题后点击"🍅 开始番茄钟"
- 弹出提示："番茄钟功能暂不可用"

#### 原因
系统初始化时引用未正确设置

#### 解决方案

**方法 1: 刷新页面**
```
1. 刷新浏览器页面 (Ctrl+R / Cmd+R)
2. 等待 3-5 秒让所有系统加载完成
3. 重新尝试
```

**方法 2: 控制台快速修复**
```javascript
// 在浏览器控制台 (F12) 执行：
if (window.app?.pomodoroTimer && window.dailyStoriesManager) {
    window.app.pomodoroTimer.dailyStories = window.dailyStoriesManager;
    window.dailyStoriesManager.pomodoroTimer = window.app.pomodoroTimer;
    console.log('✓ 系统引用已修复');
} else {
    console.log('❌ 系统未完全加载，请刷新页面');
}
```

**方法 3: 检查面板元素**
```javascript
// 检查番茄钟面板是否存在
const panel = document.getElementById('pomodoroPanel');
console.log('番茄钟面板:', panel ? '存在' : '不存在');

// 如果面板不存在，检查 HTML 是否正确加载
if (!panel) {
    console.log('请检查 index.html 是否包含番茄钟面板');
}
```

### 问题 2: 番茄钟按钮点击无反应

#### 症状
- 点击右上角 🍅 按钮
- 面板不打开，无任何反应

#### 解决方案

**检查系统状态**
```javascript
// 控制台执行
console.log('PomodoroTimer:', window.app?.pomodoroTimer);
console.log('按钮元素:', document.getElementById('pomodoroToggle'));
console.log('面板元素:', document.getElementById('pomodoroPanel'));
```

**手动绑定事件**
```javascript
// 如果检查发现按钮存在但事件未绑定
const toggle = document.getElementById('pomodoroToggle');
const panel = document.getElementById('pomodoroPanel');

if (toggle && panel) {
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        panel.classList.toggle('active');
    });
    console.log('✓ 事件已手动绑定');
}
```

### 问题 3: 数据不更新

#### 症状
- 完成番茄钟后
- 故事的 🍅 数量和 ⏱️ 时间不更新

#### 解决方案

**检查关联状态**
```javascript
// 检查是否正确关联
const stories = window.dailyStoriesManager;
console.log('当前关联故事索引:', stories.currentLinkedStoryIndex);
console.log('故事数据:', stories.stories[0]);
```

**手动测试更新**
```javascript
// 手动触发更新测试
window.dailyStoriesManager.onPomodoroComplete(25);
console.log('已手动触发番茄钟完成，检查故事数据是否更新');
```

**检查数据结构**
```javascript
// 确保故事有正确的字段
const story = window.dailyStoriesManager.stories[0];
if (!('pomodoroCount' in story)) {
    story.pomodoroCount = 0;
    console.log('✓ 已添加 pomodoroCount 字段');
}
if (!('timeSpent' in story)) {
    story.timeSpent = 0;
    console.log('✓ 已添加 timeSpent 字段');
}
```

### 问题 4: 成就不解锁

#### 症状
- 完成故事后
- 没有弹出成就通知

#### 解决方案

**检查成就系统**
```javascript
// 检查成就系统状态
console.log('成就系统:', window.app?.achievementSystem);
console.log('成就检查方法:', typeof window.app?.achievementSystem?.checkStoriesAchievements);
```

**手动触发成就检查**
```javascript
// 手动检查成就
if (window.app?.achievementSystem?.checkStoriesAchievements) {
    const todayCompleted = window.dailyStoriesManager.stories.filter(s => s.completed).length;
    window.app.achievementSystem.checkStoriesAchievements({
        todayCompleted,
        perfectDays: todayCompleted === 3 ? 1 : 0,
        totalStories: todayCompleted
    });
    console.log('✓ 已手动触发成就检查');
}
```

### 问题 5: 界面显示异常

#### 症状
- 按钮样式错误
- 面板位置不正确
- 响应式布局失效

#### 解决方案

**检查 CSS 加载**
```javascript
// 检查样式文件是否加载
const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
const dailyStoriesCSS = links.find(link => link.href.includes('dailyStories.css'));
console.log('dailyStories.css:', dailyStoriesCSS ? '已加载' : '未加载');
```

**强制刷新样式**
```javascript
// 如果样式未加载，动态加载
if (!dailyStoriesCSS) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/dailyStories.css';
    document.head.appendChild(link);
    console.log('✓ 已动态加载 dailyStories.css');
}
```

## 🔍 完整诊断流程

### 步骤 1: 基础检查 (30秒)

```javascript
// === 完整诊断脚本 ===
console.clear();
console.log('🔍 Phase 2 功能诊断开始...\n');

// 1. 检查核心系统
const checks = {
    app: !!window.app,
    pomodoro: !!window.app?.pomodoroTimer,
    stories: !!window.dailyStoriesManager,
    achievement: !!window.app?.achievementSystem,
    forest: !!window.app?.forestSystem
};

console.log('1️⃣ 系统检查:');
Object.entries(checks).forEach(([name, status]) => {
    console.log(`   ${name}: ${status ? '✅' : '❌'}`);
});

// 2. 检查 DOM 元素
const elements = {
    storiesToggle: document.getElementById('storiesToggle'),
    storiesPanel: document.getElementById('storiesPanel'),
    pomodoroToggle: document.getElementById('pomodoroToggle'),
    pomodoroPanel: document.getElementById('pomodoroPanel')
};

console.log('\n2️⃣ DOM 元素检查:');
Object.entries(elements).forEach(([name, element]) => {
    console.log(`   ${name}: ${element ? '✅' : '❌'}`);
});

// 3. 检查系统引用
console.log('\n3️⃣ 系统引用检查:');
if (window.app?.pomodoroTimer && window.dailyStoriesManager) {
    const pomodoroToStories = !!window.app.pomodoroTimer.dailyStories;
    const storiesToPomodoro = !!window.dailyStoriesManager.pomodoroTimer;
    
    console.log(`   番茄钟→故事: ${pomodoroToStories ? '✅' : '❌'}`);
    console.log(`   故事→番茄钟: ${storiesToPomodoro ? '✅' : '❌'}`);
    
    // 自动修复引用
    if (!pomodoroToStories || !storiesToPomodoro) {
        console.log('\n🔧 自动修复引用...');
        window.app.pomodoroTimer.dailyStories = window.dailyStoriesManager;
        window.dailyStoriesManager.pomodoroTimer = window.app.pomodoroTimer;
        window.dailyStoriesManager.achievementSystem = window.app.achievementSystem;
        window.dailyStoriesManager.forestSystem = window.app.forestSystem;
        console.log('   ✅ 系统引用已修复');
    }
}

// 4. 检查数据结构
console.log('\n4️⃣ 数据结构检查:');
if (window.dailyStoriesManager) {
    const story = window.dailyStoriesManager.stories[0];
    const hasPomodoro = 'pomodoroCount' in story;
    const hasTime = 'timeSpent' in story;
    
    console.log(`   pomodoroCount字段: ${hasPomodoro ? '✅' : '❌'}`);
    console.log(`   timeSpent字段: ${hasTime ? '✅' : '❌'}`);
    
    // 自动修复数据结构
    if (!hasPomodoro || !hasTime) {
        console.log('\n🔧 自动修复数据结构...');
        window.dailyStoriesManager.stories.forEach(story => {
            if (!('pomodoroCount' in story)) story.pomodoroCount = 0;
            if (!('timeSpent' in story)) story.timeSpent = 0;
        });
        console.log('   ✅ 数据结构已修复');
    }
}

console.log('\n✅ 诊断完成！');
console.log('\n📋 接下来请测试:');
console.log('1. 点击 🎯 打开故事面板');
console.log('2. 填写故事标题');
console.log('3. 点击 "🍅 开始番茄钟"');
console.log('4. 应该能正常打开番茄钟面板');
```

### 步骤 2: 功能测试 (2分钟)

**测试 A: 故事关联**
```
1. 打开故事面板 (🎯)
2. 填写故事1标题: "测试任务"
3. 点击 "🍅 开始番茄钟"
4. ✅ 应该打开番茄钟面板
5. ✅ 应该显示关联通知
```

**测试 B: 数据更新**
```
1. 在番茄钟面板选择 25分钟
2. 点击开始 (或用控制台快进)
3. 等待完成
4. 打开故事面板
5. ✅ 应该显示: 🍅 1个, ⏱️ 25分钟
```

**测试 C: 成就解锁**
```
1. 勾选故事1完成 ✓
2. ✅ 应该弹出 "📖 故事开端" 成就
3. 完成所有三个故事
4. ✅ 应该弹出 "🎯 完美一天" 成就
```

### 步骤 3: 数据验证 (30秒)

```javascript
// 验证数据完整性
const storiesData = JSON.parse(localStorage.getItem('dailyStories'));
const achievementData = JSON.parse(localStorage.getItem('studyAchievements'));

console.log('📊 数据验证:');
console.log('故事数据:', storiesData);
console.log('成就数据:', achievementData);

// 检查今日数据
const today = new Date().toISOString().split('T')[0];
const todayStories = storiesData?.[today];

if (todayStories) {
    console.log('✅ 今日故事数据存在');
    console.log('番茄钟数据:', todayStories.map(s => ({
        title: s.title,
        pomodoroCount: s.pomodoroCount || 0,
        timeSpent: s.timeSpent || 0
    })));
} else {
    console.log('❌ 今日故事数据缺失');
}
```

## 🚀 快速恢复流程

如果以上方法都无效，使用此紧急恢复流程：

### 方案 1: 软重置
```javascript
// 保留数据，重新初始化系统
location.reload();
```

### 方案 2: 硬重置
```javascript
// 清除所有数据，从头开始
localStorage.clear();
location.reload();
```

### 方案 3: 选择性重置
```javascript
// 只清除可能损坏的数据
localStorage.removeItem('dailyStories');
localStorage.removeItem('studyAchievements');
location.reload();
```

## 📞 获得帮助

如果问题仍然存在，请提供以下信息：

1. **浏览器信息**
   ```javascript
   console.log('浏览器:', navigator.userAgent);
   ```

2. **控制台错误**
   - 打开控制台 (F12)
   - 截图所有红色错误信息

3. **诊断结果**
   - 运行完整诊断脚本
   - 复制输出结果

4. **复现步骤**
   - 详细描述操作步骤
   - 指出在哪一步出现问题

## 🎯 预防措施

为避免未来出现问题：

1. **定期保存数据**
   ```javascript
   // 导出数据备份
   const backup = {
       stories: localStorage.getItem('dailyStories'),
       achievements: localStorage.getItem('studyAchievements'),
       settings: localStorage.getItem('flipClockSettings')
   };
   console.log('数据备份:', JSON.stringify(backup));
   ```

2. **使用最新浏览器**
   - Chrome 90+
   - Safari 14+
   - Firefox 88+
   - Edge 90+

3. **避免多标签页**
   - 同时只在一个标签页使用
   - 避免数据冲突

4. **定期清理缓存**
   - 每周清理一次浏览器缓存
   - 但保留 localStorage 数据

---

**最后更新**: 2026-06-14  
**版本**: Troubleshooting v1.0  
**状态**: ✅ 经过测试验证