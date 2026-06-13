// 成就页面管理器
class AchievementPageManager {
    constructor() {
        this.storageKey = 'studyAchievements';
        this.settingsKey = 'flipClockSettings';
        this.data = this.loadData();
        this.achievements = this.initAchievements();
        this.currentCategory = 'all';
        
        this.init();
    }
    
    init() {
        this.loadBackground();
        this.updateStats();
        this.setupNavigation();
        this.renderAchievements('all');
    }
    
    // 加载背景设置
    loadBackground() {
        try {
            const settingsData = localStorage.getItem(this.settingsKey);
            if (settingsData) {
                const settings = JSON.parse(settingsData);
                
                // 应用背景色
                if (settings.backgroundColor) {
                    document.body.style.background = settings.backgroundColor;
                }
                
                // 应用背景图片
                if (settings.backgroundImage && settings.backgroundImage !== 'none') {
                    document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundAttachment = 'fixed';
                }
            }
        } catch (error) {
            console.error('加载背景设置失败:', error);
        }
    }
    
    // 加载成就数据
    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const defaultData = {
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
            
            if (data) {
                const parsed = JSON.parse(data);
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
    
    getTodayDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    // 初始化成就定义
    initAchievements() {
        return {
            // 入门级成就
            firstTimer: {
                id: 'firstTimer',
                name: '初出茅庐',
                description: '完成第一个番茄钟，学习之旅从这里开始！',
                icon: '🌱',
                requirement: 1,
                category: 'pomodoro',
                unlocked: false
            },
            earlyBird: {
                id: 'earlyBird',
                name: '早起的鸟儿',
                description: '在早上6点前开始学习，早起的鸟儿有虫吃！',
                icon: '🐦',
                requirement: 1,
                category: 'special',
                unlocked: false
            },
            nightOwl: {
                id: 'nightOwl',
                name: '夜猫子',
                description: '在晚上11点后还在学习，注意休息哦！',
                icon: '🦉',
                requirement: 1,
                category: 'special',
                unlocked: false
            },
            
            // 番茄钟成就
            pomodoroNovice: {
                id: 'pomodoroNovice',
                name: '番茄新手',
                description: '累计完成10个番茄钟，掌握了时间管理的基础！',
                icon: '🍅',
                requirement: 10,
                category: 'pomodoro',
                unlocked: false
            },
            pomodoroExpert: {
                id: 'pomodoroExpert',
                name: '番茄达人',
                description: '累计完成50个番茄钟，你已经是专注高手了！',
                icon: '🎯',
                requirement: 50,
                category: 'pomodoro',
                unlocked: false
            },
            pomodoroMaster: {
                id: 'pomodoroMaster',
                name: '番茄大师',
                description: '累计完成100个番茄钟，超强专注力！',
                icon: '👑',
                requirement: 100,
                category: 'pomodoro',
                unlocked: false
            },
            pomodoroLegend: {
                id: 'pomodoroLegend',
                name: '番茄传说',
                description: '累计完成500个番茄钟，你就是传说本身！',
                icon: '⭐',
                requirement: 500,
                category: 'pomodoro',
                unlocked: false
            },
            
            // 学习时长成就
            studyTime1h: {
                id: 'studyTime1h',
                name: '坚持不懈',
                description: '累计学习1小时，万事开头难，你做到了！',
                icon: '⏰',
                requirement: 60,
                category: 'studyTime',
                unlocked: false
            },
            studyTime10h: {
                id: 'studyTime10h',
                name: '勤奋学子',
                description: '累计学习10小时，勤奋是成功的阶梯！',
                icon: '📚',
                requirement: 600,
                category: 'studyTime',
                unlocked: false
            },
            studyTime50h: {
                id: 'studyTime50h',
                name: '学霸之路',
                description: '累计学习50小时，你正走在学霸的路上！',
                icon: '🎓',
                requirement: 3000,
                category: 'studyTime',
                unlocked: false
            },
            studyTime100h: {
                id: 'studyTime100h',
                name: '学海无涯',
                description: '累计学习100小时，学海无涯苦作舟！',
                icon: '🏆',
                requirement: 6000,
                category: 'studyTime',
                unlocked: false
            },
            
            // 连续学习成就
            streak3: {
                id: 'streak3',
                name: '三日可期',
                description: '连续3天学习，好习惯正在养成！',
                icon: '🔥',
                requirement: 3,
                category: 'streak',
                unlocked: false
            },
            streak7: {
                id: 'streak7',
                name: '坚持一周',
                description: '连续7天学习，一周的坚持真不简单！',
                icon: '💪',
                requirement: 7,
                category: 'streak',
                unlocked: false
            },
            streak30: {
                id: 'streak30',
                name: '月度坚持',
                description: '连续30天学习，你的毅力令人敬佩！',
                icon: '🌟',
                requirement: 30,
                category: 'streak',
                unlocked: false
            },
            
            // 单日学习成就
            dailyGoal2h: {
                id: 'dailyGoal2h',
                name: '今日学霸',
                description: '单日学习2小时，今天的你真棒！',
                icon: '📖',
                requirement: 120,
                category: 'daily',
                unlocked: false,
                repeatable: true
            },
            dailyGoal4h: {
                id: 'dailyGoal4h',
                name: '今日学神',
                description: '单日学习4小时，简直太厉害了！',
                icon: '🌈',
                requirement: 240,
                category: 'daily',
                unlocked: false,
                repeatable: true
            },
            dailyGoal6h: {
                id: 'dailyGoal6h',
                name: '今日传奇',
                description: '单日学习6小时，你创造了传奇！',
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
                description: '一周内每天都学习，完美的坚持！',
                icon: '✨',
                requirement: 7,
                category: 'special',
                unlocked: false
            },
            marathon: {
                id: 'marathon',
                name: '学习马拉松',
                description: '单次学习超过4小时，超强耐力！',
                icon: '🏃',
                requirement: 240,
                category: 'special',
                unlocked: false
            }
        };
    }
    
    // 获取下一级所需经验
    getExpForNextLevel() {
        return 100 + (this.data.level - 1) * 50;
    }
    
    // 更新统计显示
    updateStats() {
        // 更新等级
        document.getElementById('levelDisplay').textContent = this.data.level;
        document.getElementById('currentLevel').textContent = this.data.level;
        document.getElementById('nextLevel').textContent = this.data.level + 1;
        
        // 更新经验值
        const expNeeded = this.getExpForNextLevel();
        document.getElementById('expDisplay').textContent = this.data.exp;
        document.getElementById('expNeeded').textContent = `/ ${expNeeded}`;
        document.getElementById('expText').textContent = `${this.data.exp} / ${expNeeded}`;
        
        // 更新经验条
        const expPercent = (this.data.exp / expNeeded) * 100;
        document.getElementById('expBarFill').style.width = `${expPercent}%`;
        
        // 更新连续天数
        document.getElementById('streakDisplay').textContent = this.data.currentStreak;
        
        // 更新累计学习时长
        const totalHours = (this.data.totalStudyTime / 60).toFixed(1);
        document.getElementById('totalStudyDisplay').textContent = totalHours;
        
        // 更新今日学习
        document.getElementById('todayTime').textContent = `${this.data.todayStudyTime} 分钟`;
        
        // 计算今日完成的番茄钟（估算）
        const todayPomodoros = Math.floor(this.data.todayStudyTime / 25);
        document.getElementById('todayPomodoros').textContent = `${todayPomodoros} 个`;
        
        // 计算今日解锁的成就（这里简化处理）
        document.getElementById('todayAchievements').textContent = '0 个';
        
        // 更新分类计数
        this.updateCategoryCounts();
    }
    
    // 更新分类计数
    updateCategoryCounts() {
        // 同步解锁状态
        Object.values(this.achievements).forEach(achievement => {
            if (this.data.unlockedAchievements.includes(achievement.id)) {
                achievement.unlocked = true;
            }
        });
        
        const counts = {
            all: 0,
            pomodoro: 0,
            studyTime: 0,
            streak: 0,
            daily: 0,
            special: 0
        };
        
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.unlocked) {
                counts.all++;
                if (achievement.category !== 'daily') {
                    counts[achievement.category]++;
                } else {
                    counts.special++;
                }
            }
        });
        
        document.getElementById('countAll').textContent = `${counts.all}/${Object.keys(this.achievements).length}`;
        document.getElementById('countPomodoro').textContent = counts.pomodoro;
        document.getElementById('countStudyTime').textContent = counts.studyTime;
        document.getElementById('countStreak').textContent = counts.streak;
        document.getElementById('countSpecial').textContent = counts.special + counts.daily;
    }
    
    // 设置导航
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                this.renderAchievements(category);
            });
        });
    }
    
    // 渲染成就
    renderAchievements(category) {
        this.currentCategory = category;
        const grid = document.getElementById('achievementsGrid');
        grid.innerHTML = '';
        
        // 同步解锁状态
        Object.values(this.achievements).forEach(achievement => {
            if (this.data.unlockedAchievements.includes(achievement.id)) {
                achievement.unlocked = true;
            }
        });
        
        // 筛选成就
        const filtered = Object.values(this.achievements).filter(achievement => {
            return category === 'all' || achievement.category === category;
        });
        
        // 排序：已解锁的在前面
        filtered.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return 0;
        });
        
        // 生成成就卡片
        filtered.forEach(achievement => {
            const card = this.createAchievementCard(achievement);
            grid.appendChild(card);
        });
    }
    
    // 创建成就卡片
    createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        let progressHtml = '';
        let current = 0;
        let progress = 0;
        
        switch (achievement.category) {
            case 'pomodoro':
                current = this.data.totalPomodoros;
                progress = Math.min((current / achievement.requirement) * 100, 100);
                progressHtml = `
                    <div class="achievement-progress-section">
                        <div class="progress-label">进度: ${current} / ${achievement.requirement} 个番茄钟</div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-inner" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress.toFixed(0)}% 完成</div>
                    </div>
                `;
                break;
            case 'studyTime':
                current = this.data.totalStudyTime;
                progress = Math.min((current / achievement.requirement) * 100, 100);
                const currentHours = (current / 60).toFixed(1);
                const requiredHours = (achievement.requirement / 60).toFixed(1);
                progressHtml = `
                    <div class="achievement-progress-section">
                        <div class="progress-label">进度: ${currentHours} / ${requiredHours} 小时</div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-inner" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress.toFixed(0)}% 完成</div>
                    </div>
                `;
                break;
            case 'streak':
                current = this.data.currentStreak;
                progress = Math.min((current / achievement.requirement) * 100, 100);
                progressHtml = `
                    <div class="achievement-progress-section">
                        <div class="progress-label">进度: ${current} / ${achievement.requirement} 天</div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-inner" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress.toFixed(0)}% 完成</div>
                    </div>
                `;
                break;
            case 'daily':
                current = this.data.todayStudyTime;
                progress = Math.min((current / achievement.requirement) * 100, 100);
                progressHtml = `
                    <div class="achievement-progress-section">
                        <div class="progress-label">今日进度: ${current} / ${achievement.requirement} 分钟 ${achievement.repeatable ? '(可重复获得)' : ''}</div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-inner" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress.toFixed(0)}% 完成</div>
                    </div>
                `;
                break;
            case 'special':
                if (!achievement.unlocked) {
                    progressHtml = `
                        <div class="achievement-hint">
                            <div class="hint-text">💡 提示: ${achievement.description}</div>
                        </div>
                    `;
                }
                break;
        }
        
        card.innerHTML = `
            <div class="achievement-card-header">
                <div class="achievement-icon-big">${achievement.icon}</div>
                <div>
                    <div class="achievement-title">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
            ${progressHtml}
            ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
        `;
        
        return card;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AchievementPageManager();
});
