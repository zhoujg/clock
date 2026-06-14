// 快速修复测试脚本
// 在浏览器控制台执行此脚本来验证修复

console.log('=================================');
console.log('🔧 快速修复测试');
console.log('=================================\n');

// 1. 检查系统
console.log('1️⃣ 检查系统状态:');
console.log('   App:', window.app ? '✓' : '✗');
console.log('   PomodoroTimer:', window.app?.pomodoroTimer ? '✓' : '✗');
console.log('   DailyStories:', window.dailyStoriesManager ? '✓' : '✗');

// 2. 检查番茄钟面板
console.log('\n2️⃣ 检查番茄钟面板:');
const pomodoroPanel = document.getElementById('pomodoroPanel');
const pomodoroToggle = document.getElementById('pomodoroToggle');
console.log('   面板元素:', pomodoroPanel ? '✓' : '✗');
console.log('   按钮元素:', pomodoroToggle ? '✓' : '✗');

// 3. 检查故事面板
console.log('\n3️⃣ 检查故事面板:');
const storiesPanel = document.getElementById('storiesPanel');
const storiesToggle = document.getElementById('storiesToggle');
console.log('   面板元素:', storiesPanel ? '✓' : '✗');
console.log('   按钮元素:', storiesToggle ? '✓' : '✗');

// 4. 测试关联功能
console.log('\n4️⃣ 测试关联功能:');
if (window.dailyStoriesManager) {
    console.log('   linkToPomodoro方法:', typeof window.dailyStoriesManager.linkToPomodoro === 'function' ? '✓' : '✗');
    console.log('   onPomodoroComplete方法:', typeof window.dailyStoriesManager.onPomodoroComplete === 'function' ? '✓' : '✗');
    
    // 检查故事数据结构
    const story = window.dailyStoriesManager.stories[0];
    console.log('   pomodoroCount字段:', 'pomodoroCount' in story ? '✓' : '✗');
    console.log('   timeSpent字段:', 'timeSpent' in story ? '✓' : '✗');
}

// 5. 手动测试
console.log('\n5️⃣ 手动测试指令:');
console.log('   打开故事面板: document.getElementById("storiesToggle").click()');
console.log('   打开番茄钟面板: document.getElementById("pomodoroToggle").click()');
console.log('   测试关联: window.dailyStoriesManager.linkToPomodoro(0)');
console.log('   模拟完成: window.dailyStoriesManager.onPomodoroComplete(25)');

// 6. 如果番茄钟引用未设置，强制设置
console.log('\n6️⃣ 检查系统引用:');
if (window.app?.pomodoroTimer && window.dailyStoriesManager) {
    if (!window.app.pomodoroTimer.dailyStories) {
        console.log('   ⚠️ 番茄钟→故事引用缺失，正在设置...');
        window.app.pomodoroTimer.dailyStories = window.dailyStoriesManager;
        console.log('   ✓ 引用已设置');
    } else {
        console.log('   ✓ 番茄钟→故事引用正常');
    }
    
    if (!window.dailyStoriesManager.pomodoroTimer) {
        console.log('   ⚠️ 故事→番茄钟引用缺失，正在设置...');
        window.dailyStoriesManager.pomodoroTimer = window.app.pomodoroTimer;
        console.log('   ✓ 引用已设置');
    } else {
        console.log('   ✓ 故事→番茄钟引用正常');
    }
}

console.log('\n=================================');
console.log('✅ 检查完成！');
console.log('=================================');
console.log('\n💡 接下来：');
console.log('1. 点击左上角 🎯 打开故事面板');
console.log('2. 填写故事标题');
console.log('3. 点击"🍅 开始番茄钟"按钮');
console.log('4. 应该能正常打开番茄钟面板\n');

