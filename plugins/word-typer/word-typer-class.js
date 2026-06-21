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
        words: [] // 稍后加载
    },
    'cet4': {
        name: '大学英语四级',
        icon: '📘',
        description: 'CET-4 核心词汇 2500+',
        color: '#007AFF',
        words: [] // 稍后加载
    },
    'cet6': {
        name: '大学英语六级',
        icon: '📙',
        description: 'CET-6 核心词汇 2000+',
        color: '#5856D6',
        words: []
    },
    'toefl': {
        name: '托福词汇',
        icon: '📕',
        description: 'TOEFL 核心词汇 3000+',
        color: '#FF9500',
        words: []
    },
    'ielts': {
        name: '雅思词汇',
        icon: '📗',
        description: 'IELTS 核心词汇 3000+',
        color: '#34C759',
        words: []
    },
    'gre': {
        name: 'GRE词汇',
        icon: '📓',
        description: 'GRE 核心词汇 3500+',
        color: '#AF52DE',
        words: []
    },
    'common': {
        name: '常用词汇',
        icon: '📔',
        description: '日常英语 1000 词',
        color: '#FF2D55',
        words: []
    }
};

// 初始化词库示例数据（实际使用时应该从文件加载）
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

    // CET-4 示例词汇（实际应用中应该加载完整词库）
    WORD_DICTIONARIES.cet4.words = [
        { word: 'abandon', phonetic: '/əˈbændən/', translation: 'v. 放弃，抛弃', usNote: 'US: əˈbændən', ukNote: 'UK: əˈbændən', sentence: 'Never abandon your dreams.', sentenceTrans: '永远不要放弃梦想。' },
        { word: 'ability', phonetic: '/əˈbɪləti/', translation: 'n. 能力，才能', sentence: 'She has the ability to succeed.', sentenceTrans: '她有成功的能力。' },
        { word: 'absolute', phonetic: '/ˈæbsəluːt/', translation: 'adj. 绝对的，完全的', sentence: 'There is no absolute truth.', sentenceTrans: '没有绝对的真理。' },
        { word: 'absorb', phonetic: '/əbˈsɔːrb/', translation: 'v. 吸收，理解', sentence: 'Plants absorb water from soil.', sentenceTrans: '植物从土壤中吸收水分。' },
        { word: 'abstract', phonetic: '/ˈæbstrækt/', translation: 'adj. 抽象的; n. 摘要', sentence: 'Love is an abstract concept.', sentenceTrans: '爱是一个抽象的概念。' },
        { word: 'academic', phonetic: '/ˌækəˈdemɪk/', translation: 'adj. 学术的，学业的', sentence: 'He achieved academic excellence.', sentenceTrans: '他取得了学术上的卓越成就。' },
        { word: 'accelerate', phonetic: '/əkˈseləreɪt/', translation: 'v. 加速，促进', sentence: 'We need to accelerate the process.', sentenceTrans: '我们需要加快进程。' },
        { word: 'accent', phonetic: '/ˈæksent/', translation: 'n. 口音，重音', sentence: 'She speaks English with a French accent.', sentenceTrans: '她说英语带有法国口音。' },
        { word: 'accept', phonetic: '/əkˈsept/', translation: 'v. 接受，承认', sentence: 'Please accept my apology.', sentenceTrans: '请接受我的道歉。' },
        { word: 'access', phonetic: '/ˈækses/', translation: 'n./v. 通道，进入，访问', sentence: 'Students have access to the library.', sentenceTrans: '学生们可以使用图书馆。' },
        { word: 'accident', phonetic: '/ˈæksɪdənt/', translation: 'n. 事故，意外', sentence: 'He had a car accident yesterday.', sentenceTrans: '他昨天出了车祸。' },
        { word: 'accompany', phonetic: '/əˈkʌmpəni/', translation: 'v. 陪伴，伴随', sentence: 'May I accompany you home?', sentenceTrans: '我可以陪你回家吗？' },
        { word: 'accomplish', phonetic: '/əˈkɑːmplɪʃ/', translation: 'v. 完成，实现', sentence: 'We accomplished our mission.', sentenceTrans: '我们完成了任务。' },
        { word: 'accord', phonetic: '/əˈkɔːrd/', translation: 'n. 一致，协议; v. 给予', sentence: 'The two sides reached an accord.', sentenceTrans: '双方达成了协议。' },
        { word: 'account', phonetic: '/əˈkaʊnt/', translation: 'n. 账户，描述; v. 解释', sentence: 'Open a bank account.', sentenceTrans: '开一个银行账户。' },
        { word: 'accurate', phonetic: '/ˈækjərət/', translation: 'adj. 准确的，精确的', sentence: 'The report was accurate.', sentenceTrans: '报告很准确。' },
        { word: 'accuse', phonetic: '/əˈkjuːz/', translation: 'v. 指责，控告', sentence: 'She was accused of theft.', sentenceTrans: '她被指控盗窃。' },
        { word: 'achieve', phonetic: '/əˈtʃiːv/', translation: 'v. 达到，完成，实现', sentence: 'Work hard to achieve your goals.', sentenceTrans: '努力工作以实现你的目标。' },
        { word: 'acknowledge', phonetic: '/əkˈnɑːlɪdʒ/', translation: 'v. 承认，感谢', sentence: 'He acknowledged his mistake.', sentenceTrans: '他承认了自己的错误。' },
        { word: 'acquire', phonetic: '/əˈkwaɪər/', translation: 'v. 获得，学到', sentence: 'Children acquire language naturally.', sentenceTrans: '儿童自然地习得语言。' }
    ];

    // 其他词库使用类似结构...（简化版本）
    WORD_DICTIONARIES.common.words = [
        { word: 'hello', phonetic: '/həˈloʊ/', translation: 'int. 你好，喂', sentence: 'Hello, how are you?', sentenceTrans: '你好，你怎么样？' },
        { word: 'world', phonetic: '/wɜːrld/', translation: 'n. 世界，地球', sentence: 'Welcome to the world.', sentenceTrans: '欢迎来到这个世界。' },
        { word: 'time', phonetic: '/taɪm/', translation: 'n. 时间', sentence: 'Time flies.', sentenceTrans: '时光飞逝。' },
        { word: 'people', phonetic: '/ˈpiːpl/', translation: 'n. 人，人们', sentence: 'Many people came.', sentenceTrans: '很多人来了。' },
        { word: 'learn', phonetic: '/lɜːrn/', translation: 'v. 学习', sentence: 'We learn every day.', sentenceTrans: '我们每天都在学习。' }
    ];

    // 复制部分数据给其他词库
    WORD_DICTIONARIES.cet6.words = WORD_DICTIONARIES.cet4.words.slice(5, 15);
    WORD_DICTIONARIES.toefl.words = WORD_DICTIONARIES.cet4.words.slice(0, 10);
    WORD_DICTIONARIES.ielts.words = WORD_DICTIONARIES.cet4.words.slice(3, 13);
    WORD_DICTIONARIES.gre.words = WORD_DICTIONARIES.cet4.words.slice(7, 17);
}

// 初始化示例数据
initSampleWords();

class WordTyperManager {
    constructor() {
        this.toggle = null;
        this.panel = null;
        this.overlay = null;
        this.isPanelOpen = false;
        
        // 学习状态
        this.currentDict = 'cet4';
        this.currentWords = [];
        this.currentIndex = 0;
        this.currentWord = null;
        this.userInput = '';
        this.isLearning = false;
        this.startTime = null;
        
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

        this.init();
    }

    init() {
        this.loadSettings();
        this.loadProgress();
        this.createUI();
        this.bindEvents();
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

    getPanelHTML() {
        const dictOptions = Object.entries(WORD_DICTIONARIES)
            .map(([key, dict]) => `<option value="${key}">${dict.icon} ${dict.name}</option>`)
            .join('');

        return `
            <div class="word-typer-header">
                <h3>📖 单词打字背诵</h3>
                <button class="word-typer-close-btn" id="wordTyperCloseBtn">✕</button>
            </div>
            
            <!-- 词库选择区 -->
            <div class="word-typer-selector" id="wordTyperSelector">
                <div class="dict-selector">
                    <label>选择词库：</label>
                    <select id="wordTyperDictSelect">
                        ${dictOptions}
                    </select>
                    <button class="word-typer-voice-toggle" id="wordTyperVoiceToggle" title="切换发音">🔊</button>
                </div>
                
                <div class="dict-info" id="dictInfo">
                    <span class="dict-icon">${WORD_DICTIONARIES.cet4.icon}</span>
                    <span class="dict-desc">${WORD_DICTIONARIES.cet4.description}</span>
                </div>
                
                <div class="learn-options">
                    <button class="option-btn" id="btnLearnNew">
                        <span>📚</span>
                        <span>学习新词</span>
                    </button>
                    <button class="option-btn" id="btnReviewWrong">
                        <span>🔄</span>
                        <span>复习错词</span>
                    </button>
                    <button class="option-btn" id="btnReviewAll">
                        <span>📝</span>
                        <span>全部复习</span>
                    </button>
                </div>
                
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
                    <div class="word-main" id="wordMain"></div>
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
                        <div class="key home-key" data-key="a">A</div>
                        <div class="key home-key" data-key="s">S</div>
                        <div class="key home-key" data-key="d">D</div>
                        <div class="key home-key" data-key="f">F</div>
                        <div class="key home-key" data-key="g">G</div>
                        <div class="key home-key" data-key="h">H</div>
                        <div class="key home-key" data-key="j">J</div>
                        <div class="key home-key" data-key="k">K</div>
                        <div class="key home-key" data-key="l">L</div>
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
                    <button class="btn-secondary" id="btnPronounce">🔊 发音</button>
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

        // 词库选择
        document.addEventListener('change', (e) => {
            if (e.target.id === 'wordTyperDictSelect') {
                this.currentDict = e.target.value;
                this.updateDictInfo();
            }
        });

        // 语音切换按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'wordTyperVoiceToggle') {
                const enabled = this.toggleVoice();
                this.showFeedback(enabled ? '✓ 已开启发音' : '✓ 已关闭发音', 'success');
            }
        });

        // 学习模式按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnLearnNew')) {
                this.startLearning('new');
            } else if (e.target.closest('#btnReviewWrong')) {
                this.startLearning('wrong');
            } else if (e.target.closest('#btnReviewAll')) {
                this.startLearning('all');
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
            this.updateStatsDisplay();
            this.updateVoiceButton();
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

    updateDictInfo() {
        const dict = WORD_DICTIONARIES[this.currentDict];
        if (!dict) return;
        
        const infoEl = document.getElementById('dictInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <span class="dict-icon">${dict.icon}</span>
                <span class="dict-desc">${dict.description}</span>
            `;
        }
    }

    /* ========== 学习逻辑 ========== */

    startLearning(mode) {
        const dict = WORD_DICTIONARIES[this.currentDict];
        if (!dict || !dict.words || dict.words.length === 0) {
            alert('该词库暂无内容');
            return;
        }

        // 根据模式筛选单词
        let wordsToLearn = [];
        if (mode === 'new') {
            // 学习新词：未学习或熟练度低的词
            wordsToLearn = dict.words.filter(w => {
                const progress = this.getWordProgress(w.word);
                return progress.familiarity < 3;
            });
        } else if (mode === 'wrong') {
            // 复习错词：错误次数多的词
            wordsToLearn = dict.words.filter(w => {
                const progress = this.getWordProgress(w.word);
                return progress.wrong > 0 && progress.familiarity < 4;
            });
        } else {
            // 全部复习
            wordsToLearn = [...dict.words];
        }

        if (wordsToLearn.length === 0) {
            alert(mode === 'wrong' ? '没有需要复习的错词' : '所有单词已掌握！');
            return;
        }

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
        
        this.updateWordDisplay();
        this.updateTypingDisplay();
        this.updateProgress();

        // 自动发音
        if (this.settings.autoVoice) {
            this.pronounceWord();
        }
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
            for (let i = 0; i < this.currentWord.word.length; i++) {
                const letter = document.createElement('span');
                letter.className = 'word-letter';
                letter.textContent = this.currentWord.word[i];
                letter.dataset.index = i;
                wordMainEl.appendChild(letter);
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

    handleLetterInput(key) {
        this.userInput += key.toLowerCase();
        this.updateTypingDisplay();
    }

    handleCorrect() {
        this.sessionStats.correct++;
        this.sessionStats.wordsLearned.push({
            word: this.currentWord.word,
            correct: true,
            time: Date.now() - this.startTime
        });
        this.updateWordProgress(this.currentWord.word, true);
        
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
        if (!this.currentWord) return;
        
        // 检查是否启用语音
        const enableVoice = localStorage.getItem('wordTyperVoice') !== 'false';
        if (!enableVoice) return;
        
        if ('speechSynthesis' in window) {
            // 取消之前的语音
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(this.currentWord.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;  // 0.8倍速，更清晰
            utterance.pitch = 1.0; // 标准音调
            utterance.volume = 0.9; // 适中音量
            
            // 加载语音列表（如果还没加载）
            let voices = window.speechSynthesis.getVoices();
            
            // 如果语音列表为空，等待加载
            if (voices.length === 0) {
                window.speechSynthesis.addEventListener('voiceschanged', () => {
                    voices = window.speechSynthesis.getVoices();
                    this.setPreferredVoice(utterance, voices);
                    window.speechSynthesis.speak(utterance);
                }, { once: true });
            } else {
                this.setPreferredVoice(utterance, voices);
                window.speechSynthesis.speak(utterance);
            }
        }
    }

    // 选择最佳语音
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
    
    // 更新语音按钮状态
    updateVoiceButton() {
        const voiceBtn = document.getElementById('wordTyperVoiceToggle');
        if (voiceBtn) {
            const enabled = localStorage.getItem('wordTyperVoice') !== 'false';
            voiceBtn.textContent = enabled ? '🔊' : '🔇';
            voiceBtn.title = enabled ? '关闭发音' : '开启发音';
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

    finishLearning() {
        this.isLearning = false;
        const endTime = Date.now();
        this.sessionStats.totalTime = Math.floor((endTime - this.startTime) / 1000);

        const total = this.sessionStats.correct + this.sessionStats.wrong;
        const accuracy = total > 0 ? ((this.sessionStats.correct / total) * 100).toFixed(1) : 0;

        alert(`学习完成！\n\n` +
            `总计: ${total} 个单词\n` +
            `正确: ${this.sessionStats.correct}\n` +
            `错误: ${this.sessionStats.wrong}\n` +
            `准确率: ${accuracy}%\n` +
            `用时: ${this.sessionStats.totalTime} 秒`);

        this.quitLearning();
    }

    quitLearning() {
        this.isLearning = false;
        this.currentWords = [];
        this.currentIndex = 0;
        this.currentWord = null;
        this.userInput = '';

        document.getElementById('wordTyperSelector').style.display = 'block';
        document.getElementById('wordTyperLearningArea').style.display = 'none';
        document.getElementById('wordTyperStats').style.display = 'block';

        this.updateStatsDisplay();
    }

    /* ========== 统计显示 ========== */

    updateStatsDisplay() {
        let totalWords = 0;
        let masteredWords = 0;
        let totalCorrect = 0;
        let totalWrong = 0;

        Object.values(this.wordProgress).forEach(progress => {
            totalWords++;
            if (progress.familiarity >= 4) {
                masteredWords++;
            }
            totalCorrect += progress.correct;
            totalWrong += progress.wrong;
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
