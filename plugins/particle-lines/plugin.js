/**
 * 粒子线条动画插件 — TIME-ART 极简专注与数字流派艺术
 *
 * 参照 TIME-ART：内置四套艺术算法模组，粒子在数学波形的牵引下往复律动，
 * 搭载 HSL 全彩光谱、动态拖尾残影和辉光特效，构筑极具生命力的视觉秘境。
 *
 * 算法模组：
 *   - 秩序之息 Order's Breath：多层同心环带，呼吸式扩张 + 螺旋扭曲
 *   - 虚空引力 Void Gravity：6 个引力中心 + 彩色涡流螺旋
 *   - 生物脉冲 Biological Pulse：ECG 心跳节律 + 激波涟漪 + 冷暖色相律动
 *   - 万向之门 Gate of All Directions：5 组 Lissajous 波形交织飞行
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'particle-lines';
    const CANVAS_ID = 'animationCanvas';

    /* ────── CSS 注入 ────── */
    function _ensureCSS() {
        if (document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) return;
        const link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = `plugins/${PLUGIN_ID}/style.css?v=${Date.now()}`;
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
    }

    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
    }

    /* ────── 算法定义（提前初始化，确保弹窗创建时有数据）────── */
    let _algos = [
        { name: '秩序之息', fn: null, icon: '🌬️' },
        { name: '虚空引力', fn: null, icon: '🌀' },
        { name: '生物脉冲', fn: null, icon: '💓' },
        { name: '万向之门', fn: null, icon: '🚪' },
    ];
    // 将算法函数绑定到 _algos
    function _bindAlgoFns() {
        _algos[0].fn = algo_ordersBreath;
        _algos[1].fn = algo_voidGravity;
        _algos[2].fn = algo_biologicalPulse;
        _algos[3].fn = algo_gateOfAllDirections;
    }
    _bindAlgoFns();

    /* ────── 状态 ────── */
    let _enabled = false;
    let _canvas = null;
    let _ctx = null;
    let _particles = [];
    let _rafId = null;
    let _time = 0;
    let _bgmPlayer = null;
    let _algoIndex = 0;            // 当前选中的算法索引（-1 = 自动轮播）
    let _autoCycle = false;        // 自动轮播模式（循环切换所有算法）
    let _transparent = false;      // 透明模式（不遮盖背景，默认不透明=有拖尾）
    let _transitionStart = 0;
    let _transitionDuration = 8000; // 自动轮播时每 8 秒切换

    /* ────── 粒子类 ────── */
    class Particle {
        constructor() {
            const w = _canvas ? _canvas.width : window.innerWidth;
            const h = _canvas ? _canvas.height : window.innerHeight;
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.targetX = this.x;
            this.targetY = this.y;
            this.vx = 0;
            this.vy = 0;
            this.baseRadius = 1.5 + Math.random() * 2.5;
            this.radius = this.baseRadius;
            this.easing = 0.015 + Math.random() * 0.035;
            this.phase = Math.random() * Math.PI * 2;
            this.frequency = 0.5 + Math.random() * 1.5;
            this.musicScale = 1.0;
            this.musicTarget = 1.0;
            this.alpha = 0.6 + Math.random() * 0.4;
            // HSL 色彩系统：基于位置计算初始色相（360° 色彩轮）
            const cx = w * 0.5, cy = h * 0.5;
            this.hue = (Math.atan2(this.y - cy, this.x - cx) * 180 / Math.PI + 360) % 360;
            this.hueSpeed = 0.2 + Math.random() * 0.6; // 色相漂移速度
        }

        update(time, audioData) {
            if (audioData) {
                const pulse = audioData.overall * 0.6 + audioData.bass * 0.4;
                this.musicTarget = 1.0 + pulse * 2.0;
            } else {
                this.musicTarget = 1.0;
            }
            this.musicScale += (this.musicTarget - this.musicScale) * 0.3;

            // 色相随时间缓慢漂移
            this.hue = (this.hue + this.hueSpeed * 0.1) % 360;

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.3) {
                this.vx += (dx * this.easing - this.vx) * 0.2;
                this.vy += (dy * this.easing - this.vy) * 0.2;
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        draw(ctx) {
            const r = this.baseRadius * this.musicScale;
            const a = Math.min(1.0, this.alpha + (this.musicScale - 1.0) * 0.5);
            const saturation = 75 + Math.sin(this.phase + this.hue * 0.01) * 20;
            const lightness = 55 + this.musicScale * 15;

            // 伪辉光：先画大半径低透明度外圈，再画实心内圈（比 shadowBlur 快 10x+）
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${a * 0.15})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${a})`;
            ctx.fill();
        }
    }

    /* ────── TIME-ART 算法模组 ────── */

    // 工具函数
    function _w() { return _canvas ? _canvas.width : window.innerWidth; }
    function _h() { return _canvas ? _canvas.height : window.innerHeight; }

    /**
     * 1. 秩序之息 — Order's Breath
     * 粒子分布在多层同心环带上，呼吸式扩张/收缩 + 螺旋旋转扭曲。
     * 色彩按环号从暖色渐变到冷色。
     */
    function algo_ordersBreath(particles, time, w, h) {
        const cx = w * 0.5, cy = h * 0.5;
        const total = particles.length;
        const ringCount = Math.max(5, Math.floor(total / 16));
        const maxR = Math.min(w, h) * 0.42;

        particles.forEach((p, i) => {
            const ringIdx = i % ringCount;
            const baseR = (ringIdx + 1) * (maxR / ringCount);
            // 每环粒子分布角度带微偏移
            const angleBase = (i / total) * Math.PI * 2;
            const spiralTwist = time * 0.08 * (ringIdx * 0.25 + 0.5);
            const angle = angleBase + spiralTwist;
            // 呼吸振幅随环递增
            const amplitude = baseR * (0.06 + ringIdx * 0.06);
            const breathR = baseR + amplitude * Math.sin(time * 1.5 + p.phase);
            // 次要波纹叠加
            const ripple = Math.sin(time * 3.2 + angle * 3 + ringIdx) * amplitude * 0.3;
            const finalR = breathR + ripple;
            p.targetX = cx + Math.cos(angle) * finalR;
            p.targetY = cy + Math.sin(angle) * finalR * 0.8;
            // 色相按环号从 0°(红) → 240°(蓝)
            p.hue = (ringIdx / ringCount) * 200 + time * 3;
        });
    }

    /**
     * 2. 虚空引力 — Void Gravity
     * 6 个动态引力中心在屏幕上大范围旋转，粒子围绕最近的吸引子做螺旋运动。
     * 每组粒子拥有独立的色相区域，形成彩色涡流。
     */
    function algo_voidGravity(particles, time, w, h) {
        const attractors = [];
        const aCount = 6;
        const orbitRadius = Math.min(w, h) * 0.32;
        for (let a = 0; a < aCount; a++) {
            const baseAng = (a / aCount) * Math.PI * 2;
            // 引力中心在更大的轨道上运动
            const attX = w * 0.5 + Math.cos(baseAng + time * 0.2) * orbitRadius * (0.8 + 0.2 * Math.sin(time * 0.35 + a));
            const attY = h * 0.5 + Math.sin(baseAng + time * 0.2) * orbitRadius * (0.8 + 0.2 * Math.cos(time * 0.3 + a));
            attractors.push({
                x: attX,
                y: attY,
                strength: 0.7 + Math.sin(time * 0.5 + a * 1.7) * 0.3
            });
        }

        particles.forEach((p, i) => {
            const aIdx = i % attractors.length;
            const at = attractors[aIdx];
            // 每个粒子有自己的轨道半径和速度
            const orbitR = 12 + (i % 40) + Math.sin(time * 0.9 + p.phase) * 10;
            const orbitAng = p.phase + time * (0.25 + p.frequency * 0.6);
            p.targetX = at.x + Math.cos(orbitAng) * orbitR;
            p.targetY = at.y + Math.sin(orbitAng) * orbitR * 0.65;
            // 色相分 6 组（60° 间隔）
            p.hue = (aIdx * 60 + time * 5) % 360;
        });
    }

    /**
     * 3. 生物脉冲 — Biological Pulse
     * 模拟心跳节律：粒子群整体收缩→爆发扩展，带不规则节拍和激波涟漪。
     * 色相随心跳从冷蓝（舒张）→ 暖红/橙（收缩峰值）律动。
     */
    function algo_biologicalPulse(particles, time, w, h) {
        const cx = w * 0.5, cy = h * 0.5;
        // 合成 ECG 波形包络（基频 + 谐波）
        const beatFreq = 1.3;
        const beat = Math.sin(time * beatFreq) * 0.5 +
                     Math.sin(time * beatFreq * 2) * 0.35 +
                     Math.sin(time * beatFreq * 3) * 0.2 +
                     Math.sin(time * beatFreq * 4) * 0.1;
        const envelope = 1.0 + beat * 0.3;
        // 心跳峰值检测（用于激波效果）
        const beatPeak = Math.max(0, beat * 0.8);

        particles.forEach((p, i) => {
            const layerR = 25 + (i % 55);
            const angle = (i / particles.length) * Math.PI * 2 + time * 0.06;
            // 每个粒子有相位延迟，形成波纹扩散
            const delay = (i / particles.length) * 0.4;
            const localEnv = 1.0 + Math.sin(time * beatFreq - delay * Math.PI * 2) * 0.25;
            // 激波涟漪：外层粒子在心跳峰值时向外推
            const shockwave = beatPeak * (layerR / 80) * 0.5;
            const r = (layerR * envelope * localEnv) + shockwave * 15;
            p.targetX = cx + Math.cos(angle) * r;
            p.targetY = cy + Math.sin(angle) * r * 0.75;
            // 色相：舒张(蓝 220°) → 收缩(红 0°)，带粒子位置微调
            p.hue = 220 - (envelope - 0.7) * 300 + (i % 20) * 2;
        });
    }

    /**
     * 4. 万向之门 — Gate of All Directions
     * 5 组粒子沿不同的 Lissajous 波形轨迹交织飞行，
     * 轨道中心在全屏范围内缓慢游弋，形成流动的万花筒效果。
     */
    function algo_gateOfAllDirections(particles, time, w, h) {
        const groups = 5;
        const baseAmplitude = Math.min(w, h) * 0.42;

        // 轨道中心在全屏游弋
        const ocx = w * 0.5 + Math.sin(time * 0.12) * w * 0.15;
        const ocy = h * 0.5 + Math.cos(time * 0.15) * h * 0.1;

        particles.forEach((p, i) => {
            const g = i % groups;
            // 更丰富的频率组合
            const ax = [1.0, 2.0, 3.0, 1.5, 2.7][g];
            const ay = [2.0, 1.3, 1.7, 3.0, 1.4][g];
            const phaseShift = g * Math.PI * 0.38;
            // 每组有独立的中心偏移（展开到全屏）
            const gx = ((g % 3) - 1) * w * 0.12;
            const gy = (Math.floor(g / 2) - 1) * h * 0.12;

            const tScaled = time * 0.45 + p.phase * 0.6;
            const tx = Math.sin(ax * tScaled + phaseShift);
            const ty = Math.cos(ay * tScaled + phaseShift * 0.75);
            // 振幅随时间和粒子动态变化
            const ampMod = 0.85 + 0.15 * Math.sin(time * 0.25 + p.phase);
            p.targetX = ocx + gx + tx * baseAmplitude * ampMod;
            p.targetY = ocy + gy + ty * baseAmplitude * 0.85;
            // 色相按组和位置动态变化
            p.hue = (g * 72 + time * 8 + p.phase * 30) % 360;
        });
    }


    /* ────── 动画核心 ────── */

    function _createParticles(count) {
        _particles = [];
        for (let i = 0; i < count; i++) {
            _particles.push(new Particle());
        }
    }

    function _drawLines(maxDist, maxAlpha) {
        for (let i = 0; i < _particles.length; i++) {
            const pa = _particles[i];
            for (let j = i + 1; j < _particles.length; j++) {
                const pb = _particles[j];
                const dx = pa.x - pb.x;
                const dy = pa.y - pb.y;
                const distSq = dx * dx + dy * dy;
                // 用平方距离快速剔除（跳过 sqrt）
                if (distSq > maxDist * maxDist) continue;
                const dist = Math.sqrt(distSq);
                const t = 1 - dist / maxDist;
                const avgHue = (pa.hue + pb.hue) * 0.5;
                _ctx.beginPath();
                _ctx.moveTo(pa.x, pa.y);
                _ctx.lineTo(pb.x, pb.y);
                _ctx.strokeStyle = `hsla(${avgHue}, 70%, 60%, ${(maxAlpha * t).toFixed(3)})`;
                _ctx.lineWidth = 0.4 + 0.8 * t;
                _ctx.stroke();
            }
        }
    }

    function _updateTargets(time) {
        const w = _w(), h = _h();
        const algo = _algos[_algoIndex];
        if (algo && algo.fn) {
            algo.fn(_particles, time, w, h);
        }
    }

    function _animate(timestamp) {
        if (!_enabled) return;

        // 透明模式：完全清除；不透明模式：拖尾残影效果
        if (_transparent) {
            _ctx.clearRect(0, 0, _w(), _h());
        } else {
            _ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            _ctx.fillRect(0, 0, _w(), _h());
        }
        _time += 0.016;

        // 自动轮播模式：定时循环切换算法
        if (_autoCycle) {
            const elapsedSinceTransition = Date.now() - _transitionStart;
            if (elapsedSinceTransition > _transitionDuration) {
                _algoIndex = (_algoIndex + 1) % _algos.length;
                _transitionStart = Date.now();
                _time = 0;
            }
        }

        // 更新粒子目标位置
        _updateTargets(_time);

        // 获取音频数据
        let audioData = null;
        if (typeof _bgmPlayer === 'function' && _bgmPlayer()) {
            audioData = _bgmPlayer().getAudioData();
        }

        // 更新粒子
        for (const p of _particles) {
            p.update(_time, audioData);
        }

        // 绘制连接线（距离 100px，低透明度，减少 GPU 负担）
        _drawLines(100, 0.18);

        // 绘制粒子（带发光效果）
        for (const p of _particles) {
            p.draw(_ctx);
        }

        _rafId = requestAnimationFrame(_animate);
    }

    /* ────── 生命周期 ────── */

    function _resizeCanvas() {
        if (!_canvas) {
            _canvas = document.getElementById(CANVAS_ID);
            if (!_canvas) return;
            _ctx = _canvas.getContext('2d');
        }
        _canvas.width = window.innerWidth;
        _canvas.height = window.innerHeight;
    }

    function _start() {
        if (_enabled) return;
        _enabled = true;

        _resizeCanvas();
        _canvas.classList.add('active');

        if (_particles.length === 0) {
            // 粒子数量根据屏幕大小
            const area = _w() * _h();
            const count = Math.min(200, Math.max(100, Math.floor(area / 8000)));
            _createParticles(count);
        }

        _algoIndex = 0;
        _autoCycle = true;
        _transitionStart = Date.now();
        _time = 0;

        _rafId = requestAnimationFrame(_animate);
    }

    function _stop() {
        _enabled = false;
        if (_rafId) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
        if (_canvas) {
            _canvas.classList.remove('active');
            if (_ctx) _ctx.clearRect(0, 0, _w(), _h());
        }
    }

    function _setBGMPlayer(player) {
        _bgmPlayer = player;
    }

    function _cycleAlgorithm() {
        if (!_enabled) return;
        _algoIndex = (_algoIndex + 1) % _algos.length;
        _autoCycle = false;
        _transitionStart = Date.now();
        _time = 0;
    }

    /* ────── 设置面板按钮（插件动态生成）────── */

    let _pickerEl = null;
    let _settingItemEl = null;

    function _createAlgoPicker() {
        if (_pickerEl) return _pickerEl;

        const picker = document.createElement('div');
        picker.className = 'particle-algo-picker';
        picker.innerHTML = `
            <div class="algo-picker-header">
                <span class="algo-picker-title">粒子算法</span>
                <button class="algo-picker-close" title="关闭">&times;</button>
            </div>
            <div class="algo-picker-list"></div>
        `;

        const listEl = picker.querySelector('.algo-picker-list');

        // 四个算法（radio）
        _algos.forEach((algo, idx) => {
            const item = document.createElement('label');
            item.className = 'particle-algo-item';
            item.innerHTML = `
                <input type="radio" class="algo-radio" name="algoSelect" value="${idx}">
                <span class="algo-icon">${algo.icon}</span>
                <span class="algo-name">${algo.name}</span>
            `;
            // 点击整行选中 radio
            listEl.appendChild(item);
        });

        // 分隔线 + "自动轮播"选项
        const sep = document.createElement('div');
        sep.className = 'algo-picker-sep';
        listEl.appendChild(sep);

        const autoItem = document.createElement('label');
        autoItem.className = 'particle-algo-item algo-auto-item';
        autoItem.innerHTML = `
            <input type="radio" class="algo-radio" name="algoSelect" value="-1">
            <span class="algo-icon">🔄</span>
            <span class="algo-name">自动轮播</span>
        `;
        listEl.appendChild(autoItem);

        // 分隔线 + "透明模式" 复选框
        const sep2 = document.createElement('div');
        sep2.className = 'algo-picker-sep';
        listEl.appendChild(sep2);

        const transparentItem = document.createElement('label');
        transparentItem.className = 'particle-algo-item algo-checkbox-item';
        transparentItem.innerHTML = `
            <input type="checkbox" class="algo-checkbox" id="algoTransparent">
            <span class="algo-icon">👁️</span>
            <span class="algo-name">透明模式</span>
            <span class="algo-desc">不遮盖背景</span>
        `;
        listEl.appendChild(transparentItem);

        // 关闭按钮
        picker.querySelector('.algo-picker-close').addEventListener('click', (e) => {
            e.stopPropagation();
            _hideAlgoPicker();
        });

        // 阻止弹窗内点击冒泡
        picker.addEventListener('click', (e) => e.stopPropagation());

        // 点击弹窗外部关闭
        document.addEventListener('click', (e) => {
            if (_pickerEl && _pickerEl.style.display === 'block' &&
                !_pickerEl.contains(e.target) &&
                (!_settingItemEl || !_settingItemEl.contains(e.target))) {
                _hideAlgoPicker();
            }
        });

        document.body.appendChild(picker);
        _pickerEl = picker;
        return picker;
    }

    function _showAlgoPicker() {
        if (!_settingItemEl) return;

        const picker = _createAlgoPicker();
        const btnRect = _settingItemEl.getBoundingClientRect();
        const pickerW = 220, pickerH = 310;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 8;

        // 水平位置：优先级 左侧 > 右侧 > 居中（竖屏手机场景）
        let left;
        const roomLeft = btnRect.left - margin;
        const roomRight = vw - btnRect.right - margin;

        if (roomLeft >= pickerW + margin) {
            left = btnRect.left - pickerW - margin;
        } else if (roomRight >= pickerW + margin) {
            left = btnRect.right + margin;
        } else {
            left = (vw - pickerW) / 2;
        }

        // 垂直位置：优先级 按钮上方 > 按钮下方 > 垂直居中
        let top;
        if (btnRect.top - pickerH - margin >= 0) {
            top = btnRect.top - pickerH - margin;
        } else if (btnRect.bottom + pickerH + margin <= vh) {
            top = btnRect.bottom + margin;
        } else {
            top = (vh - pickerH) / 2;
        }

        // 确保不超出屏幕边界
        top = Math.max(margin, Math.min(top, vh - pickerH - margin));
        left = Math.max(margin, Math.min(left, vw - pickerW - margin));

        picker.style.top = top + 'px';
        picker.style.left = left + 'px';
        picker.style.display = 'block';

        // 同步当前选中状态
        const radios = picker.querySelectorAll('.algo-radio');
        radios.forEach(r => {
            if (_autoCycle) {
                r.checked = r.value === '-1';
            } else {
                r.checked = parseInt(r.value) === _algoIndex;
            }
        });

        // 点击 radio 立即生效
        radios.forEach(r => {
            r.onchange = function () {
                if (this.checked) {
                    const val = parseInt(this.value);
                    if (val === -1) {
                        _autoCycle = true;
                        _transitionStart = Date.now();
                        _time = 0;
                    } else {
                        _algoIndex = val;
                        _autoCycle = false;
                        _transitionStart = Date.now();
                        _time = 0;
                    }
                    _hideAlgoPicker();
                }
            };
        });

        // 同步透明模式复选框
        const transparentCB = picker.querySelector('#algoTransparent');
        if (transparentCB) {
            transparentCB.checked = _transparent;
            transparentCB.onchange = function () {
                _transparent = this.checked;
            };
        }
    }

    function _hideAlgoPicker() {
        if (_pickerEl) {
            _pickerEl.style.display = 'none';
        }
    }

    function _createSettingsItem() {
        if (_settingItemEl) return;

        const panelContent = document.querySelector('.settings-panel .panel-content');
        if (!panelContent) return;

        // 创建 setting-item
        const item = document.createElement('div');
        item.className = 'setting-item';
        item.id = 'particleLinesSetting';

        item.innerHTML = `
            <span class="setting-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
            </span>
            <span class="setting-text">粒子线条</span>
        `;

        // 插入到插件库按钮之后
        const pluginLibItem = document.getElementById('pluginLibrarySetting');
        if (pluginLibItem && pluginLibItem.nextSibling) {
            panelContent.insertBefore(item, pluginLibItem.nextSibling);
        } else {
            panelContent.appendChild(item);
        }

        // 点击 → 弹出算法选择器
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_pickerEl && _pickerEl.style.display === 'block') {
                _hideAlgoPicker();
            } else {
                _showAlgoPicker();
            }
        });

        // 长按 → 快速切换算法
        let _holdTimer = null;
        item.addEventListener('mousedown', () => {
            _holdTimer = setTimeout(() => _cycleAlgorithm(), 600);
        });
        item.addEventListener('mouseup', () => clearTimeout(_holdTimer));
        item.addEventListener('mouseleave', () => clearTimeout(_holdTimer));
        item.addEventListener('touchstart', () => {
            _holdTimer = setTimeout(() => _cycleAlgorithm(), 600);
        });
        item.addEventListener('touchend', () => clearTimeout(_holdTimer));

        _settingItemEl = item;
    }

    function _removeSettingsItem() {
        if (_settingItemEl) {
            _settingItemEl.remove();
            _settingItemEl = null;
        }
        if (_pickerEl) {
            _pickerEl.remove();
            _pickerEl = null;
        }
    }

    /* ────── 窗口 resize ────── */
    let _resizeDebounce = null;
    function _onResize() {
        clearTimeout(_resizeDebounce);
        _resizeDebounce = setTimeout(() => {
            _resizeCanvas();
            if (_enabled) {
                _particles.forEach(p => {
                    p.x = Math.min(p.x, _w());
                    p.y = Math.min(p.y, _h());
                });
            }
        }, 200);
    }

    /* ────── 暴露 API ────── */

    window.ParticleLinesAPI = {
        start: _start,
        stop: _stop,
        toggle: function () { _enabled ? _stop() : _start(); },
        isEnabled: function () { return _enabled; },
        setBGMPlayer: _setBGMPlayer,
        cycleAlgorithm: _cycleAlgorithm,
        getCurrentAlgorithm: function () { return _algos[_algoIndex]; },
        isAutoCycle: function () { return _autoCycle; },
    };

    /* ────── 注册插件 ────── */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '粒子动画',
        version: '2.0.0',
        description: '极简数字流派艺术粒子动画。内置秩序之息、虚空引力、生物脉冲、万向之门四套算法模组，搭载 HSL 全彩光谱、辉光特效和动态拖尾，粒子在数学波形牵引下往复律动。',
        icon: '✨',
        author: '时钟应用',

        onInstall: async function () {
            console.log('[粒子动画] 首次安装');
        },

        onActivate: async function () {
            console.log('[粒子动画] 🔄 激活...');
            _ensureCSS();

            _canvas = document.getElementById(CANVAS_ID);
            if (_canvas) {
                _ctx = _canvas.getContext('2d');
            }

            // 在设置面板动态生成按钮
            _createSettingsItem();

            // 监听 resize
            window.addEventListener('resize', _onResize);

            // 尝试连接 bgm-music 插件
            if (window.app && window.app.bgmPlayerManager) {
                _bgmPlayer = function () { return window.app.bgmPlayerManager; };
            }

            console.log('[粒子动画] ✅ 已激活，自动启动中...');

            // 自动启动动画
            setTimeout(() => _start(), 100);
        },

        onDeactivate: async function () {
            console.log('[粒子动画] ⏹ 停用...');
            _stop();
            _particles = [];
            _bgmPlayer = null;
            window.removeEventListener('resize', _onResize);

            // 移除动态生成的设置面板按钮和弹窗
            _removeSettingsItem();

            console.log('[粒子动画] ✅ 已停用');
        },

        onUninstall: async function () {
            _stop();
            _removeCSS();
            _particles = [];
            _bgmPlayer = null;
            _removeSettingsItem();
            window.removeEventListener('resize', _onResize);
            delete window.ParticleLinesAPI;
            console.log('[粒子动画] 已卸载');
        }
    });

    console.log('[粒子动画] 插件已注册（TIME-ART 数字流派艺术引擎）');
})();
