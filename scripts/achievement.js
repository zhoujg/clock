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
            }
        };
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
            // 点击跳转到成就页面
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = 'achievement.html';
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
}
