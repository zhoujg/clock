// 每日三个故事目标管理系统
window.DailyStories = class DailyStories {
    constructor() {
        this.storageKey = 'dailyStories';
        this.focusKey = 'dailyStoriesFocus'; // 焦点维度存储键
        this.currentDate = this.getTodayString();
        this.viewingDate = this.currentDate; // 当前查看的日期
        this.currentView = 'today'; // 当前视图模式：today / inProgress / pending
        this.stories = this.loadTodayStories();
        this.isOpen = false;
        this.focusValues = this.loadFocusValues(); // 焦点维度列表
        
        // 引用外部系统
        this.pomodoroTimer = null;
        
        // 预设生活方向盘维度
        this.values = [
            { name: '工作', color: '#3498db', emoji: '💼', subtitle: '要结果的地方' },
            { name: '家庭', color: '#e74c3c', emoji: '👨‍👩‍👧', subtitle: '讲爱的地方' },
            { name: '健康', color: '#27ae60', emoji: '💪', subtitle: '体魄' },
            { name: '精神', color: '#9b59b6', emoji: '🧘', subtitle: '内心' },
            { name: '财富', color: '#f39c12', emoji: '💰', subtitle: '积累' },
            { name: '休闲', color: '#16a085', emoji: '🎮', subtitle: '乐趣' },
            { name: '人际', color: '#e67e22', emoji: '🤝', subtitle: '连接' },
            { name: '贡献', color: '#34495e', emoji: '❤️', subtitle: '意义' }
        ];
        
        this.init();
    }
    
    // 设置外部系统引用（在 app.js 中初始化后调用）
    setSystemReferences(pomodoro) {
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
            
            // 新的一天，先尝试从云端加载（可能有其他设备创建的故事）
            if (window.syncAdapter && window.cloudSync.isLoggedIn) {
                this._loadFromCloud().then(() => {
                    // 如果云端也没数据，用默认空列表
                    if (this.stories.length === 0) {
                        this.saveTodayStories();
                        this.showWelcomePrompt();
                    }
                });
            } else {
                this.saveTodayStories();
                this.showWelcomePrompt();
            }
        }
    }
    
    // 获取默认的空故事结构
    getDefaultStories() {
        return [];
    }
    
    // 加载今天的故事
    loadTodayStories() {
        return this.loadStoriesForDate(this.currentDate);
    }
    
    // 加载焦点维度
    loadFocusValues() {
        try {
            const data = localStorage.getItem(this.focusKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    // 保存焦点维度
    saveFocusValues() {
        localStorage.setItem(this.focusKey, JSON.stringify(this.focusValues));
    }
    
    // 设置焦点维度
    setFocusValues(values) {
        this.focusValues = values.slice(0, 3); // 最多3个
        this.saveFocusValues();
        this.updateUI();
        this.updateFocusDisplay();
    }
    
    // 是否已设置焦点维度
    hasFocusValues() {
        return this.focusValues.length > 0;
    }
    
    // 获取焦点维度的定义对象
    getFocusValueDefs() {
        return this.focusValues.map(name => this.values.find(v => v.name === name)).filter(Boolean);
    }
    
    // 获取非焦点维度的定义对象
    getNonFocusValueDefs() {
        return this.values.filter(v => !this.focusValues.includes(v.name));
    }
    
    // 加载指定日期的故事
    loadStoriesForDate(dateStr) {
        let localStories = [];

        try {
            const allData = localStorage.getItem(this.storageKey);
            if (allData) {
                const data = JSON.parse(allData);
                const dayData = data[dateStr];
                if (dayData && dayData.length > 0) {
                    localStories = dayData;
                }
            }
        } catch (error) {
            console.error('加载故事失败:', error);
        }

        // 今天才异步从云端加载
        if (dateStr === this.currentDate && window.syncAdapter && window.cloudSync.isLoggedIn) {
            this._loadFromCloud();
        }

        return localStories;
    }
    
    // 切换查看日期
    navigateToDate(dateStr) {
        this.viewingDate = dateStr;
        this.stories = this.loadStoriesForDate(dateStr);

        // 从全局视图（进行中/待开始）切回 today 视图
        if (this.currentView !== 'today') {
            this.currentView = 'today';
            document.querySelectorAll('.stories-status-btn').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.view === 'today');
            });
            const bottomNav = document.querySelector('.stories-bottom-nav');
            if (bottomNav) bottomNav.classList.remove('in-global-view');
            const focusDisplay = document.getElementById('storiesFocusDisplay');
            if (focusDisplay) focusDisplay.style.display = '';
        }

        this.updateUI();
        this.updateBadge();
        this.updateDateNav();
    }
    
    // 前一天
    navigatePrev() {
        const d = new Date(this.viewingDate);
        d.setDate(d.getDate() - 1);
        const newDate = this.dateToString(d);
        this.navigateToDate(newDate);
    }
    
    // 后一天
    navigateNext() {
        const d = new Date(this.viewingDate);
        d.setDate(d.getDate() + 1);
        const newDate = this.dateToString(d);
        // 不超过今天
        if (newDate <= this.currentDate) {
            this.navigateToDate(newDate);
        }
    }
    
    // 回到今天
    navigateToday() {
        this.navigateToDate(this.currentDate);
    }
    
    // 日期转字符串
    dateToString(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // 当前是否在查看今天
    isViewingToday() {
        return this.viewingDate === this.currentDate;
    }
    
    // 更新日期导航UI
    updateDateNav() {
        const dateLabel = document.getElementById('storiesDateLabel');
        const prevBtn = document.getElementById('storiesDatePrev');
        const nextBtn = document.getElementById('storiesDateNext');
        const todayBtn = document.getElementById('storiesDateToday');
        
        if (dateLabel) {
            dateLabel.textContent = this.formatViewingDate();
        }
        if (prevBtn) {
            prevBtn.disabled = false; // 总是可以往前翻
        }
        if (nextBtn) {
            nextBtn.disabled = this.viewingDate >= this.currentDate;
        }
        if (todayBtn) {
            todayBtn.style.display = this.isViewingToday() ? 'none' : 'flex';
        }
    }
    
    // 格式化查看日期的显示
    formatViewingDate() {
        const d = new Date(this.viewingDate);
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekday = weekdays[d.getDay()];
        
        if (this.viewingDate === this.currentDate) {
            return `今天 ${month}月${day}日`;
        }
        
        // 昨天
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (this.viewingDate === this.dateToString(yesterday)) {
            return `昨天 ${month}月${day}日`;
        }
        
        return `${month}月${day}日 周${weekday}`;
    }

    // 从云端加载今日故事
    async _loadFromCloud() {
        try {
            const cloudStories = await window.syncAdapter.loadStories(this.currentDate);
            if (cloudStories && cloudStories.length > 0) {
                // 解析云端故事（content 字段存储了完整 JSON）
                const parsed = cloudStories.map(s => {
                    try {
                        return JSON.parse(s.content);
                    } catch (e) {
                        return {
                            title: s.title || '',
                            story: s.content || '',
                            value: s.value_dim || '',
                            completed: s.completed == 1
                        };
                    }
                });

                // 云端数据覆盖本地
                this.stories = parsed;

                // 同步回 localStorage
                try {
                    const allData = localStorage.getItem(this.storageKey);
                    const data = allData ? JSON.parse(allData) : {};
                    data[this.currentDate] = this.stories;
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                } catch (e) {}

                this.updateUI();
                this.updateBadge();
            }
        } catch (e) {
            console.warn('[Stories] 云端加载失败:', e);
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

            // 通知其他插件数据已更新（如万年历刷新故事标记）
            document.dispatchEvent(new CustomEvent('stories-updated'));

            // 同步到云端
            this._syncToCloud();
            
            return true;
        } catch (error) {
            console.error('保存今日故事失败:', error);
            return false;
        }
    }

    // 云端同步（debounced），可通过 immediate=true 跳过 debounce
    _syncToCloud(immediate = false) {
        if (!window.syncAdapter || !window.cloudSync.isLoggedIn) return;

        if (this._syncTimer) clearTimeout(this._syncTimer);

        const doSync = async () => {
            const storiesForCloud = this.stories.map((story, idx) => ({
                story_index: idx + 1,
                title: story.title || '',
                content: JSON.stringify(story),
                value_dim: story.value || '',
                completed: story.completed ? 1 : 0,
                _localUpdatedAt: new Date().toISOString()
            }));

            await window.syncAdapter.saveStories(this.currentDate, storiesForCloud);
        };

        if (immediate) {
            doSync();
        } else {
            this._syncTimer = setTimeout(doSync, 500);
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
        
        // 添加到底部工具栏
        toggleBtn.style.opacity = '0';
        toggleBtn.style.visibility = 'hidden';
        const toolbar = document.querySelector('.bottom-toolbar');
        if (toolbar) {
            toolbar.appendChild(toggleBtn);
        } else {
            document.body.appendChild(toggleBtn);
        }
        // 等待一帧，让 CSS 生效后再显示按钮（避免未样式化的闪烁）
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toggleBtn.style.opacity = '';
                toggleBtn.style.visibility = '';
            });
        });
        
        // 创建全屏面板（内联隐藏，避免 CSS 未加载时闪烁）
        const panel = document.createElement('div');
        panel.id = 'storiesPanel';
        panel.className = 'stories-panel';
        panel.style.opacity = '0';
        panel.style.visibility = 'hidden';
        panel.innerHTML = `
            <div class="stories-panel-header">
                <div class="stories-focus-display" id="storiesFocusDisplay" title="点击修改焦点维度">
                </div>
                <div class="stories-header-actions">
                    <button class="stories-stats-btn" id="storiesStatsBtn" title="统计数据">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                    </button>
                    <button class="stories-review-btn" id="storiesReviewBtn" title="周回顾">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                    </button>
                    <button class="stories-close-btn" id="storiesClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="stories-list" id="storiesList">
                <!-- 故事卡片列表 -->
            </div>

            <div class="stories-bottom-bar">
                <div class="stories-bottom-nav">
                    <button class="stories-date-btn" id="storiesDatePrev" title="前一天">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                    </button>
                    <span class="stories-date-label" id="storiesDateLabel">今天</span>
                    <button class="stories-date-btn" id="storiesDateNext" title="后一天" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                    </button>
                    <span class="stories-status-sep"></span>
                    <button class="stories-status-btn" data-view="inProgress">进行中</button>
                    <button class="stories-status-btn" data-view="pending">待开始</button>
                </div>
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
    
    // 更新UI - 双列卡片网格布局
    updateUI() {
        // 非今天视图走全局渲染
        if (this.currentView !== 'today') {
            this.updateUIForGlobalView(this.currentView);
            return;
        }
        
        const listContainer = document.getElementById('storiesList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        // 收集所有有故事的维度
        const allGroups = [];

        this.values.forEach((valueDef) => {
            const valueStories = this.stories.filter(s => s.value === valueDef.name);
            if (valueStories.length > 0) {
                const completedCount = valueStories.filter(s => s.completed).length;
                const totalCount = valueStories.length;
                allGroups.push({
                    def: valueDef,
                    stories: valueStories,
                    completedCount,
                    totalCount,
                    isFocus: this.focusValues.includes(valueDef.name)
                });
            }
        });

        // 未分类
        const uncategorized = this.stories.filter(s => !s.value || !this.values.find(v => v.name === s.value));
        if (uncategorized.length > 0) {
            const completedCount = uncategorized.filter(s => s.completed).length;
            allGroups.push({
                def: { name: '未分类', color: '#95a5a6', emoji: '⭐', subtitle: '' },
                stories: uncategorized,
                completedCount,
                totalCount: uncategorized.length,
                isFocus: false
            });
        }

        // 如果没有任何故事
        if (allGroups.length === 0) {
            const isToday = this.isViewingToday();
            listContainer.innerHTML = `
                <div class="stories-empty-card" id="emptyAddStoryCard">
                    <div class="stories-empty-icon">${isToday ? '✨' : '📭'}</div>
                    <div class="stories-empty-title">${isToday ? '开始你的第一个故事' : '这天没有记录故事'}</div>
                    <div class="stories-empty-desc">${isToday ? '为生活方向盘的焦点维度添加目标' : '过去的这一天，没有留下故事'}</div>
                    ${isToday ? `<button class="stories-empty-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        添加新故事
                    </button>` : ''}
                </div>
            `;
            this.updateProgress();
            return;
        }

        // 排序：焦点维度在前，非焦点在后
        const focusGroups = allGroups.filter(g => g.isFocus);
        const nonFocusGroups = allGroups.filter(g => !g.isFocus);

        // 渲染焦点维度卡片
        focusGroups.forEach((group) => {
            const card = this.createDimensionCard(group);
            listContainer.appendChild(card);
        });

        // 非焦点维度：如果有的话合并为折叠卡片
        if (nonFocusGroups.length > 0) {
            const otherStories = nonFocusGroups.flatMap(g => g.stories);
            const otherCompleted = otherStories.filter(s => s.completed).length;
            const otherTotal = otherStories.length;
            
            const otherCard = this.createDimensionCard({
                def: { name: '其他', color: '#94a3b8', emoji: '📦', subtitle: `${nonFocusGroups.length}个维度` },
                stories: otherStories,
                completedCount: otherCompleted,
                totalCount: otherTotal,
                isFocus: false,
                isCollapsed: true,
                subGroups: nonFocusGroups
            });
            otherCard.classList.add('story-other-dimension-card');
            listContainer.appendChild(otherCard);
        }
        
        // 在所有卡片后添加"添加新故事"卡片（仅今天）
        if (this.isViewingToday()) {
            const addCard = document.createElement('div');
            addCard.className = 'story-dimension-card story-add-dimension-card';
            addCard.id = 'addNewStoryCard';
            addCard.innerHTML = `
                <div class="story-add-dimension-content">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span>添加新故事</span>
                </div>
            `;
            listContainer.appendChild(addCard);
        }

        this.updateProgress();
    }

    // 创建维度卡片（截图风格：标题头+任务列表+进度条）
    createDimensionCard(group) {
        const { def, stories, completedCount, totalCount } = group;
        const allCompleted = completedCount === totalCount && totalCount > 0;
        const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        const card = document.createElement('div');
        card.className = `story-dimension-card ${allCompleted ? 'all-completed' : ''}`;
        card.dataset.value = def.name;
        card.style.setProperty('--value-color', def.color);

        // 卡片头部
        const header = document.createElement('div');
        header.className = 'story-dimension-header';
        header.innerHTML = `
            <div class="story-dimension-title" style="--value-color: ${def.color}">
                <span class="story-dimension-emoji">${def.emoji}</span>
                <div class="story-dimension-name-wrap">
                    <span class="story-dimension-name">${def.name}</span>
                    ${def.subtitle ? `<span class="story-dimension-subtitle">· ${def.subtitle}</span>` : ''}
                </div>
            </div>

        `;
        card.appendChild(header);

        // 任务列表
        const taskList = document.createElement('div');
        taskList.className = 'story-dimension-tasks';

        stories.forEach((story) => {
            const originalIndex = story._globalIndex !== undefined ? story._globalIndex : this.stories.indexOf(story);
            const taskItem = this.createTaskItem(story, originalIndex, def);
            taskList.appendChild(taskItem);
        });
        card.appendChild(taskList);

        // 进度条区域
        const progressArea = document.createElement('div');
        progressArea.className = 'story-dimension-progress';
        progressArea.innerHTML = `
            <div class="story-dimension-progress-bar">
                <div class="story-dimension-progress-fill" style="width: ${percentage}%; background: ${def.color};"></div>
            </div>
            <span class="story-dimension-progress-text">${completedCount}/${totalCount} 项完成</span>
        `;
        card.appendChild(progressArea);

        return card;
    }
    
    // 创建任务项（截图风格：左侧标题+状态+时间，右侧圆形勾选框）
    createTaskItem(story, index, valueDef) {
        const item = document.createElement('div');
        item.className = `story-task-item ${story.completed ? 'completed' : ''}`;
        item.dataset.index = index;
        
        // 传递维度颜色
        const color = valueDef ? valueDef.color : '#95a5a6';
        item.style.setProperty('--value-color', color);

        // 状态标签：已开始且未完成=进行中，未到开始时间或无时间=待开始
        const hasStarted = this.hasStoryStarted(story);
        const statusLabel = story.completed
            ? `<span class="story-task-status completed">✓ 已完成</span>`
            : hasStarted
                ? `<span class="story-task-status in-progress">○ 进行中</span>`
                : `<span class="story-task-status pending">○ 待开始</span>`;

        // 时间显示
        let timeDisplay = '';
        if (story.startDate || story.startTime) {
            const parts = [];
            if (story.startDate) parts.push(story.startDate);
            if (story.startTime) parts.push(story.startTime);
            timeDisplay = parts.join(' ');
        }

        // 已完成的显示删除线
        const titleClass = story.completed ? 'story-task-title completed' : 'story-task-title';
        
        // 故事描述（只展示不截断，最多3行）
        const descHtml = story.story 
            ? `<div class="story-task-desc">${story.story}</div>` 
            : '';
        
        // 番茄钟按钮（今天视图和全局视图均可显示）
        const isGlobalOrToday = this.currentView === 'today' || this.currentView === 'inProgress' || this.currentView === 'pending';
        const pomodoroBtn = (isGlobalOrToday && !story.completed)
            ? `<button class="story-task-pomodoro" data-index="${index}" data-source-date="${story._globalDate || ''}" title="开始专注" style="--value-color: ${color}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                    </svg>
                </button>`
            : '';
        
        // 专注数据展示
        const focusInfo = (story.pomodoroCount > 0 || story.timeSpent > 0)
            ? `<span class="story-task-focus-info">
                    ${story.pomodoroCount > 0 ? `🍅 ${story.pomodoroCount}` : ''}
                    ${story.timeSpent > 0 ? ` ⏱ ${story.timeSpent}min` : ''}
               </span>`
            : '';

        item.innerHTML = `
            <div class="story-task-left">
                <div class="story-task-title-wrap">
                    <span class="${titleClass}">${story.title || '未命名故事'}</span>
                    <span class="story-task-tag" style="--value-color: ${color}">${story.value || '未分类'}</span>
                </div>
                ${descHtml}
                <div class="story-task-meta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                    </svg>
                    <span class="story-task-time">${timeDisplay || '未设置时间'}</span>
                    ${focusInfo}
                </div>
                <div class="story-task-status-wrap">
                    ${statusLabel}
                </div>
            </div>
            <div class="story-task-right">
                ${pomodoroBtn}
                <button class="story-task-checkbox ${story.completed ? 'checked' : ''}" data-index="${index}" title="${story.completed ? '标记未完成' : '标记完成'}" style="--value-color: ${color}">
                    ${story.completed ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
                </button>
            </div>
        `;

        return item;
    }
    
    // 判断故事是否已到开始时间
    hasStoryStarted(story) {
        if (!story.startDate && !story.startTime) return false;
        const now = new Date();
        if (story.startDate) {
            const [y, m, d] = story.startDate.split('-').map(Number);
            if (story.startTime) {
                const [h, min] = story.startTime.split(':').map(Number);
                const startAt = new Date(y, m - 1, d, h, min);
                return now >= startAt;
            }
            const startAt = new Date(y, m - 1, d, 0, 0);
            return now >= startAt;
        }
        // 只有 startTime，用今天的日期
        if (story.startTime) {
            const [h, min] = story.startTime.split(':').map(Number);
            const startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
            return now >= startAt;
        }
        return false;
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
        
        const completedEl = document.getElementById('storiesCompletedCount');
        const totalEl = document.getElementById('storiesTotalCount');
        
        if (completedEl) completedEl.textContent = completedCount;
        if (totalEl) totalEl.textContent = total;
    }
    
    // 更新徽章 - 显示进行中的故事数（已到开始时间且未完成）
    // 徽章始终显示今天的数据，不受查看日期影响
    updateBadge() {
        // 读取今天的故事数据计算徽章
        let todayStories = this.stories;
        if (!this.isViewingToday()) {
            try {
                const allData = localStorage.getItem(this.storageKey);
                if (allData) {
                    const data = JSON.parse(allData);
                    todayStories = data[this.currentDate] || [];
                }
            } catch (e) {
                todayStories = [];
            }
        }
        
        const inProgressCount = todayStories.filter(s => !s.completed && this.hasStoryStarted(s)).length;
        const uncompletedCount = todayStories.filter(s => !s.completed).length;
        const totalCount = todayStories.length;
        const badge = document.getElementById('storiesBadge');
        
        if (badge) {
            badge.className = 'stories-badge';
            
            if (totalCount === 0) {
                badge.textContent = '0';
            } else if (uncompletedCount === 0) {
                badge.textContent = '👍';
                badge.classList.add('completed');
            } else {
                badge.textContent = inProgressCount;
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
        
        // 空状态添加故事卡片
        document.getElementById('storiesList')?.addEventListener('click', (e) => {
            // 过往日期不可添加
            if (!this.isViewingToday()) return;
            
            const emptyCard = e.target.closest('#emptyAddStoryCard, .stories-empty-card, .stories-empty-btn, #addNewStoryCard');
            if (emptyCard) {
                this.showAddStoryModal();
            }
        });
        
        // 事件委托：故事列表交互（新版卡片）
        document.getElementById('storiesList')?.addEventListener('click', (e) => {
            const isGlobalView = this.currentView !== 'today';
            const isToday = this.isViewingToday() && !isGlobalView;
            const checkbox = e.target.closest('.story-task-checkbox');
            const pomodoroBtn = e.target.closest('.story-task-pomodoro');
            const editBtn = e.target.closest('.story-dimension-edit');
            const taskItem = e.target.closest('.story-task-item');
            
            if (pomodoroBtn) {
                if (isGlobalView) {
                    const sourceDate = pomodoroBtn.dataset.sourceDate;
                    const index = parseInt(pomodoroBtn.dataset.index);
                    if (sourceDate && !isNaN(index) && index >= 0) {
                        this.linkToPomodoroGlobal(sourceDate, index);
                    }
                } else {
                    const index = parseInt(pomodoroBtn.dataset.index);
                    this.linkToPomodoro(index);
                }
            } else if (checkbox) {
                if (isGlobalView) {
                    // 全局视图：可以标记完成
                    const sourceDate = checkbox.dataset.sourceDate || checkbox.closest('.story-dimension-card')?.dataset.sourceDate;
                    const index = parseInt(checkbox.dataset.index);
                    if (sourceDate) {
                        this.toggleStoryCompletionGlobal(sourceDate, index);
                    }
                } else if (!isToday) {
                    return; // 过往日期不可切换完成
                } else {
                    const index = parseInt(checkbox.dataset.index);
                    this.toggleStoryCompletion(index);
                }
            } else if (editBtn) {
                if (!isToday && !isGlobalView) return; // 过往日期不可编辑
                const value = editBtn.closest('.story-dimension-card')?.dataset.value;
                if (value) {
                    this.showAddStoryModal(null, value);
                }
            } else if (taskItem && !e.target.closest('.story-task-checkbox')) {
                if (isGlobalView) {
                    // 全局视图：点击打开编辑弹窗
                    const sourceDate = taskItem.dataset.sourceDate || taskItem.closest('.story-dimension-card')?.dataset.sourceDate;
                    const index = parseInt(taskItem.dataset.index);
                    if (sourceDate && !isNaN(index) && index >= 0) {
                        this.showEditStoryGlobal(sourceDate, index);
                    }
                } else {
                    const index = parseInt(taskItem.dataset.index);
                    if (!isNaN(index)) {
                        this.showAddStoryModal(isToday ? index : index);
                    }
                }
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
        
        // 删除按钮
        document.getElementById('storyModalDelete')?.addEventListener('click', () => {
            if (this._editingIndex !== null) {
                this.deleteStory(this._editingIndex);
                this.closeAddStoryModal();
            }
        });
        
        // 模态框中的维度选择
        document.getElementById('storyModalValues')?.addEventListener('click', (e) => {
            const tag = e.target.closest('.value-tag');
            if (tag) {
                document.querySelectorAll('#storyModalValues .value-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
            }
        });
        
        // 日期导航
        document.getElementById('storiesDatePrev')?.addEventListener('click', () => {
            this.navigatePrev();
        });
        
        document.getElementById('storiesDateNext')?.addEventListener('click', () => {
            this.navigateNext();
        });
        
        document.getElementById('storiesDateToday')?.addEventListener('click', () => {
            this.navigateToday();
        });

        // 日期标签点击：切换到当前显示日期的故事
        document.getElementById('storiesDateLabel')?.addEventListener('click', () => {
            this.navigateToDate(this.viewingDate);
        });
        
        // 统计按钮
        document.getElementById('storiesStatsBtn')?.addEventListener('click', () => {
            this.showStats();
        });
        
        // 统计面板关闭
        document.getElementById('statsClose')?.addEventListener('click', () => {
            this.closeStats();
        });
        
        // 周回顾按钮
        document.getElementById('storiesReviewBtn')?.addEventListener('click', () => {
            this.showWeeklyReview();
        });
        
        // 焦点维度显示区域点击
        document.getElementById('storiesFocusDisplay')?.addEventListener('click', () => {
            this.showFocusEditor();
        });
        
        // 视图状态筛选按钮（在 bottom-nav 内）
        const bottomNav = document.querySelector('.stories-bottom-nav');
        bottomNav?.addEventListener('click', (e) => {
            const btn = e.target.closest('.stories-status-btn');
            if (btn) {
                this.switchView(btn.dataset.view);
            }
        });
    }
    
    // 切换视图模式（today / inProgress / pending）
    switchView(view) {
        if (this.currentView === view) return;
        this.currentView = view;
        
        // 更新tab激活状态
        document.querySelectorAll('.stories-status-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
        
        const isTodayView = view === 'today';
        const bottomNav = document.querySelector('.stories-bottom-nav');
        const focusDisplay = document.getElementById('storiesFocusDisplay');
        
        // 非今天视图隐藏焦点维度，底部导航按钮保持可见
        if (bottomNav) {
            bottomNav.classList.toggle('in-global-view', !isTodayView);
        }
        if (focusDisplay) focusDisplay.style.display = isTodayView ? '' : 'none';
        
        // 更新头部计数显示
        if (isTodayView) {
            this.stories = this.loadStoriesForDate(this.viewingDate);
        }
        
        this.updateUI();
    }
    
    // 获取全局进行中/待开始的故事
    getAllStoriesGlobal(filter) {
        const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const today = this.getTodayString();
        const results = [];
        
        Object.keys(allData).sort().reverse().forEach(dateStr => {
            const stories = allData[dateStr] || [];
            stories.forEach((story, idx) => {
                if (story.completed) return; // 已完成的不管
                const started = this.hasStoryStarted(story);
                
                if (filter === 'inProgress' && started) {
                    results.push({ story, dateStr, index: idx });
                } else if (filter === 'pending' && !started) {
                    results.push({ story, dateStr, index: idx });
                }
            });
        });
        
        return results;
    }
    
    // 渲染全局视图（进行中/待开始）
    updateUIForGlobalView(filter) {
        const listContainer = document.getElementById('storiesList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        const allItems = this.getAllStoriesGlobal(filter);
        
        if (allItems.length === 0) {
            const emptyIcon = filter === 'inProgress' ? '🎉' : '📋';
            const emptyTitle = filter === 'inProgress' ? '没有进行中的故事' : '没有待开始的故事';
            const emptyDesc = filter === 'inProgress' 
                ? '所有故事都已完成，干得漂亮！' 
                : '还没有设定未来的故事目标';
            listContainer.innerHTML = `
                <div class="stories-empty-card">
                    <div class="stories-empty-icon">${emptyIcon}</div>
                    <div class="stories-empty-title">${emptyTitle}</div>
                    <div class="stories-empty-desc">${emptyDesc}</div>
                </div>
            `;
            return;
        }
        
        // 按日期分组
        const groups = {};
        const storyMeta = {}; // story id → { dateStr, index }
        allItems.forEach(({ story, dateStr, index }) => {
            if (!groups[dateStr]) groups[dateStr] = [];
            story._globalIndex = index;
            story._globalDate = dateStr;
            groups[dateStr].push(story);
        });
        
        const today = this.getTodayString();
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        
        // 按日期倒序渲染
        Object.keys(groups).sort().reverse().forEach(dateStr => {
            const groupEl = document.createElement('div');
            groupEl.className = 'stories-global-date-group';
            
            // 日期标题
            let dateLabel;
            if (dateStr === today) dateLabel = '今天';
            else if (dateStr === yesterday) dateLabel = '昨天';
            else {
                const d = new Date(dateStr);
                const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                dateLabel = `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
            }
            
            const headerEl = document.createElement('div');
            headerEl.className = 'stories-global-date-header';
            headerEl.innerHTML = `
                <span class="stories-global-date-label">${dateLabel}</span>
                <span class="stories-global-date-count">${groups[dateStr].length}个故事</span>
            `;
            groupEl.appendChild(headerEl);
            
            // 按维度分组渲染卡片
            const dateStories = groups[dateStr];
            const valueGroups = {};
            
            dateStories.forEach(story => {
                const vName = story.value || '未分类';
                if (!valueGroups[vName]) valueGroups[vName] = [];
                valueGroups[vName].push(story);
            });
            
            Object.keys(valueGroups).forEach(vName => {
                const vDef = this.values.find(v => v.name === vName) || 
                    { name: '未分类', color: '#95a5a6', emoji: '⭐', subtitle: '' };
                const vStories = valueGroups[vName];
                const completedCount = vStories.filter(s => s.completed).length;
                
                const card = this.createDimensionCard({
                    def: vDef,
                    stories: vStories,
                    completedCount,
                    totalCount: vStories.length,
                    isFocus: this.focusValues.includes(vDef.name)
                });
                
                // 标记来源日期（用于操作时定位）
                card.dataset.sourceDate = dateStr;
                card.querySelectorAll('.story-task-item').forEach(item => {
                    item.dataset.sourceDate = dateStr;
                });
                card.querySelectorAll('.story-task-checkbox').forEach(cb => {
                    cb.dataset.sourceDate = dateStr;
                });
                
                // 进行中视图：添加番茄钟按钮
                if (filter === 'inProgress') {
                    card.querySelectorAll('.story-task-item').forEach(item => {
                        const idx = parseInt(item.dataset.index);
                        const story = vStories[card.querySelectorAll('.story-task-item').length > 1 ? 
                            Array.from(card.querySelectorAll('.story-task-item')).indexOf(item) : 0];
                    });
                }
                
                groupEl.appendChild(card);
            });
            
            listContainer.appendChild(groupEl);
        });
        
        // 更新头部计数
        this.updateGlobalProgress(allItems.length, 0, filter);
    }
    
    // 更新全局视图的头部进度
    updateGlobalProgress(total, completed, filter) {
        const completedEl = document.getElementById('storiesCompletedCount');
        const totalEl = document.getElementById('storiesTotalCount');
        const statusEl = document.querySelector('.stories-title-status');
        
        if (completedEl) completedEl.textContent = completed;
        if (totalEl) totalEl.textContent = total;
        if (statusEl) {
            const viewLabel = filter === 'inProgress' ? '进行中' : '待开始';
            statusEl.innerHTML = `${viewLabel} <span class="stories-count-circle" id="storiesTotalCount">${total}</span> 个故事`;
        }
    }
    
    
    // 全局视图：标记完成
    toggleStoryCompletionGlobal(dateStr, index) {
        const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const stories = allData[dateStr];
        if (!stories || !stories[index]) return;
        
        stories[index].completed = !stories[index].completed;
        if (stories[index].completed) {
            stories[index].completedAt = new Date().toISOString();
        } else {
            stories[index].completedAt = null;
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(allData));
        
        // 同步到云端
        if (window.syncAdapter && window.cloudSync.isLoggedIn) {
            const storiesForCloud = stories.map((s, idx) => ({
                story_index: idx + 1,
                title: s.title || '',
                content: JSON.stringify(s),
                value_dim: s.value || '',
                completed: s.completed ? 1 : 0,
                _localUpdatedAt: new Date().toISOString()
            }));
            window.syncAdapter.saveStories(dateStr, storiesForCloud).catch(() => {});
        }
        
        // 重新渲染当前视图
        this.updateUIForGlobalView(this.currentView);
        this.updateBadge();
    }
    
    // 全局视图：番茄钟
    linkToPomodoroGlobal(dateStr, index) {
        const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const stories = allData[dateStr];
        if (!stories || !stories[index]) return;
        
        const story = stories[index];
        if (!story.title) {
            alert('请先填写故事标题');
            return;
        }
        
        const pomodoroTimer = this.pomodoroTimer || window.pomodoroTimerInstance || window.app?.pomodoroTimer;
        if (!pomodoroTimer) {
            console.error('❌ 番茄钟系统不可用');
            alert('番茄钟功能暂不可用，请刷新页面重试');
            return;
        }
        
        if (pomodoroTimer.isRunning) {
            alert('番茄钟正在运行中');
            return;
        }
        
        // 记录关联故事（跨日期）
        pomodoroTimer._currentStoryDate = dateStr;
        pomodoroTimer._currentStoryIndex = index;
        this.currentLinkedStoryIndex = index;
        
        // 关闭故事面板
        this.closePanel();
        
        // 直接开始25分钟番茄钟
        pomodoroTimer.setMode('work');
        pomodoroTimer.timeRemaining = 25 * 60;
        pomodoroTimer.updateDisplay();
        pomodoroTimer.start();
        
        // 显示开始提示
        this.showStartNotification(story.title);
    }
    
    // 全局视图：编辑故事
    showEditStoryGlobal(dateStr, index) {
        const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const stories = allData[dateStr];
        if (!stories || !stories[index]) return;
        
        const story = stories[index];
        this._editSourceDate = dateStr;
        this._editingIndex = index;
        
        // 临时替换 this.stories 以复用 showAddStoryModal
        const savedStories = this.stories;
        this.stories = stories;
        this.showAddStoryModal(index);
        // 恢复
        this.stories = savedStories;
    }
    
    // 全局视图：查看故事详情（只读弹窗）
    showStoryDetailGlobal(dateStr, index) {
        const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const stories = allData[dateStr];
        if (!stories || !stories[index]) return;
        
        const story = stories[index];
        const vDef = this.values.find(v => v.name === story.value) || 
            { name: '未分类', color: '#95a5a6', emoji: '⭐' };
        
        const overlay = document.getElementById('storyModalOverlay');
        if (!overlay) return;
        
        overlay.classList.add('active');
        
        const titleInput = document.getElementById('storyModalTitle');
        const storyInput = document.getElementById('storyModalStory');
        const deleteBtn = document.getElementById('storyModalDelete');
        const saveBtn = document.getElementById('storyModalSave');
        
        if (titleInput) titleInput.value = story.title || '';
        if (storyInput) storyInput.value = story.story || '';
        
        // 只读模式
        if (titleInput) titleInput.readOnly = true;
        if (storyInput) storyInput.readOnly = true;
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
        
        // 设置维度
        document.querySelectorAll('#storyModalValues .value-tag').forEach(tag => {
            tag.classList.toggle('active', tag.dataset.value === story.value);
        });
        
        // 添加来源日期信息
        const existingInfo = document.getElementById('storyModalDateInfo');
        if (existingInfo) existingInfo.remove();
        
        const dateInfo = document.createElement('div');
        dateInfo.id = 'storyModalDateInfo';
        dateInfo.style.cssText = 'text-align:center;font-size:12px;color:#999;margin-top:8px;';
        const today = this.getTodayString();
        let dateLabel = dateStr === today ? '今天' : this.formatDate(dateStr);
        dateInfo.textContent = `📅 来源：${dateLabel}`;
        
        const storyInputEl = document.getElementById('storyModalStory');
        if (storyInputEl && storyInputEl.parentElement) {
            storyInputEl.parentElement.appendChild(dateInfo);
        }
    }
    
    // 切换面板显示
    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('storiesPanel');
        
        if (this.isOpen) {
            // 每次打开都回到今天视图
            this.currentView = 'today';
            this.viewingDate = this.currentDate;
            this.stories = this.loadStoriesForDate(this.currentDate);
            this.applyPanelBackground();
            
            // 清除内联隐藏样式（CSS 类接管控制）
            panel.style.opacity = '';
            panel.style.visibility = '';
            panel.classList.add('active');
            this.updateUI();
            this.updateDateNav();
            this.updateFocusDisplay();
            
            // 重置视图tab激活状态
            document.querySelectorAll('.stories-status-btn').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.view === 'today');
            });
            // 恢复日期导航和焦点显示
            const bottomNav = document.querySelector('.stories-bottom-nav');
            const focusDisplay = document.getElementById('storiesFocusDisplay');
            if (bottomNav) bottomNav.style.display = '';
            if (focusDisplay) focusDisplay.style.display = '';

            // 首次打开且未设置焦点维度，弹出引导
            if (!this.hasFocusValues()) {
                setTimeout(() => this.showFocusGuide(), 400);
            }
        } else {
            panel.classList.remove('active');
            document.body.classList.remove('stories-dark');
        }
    }
    
    // 根据当前页面背景智能调整面板背景色
    applyPanelBackground() {
        const panel = document.getElementById('storiesPanel');
        if (!panel) return;
        
        // 始终使用 Apple 浅色主题面板样式
        panel.style.setProperty('--stories-panel-bg', 'linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%)');
        panel.style.setProperty('--stories-panel-text', '#1d1d1f');
        panel.classList.remove('dark-bg');
        document.body.classList.remove('stories-dark');
    }
    
    // 解析 CSS 颜色字符串为 RGB
    parseColor(colorString) {
        const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
        }
        const hexMatch = colorString.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
        if (hexMatch) {
            return { r: parseInt(hexMatch[1], 16), g: parseInt(hexMatch[2], 16), b: parseInt(hexMatch[3], 16) };
        }
        return null;
    }
    
    // 调整 RGB 亮度
    adjustRgb(rgb, amount) {
        return {
            r: Math.max(0, Math.min(255, rgb.r + amount)),
            g: Math.max(0, Math.min(255, rgb.g + amount)),
            b: Math.max(0, Math.min(255, rgb.b + amount))
        };
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
                    <div class="story-modal-footer-left">
                        <button class="story-modal-delete" id="storyModalDelete" style="display:none;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            删除
                        </button>
                    </div>
                    <div class="story-modal-footer-right">
                        <button class="story-modal-cancel" id="storyModalCancel">取消</button>
                        <button class="story-modal-save" id="storyModalSave">保存</button>
                    </div>
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
    showAddStoryModal(editIndex = null, defaultValue = null) {
        const overlay = document.getElementById('storyModalOverlay');
        const title = document.getElementById('storyModalTitle');
        const nameInput = document.getElementById('storyModalName');
        const descInput = document.getElementById('storyModalDesc');
        const startDateInput = document.getElementById('storyModalStartDate');
        const startTimeInput = document.getElementById('storyModalStartTime');
        const isToday = this.isViewingToday();
        const isGlobalEdit = !!this._editSourceDate;
        
        // 重置表单
        nameInput.value = '';
        descInput.value = '';
        startDateInput.value = '';
        startTimeInput.value = '';
        document.querySelectorAll('#storyModalValues .value-tag').forEach(t => t.classList.remove('active'));
        
        // 重置只读状态
        nameInput.removeAttribute('readonly');
        descInput.removeAttribute('readonly');
        startDateInput.removeAttribute('disabled');
        startTimeInput.removeAttribute('disabled');
        overlay.classList.remove('readonly-mode');
        
        if (editIndex !== null && editIndex >= 0 && editIndex < this.stories.length) {
            // 编辑模式 / 只读查看模式
            this._editingIndex = editIndex;
            const story = this.stories[editIndex];
            
            if (!isToday && !isGlobalEdit) {
                // 过往日期（非全局编辑）：只读模式
                title.textContent = '查看故事';
                nameInput.setAttribute('readonly', true);
                descInput.setAttribute('readonly', true);
                startDateInput.setAttribute('disabled', true);
                startTimeInput.setAttribute('disabled', true);
                overlay.classList.add('readonly-mode');
                // 隐藏删除和保存按钮
                const deleteBtn = document.getElementById('storyModalDelete');
                if (deleteBtn) deleteBtn.style.display = 'none';
                const saveBtn = document.getElementById('storyModalSave');
                if (saveBtn) saveBtn.style.display = 'none';
            } else {
                title.textContent = '编辑故事';
                // 显示删除按钮
                const deleteBtn = document.getElementById('storyModalDelete');
                if (deleteBtn) deleteBtn.style.display = 'flex';
                const saveBtn = document.getElementById('storyModalSave');
                if (saveBtn) saveBtn.style.display = 'flex';
            }
            
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
            
            // 隐藏删除按钮
            const deleteBtn = document.getElementById('storyModalDelete');
            if (deleteBtn) deleteBtn.style.display = 'none';
            const saveBtn = document.getElementById('storyModalSave');
            if (saveBtn) saveBtn.style.display = 'flex';
            
            // 如果有默认维度，自动选中
            if (defaultValue) {
                const tag = document.querySelector(`#storyModalValues .value-tag[data-value="${defaultValue}"]`);
                if (tag) tag.classList.add('active');
            }
        }
        
        overlay.classList.add('active');
        if (isToday || isGlobalEdit || editIndex === null) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }
    
    // 关闭模态框
    closeAddStoryModal() {
        const overlay = document.getElementById('storyModalOverlay');
        overlay.classList.remove('active');
        this._editingIndex = null;
        this._editSourceDate = null;
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
        
        // 跨日期编辑（全局视图）：保存到原始日期
        if (this._editSourceDate) {
            const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            allData[this._editSourceDate] = this.stories;
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            
            // 恢复到当前日期的 stories
            this.stories = this.loadStoriesForDate(this.viewingDate);
            
            // 刷新全局视图
            this.updateUIForGlobalView(this.currentView);
            this.updateBadge();
        } else {
            this.saveTodayStories();
            this.updateUI();
            this.updateBadge();
        }
        
        // 同步到云端
        const saveDate = this._editSourceDate || this.currentDate;
        if (window.syncAdapter && window.cloudSync.isLoggedIn) {
            const storiesForCloud = this.stories.map((s, idx) => ({
                story_index: idx + 1,
                title: s.title || '',
                content: JSON.stringify(s),
                value_dim: s.value || '',
                completed: s.completed ? 1 : 0,
                _localUpdatedAt: new Date().toISOString()
            }));
            window.syncAdapter.saveStories(saveDate, storiesForCloud).catch(() => {});
        }
        
        this.closeAddStoryModal();
    }
    
    // 删除故事
    deleteStory(index) {
        this.stories.splice(index, 1);
        
        if (this._editSourceDate) {
            // 全局视图：保存到原始日期
            const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            allData[this._editSourceDate] = this.stories;
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            // 立即同步删除后的数据到云端（用当前 stories 数组）
            this._pushStoriesToCloud(this.stories, this._editSourceDate);
            this.stories = this.loadStoriesForDate(this.viewingDate);
        } else {
            this.saveTodayStories();
            // 删除需要立即同步到云端，避免刷新后旧数据回写
            this._syncToCloud(true);
        }
        
        this.updateUI();
        this.updateBadge();
    }

    // 直接将一组故事推送到云端指定日期
    async _pushStoriesToCloud(stories, date) {
        if (!window.syncAdapter || !window.cloudSync.isLoggedIn) return;
        const storiesForCloud = stories.map((s, idx) => ({
            story_index: idx + 1,
            title: s.title || '',
            content: JSON.stringify(s),
            value_dim: s.value || '',
            completed: s.completed ? 1 : 0,
            _localUpdatedAt: new Date().toISOString()
        }));
        await window.syncAdapter.saveStories(date, storiesForCloud);
    }
    
    // 切换故事完成状态
    toggleStoryCompletion(index) {
        const story = this.stories[index];
        const newCompleted = !story.completed;
        
        story.completed = newCompleted;
        story.completedAt = newCompleted ? Date.now() : null;
        
        this.saveTodayStories();
        this.updateUI();
        this.updateBadge();
        
        // 播放完成动画
        if (newCompleted) {
            this.playCompletionAnimation(index);
            
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
        const pomodoroTimer = this.pomodoroTimer || window.pomodoroTimerInstance || window.app?.pomodoroTimer;
        
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
        const item = document.querySelector(`.story-task-item[data-index="${index}"]`);
        if (item) {
            item.classList.add('completion-flash');
            setTimeout(() => {
                item.classList.remove('completion-flash');
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
                const total = dayStories.length;
                totalStories += completed;
                
                if (total > 0 && completed === total) {
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
    
    // ========================
    //  周回顾
    // ========================
    
    // 获取本周的日期范围（周一到周日）
    getWeekRange(offsetWeek = 0) {
        const now = new Date();
        const day = now.getDay(); // 0=Sun
        const mondayOffset = day === 0 ? -6 : 1 - day; // 到本周一的偏移
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset + offsetWeek * 7);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return { monday, sunday };
    }
    
    // 获取指定周的数据
    getWeekData(offsetWeek = 0) {
        const { monday, sunday } = this.getWeekRange(offsetWeek);
        const allData = localStorage.getItem(this.storageKey);
        const data = allData ? JSON.parse(allData) : {};
        
        const days = [];
        const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = this.dateToString(d);
            const dayStories = data[dateStr] || [];
            
            days.push({
                date: d,
                dateStr,
                weekday: weekdays[i],
                shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
                stories: dayStories,
                completed: dayStories.filter(s => s.completed).length,
                total: dayStories.length,
                totalFocusMin: dayStories.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
            });
        }
        
        // 聚合
        const allStories = days.flatMap(d => d.stories);
        const completedStories = allStories.filter(s => s.completed);
        const totalStories = allStories.length;
        const totalCompleted = completedStories.length;
        const completionRate = totalStories > 0 ? Math.round(totalCompleted / totalStories * 100) : 0;
        const activeDays = days.filter(d => d.total > 0).length;
        const perfectDays = days.filter(d => d.total > 0 && d.completed === d.total).length;
        const totalFocusMin = days.reduce((sum, d) => sum + d.totalFocusMin, 0);
        
        // 维度分布
        const valueCounts = {};
        completedStories.forEach(s => {
            if (s.value) valueCounts[s.value] = (valueCounts[s.value] || 0) + 1;
        });
        const valueDistribution = this.values.map(v => ({
            ...v,
            count: valueCounts[v.name] || 0,
            percentage: totalCompleted > 0 ? Math.round((valueCounts[v.name] || 0) / totalCompleted * 100) : 0
        }));
        
        // 亮点故事（已完成的，取标题非空的）
        const highlights = completedStories.filter(s => s.title).slice(0, 5);
        
        // 被忽视的维度（0个完成故事）
        const neglectedValues = this.values.filter(v => !valueCounts[v.name]);
        
        // 周标签
        const mondayStr = `${monday.getMonth() + 1}月${monday.getDate()}日`;
        const sundayStr = `${sunday.getMonth() + 1}月${sunday.getDate()}日`;
        
        return {
            offsetWeek,
            weekLabel: `${mondayStr} — ${sundayStr}`,
            isCurrentWeek: offsetWeek === 0,
            days,
            totalStories,
            totalCompleted,
            completionRate,
            activeDays,
            perfectDays,
            totalFocusMin,
            valueDistribution,
            highlights,
            neglectedValues
        };
    }
    
    // 显示周回顾
    showWeeklyReview() {
        let reviewPanel = document.getElementById('storiesWeeklyReview');
        if (!reviewPanel) {
            reviewPanel = document.createElement('div');
            reviewPanel.id = 'storiesWeeklyReview';
            reviewPanel.className = 'stories-review-panel';
            document.body.appendChild(reviewPanel);
        }
        
        this._reviewOffsetWeek = this._reviewOffsetWeek || 0;
        this.renderWeeklyReview();
        reviewPanel.classList.add('active');
    }
    
    // 渲染周回顾内容
    renderWeeklyReview() {
        const panel = document.getElementById('storiesWeeklyReview');
        if (!panel) return;
        
        const week = this.getWeekData(this._reviewOffsetWeek || 0);
        const isCurrent = week.isCurrentWeek;
        
        // 1. 每日完成趋势
        const maxTotal = Math.max(...week.days.map(d => d.total), 1);
        const trendHtml = week.days.map(d => {
            const completedH = d.total > 0 ? Math.max((d.completed / maxTotal) * 100, 4) : 0;
            const totalH = d.total > 0 ? Math.max((d.total / maxTotal) * 100, 4) : 0;
            const isToday = d.dateStr === this.currentDate;
            return `
                <div class="review-trend-day ${d.total > 0 ? 'has-data' : ''} ${isToday ? 'is-today' : ''} ${d.completed === d.total && d.total > 0 ? 'perfect' : ''}">
                    <div class="review-trend-label">${d.weekday}</div>
                    <div class="review-trend-bars">
                        <div class="review-trend-bar-bg">
                            <div class="review-trend-bar bar-total" style="height:${totalH}%"></div>
                            <div class="review-trend-bar bar-completed" style="height:${completedH}%"></div>
                        </div>
                    </div>
                    <div class="review-trend-count">${d.completed}/${d.total}</div>
                    <div class="review-trend-date">${d.shortDate}</div>
                </div>
            `;
        }).join('');
        
        // 2. 维度平衡（只展示焦点维度，其余合并为"其他"）
        const focusDist = this.hasFocusValues()
            ? week.valueDistribution.filter(v => this.focusValues.includes(v.name))
            : week.valueDistribution;
        const otherDist = this.hasFocusValues()
            ? week.valueDistribution.filter(v => !this.focusValues.includes(v.name))
            : [];
        const otherCount = otherDist.reduce((sum, v) => sum + v.count, 0);
        
        const allDistBars = [...focusDist];
        if (otherCount > 0) {
            allDistBars.push({ name: '其他', emoji: '📦', color: '#94a3b8', count: otherCount, percentage: 0 });
        }
        const maxVal = Math.max(...allDistBars.map(v => v.count), 1);
        const radarHtml = allDistBars.map(v => `
            <div class="review-dimension-row ${this.focusValues.includes(v.name) ? 'is-focus' : ''}" style="--dim-color: ${v.color}">
                <div class="review-dim-label">${v.emoji} ${v.name}</div>
                <div class="review-dim-bar-wrap">
                    <div class="review-dim-bar" style="width: ${v.count > 0 ? Math.max(v.count / maxVal * 100, 6) : 0}%"></div>
                </div>
                <div class="review-dim-count">${v.count}</div>
            </div>
        `).join('');
        
        // 3. 亮点与成就
        const highlightsHtml = week.highlights.length > 0
            ? week.highlights.map(s => {
                const vDef = this.values.find(v => v.name === s.value) || { emoji: '⭐', color: '#95a5a6' };
                return `
                    <div class="review-highlight-item">
                        <span class="review-highlight-emoji">${vDef.emoji}</span>
                        <span class="review-highlight-title">${s.title}</span>
                        ${s.timeSpent ? `<span class="review-highlight-time">⏱ ${s.timeSpent}min</span>` : ''}
                    </div>
                `;
            }).join('')
            : '<div class="review-empty">本周暂无完成的故事</div>';
        
        // 4. 改进建议（基于焦点维度）
        const suggestions = [];
        if (this.hasFocusValues()) {
            // 焦点维度中本周没有投入的
            const neglectedFocus = week.neglectedValues.filter(v => this.focusValues.includes(v.name));
            if (neglectedFocus.length > 0) {
                const names = neglectedFocus.map(v => `${v.emoji}${v.name}`).join('、');
                suggestions.push(`⚠️ 你的焦点维度 ${names} 本周没有投入，下周要重点关注！`);
            }
            // 焦点维度有投入的给予肯定
            const activeFocus = this.focusValues.filter(name => !week.neglectedValues.find(v => v.name === name));
            if (activeFocus.length > 0) {
                const names = activeFocus.map(name => {
                    const def = this.values.find(v => v.name === name);
                    return def ? `${def.emoji}${def.name}` : name;
                }).join('、');
                suggestions.push(`✅ 焦点维度 ${names} 本周有投入，继续保持`);
            }
        } else {
            if (week.neglectedValues.length > 0) {
                const names = week.neglectedValues.slice(0, 3).map(v => `${v.emoji}${v.name}`).join('、');
                suggestions.push(`⚖️ ${names} 本周没有投入，试试设定焦点维度`);
            }
        }
        if (week.completionRate < 50 && week.totalStories > 0) {
            suggestions.push('📉 完成率不足50%，试试减少目标数量，专注完成最重要的事');
        }
        if (week.activeDays < 3) {
            suggestions.push('📝 本周记录天数较少，养成每天设定故事的习惯很重要');
        }
        if (week.completionRate >= 80 && week.totalStories > 0) {
            suggestions.push('🌟 完成率超过80%，保持这个节奏！');
        }
        if (week.perfectDays >= 3) {
            suggestions.push('🔥 多天全部完成，非常棒！');
        }
        if (suggestions.length === 0 && week.totalStories === 0) {
            suggestions.push('💡 本周还没有故事，从今天开始记录吧');
        }
        const suggestHtml = suggestions.map(s => `<div class="review-suggestion">${s}</div>`).join('');
        
        // 汇总卡片
        const summaryHtml = `
            <div class="review-summary-grid">
                <div class="review-summary-card">
                    <div class="review-summary-value">${week.totalCompleted}<span class="review-summary-unit">/${week.totalStories}</span></div>
                    <div class="review-summary-label">完成故事</div>
                </div>
                <div class="review-summary-card">
                    <div class="review-summary-value">${week.completionRate}<span class="review-summary-unit">%</span></div>
                    <div class="review-summary-label">完成率</div>
                </div>
                <div class="review-summary-card">
                    <div class="review-summary-value">${week.activeDays}<span class="review-summary-unit">天</span></div>
                    <div class="review-summary-label">记录天数</div>
                </div>
                <div class="review-summary-card">
                    <div class="review-summary-value">${week.perfectDays}<span class="review-summary-unit">天</span></div>
                    <div class="review-summary-label">完美日</div>
                </div>
            </div>
        `;
        
        panel.innerHTML = `
            <div class="review-panel-header">
                <div class="review-header-left">
                    <h2>📅 周回顾</h2>
                    <div class="review-week-nav">
                        <button class="review-week-btn" id="reviewWeekPrev" title="上一周">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                        </button>
                        <span class="review-week-label">${week.weekLabel}</span>
                        <button class="review-week-btn" id="reviewWeekNext" title="下一周" ${isCurrent ? 'disabled' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                        </button>
                    </div>
                </div>
                <button class="review-close-btn" id="reviewClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            <div class="review-content">
                ${summaryHtml}
                
                <div class="review-section">
                    <h3>📊 每日完成趋势</h3>
                    <div class="review-trend-chart">${trendHtml}</div>
                </div>
                
                <div class="review-section">
                    <h3>🎯 维度平衡</h3>
                    <div class="review-dimension-chart">${radarHtml}</div>
                </div>
                
                <div class="review-section">
                    <h3>✨ 亮点故事</h3>
                    <div class="review-highlights">${highlightsHtml}</div>
                </div>
                
                <div class="review-section">
                    <h3>💡 改进建议</h3>
                    <div class="review-suggestions">${suggestHtml}</div>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.getElementById('reviewClose')?.addEventListener('click', () => {
            this.closeWeeklyReview();
        });
        
        document.getElementById('reviewWeekPrev')?.addEventListener('click', () => {
            this._reviewOffsetWeek = (this._reviewOffsetWeek || 0) - 1;
            this.renderWeeklyReview();
        });
        
        document.getElementById('reviewWeekNext')?.addEventListener('click', () => {
            if (!isCurrent) {
                this._reviewOffsetWeek = (this._reviewOffsetWeek || 0) + 1;
                this.renderWeeklyReview();
            }
        });
    }
    
    // 关闭周回顾
    closeWeeklyReview() {
        document.getElementById('storiesWeeklyReview')?.classList.remove('active');
        this._reviewOffsetWeek = 0;
    }
    
    // ========================
    //  焦点维度
    // ========================
    
    // 更新焦点维度显示
    updateFocusDisplay() {
        const container = document.getElementById('storiesFocusDisplay');
        if (!container) return;
        
        if (this.focusValues.length === 0) {
            container.innerHTML = `<span class="focus-prompt">🎯 设置年度焦点</span>`;
            container.classList.add('no-focus');
        } else {
            const tags = this.focusValues.map(name => {
                const def = this.values.find(v => v.name === name);
                if (!def) return '';
                return `<span class="focus-tag" style="--focus-color: ${def.color}">${def.emoji} ${def.name}</span>`;
            }).join('');
            container.innerHTML = `<span class="focus-label">🎯 焦点</span>${tags}<span class="focus-edit-hint">编辑</span>`;
            container.classList.remove('no-focus');
        }
    }
    
    // 首次引导：选择焦点维度
    showFocusGuide() {
        this.showFocusEditor(true);
    }
    
    // 焦点维度编辑器
    showFocusEditor(isFirstTime = false) {
        let overlay = document.getElementById('focusEditorOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'focusEditorOverlay';
            overlay.className = 'focus-editor-overlay';
            document.body.appendChild(overlay);
        }
        
        const currentSelected = [...this.focusValues];
        const maxFocus = 3;
        
        const valueOptions = this.values.map(v => {
            const isSelected = currentSelected.includes(v.name);
            return `
                <button class="focus-option ${isSelected ? 'selected' : ''}" data-value="${v.name}" style="--opt-color: ${v.color}">
                    <span class="focus-option-emoji">${v.emoji}</span>
                    <span class="focus-option-name">${v.name}</span>
                    <span class="focus-option-subtitle">${v.subtitle}</span>
                    ${isSelected ? '<span class="focus-option-check">✓</span>' : ''}
                </button>
            `;
        }).join('');
        
        overlay.innerHTML = `
            <div class="focus-editor-modal">
                <div class="focus-editor-header">
                    <h3>${isFirstTime ? '🎯 选择你的年度焦点' : '🎯 编辑焦点维度'}</h3>
                    <p class="focus-editor-desc">${isFirstTime ? '今年你最想在哪几个维度上发力？选择 1-3 个焦点维度' : '最多选择 3 个焦点维度，其余维度的故事会归入"其他"'}</p>
                </div>
                <div class="focus-editor-options" id="focusEditorOptions">
                    ${valueOptions}
                </div>
                <div class="focus-editor-footer">
                    <span class="focus-editor-count" id="focusEditorCount">已选 ${currentSelected.length}/${maxFocus}</span>
                    <div class="focus-editor-actions">
                        ${!isFirstTime ? '<button class="focus-editor-cancel" id="focusEditorCancel">取消</button>' : ''}
                        <button class="focus-editor-save" id="focusEditorSave" ${currentSelected.length === 0 ? 'disabled' : ''}>${isFirstTime ? '开始' : '保存'}</button>
                    </div>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        // 深色模式适配
        if (document.body.classList.contains('stories-dark')) {
            overlay.classList.add('dark-mode');
        }
        
        // 选项点击
        overlay.querySelector('#focusEditorOptions').addEventListener('click', (e) => {
            const btn = e.target.closest('.focus-option');
            if (!btn) return;
            
            const valueName = btn.dataset.value;
            const idx = currentSelected.indexOf(valueName);
            
            if (idx >= 0) {
                // 取消选择
                currentSelected.splice(idx, 1);
                btn.classList.remove('selected');
                btn.querySelector('.focus-option-check')?.remove();
            } else {
                // 选择（最多3个）
                if (currentSelected.length >= maxFocus) return;
                currentSelected.push(valueName);
                btn.classList.add('selected');
                const check = document.createElement('span');
                check.className = 'focus-option-check';
                check.textContent = '✓';
                btn.appendChild(check);
            }
            
            // 更新计数和按钮状态
            const countEl = document.getElementById('focusEditorCount');
            const saveBtn = document.getElementById('focusEditorSave');
            if (countEl) countEl.textContent = `已选 ${currentSelected.length}/${maxFocus}`;
            if (saveBtn) saveBtn.disabled = currentSelected.length === 0;
        });
        
        // 保存
        document.getElementById('focusEditorSave')?.addEventListener('click', () => {
            if (currentSelected.length > 0) {
                this.setFocusValues(currentSelected);
            }
            overlay.classList.remove('active');
        });
        
        // 取消
        document.getElementById('focusEditorCancel')?.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
        
        // 点击遮罩关闭（非首次引导）
        if (!isFirstTime) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        }
    }
}

