// 番茄钟 — 聚焦之环 (Focus Ring)
// 交互：单击 开始/暂停，长按 自定义时长，双击 重启

window.PomodoroTimer = class PomodoroTimer {
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
        this.ringGlow = 0;
        this.completionFlash = 0;

        // DOM 元素
        this.toggle = null;
        this.statusIndicator = null;
        this.sessionDots = null;

        // 音效
        this.audioContext = null;

        // 完成过渡动画
        this._celebrationTimer = null;

        // 背景呼吸层
        this._breathOverlay = null;

        // 完成声音播放标记
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
        this.startRenderLoop();
    }

    createUI() {
        this.toggle = document.getElementById('pomodoroToggle');
        if (!this.toggle) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                this.toggle = document.createElement('button');
                this.toggle.id = 'pomodoroToggle';
                this.toggle.className = 'bottom-tool-btn';
                this.toggle.title = '番茄钟（单击开始/暂停，长按自定义，双击重启）';
                this.toggle.innerHTML = `
                    <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5c-4.4 0-8 3.6-8 8s3.6 7 8 7 8-2.6 8-7-3.6-8-8-8z"/>
                        <path d="M12 5c0-2 1.5-3.5 3-4 .5-.1 1 .2 1 .7 0 1-1 2-2 3"/>
                        <path d="M11 5c0-2-1.5-3.5-3-4-.5-.1-1 .2-1 .7 0 1 1 2 2 3"/>
                        <ellipse cx="9" cy="10" rx="1.5" ry="1" opacity="0.25" fill="currentColor"/>
                    </svg>
                    <span class="tool-btn-label">番茄</span>
                    <span class="pomodoro-status-indicator" id="statusIndicator"></span>
                `;
                if (toolbar.firstChild) {
                    toolbar.insertBefore(this.toggle, toolbar.firstChild);
                } else {
                    toolbar.appendChild(this.toggle);
                }
            }
        }

        this.statusIndicator = document.getElementById('statusIndicator');

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
        let lastTapTime = 0;

        // 指针按下 — 长按打开自定义时长
        this.toggle.addEventListener('pointerdown', (e) => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                this.promptCustomDuration();
            }, 500);
        });

        // 指针释放 — 短按/双击
        this.toggle.addEventListener('pointerup', (e) => {
            clearTimeout(pressTimer);
            if (isLongPress) return;

            e.stopPropagation();

            // 双击检测（300ms 内两次点击 → 重启）
            const now = Date.now();
            if (now - lastTapTime < 300) {
                this.reset();
                this.setMode(this.currentMode);
                lastTapTime = 0;
                return;
            }
            lastTapTime = now;

            // 短按 → 开始/暂停
            this.handleTap();
        });

        // 指针离开 — 取消长按
        this.toggle.addEventListener('pointerleave', () => {
            clearTimeout(pressTimer);
        });
    }

    // 短按：开始 ↔ 暂停
    handleTap() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    // ========== 自定义时长弹窗 ==========

    promptCustomDuration() {
        const saved = parseInt(localStorage.getItem('pomodoroCustomDuration')) || 25;
        const defaultVal = Math.min(Math.max(saved, 1), 180);

        const overlay = document.createElement('div');
        overlay.className = 'pomodoro-custom-overlay';
        overlay.innerHTML = `
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
        document.body.appendChild(overlay);

        const numInput = overlay.querySelector('#customMinutesInput');
        numInput.focus();
        numInput.select();

        const cleanup = () => {
            document.removeEventListener('click', outsideClick);
            overlay.remove();
        };

        const outsideClick = (ev) => {
            if (!overlay.contains(ev.target)) cleanup();
        };
        setTimeout(() => document.addEventListener('click', outsideClick), 100);

        overlay.querySelector('.custom-dialog-confirm').addEventListener('click', () => {
            const minutes = parseInt(numInput.value);
            if (minutes && minutes > 0 && minutes <= 180) {
                this.startCustomTimer(minutes);
                cleanup();
            }
        });

        overlay.querySelector('.custom-dialog-cancel').addEventListener('click', cleanup);

        numInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                overlay.querySelector('.custom-dialog-confirm').click();
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
        this.toggle.classList.remove('running-work', 'running-break', 'paused');
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
        localStorage.setItem('pomodoroCustomDuration', minutes);
        this.updateDisplay();
        this.start();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        this.toggle.classList.remove('paused');
        this.toggle.classList.add(
            this.currentMode === 'work' || this.isCustomMode ? 'running-work' : 'running-break'
        );
        this.statusIndicator.className = 'pomodoro-status-indicator ' +
            (this.currentMode === 'work' || this.isCustomMode ? 'status-work' : 'status-break');
        this.toggle.classList.add('is-running');

        this.updateBreathOverlay();

        this.intervalId = setInterval(() => {
            this.timeRemaining--;
            this.ringGlow = Math.min(1, this.ringGlow + 0.03);
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
        this.toggle.classList.remove('is-running');
        this.toggle.classList.remove('running-work', 'running-break');
        this.toggle.classList.add('paused');
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
        this.toggle.classList.remove('paused');
    }

    complete() {
        this.pause();

        if (this._soundPlayed) return;
        this._soundPlayed = true;

        this.playSound();
        this.completionFlash = 1;
        this.ringGlow = 1;
        this.spawnBurstParticles();

        if (this.isCustomMode) {
            this.showNotification();
            this.scheduleCelebrationEnd();
            return;
        }

        if (this.currentMode === 'work') {
            this.completedSessions++;
            this.updateSessionDots();

            if (this.dailyStories && this.dailyStories.onPomodoroComplete) {
                this.dailyStories.onPomodoroComplete(this.workDuration);
            }

            this.showNotification();

            const nextMode = this.completedSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
            setTimeout(() => {
                this.setMode(nextMode);
                this.completionFlash = 0;
                this.ringGlow = 0;
                this.start();
            }, 2000);
        } else {
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

    // ========== Canvas 渲染 ==========

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

        const tickEl = document.querySelector('.tick');
        if (!tickEl) return;
        const rect = tickEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clockRadius = Math.max(rect.width, rect.height) / 1.2;

        if (!this.isRunning) {
            this.ringGlow = Math.max(0, this.ringGlow - 0.02);
        }
        this.completionFlash = Math.max(0, this.completionFlash - 0.008);

        if (this.completionFlash > 0.01 || this.ringGlow > 0.01 || this.isRunning) {
            this.drawFocusRing(ctx, cx, cy, clockRadius);
        }

        this.updateParticles(cx, cy, clockRadius);
        this.drawParticles(ctx);

        if (this.completionFlash > 0.01) {
            this.drawCompletionFlash(ctx, cx, cy, clockRadius);
        }
    }

    drawFocusRing(ctx, cx, cy, radius) {
        const progress = 1 - (this.getTotalTime() > 0 ? this.timeRemaining / this.getTotalTime() : 0);
        const ringRadius = radius * 0.85;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * progress);

        const isWork = this.currentMode === 'work' || this.isCustomMode;

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

        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, startAngle, endAngle);
        ctx.strokeStyle = isWork
            ? `rgba(255, 159, 67, ${0.7 * this.ringGlow})`
            : `rgba(78, 205, 196, ${0.7 * this.ringGlow})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();

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

    updateParticles(cx, cy, radius) {
        const isWork = this.currentMode === 'work' || this.isCustomMode;
        const ringRadius = radius * 0.85;
        const targetCount = this.isRunning ? 25 : 5;

        while (this.particles.length < targetCount) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                distance: ringRadius + (Math.random() - 0.5) * 30,
                speed: (Math.random() * 0.005 + 0.003) * (isWork ? 1.5 : 0.6),
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.4 + 0.2,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.05 + 0.02,
            });
        }

        while (this.particles.length > targetCount) {
            this.particles.shift();
        }

        const progress = this.getTotalTime() > 0 ? 1 - this.timeRemaining / this.getTotalTime() : 0;
        const maxAngle = -Math.PI / 2 + Math.PI * 2 * progress;

        for (const p of this.particles) {
            p.angle += p.speed;
            p.pulse += p.pulseSpeed;

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

    spawnBurstParticles() {
        const burstCount = 40;
        for (let i = 0; i < burstCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                angle: angle,
                distance: 0,
                speed: (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
                radius: Math.random() * 3 + 2,
                opacity: 1,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.08 + 0.04,
                burst: true,
            });
        }

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

            const notes = this.currentMode === 'work' ? [523, 659, 784] : [784, 659, 523];
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
        } catch (e) {}
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
};
