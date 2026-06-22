/**
 * 单词打字背诵管理器
 * 参考 qwerty-learner 设计理念
 */

// 词库数据
const WORD_DICTIONARIES = {
    'keyboard': {
        name: '键盘练习',
        icon: '⌨️',
        description: '适合初学者的键盘指法练习',
        color: '#5AC8FA',
        url: null, // 内置数据，不需要加载
        words: [] // 稍后加载
    },
    'cet4': {
        name: '大学英语四级',
        icon: '📘',
        description: 'CET-4 核心词汇 2607 词',
        color: '#007AFF',
        url: '/dicts/CET4_T.json',
        words: []
    },
    'cet6': {
        name: '大学英语六级',
        icon: '📙',
        description: 'CET-6 核心词汇 2345 词',
        color: '#5856D6',
        url: '/dicts/CET6_T.json',
        words: []
    },
    'toefl': {
        name: '托福词汇',
        icon: '📕',
        description: 'TOEFL 核心词汇 4264 词',
        color: '#FF9500',
        url: '/dicts/TOEFL_3_T.json',
        words: []
    },
    'ielts': {
        name: '雅思词汇',
        icon: '📗',
        description: 'IELTS 核心词汇 3575 词',
        color: '#34C759',
        url: '/dicts/IELTS_3_T.json',
        words: []
    },
    'gre': {
        name: 'GRE词汇',
        icon: '📓',
        description: 'GRE 核心词汇 6515 词',
        color: '#AF52DE',
        url: '/dicts/GRE_3_T.json',
        words: []
    },
    'common': {
        name: '常用词汇',
        icon: '📔',
        description: '日常英语 2000 词',
        color: '#FF2D55',
        url: '/dicts/top2000words.json',
        words: []
    }
};

// 初始化词库示例数据（仅用于降级，不要自动调用）
function initSampleWords() {
    // 键盘练习词汇（新增）
    WORD_DICTIONARIES.keyboard.words = [
        // 基础键位 - 中排（Home Row）
        { word: 'asdf', phonetic: '中排左手', translation: '左手基准键位', sentence: '左手：小指(A) 无名指(S) 中指(D) 食指(F)', sentenceTrans: '熟悉这四个键是打字的基础' },
        { word: 'jkl', phonetic: '中排右手', translation: '右手基准键位', sentence: '右手：食指(J) 中指(K) 无名指(L)', sentenceTrans: 'J键上有一个小凸点，帮助定位' },
        { word: 'asdfjkl', phonetic: '基准行', translation: '中排全部键位', sentence: '这是打字的"家"，手指应该放在这里', sentenceTrans: '打完其他键后，手指要回到这里' },
        // 上排练习
        { word: 'qwerty', phonetic: '标准键盘', translation: '上排字母', sentence: 'QWERTY键盘布局源于打字机时代', sentenceTrans: '练习从中排移动到上排' },
        { word: 'uiop', phonetic: '右手上排', translation: '上排右侧', sentence: '右手小指负责P键及其周围', sentenceTrans: '保持手腕平直' },
        // 下排练习
        { word: 'zxcv', phonetic: '左手下排', translation: '下排左侧', sentence: '左手从中排向下移动练习', sentenceTrans: '手指要回到ASDF' },
        { word: 'bnm', phonetic: '右手下排', translation: '下排右侧', sentence: '右手食指和中指练习', sentenceTrans: '注意B和N的位置' },
        // 组合练习
        { word: 'the', phonetic: '/ðə/', translation: '常用词', sentence: 'The quick brown fox jumps over the lazy dog.', sentenceTrans: '最常用的英文单词' },
        { word: 'and', phonetic: '/ænd/', translation: '常用词', sentence: 'Practice makes perfect and patience is key.', sentenceTrans: '熟练和耐心都很重要' },
        { word: 'for', phonetic: '/fɔː/', translation: '常用词', sentence: 'This exercise is for beginners.', sentenceTrans: '这个练习适合初学者' }
    ];
}

// 不要自动初始化示例数据！让词库保持空数组，等待CDN加载

class WordTyperManager {
    constructor() {
        this.toggle = null;
        this.panel = null;
        this.overlay = null;
        this.isPanelOpen = false;
        this.audioInitialized = false; // 音频上下文是否已初始化
        this.isSpeaking = false; // 是否正在发音
        
        // 学习状态
        this.currentDict = 'cet4';
        this.currentWords = [];
        this.currentIndex = 0;
        this.currentWord = null;
        this.userInput = '';
        this.isLearning = false;
        this.startTime = null;
        this.selectedChapter = null; // 当前选择的章节
        this.wordErrorCount = 0; // 当前单词错误次数
        
        // 手指数据定义（标准Touch Typing手指分配）
        // 左手：小指、无名指、中指、食指
        // 右手：食指、中指、无名指、小指
        this.fingerMap = {
            // 左手小指 (Left Pinky)
            'q': { hand: 'left', finger: 'pinky', icon: '🔑', label: '左手小指' },
            'a': { hand: 'left', finger: 'pinky', icon: '🔑', label: '左手小指' },
            'z': { hand: 'left', finger: 'pinky', icon: '🔑', label: '左手小指' },
            
            // 左手无名指 (Left Ring)
            'w': { hand: 'left', finger: 'ring', icon: '💎', label: '左手无名指' },
            's': { hand: 'left', finger: 'ring', icon: '💎', label: '左手无名指' },
            'x': { hand: 'left', finger: 'ring', icon: '💎', label: '左手无名指' },
            
            // 左手中指 (Left Middle)
            'e': { hand: 'left', finger: 'middle', icon: '🖕🏻', label: '左手中指' },
            'd': { hand: 'left', finger: 'middle', icon: '🖕🏻', label: '左手中指' },
            'c': { hand: 'left', finger: 'middle', icon: '🖕🏻', label: '左手中指' },
            
            // 左手食指 (Left Index) - 上排需要抬手
            'r': { hand: 'left', finger: 'index', icon: '👆', label: '左手食指' },
            'f': { hand: 'left', finger: 'index', icon: '👆', label: '左手食指' },
            'v': { hand: 'left', finger: 'index', icon: '👆', label: '左手食指' },
            't': { hand: 'left', finger: 'index', icon: '👆', label: '左手食指' },
            'g': { hand: 'left', finger: 'index', icon: '👆', label: '左手食指' },
            'b': { hand: 'left', finger: 'index', icon: '👆', label: '左手食指' },
            
            // 右手食指 (Right Index) - 上排需要抬手
            'y': { hand: 'right', finger: 'index', icon: '👆', label: '右手食指' },
            'h': { hand: 'right', finger: 'index', icon: '👆', label: '右手食指' },
            'n': { hand: 'right', finger: 'index', icon: '👆', label: '右手食指' },
            'u': { hand: 'right', finger: 'index', icon: '👆', label: '右手食指' },
            'j': { hand: 'right', finger: 'index', icon: '👆', label: '右手食指' },
            'm': { hand: 'right', finger: 'index', icon: '👆', label: '右手食指' },
            
            // 右手中指 (Right Middle)
            'i': { hand: 'right', finger: 'middle', icon: '🖕🏻', label: '右手中指' },
            'k': { hand: 'right', finger: 'middle', icon: '🖕🏻', label: '右手中指' },
            ',': { hand: 'right', finger: 'middle', icon: '🖕🏻', label: '右手中指' },
            
            // 右手无名指 (Right Ring)
            'o': { hand: 'right', finger: 'ring', icon: '💎', label: '右手无名指' },
            'l': { hand: 'right', finger: 'ring', icon: '💎', label: '右手无名指' },
            '.': { hand: 'right', finger: 'ring', icon: '💎', label: '右手无名指' },
            
            // 右手小指 (Right Pinky)
            'p': { hand: 'right', finger: 'pinky', icon: '🔑', label: '右手小指' },
            ';': { hand: 'right', finger: 'pinky', icon: '🤙', label: '右手小指' },
            '/': { hand: 'right', finger: 'pinky', icon: '🤙', label: '右手小指' },
            
            // 空格键 - 双手拇指
            ' ': { hand: 'thumb', finger: 'thumb', icon: '👍', label: '双手拇指' }
        };
        
        // 学习模式设置
        this.settings = {
            showPhonetic: true,
            showTranslation: true,
            showSentence: true,
            autoVoice: true,
            voiceEnabled: true,
            reviewMode: 'smart' // 'smart', 'all', 'wrong'
        };
        
        // 学习记录
        this.wordProgress = {}; // { word: { correct: 0, wrong: 0, lastTime: timestamp, familiarity: 0-5 } }
        this.sessionStats = {
            correct: 0,
            wrong: 0,
            totalTime: 0,
            wordsLearned: []
        };

        // 音频上下文（用于提示音）
        this.audioContext = null;
        this.soundEnabled = true; // 提示音开关

        this.init();
    }

    init() {
        this.loadSettings();
        this.loadProgress();
        this.createUI();
        this.bindEvents();
        
        // 默认开启听音填词模式（如果用户从未设置过）
        if (localStorage.getItem('wordTyperListenMode') === null) {
            localStorage.setItem('wordTyperListenMode', 'true');
        }
        
        // 音频上下文在用户打开面板时初始化（延迟到用户交互后）
    }
    
    /**
     * 初始化音频上下文（需要用户交互后才能创建）
     * 只有在用户点击"背单词"按钮打开面板时才调用
     */
    initAudioContext() {
        // 防止重复初始化
        if (this.audioInitialized) {
            return;
        }
        
        // 检查是否已存在 AudioContext
        if (this.audioContext) {
            this.audioInitialized = true;
            return;
        }
        
        try {
            // 直接初始化 AudioContext
            // 浏览器会在用户首次点击插件按钮时自动授予权限
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 确保 AudioContext 处于运行状态
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('[word-typer] ✅ 音频上下文已恢复运行');
                }).catch(err => {
                    console.warn('[word-typer] ⚠️ 音频上下文恢复失败:', err);
                });
            }
            
            this.audioInitialized = true;
            console.log('[word-typer] ✅ 音频上下文已初始化');
        } catch (error) {
            console.warn('[word-typer] ⚠️ 音频初始化失败:', error);
        }
    }

    /**
     * 播放正确提示音（上升音调）
     */
    playCorrectSound() {
        if (!this.soundEnabled) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this.audioContext;
            
            // 确保音频上下文处于运行状态
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            // 创建振荡器和增益节点
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // 连接到输出
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 设置声音参数（愉快的上升音调）
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            oscillator.frequency.linearRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            oscillator.frequency.linearRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
            
            // 设置音量包络（快速淡入淡出）
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            
            // 播放声音
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
            
        } catch (error) {
            console.warn('[word-typer] ⚠️ 播放正确提示音失败:', error);
        }
    }

    /**
     * 播放错误提示音（下降音调 + 不和谐）
     */
    playWrongSound() {
        if (!this.soundEnabled) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this.audioContext;
            
            // 确保音频上下文处于运行状态
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            // 创建两个振荡器（产生不和谐音）
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // 连接到输出
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 设置声音参数（警示性的下降音调）
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
            osc1.frequency.linearRampToValueAtTime(349.23, ctx.currentTime + 0.15); // F4
            osc1.frequency.linearRampToValueAtTime(293.66, ctx.currentTime + 0.3); // D4
            
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(396.00, ctx.currentTime); // 稍微失谐，产生不和谐效果
            osc2.frequency.linearRampToValueAtTime(353.23, ctx.currentTime + 0.15);
            osc2.frequency.linearRampToValueAtTime(297.66, ctx.currentTime + 0.3);
            
            // 设置音量包络
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            
            // 播放声音
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.4);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.4);
            
        } catch (error) {
            console.warn('[word-typer] ⚠️ 播放错误提示音失败:', error);
        }
    }

    /**
     * 播放按键正确提示音（短促高音）
     */
    playKeyCorrectSound() {
        if (!this.soundEnabled) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this.audioContext;
            
            // 确保音频上下文处于运行状态
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            // 创建振荡器和增益节点（短促的高音）
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // 连接到输出
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 设置声音参数（短促清脆的高音）
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880.00, ctx.currentTime); // A5 - 高音
            
            // 设置音量包络（非常短促）
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01); // 快速淡入
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08); // 快速淡出
            
            // 播放声音
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.08);
            
        } catch (error) {
            console.warn('[word-typer] ⚠️ 播放按键正确提示音失败:', error);
        }
    }

    /**
     * 播放按键错误提示音（短促低音）
     */
    playKeyWrongSound() {
        if (!this.soundEnabled) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this.audioContext;
            
            // 确保音频上下文处于运行状态
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            // 创建振荡器和增益节点（短促的低音）
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // 连接到输出
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 设置声音参数（短促的低音）
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(220.00, ctx.currentTime); // A3 - 低音
            
            // 设置音量包络（非常短促）
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01); // 快速淡入
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1); // 快速淡出
            
            // 播放声音
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            
        } catch (error) {
            console.warn('[word-typer] ⚠️ 播放按键错误提示音失败:', error);
        }
    }

    /**
     * 切换提示音开关
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('wordTyperSoundToggle');
        if (soundBtn) {
            soundBtn.textContent = this.soundEnabled ? '🔔' : '🔕';
            soundBtn.title = this.soundEnabled ? '关闭提示音' : '开启提示音';
        }
        
        // 保存设置
        localStorage.setItem('wordTyperSound', this.soundEnabled.toString());
        
        this.showFeedback(this.soundEnabled ? '✓ 已开启提示音' : '✓ 已关闭提示音', 'success');
    }

    destroy() {
        if (this.toggle && this.toggle.parentNode) {
            this.toggle.remove();
        }
        if (this.panel && this.panel.parentNode) {
            this.panel.remove();
        }
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.remove();
        }
    }

    /* ========== 数据管理 ========== */
    
    loadSettings() {
        const saved = localStorage.getItem('wordTyperSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('wordTyperSettings', JSON.stringify(this.settings));
    }

    loadProgress() {
        const saved = localStorage.getItem('wordTyperProgress');
        if (saved) {
            try {
                this.wordProgress = JSON.parse(saved);
            } catch (e) {
                console.error('加载学习进度失败:', e);
                this.wordProgress = {};
            }
        }
    }

    saveProgress() {
        localStorage.setItem('wordTyperProgress', JSON.stringify(this.wordProgress));
        
        // 同步到云端
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('wordTyperProgress');
        }
    }

    getWordProgress(word) {
        if (!this.wordProgress[word]) {
            this.wordProgress[word] = {
                correct: 0,
                wrong: 0,
                lastTime: null,
                familiarity: 0 // 0-5，5表示完全熟悉
            };
        }
        return this.wordProgress[word];
    }

    updateWordProgress(word, isCorrect) {
        const progress = this.getWordProgress(word);
        if (isCorrect) {
            progress.correct++;
            progress.familiarity = Math.min(5, progress.familiarity + 1);
        } else {
            progress.wrong++;
            progress.familiarity = Math.max(0, progress.familiarity - 1);
        }
        progress.lastTime = Date.now();
        this.saveProgress();
    }

    /* ========== UI 创建 ========== */

    createUI() {
        this.createToggle();
        this.createPanel();
    }

    createToggle() {
        const toolbar = document.querySelector('.bottom-toolbar');
        if (!toolbar) return;

        this.toggle = document.createElement('button');
        this.toggle.id = 'wordTyperToggle';
        this.toggle.className = 'bottom-tool-btn';
        this.toggle.title = '单词打字背诵';
        this.toggle.innerHTML = `
            <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <path d="M8 7h8M8 11h8M8 15h5"/>
            </svg>
            <span class="tool-btn-label">背单词</span>
        `;
        toolbar.appendChild(this.toggle);
    }

    createPanel() {
        // 遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'wordTyperOverlay';
        this.overlay.className = 'word-typer-overlay';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);

        // 主面板
        this.panel = document.createElement('div');
        this.panel.id = 'wordTyperPanel';
        this.panel.className = 'word-typer-panel';
        this.panel.innerHTML = this.getPanelHTML();
        document.body.appendChild(this.panel);
        
        this.updateStatsDisplay();
    }

    getGalleryHTML() {
        // 按分类组织词库
        const categories = {
            'practice': {
                name: '适合初学打字',
                icon: '⌨️',
                dicts: ['keyboard']
            },            
            'dict': {
                name: '词库',
                icon: '📚',
                dicts: ['common','cet4', 'cet6','toefl', 'ielts', 'gre']
            }
        };

        let html = '<div class="dict-gallery">';
        
        for (const [catKey, category] of Object.entries(categories)) {
            html += `
                <div class="dict-category">
                    <h4 class="category-title">
                        <span class="category-icon">${category.icon}</span>
                        <span>${category.name}</span>
                    </h4>
                    <div class="dict-cards">
            `;
            
            for (const dictKey of category.dicts) {
                const dict = WORD_DICTIONARIES[dictKey];
                if (!dict) continue;
                
                html += `
                    <div class="dict-card" data-dict="${dictKey}">
                        <div class="dict-card-icon">${dict.icon}</div>
                        <div class="dict-card-name">${dict.name}</div>
                        <div class="dict-card-desc">${dict.description}</div>
                        <div class="dict-card-actions">
                            <button class="dict-card-btn" data-dict="${dictKey}" data-mode="chapter">
                                📚 选择章节
                            </button>
                            <button class="dict-card-btn dict-card-btn-secondary" data-dict="${dictKey}" data-mode="random">
                                🎲 随机练习
                            </button>
                        </div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * 显示章节选择界面
     * @param {string} mode - 学习模式 ('new' 或 'review')
     */
    async showChapterSelection(mode) {
        const dict = WORD_DICTIONARIES[this.currentDict];
        if (!dict) return;

        // 先显示加载提示
        const selectorEl = document.getElementById('wordTyperSelector');
        if (!selectorEl) return;

        selectorEl.innerHTML = `
            <div style="text-align:center;padding:40px;color:#86868b;">
                <div style="font-size:48px;margin-bottom:16px;">${dict.icon}</div>
                <div style="font-size:18px;font-weight:600;color:#1d1d1f;margin-bottom:8px;">${dict.name}</div>
                <div style="font-size:14px;margin-bottom:20px;">${dict.description}</div>
                <div style="font-size:15px;color:#007AFF;">正在加载词库...</div>
            </div>
        `;

        // 从CDN加载完整词库数据
        const words = await this.loadDictionaryWords(this.currentDict);
        
        if (!words || words.length === 0) {
            selectorEl.innerHTML = `
                <div style="text-align:center;padding:40px;">
                    <p style="color:#FF3B30;margin-bottom:20px;font-size:16px;">❌ 词库加载失败</p>
                    <p style="color:#86868b;margin-bottom:20px;font-size:14px;">请检查网络连接或稍后重试</p>
                    <button class="dict-card-btn" id="btnBackToGallery">返回词库列表</button>
                </div>
            `;
            return;
        }

        console.log(`[word-typer] ✅ 从CDN加载完成: ${this.currentDict}, ${words.length} 词`);

        // 根据实际单词数量自动分章节（每章20词）
        const wordsPerChapter = 20;
        const totalChapters = Math.ceil(words.length / wordsPerChapter);
        
        console.log(`[word-typer] 📚 自动分章节: ${totalChapters} 章 (每章 ${wordsPerChapter} 词)`);
        
        // 生成章节列表HTML
        let chaptersHTML = `
            <div class="chapter-selection">
                <div class="chapter-header">
                    <button class="btn-back" id="btnBackToGallery">← 返回</button>
                    <div class="chapter-info">
                        <h3>${dict.icon} ${dict.name}</h3>
                        <p class="chapter-stats">${totalChapters} 章节 · 共 ${words.length} 词 · 每章 ${wordsPerChapter} 词</p>
                        <p class="chapter-desc">${dict.description}</p>
                    </div>
                </div>
                                
                <div class="chapter-grid">
        `;

        // 生成章节卡片（基于实际单词数）
        for (let i = 0; i < totalChapters; i++) {
            const chapterNum = i + 1;
            const startIdx = i * wordsPerChapter;
            const endIdx = Math.min(startIdx + wordsPerChapter, words.length);
            const chapterWordCount = endIdx - startIdx;
            
            // 计算本章节的完成进度
            const chapterWords = words.slice(startIdx, endIdx);
            let masteredCount = 0;
            chapterWords.forEach(w => {
                const progress = this.getWordProgress(w.word);
                if (progress.familiarity >= 4) {
                    masteredCount++;
                }
            });
            
            const completionRate = chapterWordCount > 0 ? Math.round((masteredCount / chapterWordCount) * 100) : 0;
            const isCompleted = completionRate === 100;
            
            chaptersHTML += `
                <div class="chapter-card ${isCompleted ? 'completed' : ''}" data-chapter="${chapterNum}" data-mode="${mode}">
                    <div class="chapter-number">第 ${chapterNum} 章</div>
                    <div class="chapter-word-count">${chapterWordCount} 词</div>
                    <div class="chapter-progress">
                        <div class="chapter-progress-bar">
                            <div class="chapter-progress-fill" style="width: ${completionRate}%"></div>
                        </div>
                        <div class="chapter-progress-text">${isCompleted ? '✓ 已完成' : (completionRate > 0 ? `${completionRate}%` : '未练习')}</div>
                    </div>
                </div>
            `;
        }

        chaptersHTML += `
                </div>
            </div>
        `;

        selectorEl.innerHTML = chaptersHTML;
        
        // 显示加载成功提示
        this.showFeedback(`✓ 成功加载 ${words.length} 个单词，已分为 ${totalChapters} 章节`, 'success');
    }

    /**
     * 显示词库画廊
     */
    showGallery() {
        const selectorEl = document.getElementById('wordTyperSelector');
        if (selectorEl) {
            selectorEl.innerHTML = this.getGalleryHTML() + `
                <div class="settings-panel">
                    <label class="setting-item">
                        <input type="checkbox" id="chkShowPhonetic" ${this.settings.showPhonetic ? 'checked' : ''}>
                        <span>显示音标</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="chkShowTranslation" ${this.settings.showTranslation ? 'checked' : ''}>
                        <span>显示释义</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="chkAutoVoice" ${this.settings.autoVoice ? 'checked' : ''}>
                        <span>自动发音</span>
                    </label>
                </div>
            `;
        }
    }

    getPanelHTML() {
        return `
            <div class="word-typer-header">
                <div class="header-title-row">
                    <h3>📖 单词打字背诵</h3>
                    <button class="header-review-btn" id="reviewAllWrongBtn">
                        🔄 复习错词
                    </button>
                </div>
                <div class="header-actions">
                    <button class="word-typer-sound-toggle" id="wordTyperSoundToggle" title="切换提示音">🔔</button>
                    <button class="word-typer-voice-toggle" id="wordTyperVoiceToggle" title="切换发音">🔊</button>
                    <button class="word-typer-listen-toggle" id="wordTyperListenToggle" title="听音填词模式">🎧</button>
                    <button class="word-typer-close-btn" id="wordTyperCloseBtn">✕</button>
                </div>
            </div>
            
            <!-- 词库画廊 -->
            <div class="word-typer-selector" id="wordTyperSelector">
                ${this.getGalleryHTML()}
                
                <div class="settings-panel">
                    <label class="setting-item">
                        <input type="checkbox" id="chkShowPhonetic" checked>
                        <span>显示音标</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="chkShowTranslation" checked>
                        <span>显示释义</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="chkAutoVoice" checked>
                        <span>自动发音</span>
                    </label>
                </div>
            </div>
            
            <!-- 学习区 -->
            <div class="word-typer-learning-area" id="wordTyperLearningArea" style="display:none;">
                <div class="learning-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progressText">0/0</span>
                        <span class="accuracy">准确率: <span id="accuracyText">0%</span></span>
                    </div>
                </div>
                
                <div class="word-display-area">
                    <div class="word-phonetic" id="wordPhonetic"></div>
                    <div class="word-main-row">
                        <div class="word-main" id="wordMain"></div>
                        <button class="btn-pronounce-inline" id="btnPronounce" title="发音">🔊</button>
                    </div>
                    <div class="word-translation" id="wordTranslation"></div>
                <!-- 虚拟键盘（仅键盘练习模式显示） -->
                <div class="virtual-keyboard" id="wordTyperVirtualKeyboard" style="display:none;">
                    <div class="keyboard-row">
                        <div class="key" data-key="q">Q</div>
                        <div class="key" data-key="w">W</div>
                        <div class="key" data-key="e">E</div>
                        <div class="key" data-key="r">R</div>
                        <div class="key" data-key="t">T</div>
                        <div class="key" data-key="y">Y</div>
                        <div class="key" data-key="u">U</div>
                        <div class="key" data-key="i">I</div>
                        <div class="key" data-key="o">O</div>
                        <div class="key" data-key="p">P</div>
                    </div>
                    <div class="keyboard-row">
                        <div class="key" data-key="a">A</div>
                        <div class="key" data-key="s">S</div>
                        <div class="key" data-key="d">D</div>
                        <div class="key" data-key="f">F</div>
                        <div class="key" data-key="g">G</div>
                        <div class="key" data-key="h">H</div>
                        <div class="key" data-key="j">J</div>
                        <div class="key" data-key="k">K</div>
                        <div class="key" data-key="l">L</div>
                    </div>
                    <div class="keyboard-row">
                        <div class="key" data-key="z">Z</div>
                        <div class="key" data-key="x">X</div>
                        <div class="key" data-key="c">C</div>
                        <div class="key" data-key="v">V</div>
                        <div class="key" data-key="b">B</div>
                        <div class="key" data-key="n">N</div>
                        <div class="key" data-key="m">M</div>
                    </div>
                    <!-- 手指提示区域 -->
                    <div class="finger-hint" id="fingerHint">
                        <!-- 左手 -->
                        <div class="hand-group" id="handLeft">
                            <svg class="hand-svg left-hand" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                                <!-- 小指 -->
                                <ellipse class="finger-bg" data-finger="pinky" cx="18" cy="28" rx="9" ry="23"/>
                                <ellipse class="finger-active" data-finger="pinky" cx="18" cy="28" rx="9" ry="23"/>
                                <!-- 无名指 -->
                                <ellipse class="finger-bg" data-finger="ring" cx="38" cy="20" rx="9" ry="26"/>
                                <ellipse class="finger-active" data-finger="ring" cx="38" cy="20" rx="9" ry="26"/>
                                <!-- 中指 -->
                                <ellipse class="finger-bg" data-finger="middle" cx="58" cy="18" rx="9" ry="28"/>
                                <ellipse class="finger-active" data-finger="middle" cx="58" cy="18" rx="9" ry="28"/>
                                <!-- 食指 -->
                                <ellipse class="finger-bg" data-finger="index" cx="78" cy="22" rx="9" ry="25"/>
                                <ellipse class="finger-active" data-finger="index" cx="78" cy="22" rx="9" ry="25"/>
                                <!-- 手掌 -->
                                <rect class="palm" x="8" y="50" width="84" height="70" rx="12"/>
                            </svg>
                        </div>
                        <!-- 右手 -->
                        <div class="hand-group" id="handRight">
                            <svg class="hand-svg right-hand" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                                <!-- 食指 -->
                                <ellipse class="finger-bg" data-finger="index" cx="22" cy="22" rx="9" ry="25"/>
                                <ellipse class="finger-active" data-finger="index" cx="22" cy="22" rx="9" ry="25"/>
                                <!-- 中指 -->
                                <ellipse class="finger-bg" data-finger="middle" cx="42" cy="18" rx="9" ry="28"/>
                                <ellipse class="finger-active" data-finger="middle" cx="42" cy="18" rx="9" ry="28"/>
                                <!-- 无名指 -->
                                <ellipse class="finger-bg" data-finger="ring" cx="62" cy="20" rx="9" ry="26"/>
                                <ellipse class="finger-active" data-finger="ring" cx="62" cy="20" rx="9" ry="26"/>
                                <!-- 小指 -->
                                <ellipse class="finger-bg" data-finger="pinky" cx="82" cy="28" rx="9" ry="23"/>
                                <ellipse class="finger-active" data-finger="pinky" cx="82" cy="28" rx="9" ry="23"/>
                                <!-- 手掌 -->
                                <rect class="palm" x="8" y="50" width="84" height="70" rx="12"/>
                            </svg>
                        </div>
                    </div>
                    <div class="keyboard-hint">
                        <span class="hint-left">左手区域</span>
                        <span class="hint-home">基准键位 (Home Row)</span>
                        <span class="hint-right">右手区域</span>
                    </div>
                </div>
                

                    <div class="word-sentence" id="wordSentence"></div>
                    <div class="word-sentence-trans" id="wordSentenceTrans"></div>
                </div>
                

                <div class="typing-area">
                    <div class="typed-letters" id="typedLetters"></div>
                </div>
                
                <div class="learning-controls">
                    <button class="btn-secondary" id="btnSkip">⏭️ 跳过</button>
                    <button class="btn-danger" id="btnQuitLearning">❌ 退出</button>
                </div>
            </div>
            
            <!-- 统计信息 -->
            <div class="word-typer-stats" id="wordTyperStats">
                <h4>📊 学习统计</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="statTotalWords">0</div>
                        <div class="stat-label">已学单词</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="statMasteredWords">0</div>
                        <div class="stat-label">熟练单词</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="statAccuracy">0%</div>
                        <div class="stat-label">总体准确率</div>
                    </div>
                </div>
            </div>
        `;
    }

    /* ========== 事件绑定 ========== */

    bindEvents() {
        // 切换面板
        if (this.toggle) {
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });
        }

        // 关闭按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'wordTyperCloseBtn') {
                this.closePanel();
            }
        });

        // 遮罩点击关闭
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                if (!this.isLearning) {
                    this.closePanel();
                }
            });
        }

        // 提示音切换按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'wordTyperSoundToggle') {
                this.toggleSound();
            }
        });

        // 语音切换按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'wordTyperVoiceToggle') {
                const enabled = this.toggleVoice();
                this.showFeedback(enabled ? '✓ 已开启发音' : '✓ 已关闭发音', 'success');
            }
            
            // 听音填词模式开关
            if (e.target.id === 'wordTyperListenToggle') {
                const enabled = this.toggleListenMode();
                this.showFeedback(enabled ? '✓ 已开启听音填词' : '✓ 已关闭听音填词', 'success');
            }
        });

        // 词库卡片点击
        document.addEventListener('click', (e) => {
            // 点击按钮
            const btn = e.target.closest('.dict-card-btn');
            if (btn) {
                const dictKey = btn.dataset.dict;
                const mode = btn.dataset.mode;
                
                if (dictKey) {
                    this.currentDict = dictKey;
                    
                    if (mode === 'chapter') {
                        // 选择章节模式：显示章节选择界面
                        this.showChapterSelection('new');
                    } else if (mode === 'random') {
                        // 随机练习模式：随机选择20个单词
                        this.startLearning('random');
                    }
                }
            }
            
            // 全局复习错词按钮
            if (e.target.id === 'reviewAllWrongBtn') {
                console.log('[word-typer] 点击全局复习错词按钮');
                this.startLearning('wrong');
            }
        });

        // 章节卡片点击
        document.addEventListener('click', (e) => {
            const chapterBtn = e.target.closest('.chapter-card');
            if (chapterBtn) {
                const chapter = parseInt(chapterBtn.dataset.chapter);
                const mode = chapterBtn.dataset.mode;
                
                if (!isNaN(chapter)) {
                    this.selectedChapter = chapter;
                    this.startLearning(mode);
                }
            }
        });

        // 返回词库列表
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnBackToGallery')) {
                this.showGallery();
            }
        });

        // 设置选项
        document.addEventListener('change', (e) => {
            if (e.target.id === 'chkShowPhonetic') {
                this.settings.showPhonetic = e.target.checked;
                this.saveSettings();
                this.updateWordDisplay();
            } else if (e.target.id === 'chkShowTranslation') {
                this.settings.showTranslation = e.target.checked;
                this.saveSettings();
                this.updateWordDisplay();
            } else if (e.target.id === 'chkAutoVoice') {
                this.settings.autoVoice = e.target.checked;
                this.saveSettings();
            }
        });

        // 学习控制按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnPronounce')) {
                this.pronounceWord();
            } else if (e.target.closest('#btnSkip')) {
                this.skipWord();
            } else if (e.target.closest('#btnQuitLearning')) {
                this.quitLearning();
            }
        });

        // 全局键盘监听
        document.addEventListener('keydown', (e) => {
            if (!this.isLearning || !this.isPanelOpen) return;
            
            // 排除修饰键
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            
            // ESC 退出
            if (e.key === 'Escape') {
                this.quitLearning();
                return;
            }
            
            // Backspace 删除
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.userInput.length > 0) {
                    this.userInput = this.userInput.slice(0, -1);
                    this.updateTypingDisplay();
                }
                return;
            }
            
            // 只接受字母
            if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                this.handleLetterInput(e.key);
            }
        });
    }

    /* ========== 面板控制 ========== */

    togglePanel() {
        this.isPanelOpen ? this.closePanel() : this.openPanel();
    }

    openPanel() {
        if (this.panel && this.overlay) {
            this.panel.classList.add('open');
            this.overlay.style.display = 'block';
            this.isPanelOpen = true;
            
            // 用户打开面板时才初始化音频上下文
            this.initAudioContext();
            
            this.updateStatsDisplay();
            this.updateVoiceButton();
            this.updateListenModeButton();  // 初始化听音填词按钮状态
        }
    }

    closePanel() {
        if (this.panel && this.overlay) {
            if (this.isLearning) {
                if (!confirm('正在学习中，确定要关闭吗？')) {
                    return;
                }
                this.quitLearning();
            }
            this.panel.classList.remove('open');
            this.overlay.style.display = 'none';
            this.isPanelOpen = false;
        }
    }

    /* ========== 词库加载 ========== */

    /**
     * 重新加载当前词库（清除缓存）
     */
    async reloadDictionary() {
        const dict = WORD_DICTIONARIES[this.currentDict];
        if (!dict) {
            alert('请先选择词库');
            return;
        }

        if (!confirm(`确定要重新加载 ${dict.name} 吗？\n这将清除内存和本地缓存，从网络重新下载。`)) {
            return;
        }

        // 清除内存缓存
        dict.words = [];
        
        // 清除 localStorage 缓存
        localStorage.removeItem(`wordTyperDict_${this.currentDict}`);
        localStorage.removeItem(`wordTyperDict_${this.currentDict}_time`);
        
        console.log('[word-typer] 已清除缓存，开始重新加载...');
        
        // 显示加载提示
        this.showFeedback('正在从网络重新加载词库...', 'info');
        
        try {
            const words = await this.loadDictionaryWords(this.currentDict);
            
            if (words && words.length > 100) {
                this.showFeedback(`✓ 成功加载 ${words.length} 个单词`, 'success');
                console.log('[word-typer] ✅ 重新加载成功:', words.length, '词');
            } else {
                this.showFeedback('⚠️ 加载的单词数较少，可能是网络问题', 'error');
                console.warn('[word-typer] ⚠️ 加载的单词数较少:', words.length);
            }
        } catch (error) {
            this.showFeedback('✗ 重新加载失败', 'error');
            console.error('[word-typer] ❌ 重新加载失败:', error);
        }
    }

    /**
     * 从 qwerty-learner 加载词库数据
     * @param {string} dictId - 词库ID
     * @returns {Promise<Array>} 单词数组
     */
    async loadDictionaryWords(dictId) {
        const dict = WORD_DICTIONARIES[dictId];
        if (!dict) {
            console.error('[word-typer] 词库不存在:', dictId);
            return [];
        }

        // 键盘练习使用内置数据
        if (dictId === 'keyboard') {
            if (!dict.words || dict.words.length === 0) {
                initSampleWords();
            }
            console.log('[word-typer] 使用内置键盘练习数据:', dict.words.length, '项');
            return dict.words;
        }

        // 1. 优先从内存缓存返回（已加载过）
        if (dict.words && dict.words.length > 0) {
            console.log('[word-typer] 📦 从内存缓存返回:', dictId, dict.words.length, '词');
            return dict.words;
        }

        // 2. 尝试从localStorage加载
        const cached = this.loadFromCache(dictId);
        if (cached && cached.length > 0) {
            dict.words = cached;
            console.log('[word-typer] 💾 从localStorage缓存加载:', dictId, cached.length, '词');
            return cached;
        }

        // 3. 从CDN加载（首次加载）
        if (!dict.url) {
            console.error('[word-typer] 词库URL未配置:', dictId);
            return [];
        }

        try {
            console.log('[word-typer] 🌐 首次加载，开始从CDN下载:', dictId);
            
            // 使用 CDN 加速（jsDelivr）
            const baseUrls = [
                'https://cdn.jsdelivr.net/gh/RealKai42/qwerty-learner@master/public',
                'https://raw.githubusercontent.com/RealKai42/qwerty-learner/master/public',
                'https://cdn.statically.io/gh/RealKai42/qwerty-learner/master/public'
            ];

            let data = null;
            let lastError = null;

            // 依次尝试多个CDN
            for (const baseUrl of baseUrls) {
                try {
                    const url = baseUrl + dict.url;
                    console.log('[word-typer] 📡 尝试CDN:', url);
                    
                    const response = await fetch(url, {
                        cache: 'default',
                        mode: 'cors'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    data = await response.json();
                    console.log('[word-typer] ✅ CDN加载成功:', dictId, data.length, '词，来源:', baseUrl.split('/').slice(2,4).join('/'));
                    break;
                } catch (error) {
                    console.warn('[word-typer] ❌ CDN加载失败:', baseUrl.split('/').slice(2,4).join('/'), error.message);
                    lastError = error;
                    continue;
                }
            }

            if (!data || data.length === 0) {
                throw lastError || new Error('所有CDN加载失败或数据为空');
            }

            // 转换格式：qwerty-learner -> 插件格式
            console.log('[word-typer] 🔄 开始格式转换，原始数据:', data.length, '项');
            const words = data.map(w => ({
                word: w.name || '',
                phonetic: w.usphone ? `/${w.usphone}/` : (w.ukphone ? `/${w.ukphone}/` : ''),
                translation: Array.isArray(w.trans) ? w.trans.join('; ') : (w.trans || ''),
                sentence: '',  // qwerty-learner 词库没有例句
                sentenceTrans: ''
            })).filter(w => w.word); // 过滤空单词

            console.log('[word-typer] ✅ 格式转换完成:', words.length, '词');

            // 保存到内存和localStorage缓存
            dict.words = words;
            this.saveToCache(dictId, words);
            console.log('[word-typer] 💾 已保存到缓存');

            return words;

        } catch (error) {
            console.error('[word-typer] ❌ 加载词库失败:', dictId, error);
            this.showFeedback(`加载词库失败: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * 从缓存加载词库
     */
    loadFromCache(dictId) {
        try {
            const cached = localStorage.getItem(`wordTyperDict_${dictId}`);
            const cacheTime = localStorage.getItem(`wordTyperDict_${dictId}_time`);
            
            if (cached && cacheTime) {
                const cacheAge = Date.now() - parseInt(cacheTime);
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
                
                if (cacheAge < maxAge) {
                    return JSON.parse(cached);
                } else {
                    console.log(`词库缓存已过期: ${dictId}`);
                    // 清理过期缓存
                    localStorage.removeItem(`wordTyperDict_${dictId}`);
                    localStorage.removeItem(`wordTyperDict_${dictId}_time`);
                }
            }
        } catch (error) {
            console.error('读取缓存失败:', error);
        }
        return null;
    }

    /**
     * 保存词库到缓存
     */
    saveToCache(dictId, words) {
        try {
            localStorage.setItem(`wordTyperDict_${dictId}`, JSON.stringify(words));
            localStorage.setItem(`wordTyperDict_${dictId}_time`, Date.now().toString());
            console.log(`词库已缓存: ${dictId}, ${words.length} 词`);
        } catch (error) {
            console.error('缓存词库失败:', error);
            // localStorage 可能已满，尝试清理旧缓存
            if (error.name === 'QuotaExceededError') {
                this.clearOldCache();
            }
        }
    }

    /**
     * 清理旧缓存
     */
    clearOldCache() {
        try {
            const keys = Object.keys(localStorage);
            const dictKeys = keys.filter(k => k.startsWith('wordTyperDict_') && k.endsWith('_time'));
            
            // 按时间排序，删除最旧的
            const caches = dictKeys.map(key => ({
                key: key.replace('_time', ''),
                time: parseInt(localStorage.getItem(key) || '0')
            })).sort((a, b) => a.time - b.time);

            // 删除最旧的缓存
            if (caches.length > 0) {
                const oldest = caches[0];
                localStorage.removeItem(oldest.key);
                localStorage.removeItem(oldest.key + '_time');
                console.log('清理旧缓存:', oldest.key);
            }
        } catch (error) {
            console.error('清理缓存失败:', error);
        }
    }

    /* ========== 学习逻辑 ========== */

    async startLearning(mode) {
        const dict = WORD_DICTIONARIES[this.currentDict];
        if (!dict) {
            alert('词库不存在');
            return;
        }

        // 保存学习模式，用于"继续学习"
        this.lastLearningMode = mode;

        // 显示加载提示
        this.showFeedback('正在加载词库...', 'info');

        // 动态加载词库
        const allWords = await this.loadDictionaryWords(this.currentDict);
        
        console.log(`[word-typer] 加载词库 ${this.currentDict}:`, allWords ? allWords.length : 0, '词');
        
        if (!allWords || allWords.length === 0) {
            alert('词库加载失败或为空，请检查网络连接');
            return;
        }

        // 如果选择了章节，只使用该章节的单词
        let words = allWords;
        if (this.selectedChapter) {
            const wordsPerChapter = 20;
            const startIdx = (this.selectedChapter - 1) * wordsPerChapter;
            const endIdx = Math.min(startIdx + wordsPerChapter, allWords.length);
            words = allWords.slice(startIdx, endIdx);
            console.log(`[word-typer] 选择第 ${this.selectedChapter} 章:`, words.length, '词');
        }

        // 根据模式筛选单词
        let wordsToLearn = [];
        if (mode === 'new') {
            // 学习新词：未学习或熟练度 <= 2 的词（更宽松）
            wordsToLearn = words.filter(w => {
                const progress = this.getWordProgress(w.word);
                return progress.familiarity <= 2;
            });
            console.log(`[word-typer] "学习新词"模式筛选出:`, wordsToLearn.length, '词');
        } else if (mode === 'random') {
            // 随机练习：从所有单词中随机选择20个
            console.log(`[word-typer] "随机练习"模式：从 ${words.length} 个单词中随机选择20个`);
            
            // 打乱所有单词的顺序
            const shuffled = this.shuffleArray([...words]);
            
            // 选择前20个（如果总数不足20个，则选择所有）
            wordsToLearn = shuffled.slice(0, 20);
            
            console.log(`[word-typer] "随机练习"模式选中:`, wordsToLearn.length, '词');
        } else if (mode === 'wrong') {
            // 复习错词：从所有词库中筛选错误次数多的词
            console.log(`[word-typer] "复习错词"模式：从所有词库中筛选错词`);
            
            wordsToLearn = [];
            
            // 遍历所有词库
            for (const dictKey of Object.keys(WORD_DICTIONARIES)) {
                try {
                    const dictWords = await this.loadDictionaryWords(dictKey);
                    if (dictWords && dictWords.length > 0) {
                        // 筛选该词库中的错词
                        const wrongWords = dictWords.filter(w => {
                            const progress = this.getWordProgress(w.word);
                            return progress.wrong > 0 && progress.familiarity < 4;
                        });
                        wordsToLearn.push(...wrongWords);
                    }
                } catch (error) {
                    console.warn(`[word-typer] ⚠️ 加载词库 ${dictKey} 失败:`, error);
                }
            }
            
            console.log(`[word-typer] "复习错词"模式筛选出:`, wordsToLearn.length, '词');
        } else {
            // 全部复习
            wordsToLearn = [...words];
            console.log(`[word-typer] "全部复习"模式:`, wordsToLearn.length, '词');
        }

        if (wordsToLearn.length === 0) {
            const chapterText = this.selectedChapter ? `第 ${this.selectedChapter} 章` : '';
            
            if (mode === 'wrong') {
                // 复习模式没有错词时，显示提示并回到首页
                this.showFeedback('✓ 没有需要复习的错词', 'success');
                this.showGallery(); // 回到插件首页
            } else {
                alert(`${chapterText}所有单词已掌握！`);
            }
            return;
        }
        
        console.log(`[word-typer] 开始学习:`, wordsToLearn.length, '词，前3个:', 
            wordsToLearn.slice(0, 3).map(w => w.word));

        // 打乱顺序
        this.currentWords = this.shuffleArray(wordsToLearn);
        this.currentIndex = 0;
        this.userInput = '';
        this.isLearning = true;
        this.startTime = Date.now();
        
        // 重置本次统计
        this.sessionStats = {
            correct: 0,
            wrong: 0,
            totalTime: 0,
            wordsLearned: []
        };

        // 显示学习区域
        document.getElementById('wordTyperSelector').style.display = 'none';
        document.getElementById('wordTyperLearningArea').style.display = 'block';
        document.getElementById('wordTyperStats').style.display = 'none';

        // 如果是键盘练习模式，显示虚拟键盘
        const keyboard = document.getElementById('wordTyperVirtualKeyboard');
        if (keyboard) {
            keyboard.style.display = this.currentDict === 'keyboard' ? 'block' : 'none';
        }

        this.showNextWord();
    }

    showNextWord() {
        if (this.currentIndex >= this.currentWords.length) {
            this.finishLearning();
            return;
        }

        this.currentWord = this.currentWords[this.currentIndex];
        this.userInput = '';
        this.wordErrorCount = 0;  // 重置错误计数
        
        this.updateWordDisplay();
        this.updateTypingDisplay();
        this.updateProgress();

        // 自动发音 2 遍
        this.pronounceWord();
        setTimeout(() => this.pronounceWord(), 800);
    }

    updateWordDisplay() {
        if (!this.currentWord) return;

        const phoneticEl = document.getElementById('wordPhonetic');
        const translationEl = document.getElementById('wordTranslation');
        const sentenceEl = document.getElementById('wordSentence');
        const sentenceTransEl = document.getElementById('wordSentenceTrans');

        // 音标
        if (phoneticEl) {
            phoneticEl.textContent = this.settings.showPhonetic ? this.currentWord.phonetic : '';
            phoneticEl.style.display = this.settings.showPhonetic ? 'block' : 'none';
        }

        // 释义
        if (translationEl) {
            translationEl.textContent = this.settings.showTranslation ? this.currentWord.translation : '';
            translationEl.style.display = this.settings.showTranslation ? 'block' : 'none';
        }

        // 例句
        if (sentenceEl && this.currentWord.sentence) {
            sentenceEl.textContent = this.currentWord.sentence;
            sentenceEl.style.display = this.settings.showSentence ? 'block' : 'none';
        }

        if (sentenceTransEl && this.currentWord.sentenceTrans) {
            sentenceTransEl.textContent = this.currentWord.sentenceTrans;
            sentenceTransEl.style.display = this.settings.showSentence ? 'block' : 'none';
        }

        // 单词主体
        const wordMainEl = document.getElementById('wordMain');
        if (wordMainEl) {
            wordMainEl.innerHTML = '';
            
            // 检查是否开启听音填词模式（全局设置）
            const listenMode = localStorage.getItem('wordTyperListenMode') === 'true';
            
            // 听音填词模式：随机隐藏部分字母
            if (listenMode) {
                const word = this.currentWord.word;
                const wordLength = word.length;
                
                // 计算要显示的字母数量（30%-50%）
                const minVisible = Math.max(1, Math.floor(wordLength * 0.3));
                const maxVisible = Math.max(minVisible, Math.floor(wordLength * 0.5));
                const visibleCount = minVisible + Math.floor(Math.random() * (maxVisible - minVisible + 1));
                
                // 随机选择要显示的字母位置
                const positions = Array.from({length: wordLength}, (_, i) => i);
                const shuffledPositions = this.shuffleArray(positions);
                const visiblePositions = new Set(shuffledPositions.slice(0, visibleCount));
                
                // 生成字母显示
                for (let i = 0; i < wordLength; i++) {
                    const letter = document.createElement('span');
                    letter.className = 'word-letter';
                    letter.dataset.index = i;
                    
                    if (visiblePositions.has(i)) {
                        // 显示字母
                        letter.textContent = word[i];
                        letter.dataset.visible = 'true';
                    } else {
                        // 隐藏字母，显示为下划线
                        letter.textContent = '_';
                        letter.dataset.visible = 'false';
                        letter.style.color = '#FF9500';  // 橙色提示
                    }
                    
                    wordMainEl.appendChild(letter);
                }
            } else {
                // 普通模式：显示完整单词
                for (let i = 0; i < this.currentWord.word.length; i++) {
                    const letter = document.createElement('span');
                    letter.className = 'word-letter';
                    letter.textContent = this.currentWord.word[i];
                    letter.dataset.index = i;
                    wordMainEl.appendChild(letter);
                }
            }
        }
    }

    updateTypingDisplay() {
        const wordMainEl = document.getElementById('wordMain');
        if (!wordMainEl || !this.currentWord) return;

        const letters = wordMainEl.querySelectorAll('.word-letter');
        let allCorrect = true;
        let nextKeyToPress = null;

        // 清除所有键盘高亮
        if (this.currentDict === 'keyboard') {
            const keys = document.querySelectorAll('#wordTyperVirtualKeyboard .key');
            keys.forEach(key => {
                key.classList.remove('highlight', 'pressed', 'next');
            });
        }

        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            letter.classList.remove('correct', 'wrong', 'current');

            if (i < this.userInput.length) {
                const inputChar = this.userInput[i].toLowerCase();
                const targetChar = this.currentWord.word[i].toLowerCase();
                
                if (inputChar === targetChar) {
                    letter.classList.add('correct');
                    
                    // 在键盘上显示已按下的效果
                    if (this.currentDict === 'keyboard') {
                        const key = document.querySelector(`#wordTyperVirtualKeyboard .key[data-key="${targetChar}"]`);
                        if (key) {
                            key.classList.add('pressed');
                        }
                    }
                } else {
                    letter.classList.add('wrong');
                    allCorrect = false;
                }
            } else if (i === this.userInput.length) {
                letter.classList.add('current');
                nextKeyToPress = this.currentWord.word[i].toLowerCase();
            }
        }

        // 高亮下一个要按的键
        if (this.currentDict === 'keyboard' && nextKeyToPress) {
            const nextKey = document.querySelector(`#wordTyperVirtualKeyboard .key[data-key="${nextKeyToPress}"]`);
            if (nextKey) {
                nextKey.classList.add('next');
            }
            
            // 更新手指提示
            this.updateFingerHint(nextKeyToPress);
        }
        
        // 如果不是键盘模式，隐藏手指提示
        if (this.currentDict !== 'keyboard') {
            const fingerHint = document.getElementById('fingerHint');
            if (fingerHint) {
                fingerHint.style.display = 'none';
            }
        }

        // 自动提交
        if (this.userInput.length === this.currentWord.word.length) {
            if (allCorrect) {
                setTimeout(() => this.handleCorrect(), 300);
            } else {
                setTimeout(() => this.handleWrong(), 300);
            }
        }
    }
    
    // 更新手指提示
    updateFingerHint(key) {
        const fingerHint = document.getElementById('fingerHint');
        if (!fingerHint) return;
        
        const fingerData = this.fingerMap[key];
        if (!fingerData) return;
        
        // 显示手指提示区域
        fingerHint.style.display = 'flex';
        
        // 获取左右手容器
        const handLeft = document.getElementById('handLeft');
        const handRight = document.getElementById('handRight');
        
        // 重置所有手的状态
        [handLeft, handRight].forEach(hand => {
            if (hand) {
                hand.classList.remove('active');
                hand.querySelectorAll('.finger-active').forEach(el => {
                    el.classList.remove('active');
                });
            }
        });
        
        // 激活对应的手
        let activeHand = null;
        if (fingerData.hand === 'left') {
            activeHand = handLeft;
        } else if (fingerData.hand === 'right') {
            activeHand = handRight;
        } else {
            activeHand = handLeft;
        }
        
        if (activeHand) {
            activeHand.classList.add('active');
        }
        
        // 激活对应的手指
        const activeFingerEls = fingerHint.querySelectorAll(`.finger-active[data-finger="${fingerData.finger}"]`);
        activeFingerEls.forEach(el => {
            el.classList.add('active');
        });
    }

    handleLetterInput(key) {
        // 判断当前输入的字母是否正确
        const currentIndex = this.userInput.length;
        const targetChar = this.currentWord.word[currentIndex].toLowerCase();
        const inputChar = key.toLowerCase();
        
        if (inputChar === targetChar) {
            // 输入正确
            this.playKeyCorrectSound();
            this.userInput += inputChar;
            
            // 听音填词模式：显示对应的隐藏字母
            const listenMode = localStorage.getItem('wordTyperListenMode') === 'true';
            if (listenMode) {
                this.revealLetter(currentIndex);
            }
        } else {
            // 输入错误：清空输入，重新从第一个字母开始
            this.playKeyWrongSound();
            this.userInput = '';  // 清空输入
            
            // 增加错误次数
            this.wordErrorCount++;
            console.log(`[word-typer] 单词错误次数: ${this.wordErrorCount}/3`);
            
            // 检查是否达到3次错误
            if (this.wordErrorCount > 3) {
                // 第4次显示所有字母
                console.log('[word-typer] 错误3次，显示所有字母');
                this.showFeedback('💡 显示完整单词', 'info');
                this.revealAllLetters();  // 显示所有字母
            } else {
                // 重新发音（如果开启了发音功能）
                const voiceEnabled = localStorage.getItem('wordTyperVoice') !== 'false';
                if (voiceEnabled) {
                    this.pronounceWord();
                }
                
                this.showFeedback(`✗ 输入错误 (${this.wordErrorCount}/3)，请重新输入`, 'error');
            }
        }
        
        this.updateTypingDisplay();
    }
    
    // 显示单个字母（听音填词模式下）
    revealLetter(index) {
        const wordMainEl = document.getElementById('wordMain');
        if (wordMainEl) {
            const letters = wordMainEl.querySelectorAll('.word-letter');
            if (letters[index]) {
                const letter = letters[index];
                letter.textContent = this.currentWord.word[index];
                letter.style.color = '#34C759';  // 绿色表示正确
                letter.dataset.visible = 'true';
                letter.classList.add('revealed');
            }
        }
    }
    
    // 显示所有字母（听音填词模式下）
    revealAllLetters() {
        const wordMainEl = document.getElementById('wordMain');
        if (wordMainEl) {
            const letters = wordMainEl.querySelectorAll('.word-letter');
            letters.forEach(letter => {
                const index = parseInt(letter.dataset.index);
                letter.textContent = this.currentWord.word[index];
                letter.style.color = '#FF9500';  // 橙色提示
                letter.dataset.visible = 'true';
                letter.classList.add('revealed');
            });
        }
    }

    handleCorrect() {
        this.sessionStats.correct++;
        this.sessionStats.wordsLearned.push({
            word: this.currentWord.word,
            correct: true,
            time: Date.now() - this.startTime
        });
        this.updateWordProgress(this.currentWord.word, true);
        
        // 播放正确提示音
        this.playCorrectSound();
        
        this.showFeedback('✓ 正确！', 'success');
        
        setTimeout(() => {
            this.currentIndex++;
            this.showNextWord();
        }, 500);
    }

    handleWrong() {
        this.sessionStats.wrong++;
        this.sessionStats.wordsLearned.push({
            word: this.currentWord.word,
            correct: false,
            time: Date.now() - this.startTime
        });
        this.updateWordProgress(this.currentWord.word, false);
        
        // 播放错误提示音
        this.playWrongSound();
        
        this.showFeedback(`✗ 错误！正确答案: ${this.currentWord.word}`, 'error');
        
        // 清空输入，重新来过
        setTimeout(() => {
            this.userInput = '';
            this.updateTypingDisplay();
        }, 1500);
    }

    skipWord() {
        this.currentIndex++;
        this.showNextWord();
    }

    pronounceWord() {
        if (!this.currentWord) {
            console.log('[word-typer] 发音失败: 没有当前单词');
            return;
        }
        
        // 确保 AudioContext 处于运行状态（如果已初始化）
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if ('speechSynthesis' in window) {
            try {
                // 先取消所有等待中的发音（防止队列堵塞）
                window.speechSynthesis.cancel();
                this.isSpeaking = false;
                
                // 等待一小段时间确保取消完成
                setTimeout(() => {
                    this.doPronounce();
                }, 50);
            } catch (error) {
                console.error('[word-typer] 发音错误:', error);
            }
        } else {
            console.error('[word-typer] 浏览器不支持语音合成');
        }
    }
    
    // 实际执行发音（延迟调用，避免队列冲突）
    doPronounce() {
        if (!this.currentWord) return;
        
        if ('speechSynthesis' in window) {
            try {
                const utterance = new SpeechSynthesisUtterance(this.currentWord.word);
                utterance.lang = 'en-US';
                utterance.rate = 0.8;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                // 添加回调
                utterance.onstart = () => {
                    this.isSpeaking = true;
                    console.log('[word-typer] ✅ 发音已开始:', this.currentWord.word);
                };
                utterance.onend = () => {
                    this.isSpeaking = false;
                    console.log('[word-typer] ✅ 发音已完成:', this.currentWord.word);
                };
                utterance.onerror = (event) => {
                    this.isSpeaking = false;
                    // 忽略 canceled 错误（这是正常的取消）
                    if (event.error !== 'canceled') {
                        console.error('[word-typer] 发音错误:', event.error);
                    }
                };
                
                console.log('[word-typer] 发音单词:', this.currentWord.word);
                
                // 获取语音列表（可能是异步的）
                const setVoiceAndSpeak = () => {
                    const voices = window.speechSynthesis.getVoices();
                    console.log('[word-typer] 可用语音数量:', voices.length);
                    this.setPreferredVoice(utterance, voices);
                    console.log('[word-typer] 选择语音后 utterance.voice:', utterance.voice ? utterance.voice.name : '未设置');
                    window.speechSynthesis.speak(utterance);
                    console.log('[word-typer] speak() 调用后 - speaking:', window.speechSynthesis.speaking);
                };
                
                // 检查语音列表是否已加载
                const voices = window.speechSynthesis.getVoices();
                console.log('[word-typer] 初始语音数量:', voices.length);
                
                if (voices.length > 0) {
                    setVoiceAndSpeak();
                } else {
                    // 等待语音列表加载
                    const onVoicesChanged = () => {
                        console.log('[word-typer] 语音列表已加载');
                        setVoiceAndSpeak();
                        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                    };
                    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
                    console.log('[word-typer] 等待语音列表加载...');
                    
                    // 超时处理：1秒后仍然尝试发音
                    setTimeout(() => {
                        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                        const voicesAfterTimeout = window.speechSynthesis.getVoices();
                        console.log('[word-typer] 超时后语音数量:', voicesAfterTimeout.length);
                        if (voicesAfterTimeout.length === 0) {
                            console.log('[word-typer] 无可用语音，使用默认语音');
                            window.speechSynthesis.speak(utterance);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('[word-typer] 发音错误:', error);
            }
        }
    }
    
    // 选择最佳语音（确保选择英语语音）
    setPreferredVoice(utterance, voices) {
        // macOS 优质语音（按优先级排序）
        const macOSVoices = [
            'Samantha',           // 最优质的女声
            'Karen',              // 澳大利亚英语女声
            'Moira',              // 爱尔兰英语女声
            'Tessa',              // 南非英语女声
            'Alex',               // 男声
            'Daniel (Enhanced)',  // 增强版男声
            'Fiona',              // 苏格兰英语女声
        ];
        
        // Windows 优质语音
        const windowsVoices = [
            'Microsoft Zira',     // Windows 女声
            'Microsoft David',    // Windows 男声
            'Microsoft Mark',     // Windows 男声
        ];
        
        // Google Chrome 语音
        const googleVoices = [
            'Google US English',
            'Chrome OS US English',
        ];
        
        const allPreferredVoices = [...macOSVoices, ...windowsVoices, ...googleVoices];
        
        // 尝试按优先级查找语音
        for (const preferred of allPreferredVoices) {
            const voice = voices.find(v => 
                v.name.includes(preferred) && 
                (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en'))
            );
            if (voice) {
                utterance.voice = voice;
                console.log('使用语音:', voice.name, voice.lang);
                return;
            }
        }
        
        // 备选：任何英文语音，优先美式英语
        const usEnglish = voices.find(v => v.lang.startsWith('en-US'));
        if (usEnglish) {
            utterance.voice = usEnglish;
            console.log('使用备用美式英语语音:', usEnglish.name);
            return;
        }
        
        // 最后备选：任何英文语音
        const anyEnglish = voices.find(v => v.lang.startsWith('en'));
        if (anyEnglish) {
            utterance.voice = anyEnglish;
            console.log('使用备用英语语音:', anyEnglish.name);
        }
    }

    // 切换语音开关
    toggleVoice() {
        const currentState = localStorage.getItem('wordTyperVoice') !== 'false';
        const newState = !currentState;
        localStorage.setItem('wordTyperVoice', newState.toString());
        
        this.updateVoiceButton();
        
        return newState;
    }
    
    // 切换听音填词模式
    toggleListenMode() {
        const currentState = localStorage.getItem('wordTyperListenMode') === 'true';
        const newState = !currentState;
        localStorage.setItem('wordTyperListenMode', newState.toString());
        
        this.updateListenModeButton();
        
        return newState;
    }
    
    // 更新听音填词按钮状态
    updateListenModeButton() {
        const listenBtn = document.getElementById('wordTyperListenToggle');
        if (listenBtn) {
            const enabled = localStorage.getItem('wordTyperListenMode') === 'true';
            listenBtn.textContent = enabled ? '🎧' : '🎧';
            listenBtn.title = enabled ? '关闭听音填词' : '开启听音填词';
            listenBtn.classList.toggle('active', enabled);
        }
    }
    
    // 更新语音按钮状态
    updateVoiceButton() {
        const voiceBtn = document.getElementById('wordTyperVoiceToggle');
        if (voiceBtn) {
            const enabled = localStorage.getItem('wordTyperVoice') !== 'false';
            voiceBtn.textContent = enabled ? '🔊' : '🔇';
            voiceBtn.title = enabled ? '关闭发音' : '开启发音';
        }
        
        // 更新提示音按钮
        const soundBtn = document.getElementById('wordTyperSoundToggle');
        if (soundBtn) {
            const soundEnabled = localStorage.getItem('wordTyperSound') !== 'false';
            this.soundEnabled = soundEnabled;
            soundBtn.textContent = soundEnabled ? '🔔' : '🔕';
            soundBtn.title = soundEnabled ? '关闭提示音' : '开启提示音';
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const accuracyText = document.getElementById('accuracyText');

        if (progressFill) {
            const percent = (this.currentIndex / this.currentWords.length) * 100;
            progressFill.style.width = percent + '%';
        }

        if (progressText) {
            progressText.textContent = `${this.currentIndex}/${this.currentWords.length}`;
        }

        if (accuracyText) {
            const total = this.sessionStats.correct + this.sessionStats.wrong;
            const accuracy = total > 0 ? ((this.sessionStats.correct / total) * 100).toFixed(1) : 0;
            accuracyText.textContent = accuracy + '%';
        }
    }

    async finishLearning() {
        this.isLearning = false;
        const endTime = Date.now();
        this.sessionStats.totalTime = Math.floor((endTime - this.startTime) / 1000);

        const total = this.sessionStats.correct + this.sessionStats.wrong;
        const accuracy = total > 0 ? ((this.sessionStats.correct / total) * 100).toFixed(1) : 0;

        // 根据学习模式显示不同的提示信息
        let message = '';
        if (this.lastLearningMode === 'wrong') {
            message = `复习完成！\n\n` +
                `总计: ${total} 个单词\n` +
                `正确: ${this.sessionStats.correct}\n` +
                `错误: ${this.sessionStats.wrong}\n` +
                `准确率: ${accuracy}%\n` +
                `用时: ${this.sessionStats.totalTime} 秒\n\n` +
                `是否开始学习新词？`;
        } else if (this.lastLearningMode === 'random') {
            message = `随机练习完成！\n\n` +
                `总计: ${total} 个单词\n` +
                `正确: ${this.sessionStats.correct}\n` +
                `错误: ${this.sessionStats.wrong}\n` +
                `准确率: ${accuracy}%\n` +
                `用时: ${this.sessionStats.totalTime} 秒\n\n` +
                `是否再次随机练习？`;
        } else {
            message = `学习完成！\n\n` +
                `总计: ${total} 个单词\n` +
                `正确: ${this.sessionStats.correct}\n` +
                `错误: ${this.sessionStats.wrong}\n` +
                `准确率: ${accuracy}%\n` +
                `用时: ${this.sessionStats.totalTime} 秒\n\n` +
                `是否继续学习下一章？`;
        }

        // 询问是否继续
        if (confirm(message)) {
            console.log('[word-typer] 用户选择继续学习');
            
            if (this.lastLearningMode === 'wrong') {
                // 复习模式完成后，切换到学习新词模式（从第1章开始）
                console.log('[word-typer] 复习完成，切换到学习新词模式');
                this.lastLearningMode = 'new';
                this.selectedChapter = 1;
                await this.startLearning('new');
            } else if (this.lastLearningMode === 'random') {
                // 随机练习完成后，再次随机练习
                console.log('[word-typer] 再次随机练习');
                await this.startLearning('random');
            } else {
                // 学习模式，自动进入下一章
                const wordsPerChapter = 20;
                const allWords = await this.loadDictionaryWords(this.currentDict);
                const totalChapters = Math.ceil(allWords.length / wordsPerChapter);
                
                console.log(`[word-typer] 当前章节: ${this.selectedChapter}, 总章节数: ${totalChapters}`);
                
                if (this.selectedChapter && this.selectedChapter < totalChapters) {
                    // 还有下一章，自动进入下一章
                    this.selectedChapter++;
                    console.log(`[word-typer] 自动进入第 ${this.selectedChapter} 章`);
                    await this.startLearning('new');
                } else if (this.selectedChapter >= totalChapters && totalChapters > 0) {
                    // 已经是最后一章了，提示用户
                    alert(`🎉 恭喜！您已完成所有 ${totalChapters} 章的学习！\n\n可以点击【复习错词】按钮巩固错词。`);
                    this.quitLearning();
                } else {
                    // 没有选择章节（直接学习的），重新开始
                    await this.startLearning('new');
                }
            }
        } else {
            console.log('[word-typer] 用户选择退出');
            this.quitLearning();
        }
    }

    quitLearning() {
        this.isLearning = false;
        this.currentWords = [];
        this.currentIndex = 0;
        this.currentWord = null;
        this.userInput = '';
        this.selectedChapter = null; // 清除章节选择

        document.getElementById('wordTyperSelector').style.display = 'block';
        document.getElementById('wordTyperLearningArea').style.display = 'none';
        document.getElementById('wordTyperStats').style.display = 'block';

        // 返回到词库画廊
        this.showGallery();
        this.updateStatsDisplay();
    }

    /* ========== 统计显示 ========== */

    updateStatsDisplay() {
        let totalWords = 0;
        let masteredWords = 0;
        let totalCorrect = 0;
        let totalWrong = 0;

        // 只统计实际学习过的单词（至少有一次正确或错误记录）
        Object.entries(this.wordProgress).forEach(([word, progress]) => {
            // 只统计实际交互过的单词（correct > 0 或 wrong > 0 或 familiarity > 0）
            if (progress.correct > 0 || progress.wrong > 0 || progress.familiarity > 0) {
                totalWords++;
                if (progress.familiarity >= 4) {
                    masteredWords++;
                }
                totalCorrect += progress.correct;
                totalWrong += progress.wrong;
            }
        });

        const statTotalWords = document.getElementById('statTotalWords');
        const statMasteredWords = document.getElementById('statMasteredWords');
        const statAccuracy = document.getElementById('statAccuracy');

        if (statTotalWords) statTotalWords.textContent = totalWords;
        if (statMasteredWords) statMasteredWords.textContent = masteredWords;
        if (statAccuracy) {
            const total = totalCorrect + totalWrong;
            const accuracy = total > 0 ? ((totalCorrect / total) * 100).toFixed(1) : 0;
            statAccuracy.textContent = accuracy + '%';
        }
    }

    /* ========== 工具函数 ========== */

    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `word-typer-feedback ${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);

        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }
}

// 导出到全局作用域
window.WordTyperManager = WordTyperManager;
