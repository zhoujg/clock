// 学习成就系统
class AchievementSystem {
    constructor() {
        this.storageKey = 'studyAchievements';
        this.data = this.loadData();
        this.achievements = this.initAchievements();
        this.container = null;
        this.notificationQueue = [];
        this.isShowingNotification = false;
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.bindEvents();
        this.checkDailyReset();
        this.updateDisplay();
    }
    
    // 初始化成就定义
    initAchievements() {
        return {
            // 入门级成就
            firstTimer: {
                id: 'firstTimer',
                name: '初出茅庐',
                description: '完成第一个番茄钟',
                icon: '🌱',
                requirement: 1,
                category: 'pomodoro',
                unlocked: false
            },
            earlyBird: {
                id: 'earlyBird',
                name: '早起的鸟儿',
                description: '在早上6点前开始学习',
                icon: '🐦',
                requirement: 1,
                category: 'special',
                unlocked: false
            },
            nightOwl: {
                id: 'nightOwl',
                name: '夜猫子',
                description: '在晚上11点后学习',
                icon: '🦉',
                requirement: 1,
                category: 'special',
                unlocked: false
            },
            
            // 番茄钟成就
            pomodoroNovice: {
                id: 'pomodoroNovice',
                name: '番茄新手',
                description: '累计完成10个番茄钟',
                icon: '🍅',
                requirement: 10,
                category: 'pomodoro',
                unlocked: false
            },
            pomodoroExpert: {
                id: 'pomodoroExpert',
                name: '番茄达人',
                description: '累计完成50个番茄钟',
                icon: '🎯',
                requirement: 50,
                category: 'pomodoro',
                unlocked: false
            },
            pomodoroMaster: {
                id: 'pomodoroMaster',
                name: '番茄大师',
                description: '累计完成100个番茄钟',
                icon: '👑',
                requirement: 100,
                category: 'pomodoro',
                unlocked: false
            },
            pomodoroLegend: {
                id: 'pomodoroLegend',
                name: '番茄传说',
                description: '累计完成500个番茄钟',
                icon: '⭐',
                requirement: 500,
                category: 'pomodoro',
                unlocked: false
            },
            
            // 学习时长成就
            studyTime1h: {
                id: 'studyTime1h',
                name: '坚持不懈',
                description: '累计学习1小时',
                icon: '⏰',
                requirement: 60,
                category: 'studyTime',
                unlocked: false
            },
            studyTime10h: {
                id: 'studyTime10h',
                name: '勤奋学子',
                description: '累计学习10小时',
                icon: '📚',
                requirement: 600,
                category: 'studyTime',
                unlocked: false
            },
            studyTime50h: {
                id: 'studyTime50h',
                name: '学霸之路',
                description: '累计学习50小时',
                icon: '🎓',
                requirement: 3000,
                category: 'studyTime',
                unlocked: false
            },
            studyTime100h: {
                id: 'studyTime100h',
                name: '学海无涯',
                description: '累计学习100小时',
                icon: '🏆',
                requirement: 6000,
                category: 'studyTime',
                unlocked: false
            },
            
            // 连续学习成就
            streak3: {
                id: 'streak3',
                name: '三日可期',
                description: '连续3天学习',
                icon: '🔥',
                requirement: 3,
                category: 'streak',
                unlocked: false
            },
            streak7: {
                id: 'streak7',
                name: '坚持一周',
                description: '连续7天学习',
                icon: '💪',
                requirement: 7,
                category: 'streak',
                unlocked: false
            },
            streak30: {
                id: 'streak30',
                name: '月度坚持',
                description: '连续30天学习',
                icon: '🌟',
                requirement: 30,
                category: 'streak',
                unlocked: false
            },
            
            // 单日学习成就
            dailyGoal2h: {
                id: 'dailyGoal2h',
                name: '今日学霸',
                description: '单日学习2小时',
                icon: '📖',
                requirement: 120,
                category: 'daily',
                unlocked: false,
                repeatable: true
            },
            dailyGoal4h: {
                id: 'dailyGoal4h',
                name: '今日学神',
                description: '单日学习4小时',
                icon: '🌈',
                requirement: 240,
                category: 'daily',
                unlocked: false,
                repeatable: true
            },
            dailyGoal6h: {
                id: 'dailyGoal6h',
                name: '今日传奇',
                description: '单日学习6小时',
                icon: '🚀',
                requirement: 360,
                category: 'daily',
                unlocked: false,
                repeatable: true
            },
            
            // 特殊成就
            perfectWeek: {
                id: 'perfectWeek',
                name: '完美一周',
                description: '一周内每天都学习',
                icon: '✨',
                requirement: 7,
                category: 'special',
                unlocked: false
            },
            marathon: {
                id: 'marathon',
                name: '学习马拉松',
                description: '单次学习超过4小时',
                icon: '🏃',
                requirement: 240,
                category: 'special',
                unlocked: false
            },
            
            // 每日三个故事成就
            firstStory: {
                id: 'firstStory',
                name: '故事开端',
                description: '完成第一个每日故事',
                icon: '📖',
                requirement: 1,
                category: 'stories',
                unlocked: false
            },
            perfectDay: {
                id: 'perfectDay',
                name: '完美一天',
                description: '完成当天所有三个故事',
                icon: '🎯',
                requirement: 1,
                category: 'stories',
                unlocked: false
            },
            storyWeek: {
                id: 'storyWeek',
                name: '故事之周',
                description: '连续7天完成所有三个故事',
                icon: '📚',
                requirement: 7,
                category: 'stories',
                unlocked: false
            },
            storyMaster: {
                id: 'storyMaster',
                name: '故事大师',
                description: '累计完成30个故事',
                icon: '🏆',
                requirement: 30,
                category: 'stories',
                unlocked: false
            },
            storyLegend: {
                id: 'storyLegend',
                name: '故事传奇',
                description: '累计完成100个故事',
                icon: '👑',
                requirement: 100,
                category: 'stories',
                unlocked: false
            }
        };
    }
    
    // 检查每日三个故事成就（由 DailyStories 系统调用）
    checkStoriesAchievements(stats) {
        const { todayCompleted, perfectDays, totalStories } = stats;
        
        // 检查"故事开端"
        if (totalStories >= 1 && !this.achievements.firstStory.unlocked) {
            this.unlockAchievement(this.achievements.firstStory);
        }
        
        // 检查"完美一天"
        if (todayCompleted === 3 && !this.achievements.perfectDay.unlocked) {
            this.unlockAchievement(this.achievements.perfectDay);
        }
        
        // 检查"故事之周"
        if (perfectDays >= 7 && !this.achievements.storyWeek.unlocked) {
            this.unlockAchievement(this.achievements.storyWeek);
        }
        
        // 检查"故事大师"
        if (totalStories >= 30 && !this.achievements.storyMaster.unlocked) {
            this.unlockAchievement(this.achievements.storyMaster);
        }
        
        // 检查"故事传奇"
        if (totalStories >= 100 && !this.achievements.storyLegend.unlocked) {
            this.unlockAchievement(this.achievements.storyLegend);
        }
    }
    
    // 创建UI
    createUI() {
        // 创建成就通知（按钮已在 HTML 中）
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.id = 'achievementNotification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon" id="notificationIcon">🏆</div>
                <div class="notification-text">
                    <div class="notification-title">成就解锁！</div>
                    <div class="notification-desc" id="notificationDesc"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
    }
    
    // 绑定事件
    bindEvents() {
        const toggle = document.getElementById('achievementToggle');
        
        if (toggle) {
            // 点击显示成就模态框
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAchievementModal();
            });
        }
    }
    
    // 加载数据
    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const defaultData = {
                level: 1,
                exp: 0,
                totalStudyTime: 0, // 分钟
                totalPomodoros: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDate: null,
                todayStudyTime: 0,
                todayDate: this.getTodayDate(),
                unlockedAchievements: [],
                weekStudyDays: []
            };
            
            if (data) {
                const parsed = JSON.parse(data);
                // 合并默认数据，确保新字段存在
                return { ...defaultData, ...parsed };
            }
            return defaultData;
        } catch (error) {
            console.error('加载成就数据失败:', error);
            return {
                level: 1,
                exp: 0,
                totalStudyTime: 0,
                totalPomodoros: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDate: null,
                todayStudyTime: 0,
                todayDate: this.getTodayDate(),
                unlockedAchievements: [],
                weekStudyDays: []
            };
        }
    }
    
    // 保存数据
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            // 同步到云端
            if (window.syncAdapter) window.syncAdapter.pushChanges(this.storageKey);
        } catch (error) {
            console.error('保存成就数据失败:', error);
        }
    }
    
    // 获取今日日期字符串
    getTodayDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    // 检查日期重置
    checkDailyReset() {
        const today = this.getTodayDate();
        if (this.data.todayDate !== today) {
            // 新的一天
            this.data.todayDate = today;
            this.data.todayStudyTime = 0;
            
            // 检查连续天数
            if (this.data.lastStudyDate) {
                const lastDate = new Date(this.data.lastStudyDate);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    // 连续学习
                    this.data.currentStreak++;
                } else if (diffDays > 1) {
                    // 中断了
                    this.data.currentStreak = 0;
                }
            }
            
            this.saveData();
        }
    }
    
    // 记录完成一个番茄钟
    onPomodoroComplete(minutes = 25) {
        this.data.totalPomodoros++;
        this.addStudyTime(minutes);
        this.addExp(50); // 完成一个番茄钟获得50经验
        
        // 更新最后学习日期
        const today = this.getTodayDate();
        this.data.lastStudyDate = today;
        
        // 更新本周学习天数
        if (!this.data.weekStudyDays.includes(today)) {
            this.data.weekStudyDays.push(today);
            // 只保留最近7天
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            this.data.weekStudyDays = this.data.weekStudyDays.filter(date => {
                return new Date(date) >= weekAgo;
            });
        }
        
        this.checkAchievements();
        this.saveData();
        this.updateDisplay();
    }
    
    // 添加学习时间
    addStudyTime(minutes) {
        this.data.totalStudyTime += minutes;
        this.data.todayStudyTime += minutes;
        this.checkDailyReset();
    }
    
    // 添加经验值
    addExp(amount) {
        this.data.exp += amount;
        
        // 检查升级
        while (this.data.exp >= this.getExpForNextLevel()) {
            this.data.exp -= this.getExpForNextLevel();
            this.data.level++;
            this.showLevelUp();
        }
    }
    
    // 获取下一级所需经验
    getExpForNextLevel() {
        return 100 + (this.data.level - 1) * 50;
    }
    
    // 显示升级通知
    showLevelUp() {
        this.showNotification({
            icon: '🎉',
            title: '等级提升！',
            description: `恭喜达到 Lv.${this.data.level}`
        });
    }
    
    // 检查成就
    checkAchievements() {
        const hour = new Date().getHours();
        
        // 检查所有成就
        Object.values(this.achievements).forEach(achievement => {
            // 如果已解锁且不可重复，跳过
            if (achievement.unlocked && !achievement.repeatable) {
                return;
            }
            
            let shouldUnlock = false;
            
            switch (achievement.category) {
                case 'pomodoro':
                    if (this.data.totalPomodoros >= achievement.requirement) {
                        shouldUnlock = true;
                    }
                    break;
                    
                case 'studyTime':
                    if (this.data.totalStudyTime >= achievement.requirement) {
                        shouldUnlock = true;
                    }
                    break;
                    
                case 'streak':
                    if (this.data.currentStreak >= achievement.requirement) {
                        shouldUnlock = true;
                    }
                    break;
                    
                case 'daily':
                    if (this.data.todayStudyTime >= achievement.requirement) {
                        shouldUnlock = true;
                    }
                    break;
                    
                case 'special':
                    if (achievement.id === 'earlyBird' && hour < 6) {
                        shouldUnlock = true;
                    } else if (achievement.id === 'nightOwl' && hour >= 23) {
                        shouldUnlock = true;
                    } else if (achievement.id === 'perfectWeek' && this.data.weekStudyDays.length >= 7) {
                        shouldUnlock = true;
                    } else if (achievement.id === 'marathon') {
                        // 这个需要在单次学习时检查，暂时跳过
                    }
                    break;
            }
            
            if (shouldUnlock && !achievement.unlocked) {
                this.unlockAchievement(achievement);
            }
        });
    }
    
    // 解锁成就
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        
        if (!this.data.unlockedAchievements.includes(achievement.id)) {
            this.data.unlockedAchievements.push(achievement.id);
        }
        
        // 获得经验奖励
        const expReward = Math.floor(achievement.requirement * 2);
        this.addExp(expReward);
        
        // 显示通知
        this.showNotification({
            icon: achievement.icon,
            title: achievement.name,
            description: achievement.description
        });
        
        this.saveData();
        this.updateDisplay();
    }
    
    // 显示通知
    showNotification(data) {
        this.notificationQueue.push(data);
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
    }
    
    // 处理通知队列
    processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }
        
        this.isShowingNotification = true;
        const data = this.notificationQueue.shift();
        
        const notification = document.getElementById('achievementNotification');
        const icon = document.getElementById('notificationIcon');
        const desc = document.getElementById('notificationDesc');
        const title = notification.querySelector('.notification-title');
        
        icon.textContent = data.icon;
        title.textContent = data.title;
        desc.textContent = data.description;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                this.processNotificationQueue();
            }, 500);
        }, 3000);
    }
    
    // 更新显示
    updateDisplay() {
        // 更新徽章数量
        const unlockedCount = this.data.unlockedAchievements.length;
        document.getElementById('achievementBadge').textContent = unlockedCount;
    }
    
    // 获取统计数据（供外部调用）
    getStats() {
        return {
            level: this.data.level,
            exp: this.data.exp,
            totalStudyTime: this.data.totalStudyTime,
            totalPomodoros: this.data.totalPomodoros,
            currentStreak: this.data.currentStreak,
            todayStudyTime: this.data.todayStudyTime,
            unlockedCount: this.data.unlockedAchievements.length,
            totalAchievements: Object.keys(this.achievements).length
        };
    }
    
    // ===== 成就模态框方法 =====
    
    // 显示成就模态框
    showAchievementModal() {
        // 创建模态框（如果不存在）
        if (!document.getElementById('achievementModal')) {
            this.createAchievementModal();
        }
        
        // 渲染内容
        this.renderAchievementContent();
        
        // 显示模态框
        const modal = document.getElementById('achievementModal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    // 创建成就模态框
    createAchievementModal() {
        const modal = document.createElement('div');
        modal.id = 'achievementModal';
        modal.className = 'achievement-modal';
        modal.innerHTML = `
            <div class="achievement-modal-content">
                <div class="achievement-modal-header">
                    <h1 class="achievement-modal-title">
                        <span class="title-icon">🏆</span>
                        我的荣誉殿堂
                        <span class="title-icon">🏆</span>
                    </h1>
                    <button class="achievement-modal-close" id="achievementModalClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <p class="achievement-modal-subtitle">每一次努力都值得被记录！</p>
                
                <!-- 个人统计卡片 -->
                <div class="modal-stats-container">
                    <div class="modal-stat-card modal-level-card">
                        <div class="modal-stat-icon-large">⭐</div>
                        <div class="modal-stat-info">
                            <div class="modal-stat-label">当前等级</div>
                            <div class="modal-stat-value-large" id="modalLevelDisplay">1</div>
                            <div class="modal-stat-sublabel">继续加油！</div>
                        </div>
                    </div>
                    
                    <div class="modal-stat-card modal-exp-card">
                        <div class="modal-stat-icon-large">✨</div>
                        <div class="modal-stat-info">
                            <div class="modal-stat-label">经验值</div>
                            <div class="modal-stat-value-large" id="modalExpDisplay">0</div>
                            <div class="modal-stat-sublabel" id="modalExpNeeded">/ 100</div>
                        </div>
                    </div>
                    
                    <div class="modal-stat-card modal-streak-card">
                        <div class="modal-stat-icon-large">🔥</div>
                        <div class="modal-stat-info">
                            <div class="modal-stat-label">连续天数</div>
                            <div class="modal-stat-value-large" id="modalStreakDisplay">0</div>
                            <div class="modal-stat-sublabel">坚持就是胜利！</div>
                        </div>
                    </div>
                    
                    <div class="modal-stat-card modal-study-card">
                        <div class="modal-stat-icon-large">📚</div>
                        <div class="modal-stat-info">
                            <div class="modal-stat-label">累计学习</div>
                            <div class="modal-stat-value-large" id="modalTotalStudyDisplay">0</div>
                            <div class="modal-stat-sublabel">小时</div>
                        </div>
                    </div>
                </div>
                
                <!-- 经验进度条 -->
                <div class="modal-exp-progress-section">
                    <div class="modal-exp-label-row">
                        <span class="modal-exp-label-left">Lv.<span id="modalCurrentLevel">1</span></span>
                        <span class="modal-exp-label-center" id="modalExpText">0 / 100</span>
                        <span class="modal-exp-label-right">Lv.<span id="modalNextLevel">2</span></span>
                    </div>
                    <div class="modal-exp-bar-container">
                        <div class="modal-exp-bar-fill" id="modalExpBarFill"></div>
                        <div class="modal-exp-bar-shine"></div>
                    </div>
                </div>
                
                <!-- 今日学习进度 -->
                <div class="modal-today-section">
                    <h2 class="modal-section-title">📅 今日学习</h2>
                    <div class="modal-today-stats">
                        <div class="modal-today-item">
                            <span class="modal-today-label">学习时长</span>
                            <span class="modal-today-value" id="modalTodayTime">0 分钟</span>
                        </div>
                        <div class="modal-today-item">
                            <span class="modal-today-label">完成番茄钟</span>
                            <span class="modal-today-value" id="modalTodayPomodoros">0 个</span>
                        </div>
                        <div class="modal-today-item">
                            <span class="modal-today-label">解锁成就</span>
                            <span class="modal-today-value" id="modalTodayAchievements">0 个</span>
                        </div>
                    </div>
                </div>
                
                <!-- 成就分类标签 -->
                <div class="modal-achievement-nav">
                    <button class="modal-nav-btn active" data-category="all">
                        <span class="modal-nav-icon">🎯</span>
                        <span class="modal-nav-text">全部</span>
                        <span class="modal-nav-count" id="modalCountAll">0</span>
                    </button>
                    <button class="modal-nav-btn" data-category="pomodoro">
                        <span class="modal-nav-icon">🍅</span>
                        <span class="modal-nav-text">番茄钟</span>
                        <span class="modal-nav-count" id="modalCountPomodoro">0</span>
                    </button>
                    <button class="modal-nav-btn" data-category="studyTime">
                        <span class="modal-nav-icon">⏰</span>
                        <span class="modal-nav-text">时长</span>
                        <span class="modal-nav-count" id="modalCountStudyTime">0</span>
                    </button>
                    <button class="modal-nav-btn" data-category="streak">
                        <span class="modal-nav-icon">🔥</span>
                        <span class="modal-nav-text">连续</span>
                        <span class="modal-nav-count" id="modalCountStreak">0</span>
                    </button>
                    <button class="modal-nav-btn" data-category="stories">
                        <span class="modal-nav-icon">📖</span>
                        <span class="modal-nav-text">故事</span>
                        <span class="modal-nav-count" id="modalCountStories">0</span>
                    </button>
                    <button class="modal-nav-btn" data-category="special">
                        <span class="modal-nav-icon">⭐</span>
                        <span class="modal-nav-text">特殊</span>
                        <span class="modal-nav-count" id="modalCountSpecial">0</span>
                    </button>
                </div>
                
                <!-- 成就展示区 -->
                <div class="modal-achievements-grid" id="modalAchievementsGrid">
                    <!-- 成就卡片将通过JavaScript动态生成 -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = document.getElementById('achievementModalClose');
        closeBtn.addEventListener('click', () => this.hideAchievementModal());
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideAchievementModal();
            }
        });
        
        // 绑定分类切换
        const navBtns = modal.querySelectorAll('.modal-nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                this.filterAchievements(category);
            });
        });
    }
    
    // 渲染成就内容
    renderAchievementContent() {
        const stats = this.getStats();
        const expNeeded = this.getExpForNextLevel();
        const expPercent = (stats.exp / expNeeded) * 100;
        
        // 更新统计卡片
        document.getElementById('modalLevelDisplay').textContent = stats.level;
        document.getElementById('modalExpDisplay').textContent = stats.exp;
        document.getElementById('modalExpNeeded').textContent = `/ ${expNeeded}`;
        document.getElementById('modalStreakDisplay').textContent = stats.currentStreak;
        document.getElementById('modalTotalStudyDisplay').textContent = (stats.totalStudyTime / 60).toFixed(1);
        
        // 更新经验进度条
        document.getElementById('modalCurrentLevel').textContent = stats.level;
        document.getElementById('modalNextLevel').textContent = stats.level + 1;
        document.getElementById('modalExpText').textContent = `${stats.exp} / ${expNeeded}`;
        document.getElementById('modalExpBarFill').style.width = `${expPercent}%`;
        
        // 更新今日统计
        document.getElementById('modalTodayTime').textContent = `${stats.todayStudyTime} 分钟`;
        
        // 计算今日完成的番茄钟（简化处理）
        const todayPomodoros = Math.floor(stats.todayStudyTime / 25);
        document.getElementById('modalTodayPomodoros').textContent = `${todayPomodoros} 个`;
        
        // 计算今日解锁成就（简化处理）
        document.getElementById('modalTodayAchievements').textContent = '0 个';
        
        // 更新分类计数
        const categories = {
            all: 0,
            pomodoro: 0,
            studyTime: 0,
            streak: 0,
            stories: 0,
            special: 0,
            daily: 0
        };
        
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.unlocked) {
                categories.all++;
                categories[achievement.category]++;
            }
        });
        
        document.getElementById('modalCountAll').textContent = categories.all;
        document.getElementById('modalCountPomodoro').textContent = categories.pomodoro;
        document.getElementById('modalCountStudyTime').textContent = categories.studyTime;
        document.getElementById('modalCountStreak').textContent = categories.streak;
        document.getElementById('modalCountStories').textContent = categories.stories;
        document.getElementById('modalCountSpecial').textContent = categories.special + categories.daily;
        
        // 渲染成就卡片
        this.filterAchievements('all');
    }
    
    // 筛选成就
    filterAchievements(category) {
        const grid = document.getElementById('modalAchievementsGrid');
        const achievements = Object.values(this.achievements);
        
        const filtered = category === 'all' 
            ? achievements 
            : achievements.filter(a => a.category === category || (category === 'special' && a.category === 'daily'));
        
        grid.innerHTML = filtered.map((achievement, index) => {
            const isUnlocked = achievement.unlocked;
            const progress = this.getAchievementProgress(achievement);
            const progressPercent = Math.min((progress / achievement.requirement) * 100, 100);
            
            return `
                <div class="modal-achievement-card ${isUnlocked ? 'unlocked' : 'locked'}" 
                     style="animation-delay: ${Math.min(index * 0.05, 2)}s;">
                    <div class="modal-achievement-icon">${achievement.icon}</div>
                    <div class="modal-achievement-info">
                        <div class="modal-achievement-name">${achievement.name}</div>
                        <div class="modal-achievement-desc">${achievement.description}</div>
                        ${!isUnlocked ? `
                            <div class="modal-achievement-progress">
                                <div class="modal-achievement-progress-bar">
                                    <div class="modal-achievement-progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <div class="modal-achievement-progress-text">${progress} / ${achievement.requirement}</div>
                            </div>
                        ` : '<div class="modal-achievement-unlocked">✓ 已解锁</div>'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 获取成就进度
    getAchievementProgress(achievement) {
        switch (achievement.category) {
            case 'pomodoro':
                return this.data.totalPomodoros;
            case 'studyTime':
                return this.data.totalStudyTime;
            case 'streak':
                return this.data.currentStreak;
            case 'daily':
                return this.data.todayStudyTime;
            case 'special':
                if (achievement.id === 'perfectWeek') {
                    return this.data.weekStudyDays.length;
                }
                return 0;
            default:
                return 0;
        }
    }
    
    // 隐藏成就模态框
    hideAchievementModal() {
        const modal = document.getElementById('achievementModal');
        if (!modal) return;
        
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}
