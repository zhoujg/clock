// Phase 2 自动修复脚本
// 在浏览器控制台中复制粘贴此脚本并执行

(function() {
    console.clear();
    console.log('🔧 Phase 2 自动修复脚本启动...\n');
    
    let fixCount = 0;
    const fixes = [];
    
    // 修复函数
    function fix(description, checkFn, fixFn) {
        if (!checkFn()) {
            console.log(`🔧 修复: ${description}`);
            fixFn();
            fixes.push(description);
            fixCount++;
            console.log('   ✅ 完成\n');
        } else {
            console.log(`✅ 正常: ${description}`);
        }
    }
    
    // 1. 检查并修复系统引用
    fix('番茄钟→故事系统引用', 
        () => window.app?.pomodoroTimer?.dailyStories,
        () => {
            if (window.app?.pomodoroTimer && window.dailyStoriesManager) {
                window.app.pomodoroTimer.dailyStories = window.dailyStoriesManager;
            }
        }
    );
    
    fix('故事→番茄钟系统引用',
        () => window.dailyStoriesManager?.pomodoroTimer,
        () => {
            if (window.dailyStoriesManager && window.app?.pomodoroTimer) {
                window.dailyStoriesManager.pomodoroTimer = window.app.pomodoroTimer;
            }
        }
    );
    
    fix('故事→成就系统引用',
        () => window.dailyStoriesManager?.achievementSystem,
        () => {
            if (window.dailyStoriesManager && window.app?.achievementSystem) {
                window.dailyStoriesManager.achievementSystem = window.app.achievementSystem;
            }
        }
    );
    
    fix('故事→森林系统引用',
        () => window.dailyStoriesManager?.forestSystem,
        () => {
            if (window.dailyStoriesManager && window.app?.forestSystem) {
                window.dailyStoriesManager.forestSystem = window.app.forestSystem;
            }
        }
    );
    
    // 2. 检查并修复数据结构
    fix('故事数据结构',
        () => {
            if (!window.dailyStoriesManager?.stories) return false;
            const story = window.dailyStoriesManager.stories[0];
            return 'pomodoroCount' in story && 'timeSpent' in story;
        },
        () => {
            if (window.dailyStoriesManager?.stories) {
                window.dailyStoriesManager.stories.forEach(story => {
                    if (!('pomodoroCount' in story)) story.pomodoroCount = 0;
                    if (!('timeSpent' in story)) story.timeSpent = 0;
                });
                window.dailyStoriesManager.saveTodayStories();
            }
        }
    );
    
    // 3. 检查并修复 DOM 事件
    fix('番茄钟按钮事件',
        () => {
            const toggle = document.getElementById('pomodoroToggle');
            return toggle && toggle.onclick !== null;
        },
        () => {
            const toggle = document.getElementById('pomodoroToggle');
            const panel = document.getElementById('pomodoroPanel');
            
            if (toggle && panel) {
                // 清除可能存在的旧事件
                const newToggle = toggle.cloneNode(true);
                toggle.parentNode.replaceChild(newToggle, toggle);
                
                // 重新绑定事件
                newToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    newToggle.classList.toggle('active');
                    panel.classList.toggle('active');
                });
            }
        }
    );
    
    // 4. 检查并修复 CSS
    fix('dailyStories.css 样式文件',
        () => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            return links.some(link => link.href.includes('dailyStories.css'));
        },
        () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'styles/dailyStories.css';
            document.head.appendChild(link);
        }
    );
    
    // 5. 测试关键功能
    console.log('\n🧪 功能测试:');
    
    // 测试故事面板
    const storiesToggle = document.getElementById('storiesToggle');
    const storiesPanel = document.getElementById('storiesPanel');
    console.log('   故事面板:', storiesToggle && storiesPanel ? '✅ 可用' : '❌ 不可用');
    
    // 测试番茄钟面板
    const pomodoroToggle = document.getElementById('pomodoroToggle');
    const pomodoroPanel = document.getElementById('pomodoroPanel');
    console.log('   番茄钟面板:', pomodoroToggle && pomodoroPanel ? '✅ 可用' : '❌ 不可用');
    
    // 测试关联功能
    const linkFunction = window.dailyStoriesManager?.linkToPomodoro;
    console.log('   关联功能:', typeof linkFunction === 'function' ? '✅ 可用' : '❌ 不可用');
    
    // 测试回调功能
    const callbackFunction = window.dailyStoriesManager?.onPomodoroComplete;
    console.log('   回调功能:', typeof callbackFunction === 'function' ? '✅ 可用' : '❌ 不可用');
    
    // 6. 提供测试功能
    console.log('\n🎮 快速测试功能:');
    
    // 创建全局测试函数
    window.testPhase2 = {
        openStories: () => {
            document.getElementById('storiesToggle')?.click();
            console.log('📖 故事面板已打开');
        },
        
        openPomodoro: () => {
            document.getElementById('pomodoroToggle')?.click();
            console.log('🍅 番茄钟面板已打开');
        },
        
        linkStory: (index = 0) => {
            if (window.dailyStoriesManager?.linkToPomodoro) {
                // 先设置一个测试标题
                const story = window.dailyStoriesManager.stories[index];
                if (!story.title) {
                    story.title = '测试任务';
                    window.dailyStoriesManager.saveTodayStories();
                    window.dailyStoriesManager.updateUI();
                }
                window.dailyStoriesManager.linkToPomodoro(index);
                console.log(`🔗 已关联故事 ${index}`);
            } else {
                console.log('❌ 关联功能不可用');
            }
        },
        
        simulateComplete: (minutes = 25) => {
            if (window.dailyStoriesManager?.onPomodoroComplete) {
                window.dailyStoriesManager.onPomodoroComplete(minutes);
                console.log(`⏰ 已模拟完成 ${minutes} 分钟番茄钟`);
            } else {
                console.log('❌ 回调功能不可用');
            }
        },
        
        checkData: () => {
            if (window.dailyStoriesManager) {
                console.log('📊 当前故事数据:');
                window.dailyStoriesManager.stories.forEach((story, i) => {
                    console.log(`   故事 ${i+1}: ${story.title || '(未设置)'}`);
                    console.log(`      🍅 ${story.pomodoroCount || 0}个, ⏱️ ${story.timeSpent || 0}分钟, ✅ ${story.completed ? '已完成' : '未完成'}`);
                });
            }
        }
    };
    
    console.log('   testPhase2.openStories() - 打开故事面板');
    console.log('   testPhase2.openPomodoro() - 打开番茄钟面板');
    console.log('   testPhase2.linkStory(0) - 关联故事0到番茄钟');
    console.log('   testPhase2.simulateComplete(25) - 模拟完成25分钟');
    console.log('   testPhase2.checkData() - 查看故事数据');
    
    // 7. 总结
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 自动修复完成！`);
    console.log(`📊 修复项目: ${fixCount}/${fixes.length + 5} 项`);
    
    if (fixCount > 0) {
        console.log('🔧 已修复:');
        fixes.forEach(fix => console.log(`   • ${fix}`));
    }
    
    console.log('\n📋 接下来请测试:');
    console.log('1. 执行 testPhase2.openStories() 打开故事面板');
    console.log('2. 执行 testPhase2.linkStory(0) 测试关联功能');
    console.log('3. 执行 testPhase2.simulateComplete(25) 测试数据更新');
    console.log('4. 执行 testPhase2.checkData() 查看结果');
    
    console.log('\n如果仍有问题，请执行: location.reload() 刷新页面');
    console.log('='.repeat(50));
    
})();