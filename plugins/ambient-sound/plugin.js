/**
 * 白噪音·环境音插件
 * Web Audio 程序合成环境音（零音频文件），支持多音源叠加混音、音量调节、云端同步
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'ambient-sound';
    const STYLE_CSS = 'plugins/ambient-sound/style.css?v=20260620a';
    const STORAGE_KEY = 'ambient_settings';

    /* ========== 音源定义表 ==========
       每个音源用噪声 buffer + 滤波器 + LFO 组装。
       type 决定噪声底色：white/pink/brown
       filter 决定塑形：'none' | {type, freq, q}
       lfo 决定起伏调制：null | {target, freq, depth, base}  （调制 filter.freq 或 gain.gain）
       pulses 决定偶发脉冲（雨滴/噼啪）：null | {interval, freq, dur, gain}
    */
    const SOUNDS = [
        { id: 'rain',   name: '雨声',   icon: '🌧️', color: '#5AC8FA', type: 'brown',
          filter: { type: 'lowpass', freq: 2200, q: 0.8 },
          pulses: { interval: 60, freq: 3000, dur: 0.04, gain: 0.25 } },
        { id: 'wind',   name: '风声',   icon: '🌬️', color: '#34C759', type: 'brown',
          filter: { type: 'lowpass', freq: 600, q: 1.2 },
          lfo:    { target: 'freq', freq: 0.12, depth: 350, base: 600 } },
        { id: 'waves',  name: '海浪',   icon: '🌊', color: '#007AFF', type: 'pink',
          filter: { type: 'lowpass', freq: 800, q: 0.7 },
          lfo:    { target: 'gain', freq: 0.08, depth: 0.5, base: 0.3 } },
        { id: 'stream', name: '溪流',   icon: '💧', color: '#00C7BE', type: 'white',
          filter: { type: 'bandpass', freq: 1500, q: 0.6 },
          lfo:    { target: 'freq', freq: 0.3, depth: 500, base: 1500 } },
        { id: 'fire',   name: '篝火',   icon: '🔥', color: '#FF9500', type: 'brown',
          filter: { type: 'lowpass', freq: 400, q: 0.5 },
          pulses: { interval: 180, freq: 1200, dur: 0.06, gain: 0.3 } },
        { id: 'night',  name: '夜晚',   icon: '🌙', color: '#5856D6', type: 'brown',
          filter: { type: 'lowpass', freq: 300, q: 0.5 } },
        { id: 'white',  name: '白噪音', icon: '⚪', color: '#8E8E93', type: 'white',
          filter: null },
        { id: 'pink',   name: '粉噪音', icon: '🌸', color: '#FF2D55', type: 'pink',
          filter: null },
        { id: 'brown',  name: '棕噪音', icon: '🟤', color: '#A2845E', type: 'brown',
          filter: null }
    ];

    const SOUND_MAP = {};
    SOUNDS.forEach(s => { SOUND_MAP[s.id] = s; });

    let _engine = null;
    let _btnEl = null;
    let _modalEl = null;
    let _cssInjected = false;
    let _settings = {
        activeSounds: [],
        volumes: {},
        masterVolume: 0.7
    };
    let _eventCleanups = [];

    /* ========== 状态存取 ========== */

    function _loadSettings() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                _settings = Object.assign({ activeSounds: [], volumes: {}, masterVolume: 0.7 }, JSON.parse(saved));
            } catch (e) {
                console.warn('[白噪音] 加载设置失败:', e);
            }
        }
    }

    function _saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('ambient_settings');
        }
    }

    /* ========== 音频合成引擎 ========== */

    class AmbientSoundEngine {
        constructor() {
            this.audioContext = null;
            this.master = null;
            this.nodes = new Map();  // id → {source, filter, gain, lfo, pulseTimer}
        }

        _ensureContext() {
            if (this.audioContext) return;
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AC();
            this.master = this.audioContext.createGain();
            this.master.gain.value = _settings.masterVolume;
            this.master.connect(this.audioContext.destination);
        }

        resume() {
            this._ensureContext();
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }

        /**
         * 生成噪声 buffer
         * white: 均匀随机；pink: Voss-McCartney；brown: 累积白噪声
         */
        _createNoiseBuffer(type) {
            const ctx = this.audioContext;
            const seconds = 3;
            const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            if (type === 'white') {
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            } else if (type === 'pink') {
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < data.length; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                    b6 = white * 0.115926;
                }
            } else { // brown
                let last = 0;
                for (let i = 0; i < data.length; i++) {
                    const white = Math.random() * 2 - 1;
                    last = (last + 0.02 * white) / 1.02;
                    data[i] = last * 3.5;
                }
            }
            return buffer;
        }

        /**
         * 组装一个音源的音频图：source(buffer循环) → filter → gain → master
         */
        start(id) {
            const def = SOUND_MAP[id];
            if (!def) return;
            this._ensureContext();
            if (this.nodes.has(id)) return; // 已在播放

            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // 噪声源（循环）
            const source = ctx.createBufferSource();
            source.buffer = this._createNoiseBuffer(def.type);
            source.loop = true;

            // 滤波器（可选）
            let filter = null;
            let lastNode = source;
            if (def.filter) {
                filter = ctx.createBiquadFilter();
                filter.type = def.filter.type;
                filter.frequency.value = def.filter.freq;
                filter.Q.value = def.filter.q || 1;
                source.connect(filter);
                lastNode = filter;
            }

            // 音量节点（淡入避免爆音）
            const gain = ctx.createGain();
            const vol = _settings.volumes[id] != null ? _settings.volumes[id] : 0.6;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.5);
            lastNode.connect(gain);
            gain.connect(this.master);

            source.start(now);

            // LFO 调制（可选）：调制 filter.frequency 或 gain.gain
            let lfo = null;
            let lfoGain = null;
            if (def.lfo) {
                lfo = ctx.createOscillator();
                lfo.frequency.value = def.lfo.freq;
                lfoGain = ctx.createGain();
                lfoGain.gain.value = def.lfo.depth;
                lfo.connect(lfoGain);
                if (def.lfo.target === 'freq' && filter) {
                    lfoGain.connect(filter.frequency);
                    filter.frequency.value = def.lfo.base;
                } else if (def.lfo.target === 'gain') {
                    // 调制 gain 围绕 base 浮动
                    lfoGain.connect(gain.gain);
                    gain.gain.value = def.lfo.base * vol;
                }
                lfo.start(now);
            }

            // 偶发脉冲（雨滴/噼啪）
            let pulseTimer = null;
            if (def.pulses) {
                const schedulePulse = () => {
                    const p = def.pulses;
                    const t = ctx.currentTime;
                    const osc = ctx.createOscillator();
                    const oscGain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = p.freq + (Math.random() - 0.5) * p.freq * 0.3;
                    oscGain.gain.setValueAtTime(0, t);
                    oscGain.gain.linearRampToValueAtTime(p.gain * vol, t + 0.005);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
                    osc.connect(oscGain);
                    oscGain.connect(this.master);
                    osc.start(t);
                    osc.stop(t + p.dur + 0.02);
                    // 随机间隔
                    const next = p.interval * (0.5 + Math.random());
                    pulseTimer = setTimeout(schedulePulse, next);
                };
                pulseTimer = setTimeout(schedulePulse, def.pulses.interval);
            }

            this.nodes.set(id, { source, filter, gain, lfo, lfoGain, pulseTimer });
        }

        stop(id) {
            const node = this.nodes.get(id);
            if (!node) return;
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // 淡出避免爆音
            try {
                node.gain.gain.cancelScheduledValues(now);
                node.gain.gain.setValueAtTime(node.gain.gain.value, now);
                node.gain.gain.linearRampToValueAtTime(0, now + 0.3);
            } catch (e) {}

            setTimeout(() => {
                try { node.source.stop(); } catch (e) {}
                try { node.source.disconnect(); } catch (e) {}
                try { node.lfo && node.lfo.stop(); } catch (e) {}
                if (node.pulseTimer) clearTimeout(node.pulseTimer);
            }, 350);

            this.nodes.delete(id);
        }

        isPlaying(id) {
            return this.nodes.has(id);
        }

        setSoundVolume(id, vol) {
            const node = this.nodes.get(id);
            if (node && this.audioContext) {
                node.gain.gain.setTargetAtTime(vol, this.audioContext.currentTime, 0.05);
            }
            _settings.volumes[id] = vol;
        }

        setMasterVolume(vol) {
            if (this.master && this.audioContext) {
                this.master.gain.setTargetAtTime(vol, this.audioContext.currentTime, 0.05);
            }
            _settings.masterVolume = vol;
        }

        stopAll() {
            Array.from(this.nodes.keys()).forEach(id => this.stop(id));
        }

        resumeAll() {
            // 恢复之前激活的音源
            _settings.activeSounds.forEach(id => this.start(id));
        }

        destroy() {
            this.stopAll();
            setTimeout(() => {
                try { this.audioContext && this.audioContext.close(); } catch (e) {}
            }, 500);
            this.audioContext = null;
            this.master = null;
        }
    }

    /* ========== CSS 注入 ========== */

    function _injectCSS() {
        if (_cssInjected || document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) {
            _cssInjected = true;
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = STYLE_CSS;
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
        _cssInjected = true;
    }

    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
        _cssInjected = false;
    }

    /* ========== UI 创建 ========== */

    const BTN_HTML = `<button id="ambientBtn" class="bottom-tool-btn" title="白噪音·环境音">
        <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2c-1 4 4 6 4 10a4 4 0 0 1-8 0c0-2 1-3 2-4"/>
        </svg>
        <span class="tool-btn-label">白噪</span>
        <span class="ambient-badge" id="ambientBadge" style="display:none;">0</span>
    </button>`;

    function _createUI() {
        // 底栏按钮
        if (!document.getElementById('ambientBtn')) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                const temp = document.createElement('div');
                temp.innerHTML = BTN_HTML.trim();
                _btnEl = temp.firstChild;
                toolbar.appendChild(_btnEl);
            }
        } else {
            _btnEl = document.getElementById('ambientBtn');
        }

        // 模态框
        if (!document.getElementById('ambientModal')) {
            _modalEl = document.createElement('div');
            _modalEl.id = 'ambientModal';
            _modalEl.className = 'ambient-modal';
            _modalEl.style.display = 'none';
            _modalEl.innerHTML = _buildModalHTML();
            document.body.appendChild(_modalEl);
        } else {
            _modalEl = document.getElementById('ambientModal');
        }
    }

    function _buildModalHTML() {
        const cards = SOUNDS.map(s => `
            <div class="ambient-card" data-sound-id="${s.id}" style="--sound-color:${s.color};">
                <div class="ambient-card-icon">${s.icon}</div>
                <div class="ambient-card-name">${s.name}</div>
                <input type="range" class="ambient-slider" min="0" max="100" value="${(_settings.volumes[s.id] != null ? _settings.volumes[s.id] : 0.6) * 100}" data-sound-id="${s.id}"/>
            </div>
        `).join('');

        return `
            <div class="ambient-modal-content">
                <div class="ambient-modal-header">
                    <h1 class="ambient-modal-title"><span class="title-icon">🌧️</span>白噪音·环境音</h1>
                    <button class="ambient-modal-close" id="ambientModalClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="ambient-hint">点击卡片开启音源，可同时开启多个叠加混音</div>
                <div class="ambient-master">
                    <span class="master-label">总音量</span>
                    <input type="range" class="ambient-master-slider" id="ambientMasterSlider" min="0" max="100" value="${_settings.masterVolume * 100}"/>
                    <span class="master-value" id="ambientMasterValue">${Math.round(_settings.masterVolume * 100)}%</span>
                </div>
                <div class="ambient-grid">${cards}</div>
                <button class="ambient-stop-all" id="ambientStopAll">全部停止</button>
            </div>
        `;
    }

    function _removeUI() {
        if (_modalEl) { _modalEl.remove(); _modalEl = null; }
        if (_btnEl) { _btnEl.remove(); _btnEl = null; }
        _eventCleanups.forEach(fn => { try { fn(); } catch (e) {} });
        _eventCleanups = [];
    }

    /* ========== UI 状态更新 ========== */

    function _updateCardState(soundId) {
        const card = _modalEl && _modalEl.querySelector(`.ambient-card[data-sound-id="${soundId}"]`);
        if (!card) return;
        const playing = _engine && _engine.isPlaying(soundId);
        card.classList.toggle('active', !!playing);
    }

    function _updateAllCards() {
        SOUNDS.forEach(s => _updateCardState(s.id));
    }

    function _updateBadge() {
        const badge = document.getElementById('ambientBadge');
        if (badge && _engine) {
            const count = _settings.activeSounds.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }

    function _updateBtnPlaying() {
        if (_btnEl) {
            _btnEl.classList.toggle('playing', _settings.activeSounds.length > 0);
        }
    }

    /* ========== 事件绑定 ========== */

    function _wireEvents() {
        // 打开模态框
        if (_btnEl) {
            _btnEl.addEventListener('click', (e) => {
                e.stopPropagation();
                _openModal();
            });
        }

        // 关闭按钮
        const closeBtn = document.getElementById('ambientModalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => _closeModal());
        }

        // 卡片点击 → toggle 音源
        if (_modalEl) {
            _modalEl.addEventListener('click', (e) => {
                const card = e.target.closest('.ambient-card');
                if (card && !e.target.classList.contains('ambient-slider')) {
                    e.stopPropagation();
                    _toggleSound(card.dataset.soundId);
                }
                if (e.target === _modalEl) _closeModal();
            });
        }

        // 全部停止
        const stopAllBtn = document.getElementById('ambientStopAll');
        if (stopAllBtn) {
            stopAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _stopAll();
            });
        }

        // 音源音量滑块
        if (_modalEl) {
            _modalEl.addEventListener('input', (e) => {
                if (e.target.classList.contains('ambient-slider')) {
                    const id = e.target.dataset.soundId;
                    const vol = parseInt(e.target.value) / 100;
                    if (_engine) _engine.setSoundVolume(id, vol);
                    _saveSettings();
                }
            });
        }

        // 总音量滑块
        const masterSlider = document.getElementById('ambientMasterSlider');
        const masterValue = document.getElementById('ambientMasterValue');
        if (masterSlider) {
            masterSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value) / 100;
                if (_engine) _engine.setMasterVolume(vol);
                if (masterValue) masterValue.textContent = Math.round(vol * 100) + '%';
                _saveSettings();
            });
        }
    }

    /* ========== 播放控制 ========== */

    function _toggleSound(id) {
        if (!_engine) return;
        _engine.resume();  // 首次手势触发 resume（iOS 兼容）

        if (_engine.isPlaying(id)) {
            _engine.stop(id);
            _settings.activeSounds = _settings.activeSounds.filter(s => s !== id);
        } else {
            _engine.start(id);
            if (!_settings.activeSounds.includes(id)) {
                _settings.activeSounds.push(id);
            }
        }
        _updateCardState(id);
        _updateBadge();
        _updateBtnPlaying();
        _saveSettings();
    }

    function _stopAll() {
        if (_engine) _engine.stopAll();
        _settings.activeSounds = [];
        _updateAllCards();
        _updateBadge();
        _updateBtnPlaying();
        _saveSettings();
    }

    function _openModal() {
        if (_modalEl) {
            _modalEl.style.display = 'flex';
            setTimeout(() => _modalEl.classList.add('show'), 10);
            _updateAllCards();
        }
    }

    function _closeModal() {
        if (_modalEl) {
            _modalEl.classList.remove('show');
            setTimeout(() => { if (_modalEl) _modalEl.style.display = 'none'; }, 300);
        }
    }

    /* ========== 生命周期 ========== */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '白噪音·环境音',
        version: '1.0.0',
        description: '雨声、风声、海浪、白噪音等环境音，可叠加混音，助眠专注。',
        icon: '🌧️',
        author: '时钟应用',
        css: STYLE_CSS,

        async onActivate() {
            _injectCSS();
            _loadSettings();
            _createUI();
            _wireEvents();

            // 创建音频引擎（不立即创建 AudioContext，等首次用户手势）
            _engine = new AmbientSoundEngine();

            _updateBadge();
            _updateBtnPlaying();

            // 注册云端同步：将 ambient_settings 纳入多设备同步
            if (window.syncAdapter) {
                window.syncAdapter.registerSyncKey(
                    'ambient_settings',
                    STORAGE_KEY,
                    () => {
                        _loadSettings();
                        // 同步后：若引擎存在，重置当前播放集合以匹配云端
                        if (_engine && !_engine._destroyed) {
                            _engine.stopAll();
                            _settings.activeSounds.forEach(id => _engine.start(id));
                        }
                        _updateAllCards();
                        _updateBadge();
                        _updateBtnPlaying();
                    },
                    'object'
                );
            }
        },

        async onDeactivate() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('ambient_settings');
            }
            if (_engine) {
                _engine.destroy();
                _engine = null;
            }
            _removeUI();
        },

        async onUninstall() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('ambient_settings');
            }
            if (_engine) {
                _engine.destroy();
                _engine = null;
            }
            _removeUI();
            _removeCSS();
        }
    });
})();
