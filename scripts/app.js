// 时钟管理器
class ClockManager {
    constructor() {
        this.tickInstance = null;
        this.isPomodoroMode = false;
        this.normalClockInterval = null;
        this.tickSoundManager = null; // 将在app初始化时设置
    }
    
    // 设置滴答声管理器引用
    setTickSoundManager(tickSoundManager) {
        this.tickSoundManager = tickSoundManager;
    }
    
    // 初始化正常时钟
    initNormalClock(tick) {
        this.tickInstance = tick;
        this.startNormalClock();
    }
    
    // 启动正常时钟
    startNormalClock() {
        if (!this.tickInstance) return;
        
        // 清除之前的计时器
        if (this.normalClockInterval) {
            clearInterval(this.normalClockInterval);
        }
        
        this.isPomodoroMode = false;
        this.normalClockInterval = setInterval(() => {
            if (this.isPomodoroMode) return;
            var d = Tick.helper.date();
            this.tickInstance.value = {
                hours: d.getHours(),
                minutes: d.getMinutes(),
                seconds: d.getSeconds()
            };
            
            // 播放滴答声
            if (this.tickSoundManager) {
                this.tickSoundManager.playTick();
            }
        }, 1000);
    }
    
    // 更新番茄钟显示
    updatePomodoroDisplay(minutes, seconds) {
        if (!this.tickInstance) return;
        
        this.isPomodoroMode = true;
        this.tickInstance.value = {
            hours: 0,
            minutes: minutes,
            seconds: seconds
        };
        
        // 番茄钟模式也播放滴答声
        if (this.tickSoundManager) {
            this.tickSoundManager.playTick();
        }
    }
    
    // 切换到正常时钟模式
    switchToNormalMode() {
        this.isPomodoroMode = false;
        this.startNormalClock();
    }
}

// 全局时钟管理器实例
const clockManager = new ClockManager();

// 时钟初始化函数
function handleTickInit(tick) {
    clockManager.initNormalClock(tick);
}

// 应用主控制器
class App {
    constructor() {
        this.settingsStorage = new SettingsStorage();
        this.backgroundManager = new BackgroundManager();
        this.animationManager = new AnimationManager('animationCanvas');
        this.quoteManager = new QuoteManager();
        this.tickSoundManager = new TickSoundManager();
        this.bgmPlayerManager = new BGMPlayerManager(this.tickSoundManager); // 传递滴答声管理器
        this.achievementSystem = new AchievementSystem();
        this.forestSystem = new ForestSystem(this.achievementSystem);
        this.pomodoroTimer = new PomodoroTimer(clockManager, this.achievementSystem, this.forestSystem);
        
        // 设置时钟管理器的滴答声引用
        clockManager.setTickSoundManager(this.tickSoundManager);
        
        // 设置动画管理器的 BGM 播放器引用，用于音乐可视化
        this.animationManager.setBGMPlayer(this.bgmPlayerManager);
        
        this.initializeControls();
        this.initializeColorPanel();
        this.initializeImageInput();
        this.initializeDateDisplay();
        this.initializeBGMPlayer();
        
        // 最后加载保存的设置（这会更新状态显示）
        this.loadSavedSettings();
    }

    initializeDateDisplay() {
        // 延迟执行以确保DOM完全加载
        setTimeout(() => {
            this.updateDate();
            // 每分钟更新一次日期（因为日期可能在午夜改变）
            setInterval(() => this.updateDate(), 60000);
        }, 100);
        
        // 同时也立即执行一次
        this.updateDate();
    }

    updateDate() {
        const now = new Date();
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const weekDay = weekDays[now.getDay()];
        
        const dateText = `${year}年${month}月${date}日`;
        const weekText = weekDay;
        
        const dateElement = document.getElementById('dateText');
        const weekElement = document.getElementById('weekText');
                
        if (dateElement) {
            dateElement.textContent = dateText;
            dateElement.style.display = 'block';
            dateElement.style.visibility = 'visible';
            dateElement.style.opacity = '1';
        }
        
        if (weekElement) {
            weekElement.textContent = weekText;
            weekElement.style.display = 'block';
            weekElement.style.visibility = 'visible';
            weekElement.style.opacity = '1';
        }
    }

    initializeControls() {
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsPanel = document.getElementById('settingsPanel');
        const bgColorBtn = document.getElementById('bgColorBtn');
        const animationBtn = document.getElementById('animationBtn');
        const tickSoundBtn = document.getElementById('tickSoundBtn');
        const imageBtn = document.getElementById('imageBtn');

        // 设置按钮切换
        settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsToggle.classList.toggle('active');
            settingsPanel.classList.toggle('active');
            // 关闭番茄钟面板
            const pomodoroPanel = document.getElementById('pomodoroPanel');
            if (pomodoroPanel) {
                pomodoroPanel.classList.remove('active');
            }
        });

        // 设置面板关闭按钮
        const settingsPanelCloseBtn = document.getElementById('settingsPanelCloseBtn');
        settingsPanelCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.remove('active');
            settingsToggle.classList.remove('active');
        });

        // 背景色按钮
        bgColorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const colorPanel = document.getElementById('colorPanel');
            colorPanel.classList.toggle('active');
        });

        // 动画线条按钮
        animationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.animationManager.toggle();
            this.updateAnimationStatus();
            this.saveCurrentSettings();
        });

        // 滴答声音按钮
        tickSoundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tickSoundManager.toggle();
            this.updateTickSoundStatus();
            this.saveCurrentSettings();
        });

        // 背景图片按钮
        imageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('imageInput').click();
        });

        // 点击其他地方关闭所有面板
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.controls') && !e.target.closest('.color-panel') && !e.target.closest('.pomodoro-container')) {
                settingsPanel.classList.remove('active');
                settingsToggle.classList.remove('active');
                document.getElementById('colorPanel').classList.remove('active');
            }
        });
    }

    updateAnimationStatus() {
        const statusElement = document.getElementById('animationStatus');
        if (statusElement) {
            if (this.animationManager.enabled) {
                statusElement.textContent = '开启';
                statusElement.classList.add('active');
            } else {
                statusElement.textContent = '关闭';
                statusElement.classList.remove('active');
            }
        }
    }

    updateTickSoundStatus() {
        const statusElement = document.getElementById('tickSoundStatus');
        if (statusElement) {
            if (this.tickSoundManager.enabled) {
                statusElement.textContent = '开启';
                statusElement.classList.add('active');
            } else {
                statusElement.textContent = '关闭';
                statusElement.classList.remove('active');
            }
        }
    }

    initializeColorPanel() {
        const colorOptions = document.querySelectorAll('.color-option');
        
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.getAttribute('data-color');
                this.backgroundManager.setColor(color);
                document.getElementById('colorPanel').classList.remove('active');
                this.saveCurrentSettings();
            });
        });
    }

    initializeImageInput() {
        const imageInput = document.getElementById('imageInput');
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.backgroundManager.setImage(event.target.result);
                    this.saveCurrentSettings();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    initializeBGMPlayer() {
        // 绑定浮动播放器的控制按钮
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const loopBtn = document.getElementById('loopBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const progressContainer = document.getElementById('progressContainer');
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.bgmPlayerManager.togglePlay();
                this.saveCurrentSettings();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.bgmPlayerManager.playPrevious();
                this.saveCurrentSettings();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.bgmPlayerManager.playNext();
                this.saveCurrentSettings();
            });
        }
        
        if (loopBtn) {
            loopBtn.addEventListener('click', () => {
                this.bgmPlayerManager.toggleLoop();
                this.saveCurrentSettings();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.bgmPlayerManager.setVolume(e.target.value);
                this.saveCurrentSettings();
            });
        }
        
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                this.bgmPlayerManager.setProgress(percent);
            });
        }
        
        // 初始加载音乐列表
        this.loadJamendoMusicForFloatingPlayer();
    }
    
    // 为浮动播放器加载音乐
    async loadJamendoMusicForFloatingPlayer() {
        try {
            // 使用 BGM 标签组合加载音乐
            await this.bgmPlayerManager.loadJamendoMusic({
                tags: 'ambient+instrumental',  // 使用组合标签
                limit: 20
            });
            
        } catch (error) {
            console.error('❌ 加载浮动播放器音乐失败:', error);
        }
    }
    
    // 加载保存的设置
    loadSavedSettings() {
        const settings = this.settingsStorage.load();
        
        // 恢复背景色
        if (settings.backgroundColor) {
            this.backgroundManager.setColor(settings.backgroundColor);
        } else {
            // 如果没有保存的设置，使用默认背景色并更新翻转卡片颜色
            this.backgroundManager.updateFlipPanelColor(this.backgroundManager.currentBackground);
        }
        
        // 恢复背景图片
        if (settings.backgroundImage) {
            this.backgroundManager.setImage(settings.backgroundImage);
        }
        
        // 恢复动画状态
        if (settings.animationEnabled) {
            this.animationManager.toggle();
        }

        // 恢复滴答声状态
        if (settings.tickSoundEnabled) {
            this.tickSoundManager.toggle();
        }

        // 恢复BGM播放器设置
        if (settings.bgmPlayer) {
            this.bgmPlayerManager.restoreSettings(settings.bgmPlayer);
        }

        // 加载设置后更新状态显示
        this.updateAnimationStatus();
        this.updateTickSoundStatus();
    }

    // 保存当前设置
    saveCurrentSettings() {
        // 提取背景图片URL，排除CSS关键字'none'
        let backgroundImage = null;
        const bgImageStyle = document.body.style.backgroundImage;
        if (bgImageStyle && bgImageStyle !== 'none') {
            const match = bgImageStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match) {
                backgroundImage = match[1];
            }
        }
        
        const settings = {
            backgroundColor: this.backgroundManager.currentBackground,
            backgroundImage: backgroundImage,
            animationEnabled: this.animationManager.enabled,
            tickSoundEnabled: this.tickSoundManager.enabled,
            bgmPlayer: this.bgmPlayerManager.getSettings()
        };
        
        this.settingsStorage.save(settings);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // 确保日期显示被更新
    setTimeout(() => {
        if (window.app && window.app.updateDate) {
            window.app.updateDate();
        }
    }, 500);
});
