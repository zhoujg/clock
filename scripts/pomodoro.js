// 番茄钟 — 聚焦之环 (Focus Ring)
// 颠覆性设计：无面板，光环进度，粒子环绕，背景呼吸

class PomodoroTimer {
    constructor(clockManager, dailyStories = null) {
        // 时间设置（分钟）
        this.workDuration = 25;
        this.shortBreakDuration = 5;
        this.longBreakDuration = 15;

        // 当前状态
        this.currentMode = 'work'; // 'work', 'shortBreak', 'longBreak', 'custom'
        this.timeRemaining = this.workDuration * 60;
        this.isRunning = false;
        this.intervalId = null;
        this.completedSessions = 0;
        this.isCustomMode = false;
        this.customDuration = 0;

        // 系统引用
        this.clockManager = clockManager;
        this.dailyStories = dailyStories;

        // Canvas 渲染
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.ringGlow = 0;       // 光环发光强度 (0-1)
        this.completionFlash = 0; // 完成时闪光 (0-1)

        // DOM 元素
        this.toggle = null;
        this.statusIndicator = null;
        this.sessionCount = null;
        this.sessionDots = null;

        // 音效
        this.audioContext = null;

        // 径向菜单
        this._radialOpen = false;
        this._radialEl = null;

        // 完成过渡动画
        this._celebrationTimer = null;

        // 背景呼吸层
        this._breathOverlay = null;

        // 完成声音播放标记（防止重复播放）
        this._soundPlayed = false;

        this.init();
    }

    // ========== 初始化 ==========

    init() {
        this.createUI();
        this.initCanvas();
        this.initBreathOverlay();
        this.bindEvents();
        this.updateDisplay();
        this.createRadialMenu();
        this.startRenderLoop();
    }

    createUI() {
        this.toggle = document.getElementById('pomodoroToggle');
        this.statusIndicator = document.getElementById('statusIndicator');
        
        // 会话计数点容器
        this.sessionDots = document.getElementById('pomodoroSessionDots');
        if (!this.sessionDots) {
            this.sessionDots = document.createElement('div');
            this.sessionDots.id = 'pomodoroSessionDots';
            this.sessionDots.className = 'pomodoro-session-dots';
            if (this.toggle) {
                this.toggle.appendChild(this.sessionDots);
            }
        }
    }

    initCanvas() {
        this.canvas = document.getElementById('pomodoroCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'pomodoroCanvas';
            this.canvas.className = 'pomodoro-canvas';
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    initBreathOverlay() {
        this._breathOverlay = document.getElementById('pomodoroBreath');
        if (!this._breathOverlay) {
            this._breathOverlay = document.createElement('div');
            this._breathOverlay.id = 'pomodoroBreath';
            this._breathOverlay.className = 'pomodoro-breath';
            document.body.appendChild(this._breathOverlay);
        }
    }

    // ========== 事件绑定 ==========

    bindEvents() {
        if (!this.toggle) return;

        let pressTimer = null;
        let isLongPress = false;

        // 指针按下 — 启动长按计时
        this.toggle.addEventListener('pointerdown', (e) => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                this.promptCustomDuration();
            }, 500);
        });

        // 指针释放 — 短按逻辑
        this.toggle.addEventListener('pointerup', (e) => {
            clearTimeout(pressTimer);
            if (isLongPress) return;
            if (this._radialOpen) return;

            e.stopPropagation();
            this.handleTap();
        });

        // 指针离开 — 取消长按
        this.toggle.addEventListener('pointerleave', () => {
            clearTimeout(pressTimer);
        });

        // 全局点击 — 关闭径向菜单
        document.addEventListener('click', (e) => {
            if (this._radialOpen && !e.target.closest('.pomodoro-radial-menu') && !e.target.closest('#pomodoroToggle')) {
                this.hideRadialMenu();
            }
        });
    }

    // 短按处理
    handleTap() {
        if (this.isRunning) {
            // 运行中 → 暂停
            this.pause();
        } else if (this.timeRemaining <= 0 || (this.timeRemaining === this.getTotalTime() && !this.isCustomMode)) {
            // 未开始或已完成 → 开始工作模式
            this.setMode('work');
            this.start();
        } else {
            // 暂停中 → 继续
            this.start();
        }
    }

    // ========== 径向模式菜单 ==========

    createRadialMenu() {
        const menu = document.createElement('div');
        menu.id = 'pomodoroRadial';
        menu.className = 'pomodoro-radial-menu';
        menu.innerHTML = `
            <button class="radial-item" data-mode="work">
                <span class="radial-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                </span>
                <span class="radial-label">工作</span>
                <span class="radial-time">25min</span>
            </button>
            <button class="radial-item" data-mode="shortBreak">
                <span class="radial-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                    </svg>
                </span>
                <span class="radial-label">短休</span>
                <span class="radial-time">5min</span>
            </button>
            <button class="radial-item" data-mode="longBreak">
                <span class="radial-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                </span>
                <span class="radial-label">长休</span>
                <span class="radial-time">15min</span>
            </button>
            <button class="radial-item" data-mode="custom" id="radialCustomBtn">
                <span class="radial-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2"/>
                    </svg>
                </span>
                <span class="radial-label">自定义</span>
                <span class="radial-time" id="radialCustomTime">${parseInt(localStorage.getItem('pomodoroCustomDuration')) || 25}min</span>
            </button>
        `;
        document.body.appendChild(menu);
        this._radialEl = menu;

        // 绑定菜单项点击
        menu.querySelectorAll('.radial-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = item.dataset.mode;
                if (mode === 'custom') {
                    this.promptCustomDuration();
                } else {
                    this.setMode(mode);
                    this.start();
                }
                this.hideRadialMenu();
            });
        });
    }

    showRadialMenu(e) {
        if (this._radialOpen) return;
        
        const btnRect = this.toggle.getBoundingClientRect();
        const cx = btnRect.left + btnRect.width / 2;
        const cy = btnRect.bottom + 8;     // 按钮下方 8px 为弧心
        
        // 四个按钮位置：在按钮下方呈弧形展开（左侧→右侧）
        const items = this._radialEl.querySelectorAll('.radial-item');
        const radius = 100;
        const startAngle = Math.PI * 0.75;  // 135° 左侧偏下
        const endAngle = Math.PI * 0.25;    // 45° 右侧偏下
        
        items.forEach((item, i) => {
            const angle = startAngle + ((endAngle - startAngle) / (items.length - 1)) * i;
            const ix = cx + radius * Math.cos(angle) - 32;
            const iy = cy + radius * Math.sin(angle) - 32;
            item.style.left = ix + 'px';
            item.style.top = iy + 'px';
        });
        
        this._radialEl.style.setProperty('--origin-x', cx + 'px');
        this._radialEl.style.setProperty('--origin-y', cy + 'px');
        this._radialEl.classList.add('active');
        this._radialOpen = true;
        this.toggle.classList.add('radial-open');
    }

    hideRadialMenu() {
        this._radialEl.classList.remove('active');
        this._radialOpen = false;
        this.toggle.classList.remove('radial-open');
    }

    promptCustomDuration() {
        // 读取上次保存的自定义时长
        const saved = parseInt(localStorage.getItem('pomodoroCustomDuration')) || 25;
        const defaultVal = Math.min(Math.max(saved, 1), 180);

        const input = document.createElement('div');
        input.className = 'pomodoro-custom-overlay';
        input.innerHTML = `
            <div class="custom-dialog">
                <h3>自定义时长</h3>
                <div class="custom-input-row">
                    <input type="number" id="customMinutesInput" min="1" max="180" value="${defaultVal}" autofocus />
                    <span>分钟</span>
                </div>
                <div class="custom-dialog-btns">
                    <button class="custom-dialog-cancel">取消</button>
                    <button class="custom-dialog-confirm">开始</button>
                </div>
            </div>
        `;
        document.body.appendChild(input);
        
        const numInput = input.querySelector('#customMinutesInput');
        numInput.focus();
        numInput.select();

        const cleanup = () => {
            document.removeEventListener('click', outsideClick);
            input.remove();
        };

        const outsideClick = (ev) => {
            if (!input.contains(ev.target)) cleanup();
        };
        setTimeout(() => document.addEventListener('click', outsideClick), 100);

        input.querySelector('.custom-dialog-confirm').addEventListener('click', () => {
            const minutes = parseInt(numInput.value);
            if (minutes && minutes > 0 && minutes <= 180) {
                this.startCustomTimer(minutes);
                cleanup();
            }
        });

        input.querySelector('.custom-dialog-cancel').addEventListener('click', cleanup);

        numInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                input.querySelector('.custom-dialog-confirm').click();
            } else if (ev.key === 'Escape') {
                cleanup();
            }
        });
    }

    // ========== 模式 & 控制 ==========

    setMode(mode) {
        this.currentMode = mode;
        this.isRunning = false;
        this.isCustomMode = false;
        clearInterval(this.intervalId);

        switch (mode) {
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

        this._soundPlayed = false;
        this.completionFlash = 0;
        this.toggle.classList.remove('running-work', 'running-break');
        this.statusIndicator.className = 'pomodoro-status-indicator';
        this.clockManager.switchToNormalMode();
        this.updateBreathOverlay();
        this.updateDisplay();
    }

    startCustomTimer(minutes) {
        this.isCustomMode = true;
        this.customDuration = minutes;
        this.currentMode = 'custom';
        this.timeRemaining = minutes * 60;
        this._soundPlayed = false;
        // 记住本次自定义时长
        localStorage.setItem('pomodoroCustomDuration', minutes);
        // 更新菜单中的自定义时长显示
        const radialTime = document.getElementById('radialCustomTime');
        if (radialTime) radialTime.textContent = minutes + 'min';
        this.updateDisplay();
        this.start();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // 按钮状态
        this.toggle.classList.add(
            this.currentMode === 'work' || this.isCustomMode ? 'running-work' : 'running-break'
        );
        this.statusIndicator.className = 'pomodoro-status-indicator ' +
            (this.currentMode === 'work' || this.isCustomMode ? 'working' : 'breaking');
        this.toggle.classList.add('is-running');

        // 呼吸层
        this.updateBreathOverlay();

        // 倒计时
        this.intervalId = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            this.ringGlow = Math.min(1, this.ringGlow + 0.03);

            if (this.timeRemaining <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.toggle.classList.remove('is-running');
        this.toggle.classList.remove('running-work', 'running-break');
        this.statusIndicator.className = 'pomodoro-status-indicator';
        this.ringGlow = Math.max(0, this.ringGlow - 0.05);
        this.clockManager.switchToNormalMode();
        this.updateBreathOverlay();
    }

    reset() {
        this.pause();
        this.setMode(this.currentMode);
        this.ringGlow = 0;
        this.completionFlash = 0;
    }

    complete() {
        this.pause();

        // 防止重复触发
        if (this._soundPlayed) return;
        this._soundPlayed = true;

        this.playSound();

        // 完成闪光
        this.completionFlash = 1;
        this.ringGlow = 1;

        // 粒子爆发
        this.spawnBurstParticles();

        // 自定义模式
        if (this.isCustomMode) {
            this.showNotification();
            this.scheduleCelebrationEnd();
            return;
        }

        // 工作完成
        if (this.currentMode === 'work') {
            this.completedSessions++;
            this.updateSessionDots();

            if (this.dailyStories && this.dailyStories.onPomodoroComplete) {
                this.dailyStories.onPomodoroComplete(this.workDuration);
            }

            this.showNotification();

            // 自动切换
            const nextMode = this.completedSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
            setTimeout(() => {
                this.setMode(nextMode);
                this.completionFlash = 0;
                this.ringGlow = 0;
                this.start();
            }, 2000);
        } else {
            // 休息完成
            this.showNotification();
            setTimeout(() => {
                this.setMode('work');
                this.completionFlash = 0;
                this.ringGlow = 0;
            }, 2000);
        }
    }

    scheduleCelebrationEnd() {
        clearTimeout(this._celebrationTimer);
        this._celebrationTimer = setTimeout(() => {
            this.completionFlash = 0;
            this.ringGlow = 0;
        }, 2500);
    }

    // ========== 显示更新 ==========

    updateDisplay() {
        if (this.isRunning) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            this.clockManager.updatePomodoroDisplay(minutes, seconds);
        } else if (this.timeRemaining <= 0) {
            // 显示完成状态
        }
    }

    getTotalTime() {
        if (this.isCustomMode) return this.customDuration * 60;
        switch (this.currentMode) {
            case 'work': return this.workDuration * 60;
            case 'shortBreak': return this.shortBreakDuration * 60;
            case 'longBreak': return this.longBreakDuration * 60;
            default: return this.workDuration * 60;
        }
    }

    updateSessionDots() {
        if (!this.sessionDots) return;
        this.sessionDots.innerHTML = '';
        const total = Math.min(this.completedSessions, 8);
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('span');
            dot.className = 'session-dot';
            if (i >= total - 4) dot.classList.add('recent');
            this.sessionDots.appendChild(dot);
        }
        this.sessionDots.style.display = total > 0 ? 'flex' : 'none';
    }

    updateBreathOverlay() {
        if (!this._breathOverlay) return;
        this._breathOverlay.classList.remove('breath-work', 'breath-break', 'breath-active');
        
        if (this.isRunning) {
            this._breathOverlay.classList.add('breath-active');
            if (this.currentMode === 'work' || this.isCustomMode) {
                this._breathOverlay.classList.add('breath-work');
            } else {
                this._breathOverlay.classList.add('breath-break');
            }
        }
    }

    // ========== Canvas 渲染（聚焦之环 + 粒子） ==========

    startRenderLoop() {
        const loop = () => {
            this.renderFrame();
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    renderFrame() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        ctx.clearRect(0, 0, w, h);

        // 找到时钟中心
        const tickEl = document.querySelector('.tick');
        if (!tickEl) return;
        const rect = tickEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clockRadius = Math.max(rect.width, rect.height) / 1.2;

        // 光环衰减
        if (!this.isRunning) {
            this.ringGlow = Math.max(0, this.ringGlow - 0.02);
        }
        this.completionFlash = Math.max(0, this.completionFlash - 0.008);

        if (this.completionFlash > 0.01 || this.ringGlow > 0.01 || this.isRunning) {
            this.drawFocusRing(ctx, cx, cy, clockRadius);
        }

        // 粒子
        this.updateParticles(cx, cy, clockRadius);
        this.drawParticles(ctx);

        // 完成闪光
        if (this.completionFlash > 0.01) {
            this.drawCompletionFlash(ctx, cx, cy, clockRadius);
        }
    }

    drawFocusRing(ctx, cx, cy, radius) {
        const progress = 1 - (this.getTotalTime() > 0 ? this.timeRemaining / this.getTotalTime() : 0);
        const ringRadius = radius * 0.85;
        const startAngle = -Math.PI / 2; // 12点钟方向
        const endAngle = startAngle + (Math.PI * 2 * progress);

        const isWork = this.currentMode === 'work' || this.isCustomMode;

        // 外发光（多层光晕）
        for (let i = 3; i >= 0; i--) {
            const blur = 4 + i * 6;
            const alpha = (0.06 + i * 0.03) * this.ringGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, startAngle, endAngle);
            ctx.strokeStyle = isWork
                ? `rgba(255, 159, 67, ${alpha})`
                : `rgba(78, 205, 196, ${alpha})`;
            ctx.lineWidth = 2 + i * 2;
            ctx.lineCap = 'round';
            ctx.shadowColor = isWork
                ? `rgba(255, 159, 67, ${alpha * 1.5})`
                : `rgba(78, 205, 196, ${alpha * 1.5})`;
            ctx.shadowBlur = blur;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // 主环
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, startAngle, endAngle);
        const gradient = ctx.createConicalGradient
            ? ctx.createConicalGradient(startAngle, cx, cy)
            : null;

        if (gradient) {
            // Conic gradient if supported
            if (isWork) {
                gradient.addColorStop(0, 'rgba(255, 159, 67, 0.9)');
                gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.9)');
                gradient.addColorStop(1, 'rgba(255, 159, 67, 0.9)');
            } else {
                gradient.addColorStop(0, 'rgba(78, 205, 196, 0.9)');
                gradient.addColorStop(0.5, 'rgba(0, 184, 212, 0.9)');
                gradient.addColorStop(1, 'rgba(78, 205, 196, 0.9)');
            }
            ctx.strokeStyle = gradient;
        } else {
            ctx.strokeStyle = isWork
                ? `rgba(255, 159, 67, ${0.7 * this.ringGlow})`
                : `rgba(78, 205, 196, ${0.7 * this.ringGlow})`;
        }
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 环端发光点
        if (progress > 0) {
            const ex = cx + ringRadius * Math.cos(endAngle);
            const ey = cy + ringRadius * Math.sin(endAngle);
            const glowGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 12);
            if (isWork) {
                glowGrad.addColorStop(0, `rgba(255, 200, 100, ${0.9 * this.ringGlow})`);
                glowGrad.addColorStop(0.5, `rgba(255, 159, 67, ${0.5 * this.ringGlow})`);
                glowGrad.addColorStop(1, `rgba(255, 159, 67, 0)`);
            } else {
                glowGrad.addColorStop(0, `rgba(130, 230, 220, ${0.9 * this.ringGlow})`);
                glowGrad.addColorStop(0.5, `rgba(78, 205, 196, ${0.5 * this.ringGlow})`);
                glowGrad.addColorStop(1, `rgba(78, 205, 196, 0)`);
            }
            ctx.beginPath();
            ctx.arc(ex, ey, 12, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();
        }
    }

    // 粒子系统
    updateParticles(cx, cy, radius) {
        const isWork = this.currentMode === 'work' || this.isCustomMode;
        const ringRadius = radius * 0.85;
        const targetCount = this.isRunning ? 25 : 5;

        // 生成粒子
        while (this.particles.length < targetCount) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                angle: angle,
                distance: ringRadius + (Math.random() - 0.5) * 30,
                speed: (Math.random() * 0.005 + 0.003) * (isWork ? 1.5 : 0.6),
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.4 + 0.2,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.05 + 0.02,
            });
        }

        // 超出则移除
        while (this.particles.length > targetCount) {
            this.particles.shift();
        }

        // 更新位置
        const progress = this.getTotalTime() > 0 ? 1 - this.timeRemaining / this.getTotalTime() : 0;
        const maxAngle = -Math.PI / 2 + Math.PI * 2 * progress;

        for (const p of this.particles) {
            p.angle += p.speed;
            p.pulse += p.pulseSpeed;

            // 粒子跟随光环进度
            if (this.isRunning) {
                while (p.angle > maxAngle + Math.PI * 2) p.angle -= Math.PI * 2;
                if (p.angle > maxAngle && p.angle < maxAngle + Math.PI * 0.5) {
                    p.opacity = Math.max(0.05, p.opacity - 0.01);
                }
            }
        }
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            const isWork = this.currentMode === 'work' || this.isCustomMode;
            const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse)) * this.ringGlow;
            if (alpha < 0.03) continue;

            // 相对于时钟中心的位置
            const px = this._clockCx + p.distance * Math.cos(p.angle);
            const py = this._clockCy + p.distance * Math.sin(p.angle);

            const grad = ctx.createRadialGradient(px, py, 0, px, py, p.radius * 3);
            if (isWork) {
                grad.addColorStop(0, `rgba(255, 200, 130, ${alpha})`);
                grad.addColorStop(1, `rgba(255, 159, 67, 0)`);
            } else {
                grad.addColorStop(0, `rgba(130, 230, 220, ${alpha})`);
                grad.addColorStop(1, `rgba(78, 205, 196, 0)`);
            }
            ctx.beginPath();
            ctx.arc(px, py, p.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    // 粒子爆发（完成时）
    spawnBurstParticles() {
        const burstCount = 40;
        const isWork = this.currentMode === 'work' || this.isCustomMode;
        for (let i = 0; i < burstCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 0;
            this.particles.push({
                angle: angle,
                distance: dist,
                speed: (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
                radius: Math.random() * 3 + 2,
                opacity: 1,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.08 + 0.04,
                burst: true,
            });
        }

        // 爆发粒子渐隐
        setTimeout(() => {
            this.particles = this.particles.filter(p => !p.burst);
        }, 2000);
    }

    drawCompletionFlash(ctx, cx, cy, radius) {
        const flashAlpha = this.completionFlash * 0.4;
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.5);
        const isWork = this.currentMode === 'work' || this.isCustomMode;

        if (isWork) {
            grad.addColorStop(0, `rgba(255, 200, 100, ${flashAlpha})`);
            grad.addColorStop(0.5, `rgba(255, 159, 67, ${flashAlpha * 0.5})`);
        } else {
            grad.addColorStop(0, `rgba(130, 230, 220, ${flashAlpha})`);
            grad.addColorStop(0.5, `rgba(78, 205, 196, ${flashAlpha * 0.5})`);
        }
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // 时钟中心缓存
    get _clockCx() {
        const tickEl = document.querySelector('.tick');
        if (!tickEl) return window.innerWidth / 2;
        const rect = tickEl.getBoundingClientRect();
        return rect.left + rect.width / 2;
    }

    get _clockCy() {
        const tickEl = document.querySelector('.tick');
        if (!tickEl) return window.innerHeight / 2;
        const rect = tickEl.getBoundingClientRect();
        return rect.top + rect.height / 2;
    }

    // ========== 音效 & 通知 ==========

    playSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // 完成音效：三音符上行和弦
            const notes = this.currentMode === 'work' ? [523, 659, 784] : [784, 659, 523]; // C5-E5-G5 上行
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const startTime = this.audioContext.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0.25, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } catch (e) {
            // 静默处理
        }
    }

    showNotification() {
        if (!('Notification' in window)) return;

        const send = () => {
            let title, body;
            if (this.isCustomMode) {
                title = '⏰ 倒计时结束';
                body = `${this.customDuration}分钟倒计时已完成！`;
            } else if (this.currentMode === 'work') {
                title = '🍅 专注完成！';
                body = `完成第 ${this.completedSessions} 个番茄，${this.completedSessions % 4 === 0 ? '该长休息啦~' : '休息一下吧~'}`;
            } else if (this.currentMode === 'shortBreak') {
                title = '☕ 休息结束';
                body = '准备开始新的工作周期！';
            } else {
                title = '🌿 长休息结束';
                body = '精力充沛，继续前进！';
            }
            new Notification(title, { body, icon: '🍅' });
        };

        if (Notification.permission === 'granted') {
            send();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => { if (p === 'granted') send(); });
        }
    }

    // ========== 配置 ==========

    setConfig(config) {
        if (config.workDuration) this.workDuration = config.workDuration;
        if (config.shortBreakDuration) this.shortBreakDuration = config.shortBreakDuration;
        if (config.longBreakDuration) this.longBreakDuration = config.longBreakDuration;
        if (!this.isRunning) {
            this.setMode(this.currentMode);
        }
    }
}
