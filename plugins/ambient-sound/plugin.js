/**
 * 环境音插件 v3.5.0
 * 基于 moodist (https://github.com/remvze/moodist) 真实环境音 + 噪音合成
 * 完整音源 75+，支持混音预设保存/加载/删除、内置学习专注预设、多设备同步
 * 预设播放状态可视化标识（active 高亮 + 播放指示器）
 * 页面刷新后自动恢复播放状态（首次交互时 resume AudioContext）
 * 音源许可：Pixabay Content License / CC0
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'ambient-sound';
    const STYLE_CSS = 'plugins/ambient-sound/style.css?v=20260620g';
    const STORAGE_KEY = 'ambient_settings';
    const MOODIST_CDN = 'https://moodist.mvze.net';

    /* ========== 音源分类定义 ==========
       src: moodist CDN 音频文件路径（MP3）
       synth: 合成噪音配置（type: white/pink/brown）
    */
    const CATEGORIES = [
        {
            id: 'nature', title: '自然', icon: '🌳', color: '#34C759',
            sounds: [
                { id: 'river',          name: '河流',     icon: '🏞️', src: '/sounds/nature/river.mp3' },
                { id: 'waves',          name: '海浪',     icon: '🌊', src: '/sounds/nature/waves.mp3' },
                { id: 'campfire',       name: '篝火',     icon: '🔥', src: '/sounds/nature/campfire.mp3' },
                { id: 'wind',           name: '风声',     icon: '💨', src: '/sounds/nature/wind.mp3' },
                { id: 'howling-wind',   name: '呼啸风',   icon: '🌪️', src: '/sounds/nature/howling-wind.mp3' },
                { id: 'wind-in-trees',  name: '林间风',   icon: '🌲', src: '/sounds/nature/wind-in-trees.mp3' },
                { id: 'waterfall',      name: '瀑布',     icon: '⛲', src: '/sounds/nature/waterfall.mp3' },
                { id: 'walk-in-snow',   name: '踏雪',     icon: '❄️', src: '/sounds/nature/walk-in-snow.mp3' },
                { id: 'walk-on-leaves', name: '踏落叶',   icon: '🍂', src: '/sounds/nature/walk-on-leaves.mp3' },
                { id: 'walk-on-gravel', name: '踏碎石',   icon: '🪨', src: '/sounds/nature/walk-on-gravel.mp3' },
                { id: 'droplets',       name: '水滴',     icon: '💧', src: '/sounds/nature/droplets.mp3' },
                { id: 'jungle',         name: '丛林',     icon: '🌴', src: '/sounds/nature/jungle.mp3' },
            ]
        },
        {
            id: 'rain', title: '雨声', icon: '🌧️', color: '#5AC8FA',
            sounds: [
                { id: 'light-rain',       name: '小雨',     icon: '🌦️', src: '/sounds/rain/light-rain.mp3' },
                { id: 'heavy-rain',       name: '大雨',     icon: '⛈️', src: '/sounds/rain/heavy-rain.mp3' },
                { id: 'thunder',          name: '雷雨',     icon: '⚡', src: '/sounds/rain/thunder.mp3' },
                { id: 'rain-on-window',   name: '雨打窗',   icon: '🪟', src: '/sounds/rain/rain-on-window.mp3' },
                { id: 'rain-on-car-roof', name: '雨打车顶', icon: '🚗', src: '/sounds/rain/rain-on-car-roof.mp3' },
                { id: 'rain-on-umbrella', name: '雨打伞',   icon: '☂️', src: '/sounds/rain/rain-on-umbrella.mp3' },
                { id: 'rain-on-tent',     name: '雨打帐篷', icon: '⛺', src: '/sounds/rain/rain-on-tent.mp3' },
                { id: 'rain-on-leaves',   name: '雨打落叶', icon: '🍃', src: '/sounds/rain/rain-on-leaves.mp3' },
            ]
        },
        {
            id: 'animals', title: '动物', icon: '🐦', color: '#FF9500',
            sounds: [
                { id: 'birds',        name: '鸟鸣',   icon: '🐦', src: '/sounds/animals/birds.mp3' },
                { id: 'seagulls',     name: '海鸥',   icon: '🕊️', src: '/sounds/animals/seagulls.mp3' },
                { id: 'crickets',     name: '蟋蟀',   icon: '🦗', src: '/sounds/animals/crickets.mp3' },
                { id: 'wolf',         name: '狼嚎',   icon: '🐺', src: '/sounds/animals/wolf.mp3' },
                { id: 'owl',          name: '猫头鹰', icon: '🦉', src: '/sounds/animals/owl.mp3' },
                { id: 'frog',         name: '蛙鸣',   icon: '🐸', src: '/sounds/animals/frog.mp3' },
                { id: 'dog-barking',  name: '狗吠',   icon: '🐕', src: '/sounds/animals/dog-barking.mp3' },
                { id: 'horse-gallop', name: '马蹄',   icon: '🐎', src: '/sounds/animals/horse-gallop.mp3' },
                { id: 'cat-purring',  name: '猫呼噜', icon: '🐱', src: '/sounds/animals/cat-purring.mp3' },
                { id: 'crows',        name: '乌鸦',   icon: '🦅', src: '/sounds/animals/crows.mp3' },
                { id: 'whale',        name: '鲸鸣',   icon: '🐋', src: '/sounds/animals/whale.mp3' },
                { id: 'beehive',      name: '蜂巢',   icon: '🐝', src: '/sounds/animals/beehive.mp3' },
                { id: 'woodpecker',   name: '啄木鸟', icon: '🪶', src: '/sounds/animals/woodpecker.mp3' },
                { id: 'chickens',     name: '鸡鸣',   icon: '🐔', src: '/sounds/animals/chickens.mp3' },
                { id: 'cows',         name: '牛叫',   icon: '🐮', src: '/sounds/animals/cows.mp3' },
                { id: 'sheep',        name: '羊叫',   icon: '🐑', src: '/sounds/animals/sheep.mp3' },
            ]
        },
        {
            id: 'places', title: '场所', icon: '📍', color: '#AF52DE',
            sounds: [
                { id: 'cafe',              name: '咖啡馆',   icon: '☕', src: '/sounds/places/cafe.mp3' },
                { id: 'airport',           name: '机场',     icon: '✈️', src: '/sounds/places/airport.mp3' },
                { id: 'church',            name: '教堂',     icon: '⛪', src: '/sounds/places/church.mp3' },
                { id: 'temple',            name: '寺庙',     icon: '🛕', src: '/sounds/places/temple.mp3' },
                { id: 'construction-site', name: '建筑工地', icon: '🏗️', src: '/sounds/places/construction-site.mp3' },
                { id: 'underwater',        name: '水下',     icon: '🤿', src: '/sounds/places/underwater.mp3' },
                { id: 'crowded-bar',       name: '酒吧',     icon: '🍺', src: '/sounds/places/crowded-bar.mp3' },
                { id: 'night-village',     name: '夜晚村落', icon: '🏘️', src: '/sounds/places/night-village.mp3' },
                { id: 'subway-station',    name: '地铁站',   icon: '🚇', src: '/sounds/places/subway-station.mp3' },
                { id: 'office',            name: '办公室',   icon: '🏢', src: '/sounds/places/office.mp3' },
                { id: 'supermarket',       name: '超市',     icon: '🛒', src: '/sounds/places/supermarket.mp3' },
                { id: 'carousel',          name: '旋转木马', icon: '🎠', src: '/sounds/places/carousel.mp3' },
                { id: 'laboratory',        name: '实验室',   icon: '🧪', src: '/sounds/places/laboratory.mp3' },
                { id: 'laundry-room',      name: '洗衣房',   icon: '🧺', src: '/sounds/places/laundry-room.mp3' },
                { id: 'restaurant',        name: '餐厅',     icon: '🍽️', src: '/sounds/places/restaurant.mp3' },
                { id: 'library',           name: '图书馆',   icon: '📚', src: '/sounds/places/library.mp3' },
            ]
        },
        {
            id: 'transport', title: '交通', icon: '🚂', color: '#0A84FF',
            sounds: [
                { id: 'train',          name: '火车',   icon: '🚂', src: '/sounds/transport/train.mp3' },
                { id: 'inside-a-train', name: '车厢内', icon: '🚆', src: '/sounds/transport/inside-a-train.mp3' },
                { id: 'airplane',       name: '飞机',   icon: '✈️', src: '/sounds/transport/airplane.mp3' },
                { id: 'submarine',      name: '潜艇',   icon: '🚢', src: '/sounds/transport/submarine.mp3' },
                { id: 'sailboat',       name: '帆船',   icon: '⛵', src: '/sounds/transport/sailboat.mp3' },
                { id: 'rowing-boat',    name: '划船',   icon: '🚣', src: '/sounds/transport/rowing-boat.mp3' },
            ]
        },
        {
            id: 'things', title: '器物', icon: '⌨️', color: '#5856D6',
            sounds: [
                { id: 'keyboard',         name: '键盘',     icon: '⌨️', src: '/sounds/things/keyboard.mp3' },
                { id: 'typewriter',       name: '打字机',   icon: '📝', src: '/sounds/things/typewriter.mp3' },
                { id: 'paper',            name: '纸张',     icon: '📄', src: '/sounds/things/paper.mp3' },
                { id: 'clock',            name: '时钟',     icon: '🕐', src: '/sounds/things/clock.mp3' },
                { id: 'wind-chimes',      name: '风铃',     icon: '🎐', src: '/sounds/things/wind-chimes.mp3' },
                { id: 'singing-bowl',     name: '颂钵',     icon: '🥣', src: '/sounds/things/singing-bowl.mp3' },
                { id: 'ceiling-fan',      name: '吊扇',     icon: '🌀', src: '/sounds/things/ceiling-fan.mp3' },
                { id: 'dryer',            name: '烘干机',   icon: '👕', src: '/sounds/things/dryer.mp3' },
                { id: 'slide-projector',  name: '幻灯机',   icon: '📽️', src: '/sounds/things/slide-projector.mp3' },
                { id: 'boiling-water',    name: '沸水',     icon: '🫖', src: '/sounds/things/boiling-water.mp3' },
                { id: 'bubbles',          name: '气泡',     icon: '🫧', src: '/sounds/things/bubbles.mp3' },
                { id: 'tuning-radio',     name: '调频收音', icon: '📻', src: '/sounds/things/tuning-radio.mp3' },
                { id: 'morse-code',       name: '摩斯电码', icon: '📡', src: '/sounds/things/morse-code.mp3' },
                { id: 'washing-machine',  name: '洗衣机',   icon: '🔄', src: '/sounds/things/washing-machine.mp3' },
                { id: 'vinyl-effect',     name: '黑胶唱片', icon: '💿', src: '/sounds/things/vinyl-effect.mp3' },
                { id: 'windshield-wipers',name: '雨刮器',   icon: '🚘', src: '/sounds/things/windshield-wipers.mp3' },
            ]
        },
        {
            id: 'noise', title: '噪音', icon: '〰️', color: '#8E8E93',
            sounds: [
                { id: 'white', name: '白噪音', icon: '⚪', synth: { type: 'white' } },
                { id: 'pink',  name: '粉噪音', icon: '🌸', synth: { type: 'pink' } },
                { id: 'brown', name: '棕噪音', icon: '🟤', synth: { type: 'brown' } },
            ]
        },
    ];

    // 扁平化音源映射表
    const SOUND_MAP = {};
    CATEGORIES.forEach(cat => cat.sounds.forEach(s => {
        SOUND_MAP[s.id] = s;
    }));

    /* ========== 内置混音预设（适合学习专注场景） ========== */
    const BUILTIN_PRESETS = [
        {
            id: 'builtin_deep_focus',
            name: '深度专注',
            icon: '🧠',
            desc: '棕噪音屏蔽干扰 + 键盘声营造工作氛围',
            sounds: [
                { id: 'brown',    vol: 0.5  },
                { id: 'keyboard', vol: 0.25 },
            ],
            masterVolume: 0.7,
        },
        {
            id: 'builtin_library',
            name: '图书馆',
            icon: '📚',
            desc: '图书馆安静氛围 + 小雨白噪',
            sounds: [
                { id: 'library',    vol: 0.55 },
                { id: 'light-rain', vol: 0.25 },
            ],
            masterVolume: 0.7,
        },
        {
            id: 'builtin_cafe_study',
            name: '咖啡馆学习',
            icon: '☕',
            desc: '咖啡馆白噪音 + 键盘 + 翻书声',
            sounds: [
                { id: 'cafe',     vol: 0.45 },
                { id: 'keyboard', vol: 0.25 },
                { id: 'paper',    vol: 0.2  },
            ],
            masterVolume: 0.7,
        },
        {
            id: 'builtin_rainy_reading',
            name: '雨天阅读',
            icon: '📖',
            desc: '雨打窗 + 小雨，沉浸式阅读氛围',
            sounds: [
                { id: 'rain-on-window', vol: 0.5  },
                { id: 'light-rain',     vol: 0.25 },
            ],
            masterVolume: 0.7,
        },
        {
            id: 'builtin_forest_meditation',
            name: '林间冥想',
            icon: '🌲',
            desc: '林间风 + 河流，自然白噪音助专注',
            sounds: [
                { id: 'wind-in-trees', vol: 0.35 },
                { id: 'river',         vol: 0.4  },
            ],
            masterVolume: 0.7,
        },
        {
            id: 'builtin_late_night',
            name: '深夜静心',
            icon: '🌙',
            desc: '蟋蟀 + 棕噪音，深夜学习不扰民',
            sounds: [
                { id: 'crickets', vol: 0.35 },
                { id: 'brown',    vol: 0.25 },
            ],
            masterVolume: 0.65,
        },
    ];

    let _engine = null;
    let _btnEl = null;
    let _modalEl = null;
    let _cssInjected = false;
    let _settings = {
        activeSounds: [],
        volumes: {},
        masterVolume: 0.7,
        presets: []           // 混音预设列表 [{id, name, sounds:[{id,vol}], masterVolume, createdAt}]
    };
    let _eventCleanups = [];
    let _resumeFn = null;          // 首次交互 resume 监听器（用于清理）
    let _resumeTimestamp = 0;      // 上次 resume 的时间戳（防止首次点击误关闭恢复的音源）

    /* ========== 状态存取 ========== */

    function _loadSettings() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                _settings = Object.assign({ activeSounds: [], volumes: {}, masterVolume: 0.7, presets: [] }, JSON.parse(saved));
                if (!_settings.presets) _settings.presets = [];
            } catch (e) {
                console.warn('[环境音] 加载设置失败:', e);
            }
        }
    }

    function _saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('ambient_settings');
        }
    }

    /* ========== 音频引擎（双模式：文件 + 合成） ========== */

    class AmbientSoundEngine {
        constructor() {
            this.audioContext = null;
            this.master = null;
            this.nodes = new Map();            // id → {type, source, gain, ...}
            this.bufferCache = new Map();      // id → AudioBuffer（已解码缓存）
            this.loadingPromises = new Map();  // id → Promise<AudioBuffer>（加载中）
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
         * 生成噪音 buffer（white/pink/brown）
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
         * 从 moodist CDN 加载并解码音频文件（带 Promise 去重）
         */
        _loadBuffer(id, src) {
            if (this.bufferCache.has(id)) return Promise.resolve(this.bufferCache.get(id));
            if (this.loadingPromises.has(id)) return this.loadingPromises.get(id);

            const promise = this._doLoadBuffer(id, src);
            this.loadingPromises.set(id, promise);
            return promise;
        }

        async _doLoadBuffer(id, src) {
            _setCardLoading(id, true);
            try {
                const url = MOODIST_CDN + src;
                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const arrayBuf = await resp.arrayBuffer();
                const audioBuf = await this.audioContext.decodeAudioData(arrayBuf);
                this.bufferCache.set(id, audioBuf);
                return audioBuf;
            } catch (err) {
                console.warn(`[环境音] 加载失败 ${id}:`, err);
                _setCardError(id, true);
                throw err;
            } finally {
                this.loadingPromises.delete(id);
                _setCardLoading(id, false);
            }
        }

        /**
         * 启动一个音源
         */
        async start(id) {
            if (this._destroyed) return;
            const def = SOUND_MAP[id];
            if (!def) return;
            this._ensureContext();
            if (this.nodes.has(id)) return; // 已在播放

            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // 音量节点（淡入避免爆音）
            const gain = ctx.createGain();
            const vol = _settings.volumes[id] != null ? _settings.volumes[id] : 0.6;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.5);
            gain.connect(this.master);

            if (def.synth) {
                // --- 合成噪音 ---
                const buffer = this._createNoiseBuffer(def.synth.type);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;
                source.connect(gain);
                source.start(now);
                this.nodes.set(id, { type: 'synth', source, gain });
            } else if (def.src) {
                // --- 真实音频文件 ---
                try {
                    const buffer = await this._loadBuffer(id, def.src);

                    // 加载期间可能已被 stop 或引擎已销毁
                    if (this._destroyed || this.nodes.has(id)) {
                        try { gain.disconnect(); } catch (e) {}
                        return;
                    }

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.loop = true;
                    source.connect(gain);
                    source.start(now);
                    this.nodes.set(id, { type: 'file', source, gain });
                } catch (err) {
                    // 加载失败，清理 gain 节点
                    try { gain.disconnect(); } catch (e) {}
                    _updateCardState(id);
                    _updateBadge();
                    _updateBtnPlaying();
                    return;
                }
            }

            _updateCardState(id);
            _updateBadge();
            _updateBtnPlaying();
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

            const nodeRef = node;
            setTimeout(() => {
                try { nodeRef.source.stop(); } catch (e) {}
                try { nodeRef.source.disconnect(); } catch (e) {}
                try { nodeRef.gain.disconnect(); } catch (e) {}
            }, 350);

            this.nodes.delete(id);
        }

        isPlaying(id) {
            return this.nodes.has(id);
        }
        isLoading(id) {
            return this.loadingPromises.has(id);
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

        destroy() {
            this.stopAll();
            this._destroyed = true;
            setTimeout(() => {
                try { this.audioContext && this.audioContext.close(); } catch (e) {}
            }, 500);
            this.audioContext = null;
            this.master = null;
            this.bufferCache.clear();
            this.loadingPromises.clear();
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

    const BTN_HTML = `<button id="ambientBtn" class="bottom-tool-btn" title="环境音">
        <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2c-1 4 4 6 4 10a4 4 0 0 1-8 0c0-2 1-3 2-4"/>
        </svg>
        <span class="tool-btn-label">环境</span>
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
        const sectionsHTML = CATEGORIES.map(cat => {
            const cards = cat.sounds.map(s => `
                <div class="ambient-card" data-sound-id="${s.id}" style="--sound-color:${cat.color};">
                    <div class="ambient-card-icon">${s.icon}</div>
                    <div class="ambient-card-name">${s.name}</div>
                    <input type="range" class="ambient-slider" min="0" max="100" value="${(_settings.volumes[s.id] != null ? _settings.volumes[s.id] : 0.6) * 100}" data-sound-id="${s.id}"/>
                </div>
            `).join('');

            return `
                <div class="ambient-category">
                    <div class="ambient-category-header">
                        <span class="ambient-category-icon">${cat.icon}</span>
                        <span class="ambient-category-title">${cat.title}</span>
                    </div>
                    <div class="ambient-grid">${cards}</div>
                </div>
            `;
        }).join('');

        const builtinPresetsHTML = BUILTIN_PRESETS.map(p => _renderPresetCard(p, true)).join('');
        const userPresetsHTML = _settings.presets.length > 0
            ? _settings.presets.map(p => _renderPresetCard(p, false)).join('')
            : '';

        return `
            <div class="ambient-modal-content">
                <div class="ambient-modal-header">
                    <h1 class="ambient-modal-title"><span class="title-icon">🎵</span>环境音</h1>
                    <button class="ambient-modal-close" id="ambientModalClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="ambient-hint">点击卡片开启音源，可同时开启多个叠加混音</div>

                <div class="ambient-preset-section">
                    <div class="ambient-preset-header">
                        <span class="preset-section-title">🎵 混音预设</span>
                        <div class="ambient-preset-actions">
                            <button class="ambient-stop-all-btn" id="ambientStopAll">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                                </svg>
                                <span>全部停止</span>
                            </button>
                            <button class="ambient-preset-save" id="ambientPresetSave">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                    <polyline points="17 21 17 13 7 13 7 21"/>
                                    <polyline points="7 3 7 8 15 8"/>
                                </svg>
                                <span>保存当前混音</span>
                            </button>
                        </div>
                    </div>
                    ${builtinPresetsHTML ? `
                        <div class="ambient-preset-sublabel">推荐 · 适合学习专注</div>
                        <div class="ambient-preset-list" id="ambientBuiltinList">${builtinPresetsHTML}</div>
                    ` : ''}
                    ${userPresetsHTML ? `
                        <div class="ambient-preset-sublabel">我的预设</div>
                        <div class="ambient-preset-list" id="ambientPresetList">${userPresetsHTML}</div>
                    ` : `
                        <div class="ambient-preset-list" id="ambientPresetList" style="display:none;"></div>
                    `}
                </div>

                <div class="ambient-master">
                    <span class="master-label">总音量</span>
                    <input type="range" class="ambient-master-slider" id="ambientMasterSlider" min="0" max="100" value="${_settings.masterVolume * 100}"/>
                    <span class="master-value" id="ambientMasterValue">${Math.round(_settings.masterVolume * 100)}%</span>
                </div>
                ${sectionsHTML}
                <div class="ambient-credit">音源来自 <a href="https://github.com/remvze/moodist" target="_blank" rel="noopener">Moodist</a>（MIT）</div>
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
        const loading = _engine && _engine.isLoading(soundId);
        // active 判断：引擎正在播放 OR 在 activeSounds 中（支持恢复/加载中的 pending 状态）
        const playing = (_engine && _engine.isPlaying(soundId)) || _settings.activeSounds.includes(soundId);
        card.classList.toggle('loading', !!loading);
        card.classList.toggle('active', !!playing && !loading);
    }

    function _updateAllCards() {
        Object.keys(SOUND_MAP).forEach(id => _updateCardState(id));
    }

    function _setCardLoading(soundId, isLoading) {
        const card = _modalEl && _modalEl.querySelector(`.ambient-card[data-sound-id="${soundId}"]`);
        if (!card) return;
        card.classList.toggle('loading', isLoading);
    }

    function _setCardError(soundId, hasError) {
        const card = _modalEl && _modalEl.querySelector(`.ambient-card[data-sound-id="${soundId}"]`);
        if (!card) return;
        card.classList.toggle('error', hasError);
        if (hasError) {
            setTimeout(() => card.classList.remove('error'), 3000);
        }
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
                // 预设卡片点击 → 加载预设
                const presetCard = e.target.closest('.ambient-preset-card');
                if (presetCard && !e.target.closest('.preset-card-delete')) {
                    e.stopPropagation();
                    _loadPreset(presetCard.dataset.presetId);
                    return;
                }
                // 预设删除按钮
                const delBtn = e.target.closest('.preset-card-delete');
                if (delBtn) {
                    e.stopPropagation();
                    _deletePreset(delBtn.dataset.presetId);
                    return;
                }
                // 保存预设按钮
                if (e.target.closest('#ambientPresetSave')) {
                    e.stopPropagation();
                    _savePresetDialog();
                    return;
                }
                // 音源卡片
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

    async function _toggleSound(id) {
        if (!_engine) return;
        _engine.resume();  // 首次手势触发 resume（iOS 兼容）

        // 防止页面刷新后首次点击误关闭正在恢复的音源
        // pointerdown 先于 click 触发 _resumeFn 启动所有音源，
        // 此处检查如果在 300ms 内且该音源在 activeSounds 中，跳过 toggle
        if (_resumeTimestamp > 0 && Date.now() - _resumeTimestamp < 300 && _settings.activeSounds.includes(id)) {
            return;
        }

        if (_engine.isPlaying(id) || _engine.isLoading(id)) {
            if (_engine.isLoading(id)) return; // 加载中不可取消
            _engine.stop(id);
            _settings.activeSounds = _settings.activeSounds.filter(s => s !== id);
            _updateCardState(id);
            _updateBadge();
            _updateBtnPlaying();
            _updatePresetCardStates();
            _saveSettings();
        } else {
            // 先加入 activeSounds，再异步启动
            if (!_settings.activeSounds.includes(id)) {
                _settings.activeSounds.push(id);
            }
            _updateCardState(id);  // 立即显示 active 状态
            _updateBadge();
            _updateBtnPlaying();
            _saveSettings();
            await _engine.start(id);
            // 加载失败后从 activeSounds 移除
            if (!_engine.isPlaying(id)) {
                _settings.activeSounds = _settings.activeSounds.filter(s => s !== id);
                _updateBadge();
                _updateBtnPlaying();
                _updatePresetCardStates();
                _saveSettings();
            } else {
                // 启动成功，更新预设卡片状态
                _updatePresetCardStates();
            }
        }
    }

    function _stopAll() {
        if (_engine) _engine.stopAll();
        _settings.activeSounds = [];
        _updateAllCards();
        _updateBadge();
        _updateBtnPlaying();
        _updatePresetCardStates();
        _saveSettings();
    }

    /* ========== 混音预设管理 ========== */

    /**
     * 渲染单个预设卡片 HTML
     * @param {Object} preset - 预设对象
     * @param {boolean} isBuiltin - 是否内置预设
     */
    function _renderPresetCard(preset, isBuiltin) {
        const icons = preset.sounds.slice(0, 4).map(s => (SOUND_MAP[s.id] || {}).icon || '🎵').join('');
        const moreLabel = preset.sounds.length > 4 ? `<span class="preset-more">+${preset.sounds.length - 4}</span>` : '';
        const badge = isBuiltin
            ? (preset.icon ? `<span class="preset-card-badge">${preset.icon}</span>` : '')
            : '';
        const deleteBtn = isBuiltin ? '' : `
            <button class="preset-card-delete" data-preset-id="${preset.id}" title="删除">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        const desc = preset.desc ? `<div class="preset-card-desc">${preset.desc}</div>` : '';

        // 检查是否为当前活跃预设
        const isActive = _isPresetActive(preset);
        const activeIndicator = isActive
            ? `<div class="preset-playing-indicator"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/></svg><span>播放中</span></div>`
            : '';

        return `
            <div class="ambient-preset-card${isBuiltin ? ' builtin' : ''}${isActive ? ' active' : ''}" data-preset-id="${preset.id}">
                <div class="preset-card-info">
                    <div class="preset-card-icons">${badge}${icons}${moreLabel}${activeIndicator}</div>
                    <div class="preset-card-name">${preset.name}</div>
                    ${desc}
                </div>
                ${deleteBtn}
            </div>
        `;
    }

    /**
     * 判断某个预设是否与当前 activeSounds 匹配
     */
    function _isPresetActive(preset) {
        if (!_settings.activeSounds || _settings.activeSounds.length === 0) return false;
        if (!preset.sounds || preset.sounds.length === 0) return false;
        if (_settings.activeSounds.length !== preset.sounds.length) return false;
        const activeIds = new Set(_settings.activeSounds);
        return preset.sounds.every(s => activeIds.has(s.id));
    }

    /**
     * 根据 ID 查找预设（先查用户预设，再查内置预设）
     */
    function _getPresetById(presetId) {
        const userPreset = _settings.presets.find(p => p.id === presetId);
        if (userPreset) return { preset: userPreset, isBuiltin: false };
        const builtin = BUILTIN_PRESETS.find(p => p.id === presetId);
        if (builtin) return { preset: builtin, isBuiltin: true };
        return null;
    }

    /**
     * 根据 current activeSounds 匹配正在播放的预设
     * 精确匹配：activeSounds 与预设 sounds 完全一致（顺序无关）
     */
    function _findActivePreset() {
        if (!_settings.activeSounds || _settings.activeSounds.length === 0) return null;
        const activeIds = new Set(_settings.activeSounds);

        // 先检查内置预设
        for (const p of BUILTIN_PRESETS) {
            const presetIds = new Set(p.sounds.map(s => s.id));
            if (_setsEqual(activeIds, presetIds)) return { id: p.id, name: p.name, isBuiltin: true };
        }

        // 再检查用户预设
        for (const p of _settings.presets) {
            const presetIds = new Set(p.sounds.map(s => s.id));
            if (_setsEqual(activeIds, presetIds)) return { id: p.id, name: p.name, isBuiltin: false };
        }

        return null;
    }

    function _setsEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }

    /**
     * 更新所有预设卡片的 active 状态（不重新渲染，只切换 class）
     * 在音源变化时调用，性能更好
     */
    function _updatePresetCardStates() {
        if (!_modalEl) return;

        // 更新内置预设
        BUILTIN_PRESETS.forEach(p => {
            const card = _modalEl.querySelector(`.ambient-preset-card[data-preset-id="${p.id}"]`);
            if (card) {
                const isActive = _isPresetActive(p);
                // 添加/移除 active 类
                if (isActive && !card.classList.contains('active')) {
                    card.classList.add('active');
                    // 添加播放指示器（如果还没有）
                    let indicator = card.querySelector('.preset-playing-indicator');
                    if (!indicator) {
                        const iconsEl = card.querySelector('.preset-card-icons');
                        if (iconsEl) {
                            indicator = document.createElement('div');
                            indicator.className = 'preset-playing-indicator';
                            indicator.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/></svg><span>播放中</span>';
                            iconsEl.appendChild(indicator);
                        }
                    }
                } else if (!isActive && card.classList.contains('active')) {
                    card.classList.remove('active');
                    // 移除播放指示器
                    const indicator = card.querySelector('.preset-playing-indicator');
                    if (indicator) indicator.remove();
                }
            }
        });

        // 更新用户预设
        _settings.presets.forEach(p => {
            const card = _modalEl.querySelector(`.ambient-preset-card[data-preset-id="${p.id}"]`);
            if (card) {
                const isActive = _isPresetActive(p);
                if (isActive && !card.classList.contains('active')) {
                    card.classList.add('active');
                    let indicator = card.querySelector('.preset-playing-indicator');
                    if (!indicator) {
                        const iconsEl = card.querySelector('.preset-card-icons');
                        if (iconsEl) {
                            indicator = document.createElement('div');
                            indicator.className = 'preset-playing-indicator';
                            indicator.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/></svg><span>播放中</span>';
                            iconsEl.appendChild(indicator);
                        }
                    }
                } else if (!isActive && card.classList.contains('active')) {
                    card.classList.remove('active');
                    const indicator = card.querySelector('.preset-playing-indicator');
                    if (indicator) indicator.remove();
                }
            }
        });
    }

    function _savePresetDialog() {
        if (_settings.activeSounds.length === 0) return;

        // 使用内联输入框，不用 prompt
        const saveBtn = document.getElementById('ambientPresetSave');
        if (!saveBtn) return;

        // 创建内联输入区域
        const inputWrap = document.createElement('div');
        inputWrap.className = 'ambient-preset-input-wrap';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ambient-preset-input';
        input.placeholder = '输入预设名称…';
        input.maxLength = 20;
        // 默认名称：用活跃音源名拼接
        const defaultName = _settings.activeSounds
            .slice(0, 3)
            .map(id => (SOUND_MAP[id] || {}).name || id)
            .join(' + ');
        input.value = defaultName;

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'preset-input-confirm';
        confirmBtn.textContent = '保存';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'preset-input-cancel';
        cancelBtn.textContent = '取消';

        inputWrap.appendChild(input);
        inputWrap.appendChild(confirmBtn);
        inputWrap.appendChild(cancelBtn);

        // 替换保存按钮
        saveBtn.replaceWith(inputWrap);
        input.focus();
        input.select();

        const doSave = () => {
            const name = input.value.trim() || defaultName;
            _savePreset(name);
            _renderPresets();
        };

        confirmBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', () => _renderPresets());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSave();
            if (e.key === 'Escape') _renderPresets();
        });
    }

    function _savePreset(name) {
        const preset = {
            id: 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            sounds: _settings.activeSounds.map(id => ({
                id: id,
                vol: _settings.volumes[id] != null ? _settings.volumes[id] : 0.6
            })),
            masterVolume: _settings.masterVolume,
            createdAt: Date.now()
        };
        _settings.presets.push(preset);
        _saveSettings();
    }

    function _loadPreset(presetId) {
        const result = _getPresetById(presetId);
        if (!result) return;
        const preset = result.preset;

        // 停止当前所有音源
        if (_engine) _engine.stopAll();
        _settings.activeSounds = [];

        // 应用预设的音量和总音量
        preset.sounds.forEach(s => {
            _settings.volumes[s.id] = s.vol;
            _settings.activeSounds.push(s.id);
        });
        _settings.masterVolume = preset.masterVolume;

        // 更新 UI
        _updateAllSliders();
        _updateAllCards();
        _updateBadge();
        _updateBtnPlaying();
        _updateMasterSlider();
        _updatePresetCardStates();
        _saveSettings();

        // 启动音源（需要用户手势，如果引擎存在就启动）
        if (_engine) {
            _engine.resume();
            _engine.setMasterVolume(_settings.masterVolume);
            _settings.activeSounds.forEach(id => _engine.start(id));
        }
    }

    function _deletePreset(presetId) {
        // 内置预设不可删除
        if (BUILTIN_PRESETS.some(p => p.id === presetId)) return;
        _settings.presets = _settings.presets.filter(p => p.id !== presetId);
        _saveSettings();
        _renderPresets();
    }

    function _renderPresets() {
        // 渲染内置预设列表
        const builtinList = document.getElementById('ambientBuiltinList');
        if (builtinList) {
            builtinList.innerHTML = BUILTIN_PRESETS.map(p => _renderPresetCard(p, true)).join('');
        }

        // 渲染用户预设列表
        const listEl = document.getElementById('ambientPresetList');
        if (!listEl) {
            _restoreSaveBtn();
            return;
        }

        if (_settings.presets.length === 0) {
            // 没有用户预设时隐藏用户预设区域
            listEl.style.display = 'none';
            // 移除"我的预设"标签（如果有）
            const sublabels = listEl.parentElement.querySelectorAll('.ambient-preset-sublabel');
            sublabels.forEach(el => {
                if (el.textContent.includes('我的预设')) el.remove();
            });
            _restoreSaveBtn();
            return;
        }

        listEl.style.display = '';
        listEl.innerHTML = _settings.presets.map(p => _renderPresetCard(p, false)).join('');

        // 确保"我的预设"标签存在
        const parent = listEl.parentElement;
        let myLabel = Array.from(parent.querySelectorAll('.ambient-preset-sublabel')).find(
            el => el.textContent.includes('我的预设')
        );
        if (!myLabel) {
            myLabel = document.createElement('div');
            myLabel.className = 'ambient-preset-sublabel';
            myLabel.textContent = '我的预设';
            parent.insertBefore(myLabel, listEl);
        }

        _restoreSaveBtn();
    }

    function _restoreSaveBtn() {
        // 如果输入框区域还在，恢复保存按钮
        const inputWrap = document.querySelector('.ambient-preset-input-wrap');
        if (inputWrap) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'ambient-preset-save';
            saveBtn.id = 'ambientPresetSave';
            saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg><span>保存当前混音</span>`;
            inputWrap.replaceWith(saveBtn);
        }
    }

    function _updateAllSliders() {
        // 更新所有音源卡片上的音量滑块
        Object.keys(SOUND_MAP).forEach(id => {
            const slider = _modalEl && _modalEl.querySelector(`.ambient-slider[data-sound-id="${id}"]`);
            if (slider) {
                slider.value = (_settings.volumes[id] != null ? _settings.volumes[id] : 0.6) * 100;
            }
        });
    }

    function _updateMasterSlider() {
        const slider = document.getElementById('ambientMasterSlider');
        const value = document.getElementById('ambientMasterValue');
        if (slider) slider.value = _settings.masterVolume * 100;
        if (value) value.textContent = Math.round(_settings.masterVolume * 100) + '%';
    }

    function _openModal() {
        if (_modalEl) {
            _renderPresets(); // 刷新预设列表（可能有云同步更新）
            _updatePresetCardStates(); // 更新 active 状态
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

    /* ========== 播放恢复（页面刷新后） ========== */

    /**
     * 页面刷新后恢复上次的播放状态
     * 浏览器自动播放策略：AudioContext 以 suspended 状态创建，
     * 首次用户交互时 resume 并启动所有音源。
     * 注意：不在 _restorePlayback 中立即 start()，否则 pointerdown 先于 click 触发，
     * 会导致合成噪音瞬间 start → click 时 isPlaying=true → 误关闭。
     */
    function _restorePlayback() {
        if (!_engine || _settings.activeSounds.length === 0) return;

        // 创建 AudioContext（suspended 状态，无用户手势时无法播放）
        _engine._ensureContext();

        // 首次用户交互时 resume 并启动所有音源
        _resumeFn = () => {
            if (_engine && !_engine._destroyed) {
                _engine.resume();
                _engine.setMasterVolume(_settings.masterVolume);
                _resumeTimestamp = Date.now();

                // 启动所有 activeSounds
                const sounds = [..._settings.activeSounds];
                sounds.forEach(id => {
                    _engine.start(id).then(() => {
                        if (!_engine || _engine._destroyed) return;
                        // 加载期间 activeSounds 可能已被修改（如用户点了预设），
                        // 如果该音源已不在 activeSounds 中，立即停止
                        if (!_settings.activeSounds.includes(id)) {
                            _engine.stop(id);
                            return;
                        }
                        // 加载失败则从 activeSounds 移除
                        if (!_engine.isPlaying(id)) {
                            _settings.activeSounds = _settings.activeSounds.filter(s => s !== id);
                            _updateCardState(id);
                            _updateBadge();
                            _updateBtnPlaying();
                            _saveSettings();
                        }
                    }).catch(() => {});
                });
            }
            document.removeEventListener('pointerdown', _resumeFn);
            document.removeEventListener('keydown', _resumeFn);
            _resumeFn = null;
            _setResumeIndicator(false);
        };
        document.addEventListener('pointerdown', _resumeFn);
        document.addEventListener('keydown', _resumeFn);

        _setResumeIndicator(true);
    }

    /**
     * 显示/隐藏"等待恢复"视觉指示（徽章脉冲动画）
     */
    function _setResumeIndicator(show) {
        if (_btnEl) {
            _btnEl.classList.toggle('resume-pending', show);
        }
    }

    /**
     * 清理 resume 监听器
     */
    function _cleanupResumeListener() {
        if (_resumeFn) {
            document.removeEventListener('pointerdown', _resumeFn);
            document.removeEventListener('keydown', _resumeFn);
            _resumeFn = null;
        }
        _setResumeIndicator(false);
    }

    /* ========== 生命周期 ========== */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '环境音',
        version: '3.5.0',
        description: '基于 Moodist 的真实环境音：75+ 音源，内置学习专注预设，可叠加混音、保存预设、多设备同步。预设播放状态可视化标识。',
        icon: '🌧️',
        author: '时钟应用',
        css: STYLE_CSS,

        async onActivate() {
            _injectCSS();
            _loadSettings();
            _createUI();
            _wireEvents();

            // 创建音频引擎
            _engine = new AmbientSoundEngine();

            _updateBadge();
            _updateBtnPlaying();

            // 页面刷新后恢复上次的播放状态
            // AudioContext 以 suspended 创建，首次用户交互时自动 resume
            if (_settings.activeSounds.length > 0) {
                _restorePlayback();
            }

            // 注册云端同步
            if (window.syncAdapter) {
                window.syncAdapter.registerSyncKey(
                    'ambient_settings',
                    STORAGE_KEY,
                    () => {
                        _loadSettings();
                        if (_engine && !_engine._destroyed) {
                            _engine.stopAll();
                            _engine.resume();
                            _settings.activeSounds.forEach(id => _engine.start(id));
                        }
                        _updateAllCards();
                        _updateAllSliders();
                        _updateMasterSlider();
                        _renderPresets();
                        _updatePresetCardStates();
                        _updateBadge();
                        _updateBtnPlaying();
                    },
                    'object'
                );
            }
        },

        async onDeactivate() {
            _cleanupResumeListener();
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
            _cleanupResumeListener();
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
