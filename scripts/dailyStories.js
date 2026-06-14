// 每日三个故事目标管理系统
class DailyStories {
    constructor() {
        this.storageKey = 'dailyStories';
        this.currentDate = this.getTodayString();
        this.stories = this.loadTodayStories();
        this.isOpen = false;
        
        // 引用外部系统
        this.achievementSystem = null;
        this.forestSystem = null;
        this.pomodoroTimer = null;
        
        // 预设价值观标签
        this.values = [
            { name: '责任', color: '#e74c3c', emoji: '💼' },
            { name: '学习', color: '#3498db', emoji: '📚' },
            { name: '健康', color: '#27ae60', emoji: '💪' },
            { name: '家庭', color: '#f39c12', emoji: '👨‍👩‍👧' },
            { name: '成长', color: '#9b59b6', emoji: '🌱' },
            { name: '效率', color: '#16a085', emoji: '⚡' },
            { name: '创新', color: '#e67e22', emoji: '💡' },
            { name: '专注', color: '#34495e', emoji: '🎯' }
        ];
        
        this.init();
    }
    
    // 设置外部系统引用（在 app.js 中初始化后调用）
    setSystemReferences(achievement, forest, pomodoro) {
        this.achievementSystem = achievement;
        this.forestSystem = forest;
        this.pomodoroTimer = pomodoro;
    }
    
    // 获取今天的日期字符串 YYYY-MM-DD
    getTodayString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    // 初始化
    init() {
        this.createUI();
        this.bindEvents();
        this.checkNewDay();
        this.updateUI();
        this.updateBadge();
    }
    
    // 检查是否是新的一天
    checkNewDay() {
        const today = this.getTodayString();
        if (this.currentDate !== today) {
            this.currentDate = today;
            this.stories = this.getDefaultStories();
            this.saveTodayStories();
            this.showWelcomePrompt();
        }
    }
    
    // 获取默认的空故事结构
    getDefaultStories() {
        return [
            { id: 1, title: '', story: '', value: '', completed: false, completedAt: null, pomodoroCount: 0, timeSpent: 0 },
            { id: 2, title: '', story: '', value: '', completed: false, completedAt: null, pomodoroCount: 0, timeSpent: 0 },
            { id: 3, title: '', story: '', value: '', completed: false, completedAt: null, pomodoroCount: 0, timeSpent: 0 }
        ];
    }
    
    // 加载今天的故事
    loadTodayStories() {
        try {
            const allData = localStorage.getItem(this.storageKey);
            if (!allData) return this.getDefaultStories();
            
            const data = JSON.parse(allData);
            const todayData = data[this.currentDate];
            
            return todayData || this.getDefaultStories();
        } catch (error) {
            console.error('加载今日故事失败:', error);
            return this.getDefaultStories();
        }
    }
    
    // 保存今天的故事
    saveTodayStories() {
        try {
            const allData = localStorage.getItem(this.storageKey);
            const data = allData ? JSON.parse(allData) : {};
            
            data[this.currentDate] = this.stories;
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            this.updateBadge();
            return true;
        } catch (error) {
            console.error('保存今日故事失败:', error);
            return false;
        }
    }
    
    // 创建UI
    createUI() {
        // 创建触发按钮（添加到控制面板）
        const controls = document.querySelector('.controls');
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'storiesToggle';
        toggleBtn.className = 'control-btn stories-toggle';
        toggleBtn.title = '每日三个故事';
        toggleBtn.innerHTML = `
            🎯
            <span class="stories-badge" id="storiesBadge">0/3</span>
        `;
        
        // 插入到第一个位置
        controls.insertBefore(toggleBtn, controls.firstChild);
        
        // 创建侧边栏面板
        const panel = document.createElement('div');
        panel.id = 'storiesPanel';
        panel.className = 'stories-panel';
        panel.innerHTML = `
            <div class="stories-panel-header">
                <h2>🎯 今日三个故事</h2>
                <button class="stories-close-btn" id="storiesClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            <div class="stories-date">
                ${this.formatDate(this.currentDate)}
            </div>
            
            <div class="stories-progress">
                <div class="stories-progress-bar">
                    <div class="stories-progress-fill" id="storiesProgressFill"></div>
                </div>
                <div class="stories-progress-text" id="storiesProgressText">已完成 0/3</div>
            </div>
            
            <div class="stories-list" id="storiesList">
                <!-- 故事卡片将在这里动态生成 -->
            </div>
            
            <div class="stories-tips">
                <div class="tips-icon">💡</div>
                <div class="tips-text">
                    找到三个今天重要的结果，用简短的故事描述，与你的价值观联系起来。
                </div>
            </div>
            
            <div class="stories-stats">
                <button class="stats-btn" id="statsBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                    查看统计
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 创建统计面板
        this.createStatsPanel();
    }
    
    // 创建统计面板
    createStatsPanel() {
        const statsPanel = document.createElement('div');
        statsPanel.id = 'storiesStatsPanel';
        statsPanel.className = 'stories-stats-panel';
        statsPanel.innerHTML = `
            <div class="stats-panel-header">
                <h2>📊 统计数据</h2>
                <button class="stats-close-btn" id="statsClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            <div class="stats-content" id="statsContent">
                <!-- 统计内容将动态生成 -->
            </div>
        `;
        
        document.body.appendChild(statsPanel);
    }
    
    // 格式化日期
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = weekdays[date.getDay()];
        
        return `${month}月${day}日 星期${weekday}`;
    }
    
    // 更新UI
    updateUI() {
        const listContainer = document.getElementById('storiesList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        this.stories.forEach((story, index) => {
            const card = this.createStoryCard(story, index);
            listContainer.appendChild(card);
        });
        
        this.updateProgress();
    }
    
    // 创建故事卡片
    createStoryCard(story, index) {
        const card = document.createElement('div');
        card.className = `story-card ${story.completed ? 'completed' : ''}`;
        card.dataset.index = index;
        
        const valueInfo = this.values.find(v => v.name === story.value) || { color: '#95a5a6', emoji: '⭐' };
        
        card.innerHTML = `
            <div class="story-card-header">
                <div class="story-number">${index + 1}</div>
                <label class="story-checkbox">
                    <input type="checkbox" ${story.completed ? 'checked' : ''} data-index="${index}">
                    <span class="checkbox-custom"></span>
                </label>
            </div>
            
            <div class="story-content">
                <input 
                    type="text" 
                    class="story-title-input" 
                    placeholder="例如：完成项目计划"
                    value="${story.title}"
                    data-index="${index}"
                    data-field="title"
                    ${story.completed ? 'readonly' : ''}
                />
                
                <textarea 
                    class="story-description-input" 
                    placeholder="用简短的故事描述：这件事为什么重要？与你的哪个价值观相关？"
                    data-index="${index}"
                    data-field="story"
                    ${story.completed ? 'readonly' : ''}
                >${story.story}</textarea>
                
                <div class="story-values">
                    ${this.values.map(v => `
                        <button 
                            class="value-tag ${story.value === v.name ? 'active' : ''}" 
                            data-index="${index}" 
                            data-value="${v.name}"
                            style="--value-color: ${v.color}"
                            ${story.completed ? 'disabled' : ''}
                        >
                            ${v.emoji} ${v.name}
                        </button>
                    `).join('')}
                </div>
                
                ${!story.completed && story.title ? `
                    <div class="story-pomodoro-link">
                        <button class="link-pomodoro-btn" data-index="${index}">
                            🍅 开始25分钟倒计时
                        </button>
                    </div>
                ` : ''}
                
                ${story.pomodoroCount > 0 || story.timeSpent > 0 ? `
                    <div class="story-stats">
                        ${story.pomodoroCount > 0 ? `<span class="story-stat">🍅 ${story.pomodoroCount}个</span>` : ''}
                        ${story.timeSpent > 0 ? `<span class="story-stat">⏱️ ${story.timeSpent}分钟</span>` : ''}
                    </div>
                ` : ''}
                
                ${story.completed ? `
                    <div class="story-completed-time">
                        ✅ 完成于 ${this.formatTime(story.completedAt)}
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    }
    
    // 格式化时间
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    // 更新进度
    updateProgress() {
        const completedCount = this.stories.filter(s => s.completed).length;
        const total = this.stories.length;
        const percentage = (completedCount / total) * 100;
        
        const progressFill = document.getElementById('storiesProgressFill');
        const progressText = document.getElementById('storiesProgressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `已完成 ${completedCount}/${total}`;
        }
    }
    
    // 更新徽章
    updateBadge() {
        const completedCount = this.stories.filter(s => s.completed).length;
        const badge = document.getElementById('storiesBadge');
        
        if (badge) {
            badge.textContent = `${completedCount}/3`;
            
            // 根据完成情况改变颜色
            if (completedCount === 3) {
                badge.style.backgroundColor = '#27ae60';
            } else if (completedCount > 0) {
                badge.style.backgroundColor = '#f39c12';
            } else {
                badge.style.backgroundColor = '#e74c3c';
            }
        }
    }
    
    // 绑定事件
    bindEvents() {
        // 切换面板
        document.getElementById('storiesToggle')?.addEventListener('click', () => {
            this.togglePanel();
        });
        
        document.getElementById('storiesClose')?.addEventListener('click', () => {
            this.closePanel();
        });
        
        // 事件委托：处理所有故事相关的交互
        document.getElementById('storiesList')?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const index = parseInt(e.target.dataset.index);
                this.toggleStoryCompletion(index, e.target.checked);
            }
        });
        
        document.getElementById('storiesList')?.addEventListener('input', (e) => {
            if (e.target.classList.contains('story-title-input') || 
                e.target.classList.contains('story-description-input')) {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.updateStoryField(index, field, e.target.value);
            }
        });
        
        document.getElementById('storiesList')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('value-tag')) {
                const index = parseInt(e.target.dataset.index);
                const value = e.target.dataset.value;
                this.updateStoryValue(index, value);
            } else if (e.target.classList.contains('link-pomodoro-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.linkToPomodoro(index);
            }
        });
        
        // 统计按钮
        document.getElementById('statsBtn')?.addEventListener('click', () => {
            this.showStats();
        });
        
        document.getElementById('statsClose')?.addEventListener('click', () => {
            this.closeStats();
        });
    }
    
    // 切换面板显示
    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('storiesPanel');
        
        if (this.isOpen) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    }
    
    // 关闭面板
    closePanel() {
        this.isOpen = false;
        document.getElementById('storiesPanel')?.classList.remove('active');
    }
    
    // 切换故事完成状态
    toggleStoryCompletion(index, completed) {
        this.stories[index].completed = completed;
        this.stories[index].completedAt = completed ? Date.now() : null;
        
        this.saveTodayStories();
        this.updateUI();
        
        // 播放完成动画
        if (completed) {
            this.playCompletionAnimation(index);
            
            // 触发成就检查
            this.checkStoryAchievements();
            
            // 种植特殊金色树木（如果有森林系统）
            if (this.forestSystem && this.stories[index].title) {
                this.plantSpecialTree(this.stories[index]);
            }
            
            // 检查是否全部完成
            const allCompleted = this.stories.every(s => s.completed);
            if (allCompleted) {
                this.celebrateAllCompleted();
            }
        }
    }
    
    // 关联番茄钟
    linkToPomodoro(index) {
        const story = this.stories[index];
        
        if (!story.title) {
            alert('请先填写故事标题');
            return;
        }
        
        // 获取番茄钟系统实例
        const pomodoroTimer = this.pomodoroTimer || window.app?.pomodoroTimer;
        
        if (!pomodoroTimer) {
            console.error('❌ 番茄钟系统不可用');
            alert('番茄钟功能暂不可用，请刷新页面重试');
            return;
        }
        
        // 存储当前关联的故事索引
        this.currentLinkedStoryIndex = index;
        
        // 关闭故事面板
        this.closePanel();
        
        // 直接开始25分钟番茄钟，不弹出对话框
        // 1. 设置为工作模式
        pomodoroTimer.setMode('work');
        
        // 2. 确保时间为25分钟
        pomodoroTimer.timeRemaining = 25 * 60;
        pomodoroTimer.updateDisplay();
        
        // 3. 直接开始倒计时
        pomodoroTimer.start();
        
        // 显示开始提示
        this.showStartNotification(story.title);
    }
    
    // 显示开始番茄钟提示
    showStartNotification(storyTitle) {
        const notification = document.createElement('div');
        notification.className = 'story-link-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🍅</div>
                <div class="notification-text">
                    <div class="notification-title">番茄钟已开始</div>
                    <div class="notification-desc">${storyTitle} - 25分钟倒计时</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // 显示关联提示
    showLinkNotification(storyTitle) {
        const notification = document.createElement('div');
        notification.className = 'story-link-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🎯</div>
                <div class="notification-text">
                    <div class="notification-title">已关联故事</div>
                    <div class="notification-desc">${storyTitle}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    // 番茄钟完成回调（由番茄钟系统调用）
    onPomodoroComplete(minutes) {
        if (this.currentLinkedStoryIndex !== undefined && this.currentLinkedStoryIndex !== null) {
            const story = this.stories[this.currentLinkedStoryIndex];
            
            if (story && !story.completed) {
                // 更新故事的番茄钟计数和时间
                story.pomodoroCount = (story.pomodoroCount || 0) + 1;
                story.timeSpent = (story.timeSpent || 0) + minutes;
                
                this.saveTodayStories();
                this.updateUI();
                
                // 显示更新通知
                this.showUpdateNotification(story.title, story.pomodoroCount, story.timeSpent);
            }
            
            // 清除关联（只记录一次）
            // 如果想继续关联，用户需要再次点击按钮
            // this.currentLinkedStoryIndex = null;
        }
    }
    
    // 显示更新通知
    showUpdateNotification(storyTitle, pomodoroCount, timeSpent) {
        const notification = document.createElement('div');
        notification.className = 'story-link-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">✅</div>
                <div class="notification-text">
                    <div class="notification-title">故事进度更新</div>
                    <div class="notification-desc">${storyTitle}: 🍅 ${pomodoroCount}个 | ⏱️ ${timeSpent}分钟</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // 种植特殊树木
    plantSpecialTree(story) {
        // 创建一个特殊的"故事完成"事件，种植金色树
        if (this.forestSystem) {
            // 暂时使用模拟方式，未来可以扩展森林系统支持特殊树木类型
            console.log(`🌟 完成故事"${story.title}"，获得特殊奖励！`);
            
            // 可以在这里添加额外的经验值
            if (this.achievementSystem) {
                this.achievementSystem.addExp(30); // 完成故事额外30经验
            }
        }
    }
    
    // 检查故事相关成就
    checkStoryAchievements() {
        if (!this.achievementSystem) return;
        
        // 检查今日完成的故事数
        const todayCompleted = this.stories.filter(s => s.completed).length;
        
        // 统计历史数据
        const allData = localStorage.getItem(this.storageKey);
        if (allData) {
            const data = JSON.parse(allData);
            const dates = Object.keys(data);
            
            // 统计完成所有三个故事的天数
            let perfectDays = 0;
            let totalStories = 0;
            
            dates.forEach(date => {
                const dayStories = data[date];
                const completed = dayStories.filter(s => s.completed).length;
                totalStories += completed;
                
                if (completed === 3) {
                    perfectDays++;
                }
            });
            
            // 触发成就系统的故事相关成就检查
            if (this.achievementSystem.checkStoriesAchievements) {
                this.achievementSystem.checkStoriesAchievements({
                    todayCompleted,
                    perfectDays,
                    totalStories
                });
            }
        }
    }
    
    // 更新故事字段
    updateStoryField(index, field, value) {
        this.stories[index][field] = value;
        this.saveTodayStories();
    }
    
    // 更新故事价值观
    updateStoryValue(index, value) {
        this.stories[index].value = value;
        this.saveTodayStories();
        this.updateUI();
    }
    
    // 播放完成动画
    playCompletionAnimation(index) {
        const card = document.querySelector(`.story-card[data-index="${index}"]`);
        if (card) {
            card.classList.add('completion-flash');
            setTimeout(() => {
                card.classList.remove('completion-flash');
            }, 600);
        }
    }
    
    // 庆祝全部完成
    celebrateAllCompleted() {
        // 创建庆祝提示
        const celebration = document.createElement('div');
        celebration.className = 'celebration-modal';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>太棒了！</h2>
                <p>你完成了今天的三个故事！</p>
                <p>每一天的积累，都在成就更好的自己。</p>
                <button class="celebration-close-btn">继续努力</button>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // 延迟显示
        setTimeout(() => {
            celebration.classList.add('active');
        }, 100);
        
        // 关闭按钮
        celebration.querySelector('.celebration-close-btn').addEventListener('click', () => {
            celebration.classList.remove('active');
            setTimeout(() => {
                celebration.remove();
            }, 300);
        });
        
        // 可能触发成就系统（如果存在）
        if (window.achievementManager) {
            // 这里可以添加与成就系统的集成
        }
    }
    
    // 显示欢迎提示
    showWelcomePrompt() {
        // 检查是否所有故事都为空
        const isEmpty = this.stories.every(s => !s.title && !s.story);
        
        if (isEmpty) {
            setTimeout(() => {
                const welcome = document.createElement('div');
                welcome.className = 'welcome-prompt';
                welcome.innerHTML = `
                    <div class="welcome-content">
                        <div class="welcome-icon">🌅</div>
                        <h3>新的一天，新的开始</h3>
                        <p>今天你想完成哪三件重要的事情？</p>
                        <button class="welcome-btn" id="welcomeStartBtn">开始规划</button>
                    </div>
                `;
                
                document.body.appendChild(welcome);
                
                setTimeout(() => {
                    welcome.classList.add('active');
                }, 100);
                
                document.getElementById('welcomeStartBtn').addEventListener('click', () => {
                    welcome.classList.remove('active');
                    setTimeout(() => {
                        welcome.remove();
                    }, 300);
                    
                    // 打开面板
                    this.togglePanel();
                });
            }, 2000);
        }
    }
    
    // 显示统计
    showStats() {
        const statsPanel = document.getElementById('storiesStatsPanel');
        const statsContent = document.getElementById('statsContent');
        
        // 计算统计数据
        const stats = this.calculateStats();
        
        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalDays}</div>
                    <div class="stat-label">记录天数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.completedDays}</div>
                    <div class="stat-label">完成天数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.completionRate}%</div>
                    <div class="stat-label">完成率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalStories}</div>
                    <div class="stat-label">完成故事数</div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>📊 价值观分布</h3>
                <div class="value-stats">
                    ${stats.valueDistribution.map(v => `
                        <div class="value-stat-item">
                            <div class="value-stat-bar" style="--value-color: ${v.color}; --value-width: ${v.percentage}%;">
                                <span class="value-stat-label">${v.emoji} ${v.name}</span>
                                <span class="value-stat-count">${v.count}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="stats-section">
                <h3>📅 最近7天</h3>
                <div class="recent-days">
                    ${stats.recentDays.map(day => `
                        <div class="day-item ${day.completed === 3 ? 'full-completed' : ''}">
                            <div class="day-date">${day.dateStr}</div>
                            <div class="day-progress">
                                <div class="day-progress-bar" style="width: ${(day.completed / 3) * 100}%"></div>
                            </div>
                            <div class="day-count">${day.completed}/3</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        statsPanel.classList.add('active');
    }
    
    // 关闭统计
    closeStats() {
        document.getElementById('storiesStatsPanel')?.classList.remove('active');
    }
    
    // 计算统计数据
    calculateStats() {
        try {
            const allData = localStorage.getItem(this.storageKey);
            if (!allData) return this.getEmptyStats();
            
            const data = JSON.parse(allData);
            const dates = Object.keys(data).sort();
            
            let totalStories = 0;
            let completedDays = 0;
            const valueCounts = {};
            
            dates.forEach(date => {
                const dayStories = data[date];
                const completed = dayStories.filter(s => s.completed).length;
                totalStories += completed;
                
                if (completed === 3) {
                    completedDays++;
                }
                
                // 统计价值观
                dayStories.forEach(story => {
                    if (story.completed && story.value) {
                        valueCounts[story.value] = (valueCounts[story.value] || 0) + 1;
                    }
                });
            });
            
            // 价值观分布
            const valueDistribution = this.values
                .map(v => ({
                    ...v,
                    count: valueCounts[v.name] || 0,
                    percentage: totalStories > 0 ? ((valueCounts[v.name] || 0) / totalStories * 100).toFixed(0) : 0
                }))
                .filter(v => v.count > 0)
                .sort((a, b) => b.count - a.count);
            
            // 最近7天
            const recentDays = this.getRecentDays(7, data);
            
            return {
                totalDays: dates.length,
                completedDays,
                completionRate: dates.length > 0 ? Math.round((completedDays / dates.length) * 100) : 0,
                totalStories,
                valueDistribution,
                recentDays
            };
        } catch (error) {
            console.error('计算统计数据失败:', error);
            return this.getEmptyStats();
        }
    }
    
    // 获取最近N天的数据
    getRecentDays(n, data) {
        const days = [];
        const today = new Date();
        
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.getTodayString.call({ getTodayString: () => {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }});
            
            const dayData = data[dateStr] || this.getDefaultStories();
            const completed = dayData.filter(s => s.completed).length;
            
            days.push({
                dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
                completed
            });
        }
        
        return days;
    }
    
    // 获取空统计数据
    getEmptyStats() {
        return {
            totalDays: 0,
            completedDays: 0,
            completionRate: 0,
            totalStories: 0,
            valueDistribution: [],
            recentDays: []
        };
    }
}

// 初始化
let dailyStoriesManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 初始化每日三个故事系统...');
    dailyStoriesManager = new DailyStories();
    window.dailyStoriesManager = dailyStoriesManager;
    console.log('✅ 每日三个故事系统初始化完成');
});
