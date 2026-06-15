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
        
        // 预设生活方向盘维度
        this.values = [
            { name: '工作', color: '#3498db', emoji: '💼' },
            { name: '家庭', color: '#e74c3c', emoji: '👨‍👩‍👧' },
            { name: '健康', color: '#27ae60', emoji: '💪' },
            { name: '精神', color: '#9b59b6', emoji: '🧘' },
            { name: '财富', color: '#f39c12', emoji: '💰' },
            { name: '休闲', color: '#16a085', emoji: '🎮' },
            { name: '人际', color: '#e67e22', emoji: '🤝' },
            { name: '贡献', color: '#34495e', emoji: '❤️' }
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
        return [];
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
        // 创建独立的故事按钮（放置在右下角）
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'storiesToggle';
        toggleBtn.className = 'stories-main-btn';
        toggleBtn.title = '每日三个故事';
        toggleBtn.innerHTML = `
            <svg class="stories-main-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path class="stories-svg-body" d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4z" fill="currentColor" opacity="0.85"/>
                <path class="stories-svg-body2" d="M13 13h7v7h-7v-7z" fill="currentColor" opacity="0.5"/>
            </svg>
            <div class="stories-main-text">故事</div>
            <span class="stories-badge" id="storiesBadge">0/3</span>
        `;
        
        // 直接添加到 body
        document.body.appendChild(toggleBtn);
        
        // 创建全屏面板
        const panel = document.createElement('div');
        panel.id = 'storiesPanel';
        panel.className = 'stories-panel';
        panel.innerHTML = `
            <div class="stories-panel-header">
                <div class="stories-header-left">
                    <h2>每日故事</h2>
                    <button class="stories-add-btn" id="addStoryBtn" title="添加故事">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                </div>
                <button class="stories-close-btn" id="storiesClose">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            <div class="stories-progress">
                <div class="stories-progress-bar">
                    <div class="stories-progress-fill" id="storiesProgressFill"></div>
                </div>
                <div class="stories-progress-text" id="storiesProgressText">已完成 0 个故事</div>
            </div>
            
            <div class="stories-list" id="storiesList">
                <!-- 故事卡片将在这里动态生成 -->
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 创建添加故事的模态框
        this.createAddStoryModal();
        
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
        
        // 只显示未完成的故事
        const uncompletedStories = this.stories.filter(s => !s.completed);
        
        if (uncompletedStories.length === 0) {
            listContainer.innerHTML = `
                <div class="stories-empty">
                    <div class="stories-empty-icon">📝</div>
                    <div class="stories-empty-text">暂无未完成的故事</div>
                    <div class="stories-empty-hint">点击下方按钮添加新故事</div>
                </div>
            `;
        } else {
            uncompletedStories.forEach((story) => {
                const originalIndex = this.stories.indexOf(story);
                const card = this.createStoryCard(story, originalIndex);
                listContainer.appendChild(card);
            });
        }
        
        this.updateProgress();
    }
    
    // 创建故事卡片
    createStoryCard(story, index) {
        const card = document.createElement('div');
        card.className = `story-card ${story.completed ? 'completed' : ''}`;
        card.dataset.index = index;
        
        const valueInfo = this.values.find(v => v.name === story.value) || { color: '#95a5a6', emoji: '⭐' };
        
        // 构建时间显示
        let timeDisplay = '';
        if (story.startDate || story.startTime) {
            const parts = [];
            if (story.startDate) parts.push(story.startDate);
            if (story.startTime) parts.push(story.startTime);
            timeDisplay = parts.join(' ');
        }
        
        card.innerHTML = `
            <div class="story-card-header">
                <div class="story-value-badge" style="--value-color: ${valueInfo.color}">
                    ${valueInfo.emoji} ${story.value || '未分类'}
                </div>
                <button class="story-delete-btn" data-index="${index}" title="删除故事">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
            
            <div class="story-content">
                <div class="story-title">${story.title || '未命名故事'}</div>
                
                ${story.story ? `<div class="story-description">${story.story}</div>` : ''}
                
                ${timeDisplay ? `
                    <div class="story-time-info">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        ${timeDisplay}
                    </div>
                ` : ''}
                
                <div class="story-card-actions">
                    <button class="story-complete-btn" data-index="${index}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        完成
                    </button>
                    <button class="story-edit-btn" data-index="${index}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        编辑
                    </button>
                </div>
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
        const total = this.stories.length;
        const completedCount = this.stories.filter(s => s.completed).length;
        const percentage = total > 0 ? (completedCount / total) * 100 : 0;
        
        const progressFill = document.getElementById('storiesProgressFill');
        const progressText = document.getElementById('storiesProgressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `已完成 ${completedCount}/${total} 个故事`;
        }
    }
    
    // 更新徽章
    updateBadge() {
        const uncompletedCount = this.stories.filter(s => !s.completed).length;
        const totalCount = this.stories.length;
        const badge = document.getElementById('storiesBadge');
        
        if (badge) {
            badge.className = 'stories-badge';
            
            if (totalCount === 0) {
                // 今天没有设置过故事
                badge.textContent = '0';
            } else if (uncompletedCount === 0) {
                // 全部完成，显示大拇指
                badge.textContent = '👍';
                badge.classList.add('completed');
            } else {
                // 有未完成的故事
                badge.textContent = uncompletedCount;
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
        
        // 添加故事按钮
        document.getElementById('addStoryBtn')?.addEventListener('click', () => {
            this.showAddStoryModal();
        });
        
        // 事件委托：故事列表交互
        document.getElementById('storiesList')?.addEventListener('click', (e) => {
            const completeBtn = e.target.closest('.story-complete-btn');
            const editBtn = e.target.closest('.story-edit-btn');
            const deleteBtn = e.target.closest('.story-delete-btn');
            
            if (completeBtn) {
                const index = parseInt(completeBtn.dataset.index);
                this.toggleStoryCompletion(index, true);
            } else if (editBtn) {
                const index = parseInt(editBtn.dataset.index);
                this.showAddStoryModal(index);
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                this.deleteStory(index);
            }
        });
        
        // 模态框事件
        document.getElementById('storyModalClose')?.addEventListener('click', () => {
            this.closeAddStoryModal();
        });
        
        document.getElementById('storyModalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeAddStoryModal();
            }
        });
        
        document.getElementById('storyModalSave')?.addEventListener('click', () => {
            this.saveStoryFromModal();
        });
        
        // 模态框中的维度选择
        document.getElementById('storyModalValues')?.addEventListener('click', (e) => {
            const tag = e.target.closest('.value-tag');
            if (tag) {
                document.querySelectorAll('#storyModalValues .value-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
            }
        });
    }
    
    // 切换面板显示
    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('storiesPanel');
        
        if (this.isOpen) {
            panel.classList.add('active');
            this.updateUI();
        } else {
            panel.classList.remove('active');
        }
    }
    
    // 关闭面板
    closePanel() {
        this.isOpen = false;
        document.getElementById('storiesPanel')?.classList.remove('active');
    }
    
    // 创建添加故事模态框
    createAddStoryModal() {
        const modal = document.createElement('div');
        modal.id = 'storyModalOverlay';
        modal.className = 'story-modal-overlay';
        modal.innerHTML = `
            <div class="story-modal">
                <div class="story-modal-header">
                    <h3 id="storyModalTitle">添加故事</h3>
                    <button class="story-modal-close" id="storyModalClose">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="story-modal-body">
                    <div class="story-modal-field">
                        <label>故事标题 <span class="required">*</span></label>
                        <input type="text" id="storyModalName" placeholder="例如：完成项目计划" maxlength="50" />
                    </div>
                    <div class="story-modal-field">
                        <label>故事描述</label>
                        <textarea id="storyModalDesc" placeholder="用简短的故事描述这件事为什么重要" rows="3" maxlength="200"></textarea>
                    </div>
                    <div class="story-modal-field">
                        <label>生活方向盘</label>
                        <div class="story-modal-values" id="storyModalValues">
                            ${this.values.map(v => `
                                <button class="value-tag" data-value="${v.name}" style="--value-color: ${v.color}">
                                    ${v.emoji} ${v.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="story-modal-row">
                        <div class="story-modal-field story-modal-field-half">
                            <label>开始日期</label>
                            <input type="date" id="storyModalStartDate" />
                        </div>
                        <div class="story-modal-field story-modal-field-half">
                            <label>开始时间</label>
                            <input type="time" id="storyModalStartTime" />
                        </div>
                    </div>
                </div>
                <div class="story-modal-footer">
                    <button class="story-modal-cancel" id="storyModalCancel">取消</button>
                    <button class="story-modal-save" id="storyModalSave">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 取消按钮也关闭
        document.getElementById('storyModalCancel')?.addEventListener('click', () => {
            this.closeAddStoryModal();
        });
        
        this._editingIndex = null;
    }
    
    // 显示添加/编辑故事模态框
    showAddStoryModal(editIndex = null) {
        const overlay = document.getElementById('storyModalOverlay');
        const title = document.getElementById('storyModalTitle');
        const nameInput = document.getElementById('storyModalName');
        const descInput = document.getElementById('storyModalDesc');
        const startDateInput = document.getElementById('storyModalStartDate');
        const startTimeInput = document.getElementById('storyModalStartTime');
        
        // 重置表单
        nameInput.value = '';
        descInput.value = '';
        startDateInput.value = '';
        startTimeInput.value = '';
        document.querySelectorAll('#storyModalValues .value-tag').forEach(t => t.classList.remove('active'));
        
        if (editIndex !== null && editIndex >= 0 && editIndex < this.stories.length) {
            // 编辑模式
            this._editingIndex = editIndex;
            const story = this.stories[editIndex];
            title.textContent = '编辑故事';
            nameInput.value = story.title || '';
            descInput.value = story.story || '';
            startDateInput.value = story.startDate || '';
            startTimeInput.value = story.startTime || '';
            
            if (story.value) {
                const tag = document.querySelector(`#storyModalValues .value-tag[data-value="${story.value}"]`);
                if (tag) tag.classList.add('active');
            }
        } else {
            // 新增模式
            this._editingIndex = null;
            title.textContent = '添加故事';
        }
        
        overlay.classList.add('active');
        setTimeout(() => nameInput.focus(), 100);
    }
    
    // 关闭模态框
    closeAddStoryModal() {
        const overlay = document.getElementById('storyModalOverlay');
        overlay.classList.remove('active');
        this._editingIndex = null;
    }
    
    // 从模态框保存故事
    saveStoryFromModal() {
        const name = document.getElementById('storyModalName').value.trim();
        const desc = document.getElementById('storyModalDesc').value.trim();
        const activeTag = document.querySelector('#storyModalValues .value-tag.active');
        const value = activeTag ? activeTag.dataset.value : '';
        const startDate = document.getElementById('storyModalStartDate').value;
        const startTime = document.getElementById('storyModalStartTime').value;
        
        if (!name) {
            document.getElementById('storyModalName').classList.add('error');
            setTimeout(() => document.getElementById('storyModalName').classList.remove('error'), 1500);
            return;
        }
        
        if (this._editingIndex !== null) {
            // 更新已有故事
            this.stories[this._editingIndex].title = name;
            this.stories[this._editingIndex].story = desc;
            this.stories[this._editingIndex].value = value;
            this.stories[this._editingIndex].startDate = startDate || '';
            this.stories[this._editingIndex].startTime = startTime || '';
        } else {
            // 新增故事
            const newStory = {
                id: Date.now(),
                title: name,
                story: desc,
                value: value,
                startDate: startDate || '',
                startTime: startTime || '',
                completed: false,
                completedAt: null,
                pomodoroCount: 0,
                timeSpent: 0
            };
            this.stories.push(newStory);
        }
        
        this.saveTodayStories();
        this.updateUI();
        this.updateBadge();
        this.closeAddStoryModal();
    }
    
    // 删除故事
    deleteStory(index) {
        this.stories.splice(index, 1);
        this.saveTodayStories();
        this.updateUI();
        this.updateBadge();
    }
    
    // 切换故事完成状态
    toggleStoryCompletion(index, completed) {
        this.stories[index].completed = completed;
        this.stories[index].completedAt = completed ? Date.now() : null;
        
        this.saveTodayStories();
        this.updateUI();
        this.updateBadge();
        
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
            
            // 统计完成所有故事的天数
            let perfectDays = 0;
            let totalStories = 0;
            
            dates.forEach(date => {
                const dayStories = data[date];
                const completed = dayStories.filter(s => s.completed).length;
                const total = dayStories.length;
                totalStories += completed;
                
                if (total > 0 && completed === total) {
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
        const celebration = document.createElement('div');
        celebration.className = 'celebration-modal';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>太棒了！</h2>
                <p>你完成了今天的所有故事！</p>
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
        // 新的一天不再自动弹3个空故事，跳过欢迎提示
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
                        <div class="day-item ${day.completed === day.total && day.total > 0 ? 'full-completed' : ''}">
                            <div class="day-date">${day.dateStr}</div>
                            <div class="day-progress">
                                <div class="day-progress-bar" style="width: ${day.total > 0 ? (day.completed / day.total) * 100 : 0}%"></div>
                            </div>
                            <div class="day-count">${day.completed}/${day.total}</div>
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
                
                if (completed === total && total > 0) {
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
            
            const dayData = data[dateStr] || [];
            const completed = dayData.filter(s => s.completed).length;
            const total = dayData.length;
            
            days.push({
                dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
                completed,
                total
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
