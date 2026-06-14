// 验证番茄钟直接启动功能的脚本

console.log('🔍 开始验证番茄钟直接启动功能...');

// 检查修改后的代码是否包含正确的逻辑
function verifyCodeModifications() {
    console.log('\n📝 检查代码修改...');
    
    const fs = require('fs');
    const dailyStoriesCode = fs.readFileSync('./scripts/dailyStories.js', 'utf8');
    
    // 检查关键修改点
    const checks = [
        {
            name: '番茄钟直接启动逻辑',
            pattern: /pomodoroTimer\.setMode\('work'\)/,
            expected: true
        },
        {
            name: '25分钟时间设置',
            pattern: /pomodoroTimer\.timeRemaining = 25 \* 60/,
            expected: true
        },
        {
            name: '直接开始方法调用',
            pattern: /pomodoroTimer\.start\(\)/,
            expected: true
        },
        {
            name: '移除面板打开逻辑',
            pattern: /pomodoroPanel\.classList\.add\('active'\)/,
            expected: false
        },
        {
            name: '按钮文字更新',
            pattern: /开始25分钟倒计时/,
            expected: true
        },
        {
            name: '开始提示通知',
            pattern: /showStartNotification/,
            expected: true
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
        const found = check.pattern.test(dailyStoriesCode);
        const passed = found === check.expected;
        
        console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${found ? '存在' : '不存在'}${!passed ? ' (预期' + (check.expected ? '存在' : '不存在') + ')' : ''}`);
        
        if (!passed) allPassed = false;
    });
    
    return allPassed;
}

// 检查语法错误
function checkSyntax() {
    console.log('\n🔧 检查语法...');
    
    try {
        const { execSync } = require('child_process');
        
        // 检查 dailyStories.js
        execSync('node -c scripts/dailyStories.js', { stdio: 'pipe' });
        console.log('  ✅ dailyStories.js 语法正确');
        
        // 检查 pomodoro.js
        execSync('node -c scripts/pomodoro.js', { stdio: 'pipe' });
        console.log('  ✅ pomodoro.js 语法正确');
        
        return true;
    } catch (error) {
        console.log(`  ❌ 语法错误: ${error.message}`);
        return false;
    }
}

// 分析修改的影响
function analyzeChanges() {
    console.log('\n📊 分析修改影响...');
    
    console.log('  🎯 用户体验改进:');
    console.log('    - 点击"开始25分钟倒计时"按钮后不再弹出番茄钟设置面板');
    console.log('    - 直接开始25分钟的工作倒计时');
    console.log('    - 显示开始提示通知，明确告知用户操作结果');
    
    console.log('\n  🔧 技术实现:');
    console.log('    - 调用 pomodoroTimer.setMode("work") 设置工作模式');
    console.log('    - 设置 timeRemaining = 25 * 60 确保25分钟倒计时');
    console.log('    - 调用 pomodoroTimer.start() 直接开始计时');
    console.log('    - 使用 showStartNotification() 显示友好的开始提示');
    
    console.log('\n  🔄 保持的功能:');
    console.log('    - 故事与番茄钟的关联机制');
    console.log('    - 番茄钟完成后的数据更新');
    console.log('    - 成就系统和森林系统的集成');
}

// 提供使用说明
function provideUsageInstructions() {
    console.log('\n📖 使用说明:');
    console.log('  1. 在"每日三个故事"中填写故事标题');
    console.log('  2. 点击"🍅 开始25分钟倒计时"按钮');
    console.log('  3. 系统会直接开始25分钟的番茄钟倒计时');
    console.log('  4. 无需额外设置，专注于工作即可');
    console.log('  5. 完成后故事会自动记录番茄钟数量和时间');
    
    console.log('\n🧪 测试验证:');
    console.log('  - 在浏览器中打开: http://localhost:8000');
    console.log('  - 或者打开测试页面: http://localhost:8000/test_daily_stories_pomodoro.html');
    console.log('  - 创建一个测试故事，然后点击开始按钮验证功能');
}

// 运行所有验证
function runAllVerifications() {
    const codeModificationsPassed = verifyCodeModifications();
    const syntaxPassed = checkSyntax();
    
    analyzeChanges();
    provideUsageInstructions();
    
    console.log('\n🎯 验证总结:');
    console.log(`  代码修改: ${codeModificationsPassed ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  语法检查: ${syntaxPassed ? '✅ 通过' : '❌ 失败'}`);
    
    if (codeModificationsPassed && syntaxPassed) {
        console.log('\n🎉 所有验证都已通过！功能应该能够正常工作。');
        console.log('   现在用户在"每日三个故事"中点击番茄钟按钮时，会直接开始25分钟倒计时，无需弹出设置对话框。');
    } else {
        console.log('\n⚠️ 存在问题，请检查上述错误信息。');
    }
}

// 执行验证
runAllVerifications();