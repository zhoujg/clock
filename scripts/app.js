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
        this.pomodoroTimer = new PomodoroTimer(clockManager);
        
        // 设置时钟管理器的滴答声引用
        clockManager.setTickSoundManager(this.tickSoundManager);
        
        this.initializeControls();
        this.initializeColorPanel();
        this.initializeImageInput();
        this.initializeDateDisplay();
        
        // 最后加载保存的设置（这会更新状态显示）
        this.loadSavedSettings();
    }

    initializeDateDisplay() {
        this.updateDate();
        // 每分钟更新一次日期（因为日期可能在午夜改变）
        setInterval(() => this.updateDate(), 60000);
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
        
        document.getElementById('dateText').textContent = dateText;
        document.getElementById('weekText').textContent = weekText;
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
        });

        // 阻止设置面板内点击冒泡
        settingsPanel.addEventListener('click', (e) => {
            e.stopPropagation();
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

        // 加载设置后更新状态显示
        this.updateAnimationStatus();
        this.updateTickSoundStatus();
    }

    // 保存当前设置
    saveCurrentSettings() {
        const settings = {
            backgroundColor: this.backgroundManager.currentBackground,
            backgroundImage: document.body.style.backgroundImage.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1') || null,
            animationEnabled: this.animationManager.enabled,
            tickSoundEnabled: this.tickSoundManager.enabled
        };
        
        this.settingsStorage.save(settings);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
