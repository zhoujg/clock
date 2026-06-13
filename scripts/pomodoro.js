// 番茄钟管理器
class PomodoroTimer {
    constructor(clockManager, achievementSystem) {
        // 默认时间设置（分钟）
        this.workDuration = 25;
        this.shortBreakDuration = 5;
        this.longBreakDuration = 15;
        
        // 当前状态
        this.currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.timeRemaining = this.workDuration * 60; // 剩余时间（秒）
        this.isRunning = false;
        this.intervalId = null;
        this.completedSessions = 0; // 完成的工作周期数
        
        // 时钟管理器引用
        this.clockManager = clockManager;
        
        // 成就系统引用
        this.achievementSystem = achievementSystem;
        
        // DOM 元素
        this.container = null;
        this.display = null;
        this.progress = null;
        this.startBtn = null;
        this.pauseBtn = null;
        this.resetBtn = null;
        this.modeButtons = null;
        this.sessionCount = null;
        
        // 音效
        this.audioContext = null;
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.bindEvents();
        this.updateDisplay();
    }
    
    createUI() {
        // 创建番茄钟容器
        this.container = document.createElement('div');
        this.container.className = 'pomodoro-container';
        this.container.innerHTML = `
            <div class="pomodoro-toggle" id="pomodoroToggle" title="番茄钟">
                🍅
                <span class="pomodoro-status-indicator" id="statusIndicator"></span>
            </div>
            <div class="pomodoro-panel" id="pomodoroPanel">
                <div class="panel-header">
                    <span>🍅 番茄钟</span>
                    <button class="panel-close-btn" id="pomodoroClose" title="关闭">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="panel-content">
                <div class="pomodoro-modes">
                    <button class="mode-btn active" data-mode="work">
                        <span>工作</span>
                        <small>25分钟</small>
                    </button>
                    <button class="mode-btn" data-mode="shortBreak">
                        <span>短休息</span>
                        <small>5分钟</small>
                    </button>
                    <button class="mode-btn" data-mode="longBreak">
                        <span>长休息</span>
                        <small>15分钟</small>
                    </button>
                </div>
                <div class="pomodoro-custom">
                    <label for="customMinutes">自定义时长（分钟）</label>
                    <div class="custom-input-wrapper">
                        <input type="number" id="customMinutes" min="1" max="180" placeholder="输入分钟数" />
                        <button class="custom-start-btn" id="customStartBtn">开始</button>
                    </div>
                </div>
                <div class="pomodoro-progress-bar">
                    <div class="pomodoro-progress-fill" id="progressFill"></div>
                </div>
                <div class="pomodoro-controls">
                    <button class="pomodoro-btn start" id="pomodoroStart">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </button>
                    <button class="pomodoro-btn pause" id="pomodoroPause" style="display: none;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    </button>
                    <button class="pomodoro-btn reset" id="pomodoroReset">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                    </button>
                </div>
                <div class="pomodoro-sessions">
                    <span>已完成 </span>
                    <span id="sessionCount">0</span>
                    <span> 个番茄</span>
                </div>
                </div>
            </div>
        `;
        
        // 插入到页面中
        document.body.appendChild(this.container);
        
        // 获取DOM元素引用
        this.toggle = document.getElementById('pomodoroToggle');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.progressFill = document.getElementById('progressFill');
        this.startBtn = document.getElementById('pomodoroStart');
        this.pauseBtn = document.getElementById('pomodoroPause');
        this.resetBtn = document.getElementById('pomodoroReset');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.sessionCount = document.getElementById('sessionCount');
        this.panel = document.getElementById('pomodoroPanel');
    }
    
    bindEvents() {
        // 切换面板显示
        const panel = document.getElementById('pomodoroPanel');
        const close = document.getElementById('pomodoroClose');
        
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggle.classList.toggle('active');
            panel.classList.toggle('active');
            
            // 关闭其他面板
            const settingsPanel = document.getElementById('settingsPanel');
            const settingsToggle = document.getElementById('settingsToggle');
            const musicPanel = document.getElementById('musicPanel');
            const musicBtn = document.getElementById('musicBtn');
            
            if (settingsPanel) {
                settingsPanel.classList.remove('active');
            }
            if (settingsToggle) {
                settingsToggle.classList.remove('active');
            }
            if (musicPanel) {
                musicPanel.classList.remove('active');
            }
            if (musicBtn) {
                musicBtn.classList.remove('active');
            }
        });
        
        close.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.remove('active');
            this.toggle.classList.remove('active');
        });
        
        // 阻止面板内点击冒泡
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 控制按钮
        this.startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.start();
        });
        this.pauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pause();
        });
        this.resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reset();
        });
        
        // 模式切换
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.getAttribute('data-mode');
                this.setMode(mode);
            });
        });
        
        // 自定义时长
        const customStartBtn = document.getElementById('customStartBtn');
        const customMinutesInput = document.getElementById('customMinutes');
        
        customStartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const minutes = parseInt(customMinutesInput.value);
            if (minutes && minutes > 0 && minutes <= 180) {
                this.startCustomTimer(minutes);
            } else {
                alert('请输入1-180之间的有效分钟数');
            }
        });
        
        // 按回车键也可以开始自定义倒计时
        customMinutesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
                customStartBtn.click();
            }
        });
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.isRunning = false;
        clearInterval(this.intervalId);
        
        // 重置自定义状态
        this.isCustomMode = false;
        
        // 设置对应的时间
        switch(mode) {
            case 'work':
                this.timeRemaining = this.workDuration * 60;
                break;
            case 'shortBreak':
                this.timeRemaining = this.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.timeRemaining = this.longBreakDuration * 60;
                break;
        }
        
        // 更新按钮状态
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
        });
        
        // 更新按钮显示
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        
        // 重置状态
        this.toggle.classList.remove('running-work', 'running-break');
        this.statusIndicator.className = 'pomodoro-status-indicator';
        
        this.updateDisplay();
        
        // 切换回正常时钟模式
        this.clockManager.switchToNormalMode();
    }
    
    startCustomTimer(minutes) {
        // 设置自定义模式
        this.isCustomMode = true;
        this.customDuration = minutes;
        this.currentMode = 'custom';
        this.timeRemaining = minutes * 60;
        
        // 清除所有模式按钮的选中状态
        this.modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 更新显示
        this.updateDisplay();
        
        // 立即开始倒计时
        this.start();
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        
        // 更新按钮状态
        this.toggle.classList.add(this.currentMode === 'work' ? 'running-work' : 'running-break');
        this.statusIndicator.className = 'pomodoro-status-indicator ' + (this.currentMode === 'work' ? 'working' : 'breaking');
        
        // 自动收起面板
        setTimeout(() => {
            this.panel.classList.remove('active');
        }, 500);
        
        this.intervalId = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            if (this.timeRemaining <= 0) {
                this.complete();
            }
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        
        // 切换回正常时钟模式
        this.clockManager.switchToNormalMode();
    }
    
    reset() {
        this.pause();
        this.setMode(this.currentMode);
    }
    
    complete() {
        this.pause();
        this.playSound();
        
        // 重置按钮状态
        this.toggle.classList.remove('running-work', 'running-break');
        this.statusIndicator.className = 'pomodoro-status-indicator';
        
        // 如果是自定义模式，完成后不自动切换
        if (this.isCustomMode) {
            this.showNotification();
            this.panel.classList.add('active');
            // 清空输入框
            const customMinutesInput = document.getElementById('customMinutes');
            if (customMinutesInput) {
                customMinutesInput.value = '';
            }
            return;
        }
        
        // 如果完成的是工作周期
        if (this.currentMode === 'work') {
            this.completedSessions++;
            this.sessionCount.textContent = this.completedSessions;
            
            // 触发成就系统
            if (this.achievementSystem) {
                this.achievementSystem.onPomodoroComplete(this.workDuration);
            }
            
            // 每完成4个工作周期后，进入长休息
            if (this.completedSessions % 4 === 0) {
                this.setMode('longBreak');
            } else {
                this.setMode('shortBreak');
            }
        } else {
            // 休息完成后，回到工作模式
            this.setMode('work');
        }
        
        // 显示通知
        this.showNotification();
        
        // 自动展开面板
        this.panel.classList.add('active');
    }
    
    updateDisplay() {
        // 更新主时钟显示
        if (this.isRunning) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            this.clockManager.updatePomodoroDisplay(minutes, seconds);
        }
        
        // 更新进度条
        const totalTime = this.getTotalTime();
        const progress = ((totalTime - this.timeRemaining) / totalTime) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // 根据模式设置进度条颜色
        if (this.currentMode === 'work') {
            this.progressFill.classList.remove('break');
        } else {
            this.progressFill.classList.add('break');
        }
    }
    
    getTotalTime() {
        if (this.isCustomMode) {
            return this.customDuration * 60;
        }
        
        switch(this.currentMode) {
            case 'work':
                return this.workDuration * 60;
            case 'shortBreak':
                return this.shortBreakDuration * 60;
            case 'longBreak':
                return this.longBreakDuration * 60;
            default:
                return this.workDuration * 60;
        }
    }
    
    playSound() {
        // 创建音频上下文
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 播放提示音
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
        
        // 播放三次提示音
        setTimeout(() => {
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(this.audioContext.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            osc2.start(this.audioContext.currentTime);
            osc2.stop(this.audioContext.currentTime + 0.3);
        }, 600);
    }
    
    showNotification() {
        // 请求通知权限
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.createNotification();
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.createNotification();
                    }
                });
            }
        }
    }
    
    createNotification() {
        let title, body;
        
        if (this.isCustomMode) {
            title = '⏰ 倒计时结束';
            body = `${this.customDuration}分钟倒计时已完成！`;
        } else if (this.currentMode === 'work') {
            title = '🍅 番茄钟完成';
            body = '恭喜完成一个工作周期！休息一下吧。';
        } else {
            title = '⏰ 休息结束';
            body = '休息时间结束，准备开始新的工作周期！';
        }
        
        new Notification(title, {
            body: body,
            icon: '🍅'
        });
    }
    
    // 设置时间配置
    setConfig(config) {
        if (config.workDuration) this.workDuration = config.workDuration;
        if (config.shortBreakDuration) this.shortBreakDuration = config.shortBreakDuration;
        if (config.longBreakDuration) this.longBreakDuration = config.longBreakDuration;
        this.setMode(this.currentMode);
    }
}
