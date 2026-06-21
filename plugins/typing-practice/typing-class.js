/**
 * 打字练习管理器
 * 英语单词打字练习
 */

// 内置词库（示例单词）- 参考 TypeWords
const WORD_LIBRARIES = {
    'keyboard': {
        name: '键盘练习',
        words: [
            // 基础键位 - 中排（Home Row）
            { 
                word: 'asdf', 
                translation: '左手基准键位', 
                phonetic: '中排左手',
                sentence: '左手：小指(A) 无名指(S) 中指(D) 食指(F)',
                sentenceTrans: '熟悉这四个键是打字的基础'
            },
            { 
                word: 'jkl', 
                translation: '右手基准键位', 
                phonetic: '中排右手',
                sentence: '右手：食指(J) 中指(K) 无名指(L)',
                sentenceTrans: 'J键上有一个小凸点，帮助定位'
            },
            { 
                word: 'asdfjkl', 
                translation: '中排全部键位', 
                phonetic: '基准行',
                sentence: '这是打字的"家"，手指应该放在这里',
                sentenceTrans: '打完其他键后，手指要回到这里'
            },
            // 上排练习
            { 
                word: 'qwerty', 
                translation: '上排字母', 
                phonetic: '标准键盘',
                sentence: 'QWERTY键盘布局源于打字机时代',
                sentenceTrans: '练习从中排移动到上排'
            },
            { 
                word: 'uiop', 
                translation: '上排右侧', 
                phonetic: '右手上排',
                sentence: '右手小指负责P键及其周围',
                sentenceTrans: '保持手腕平直'
            },
            // 下排练习
            { 
                word: 'zxcv', 
                translation: '下排左侧', 
                phonetic: '左手下排',
                sentence: '左手从中排向下移动练习',
                sentenceTrans: '手指要回到ASDF'
            },
            { 
                word: 'bnm', 
                translation: '下排右侧', 
                phonetic: '右手下排',
                sentence: '右手食指和中指练习',
                sentenceTrans: '注意B和N的位置'
            },
            // 组合练习
            { 
                word: 'the', 
                translation: '常用词', 
                phonetic: '/ðə/',
                sentence: 'The quick brown fox jumps over the lazy dog.',
                sentenceTrans: '最常用的英文单词'
            },
            { 
                word: 'and', 
                translation: '常用词', 
                phonetic: '/ænd/',
                sentence: 'Practice makes perfect and patience is key.',
                sentenceTrans: '熟练和耐心都很重要'
            },
            { 
                word: 'for', 
                translation: '常用词', 
                phonetic: '/fɔː/',
                sentence: 'This exercise is for beginners.',
                sentenceTrans: '这个练习适合初学者'
            }
        ]
    },
    'basic': {
        name: '基础词汇',
        words: [
            { 
                word: 'hello', 
                translation: 'int. 你好，喂', 
                phonetic: '/həˈləʊ/',
                sentence: 'Hello, how are you today?',
                sentenceTrans: '你好，你今天怎么样？'
            },
            { 
                word: 'world', 
                translation: 'n. 世界，地球', 
                phonetic: '/wɜːld/',
                sentence: 'The world is a beautiful place.',
                sentenceTrans: '世界是一个美丽的地方。'
            },
            { 
                word: 'practice', 
                translation: 'n./v. 练习，实践', 
                phonetic: '/ˈpræktɪs/',
                sentence: 'Practice makes perfect.',
                sentenceTrans: '熟能生巧。'
            },
            { 
                word: 'diligent', 
                translation: 'adj. 勤勉的，勤奋的', 
                phonetic: '/ˈdɪlɪdʒənt/',
                sentence: 'A diligent student always finishes homework on time.',
                sentenceTrans: '勤奋的学生总是按时完成作业。'
            },
            { 
                word: 'study', 
                translation: 'v./n. 学习，研究', 
                phonetic: '/ˈstʌdi/',
                sentence: 'I need to study for my exam.',
                sentenceTrans: '我需要为考试学习。'
            },
            { 
                word: 'time', 
                translation: 'n. 时间', 
                phonetic: '/taɪm/',
                sentence: 'Time flies when you are having fun.',
                sentenceTrans: '快乐时光总是飞逝。'
            },
            { 
                word: 'today', 
                translation: 'n./adv. 今天', 
                phonetic: '/təˈdeɪ/',
                sentence: 'Today is a good day.',
                sentenceTrans: '今天是美好的一天。'
            },
            { 
                word: 'learn', 
                translation: 'v. 学习，了解', 
                phonetic: '/lɜːn/',
                sentence: 'We learn something new every day.',
                sentenceTrans: '我们每天都学到新东西。'
            },
            { 
                word: 'progress', 
                translation: 'n./v. 进步，进展', 
                phonetic: '/ˈprəʊɡres/',
                sentence: 'Keep making progress every day.',
                sentenceTrans: '每天保持进步。'
            },
            { 
                word: 'achieve', 
                translation: 'v. 达到，完成', 
                phonetic: '/əˈtʃiːv/',
                sentence: 'Work hard to achieve your goals.',
                sentenceTrans: '努力工作以实现你的目标。'
            }
        ]
    },
    'cet4': {
        name: '大学英语四级',
        words: [
            { 
                word: 'abandon', 
                translation: 'v. 放弃，抛弃', 
                phonetic: '/əˈbændən/',
                sentence: 'Never abandon your dreams.',
                sentenceTrans: '永远不要放弃你的梦想。'
            },
            { 
                word: 'ability', 
                translation: 'n. 能力，才能', 
                phonetic: '/əˈbɪləti/',
                sentence: 'She has the ability to succeed.',
                sentenceTrans: '她有成功的能力。'
            },
            { 
                word: 'absolute', 
                translation: 'adj. 绝对的，完全的', 
                phonetic: '/ˈæbsəluːt/',
                sentence: 'There is no absolute truth.',
                sentenceTrans: '没有绝对的真理。'
            },
            { 
                word: 'absorb', 
                translation: 'v. 吸收，理解', 
                phonetic: '/əbˈsɔːb/',
                sentence: 'Plants absorb water from soil.',
                sentenceTrans: '植物从土壤中吸收水分。'
            },
            { 
                word: 'abstract', 
                translation: 'adj. 抽象的 n. 摘要', 
                phonetic: '/ˈæbstrækt/',
                sentence: 'Love is an abstract concept.',
                sentenceTrans: '爱是一个抽象的概念。'
            },
            { 
                word: 'academic', 
                translation: 'adj. 学术的，学业的', 
                phonetic: '/ˌækəˈdemɪk/',
                sentence: 'He achieved academic excellence.',
                sentenceTrans: '他取得了学术上的卓越成就。'
            },
            { 
                word: 'accept', 
                translation: 'v. 接受，承认', 
                phonetic: '/əkˈsept/',
                sentence: 'Please accept my apology.',
                sentenceTrans: '请接受我的道歉。'
            },
            { 
                word: 'access', 
                translation: 'n./v. 通道，进入', 
                phonetic: '/ˈækses/',
                sentence: 'Students have access to the library.',
                sentenceTrans: '学生们可以使用图书馆。'
            },
            { 
                word: 'accident', 
                translation: 'n. 事故，意外', 
                phonetic: '/ˈæksɪdənt/',
                sentence: 'He had a car accident yesterday.',
                sentenceTrans: '他昨天出了车祸。'
            },
            { 
                word: 'accompany', 
                translation: 'v. 陪伴，伴随', 
                phonetic: '/əˈkʌmpəni/',
                sentence: 'May I accompany you home?',
                sentenceTrans: '我可以陪你回家吗？'
            }
        ]
    },
    'cet6': {
        name: '大学英语六级',
        words: [
            { 
                word: 'abbreviation', 
                translation: 'n. 缩写，缩略词', 
                phonetic: '/əˌbriːviˈeɪʃn/',
                sentence: 'USA is an abbreviation of United States of America.',
                sentenceTrans: 'USA 是 United States of America 的缩写。'
            },
            { 
                word: 'abolish', 
                translation: 'v. 废除，取消', 
                phonetic: '/əˈbɒlɪʃ/',
                sentence: 'They voted to abolish the old law.',
                sentenceTrans: '他们投票废除了旧法律。'
            },
            { 
                word: 'abound', 
                translation: 'v. 充满，富于', 
                phonetic: '/əˈbaʊnd/',
                sentence: 'The forest abounds with wildlife.',
                sentenceTrans: '森林里野生动物很多。'
            },
            { 
                word: 'abrupt', 
                translation: 'adj. 突然的，生硬的', 
                phonetic: '/əˈbrʌpt/',
                sentence: 'His abrupt departure surprised everyone.',
                sentenceTrans: '他的突然离开让所有人都很惊讶。'
            },
            { 
                word: 'absence', 
                translation: 'n. 缺席，不在', 
                phonetic: '/ˈæbsəns/',
                sentence: 'Her absence was noticed immediately.',
                sentenceTrans: '她的缺席立刻被注意到了。'
            },
            { 
                word: 'absorption', 
                translation: 'n. 吸收，专注', 
                phonetic: '/əbˈsɔːpʃn/',
                sentence: 'The absorption of knowledge takes time.',
                sentenceTrans: '知识的吸收需要时间。'
            },
            { 
                word: 'absurd', 
                translation: 'adj. 荒谬的，可笑的', 
                phonetic: '/əbˈsɜːd/',
                sentence: 'That idea sounds completely absurd.',
                sentenceTrans: '那个想法听起来完全荒谬。'
            },
            { 
                word: 'abundance', 
                translation: 'n. 丰富，充裕', 
                phonetic: '/əˈbʌndəns/',
                sentence: 'The region has an abundance of natural resources.',
                sentenceTrans: '该地区有丰富的自然资源。'
            },
            { 
                word: 'accelerate', 
                translation: 'v. 加速，促进', 
                phonetic: '/əkˈseləreɪt/',
                sentence: 'We need to accelerate the process.',
                sentenceTrans: '我们需要加快进程。'
            },
            { 
                word: 'accessible', 
                translation: 'adj. 可接近的，易理解的', 
                phonetic: '/əkˈsesəbl/',
                sentence: 'The building is accessible to wheelchairs.',
                sentenceTrans: '这座建筑可供轮椅通行。'
            }
        ]
    }
};

class TypingPracticeManager {
    constructor() {
        this.toggle = null;
        this.panel = null;
        this.overlay = null;
        this.isPanelOpen = false;
        
        // 练习状态
        this.currentLibrary = 'basic';
        this.currentWords = [];
        this.currentWordIndex = 0;
        this.currentWord = null;
        this.userInput = '';
        this.isTyping = false;
        this.startTime = null;
        this.errors = 0;
        this.correctCount = 0;
        this.totalCount = 0;
        
        // 统计数据
        this.stats = {
            totalWords: 0,
            totalCorrect: 0,
            totalErrors: 0,
            bestSpeed: 0, // WPM (words per minute)
            practiceTime: 0 // 秒
        };

        this.init();
    }

    init() {
        this.loadStats();
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

    loadStats() {
        const saved = localStorage.getItem('typingPracticeStats');
        if (saved) {
            try {
                this.stats = JSON.parse(saved);
            } catch (e) {
                console.error('加载打字统计失败:', e);
            }
        }
    }

    saveStats() {
        localStorage.setItem('typingPracticeStats', JSON.stringify(this.stats));
        
        // 同步到云端
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('typingPracticeStats');
        }
    }

    /* ========== UI 创建 ========== */

    createUI() {
        this.createToggle();
        this.createPanel();
    }

    createToggle() {
        this.toggle = document.getElementById('typingPracticeToggle');
        if (!this.toggle) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                this.toggle = document.createElement('button');
                this.toggle.id = 'typingPracticeToggle';
                this.toggle.className = 'bottom-tool-btn';
                this.toggle.title = '打字练习';
                this.toggle.innerHTML = `
                    <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
                    </svg>
                    <span class="tool-btn-label">打字</span>
                `;
                toolbar.appendChild(this.toggle);
            }
        }
    }

    createPanel() {
        // 遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'typingPracticeOverlay';
        this.overlay.className = 'typing-overlay';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);

        // 面板
        this.panel = document.createElement('div');
        this.panel.id = 'typingPracticePanel';
        this.panel.className = 'typing-panel';
        this.panel.innerHTML = `
            <div class="typing-header">
                <h3>⌨️ 打字练习</h3>
                <button class="typing-close-btn" id="typingCloseBtn">✕</button>
            </div>
            
            <div class="typing-library-selector">
                <label>选择词库：</label>
                <select id="typingLibrarySelect">
                    <option value="keyboard">⌨️ 键盘练习（初学者）</option>
                    <option value="basic">📝 基础词汇</option>
                    <option value="cet4">📚 大学英语四级</option>
                    <option value="cet6">🎓 大学英语六级</option>
                </select>
                <button class="typing-voice-toggle" id="typingVoiceToggle" title="切换发音">🔊</button>
                <button class="typing-start-btn" id="typingStartBtn">开始练习</button>
            </div>
            
            <div class="typing-practice-area" id="typingPracticeArea" style="display:none;">
                <div class="typing-word-display">
                    <div class="typing-phonetic" id="typingPhonetic"></div>
                    <div class="typing-word" id="typingWord"></div>
                    <div class="typing-translation" id="typingTranslation"></div>
                </div>
                                
                <!-- 虚拟键盘（仅键盘练习模式显示） -->
                <div class="virtual-keyboard" id="virtualKeyboard" style="display:none;">
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
                
                <div class="typing-sentence" id="typingSentence" style="display:none;"></div>
                <div class="typing-sentence-trans" id="typingSentenceTrans" style="display:none;"></div>

                <div class="typing-progress">
                    <div class="typing-progress-text">
                        <span>进度: <span id="typingProgress">0/0</span></span>
                        <span>正确: <span id="typingCorrect">0</span></span>
                        <span>错误: <span id="typingErrors">0</span></span>
                    </div>
                </div>
                
                <button class="typing-quit-btn" id="typingQuitBtn">退出练习</button>
            </div>
            
            <div class="typing-stats">
                <h4>📊 练习统计</h4>
                <div class="typing-stats-grid">
                    <div class="typing-stat-item">
                        <div class="typing-stat-value" id="typingStatTotal">0</div>
                        <div class="typing-stat-label">累计练习</div>
                    </div>
                    <div class="typing-stat-item">
                        <div class="typing-stat-value" id="typingStatCorrect">0</div>
                        <div class="typing-stat-label">正确次数</div>
                    </div>
                    <div class="typing-stat-item">
                        <div class="typing-stat-value" id="typingStatSpeed">0</div>
                        <div class="typing-stat-label">最快速度(WPM)</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.panel);
        
        this.updateStatsDisplay();
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
            if (e.target.id === 'typingCloseBtn') {
                this.closePanel();
            }
        });

        // 遮罩点击关闭
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                if (!this.isTyping) {
                    this.closePanel();
                }
            });
        }

        // 语音切换按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'typingVoiceToggle') {
                const enabled = this.toggleVoice();
                this.showFeedback(enabled ? '✓ 已开启发音' : '✓ 已关闭发音', 'success');
            }
        });

        // 开始练习
        document.addEventListener('click', (e) => {
            if (e.target.id === 'typingStartBtn') {
                this.startPractice();
            }
        });

        // 退出练习
        document.addEventListener('click', (e) => {
            if (e.target.id === 'typingQuitBtn') {
                this.quitPractice();
            }
        });

        // 全局键盘监听
        document.addEventListener('keydown', (e) => {
            // 只在练习模式下监听
            if (!this.isTyping || !this.isPanelOpen) return;
            
            // 排除一些特殊键
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            
            // ESC 退出
            if (e.key === 'Escape') {
                this.quitPractice();
                return;
            }
            
            // Backspace 删除
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.userInput.length > 0) {
                    this.userInput = this.userInput.slice(0, -1);
                    this.updateInputDisplay();
                }
                return;
            }
            
            // Enter 提交（可选，也可以自动提交）
            if (e.key === 'Enter') {
                e.preventDefault();
                this.checkWord();
                return;
            }
            
            // 只接受字母
            if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                this.userInput += e.key;
                this.updateInputDisplay();
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
            if (this.isTyping) {
                if (!confirm('正在练习中，确定要关闭吗？')) {
                    return;
                }
                this.quitPractice();
            }
            this.panel.classList.remove('open');
            this.overlay.style.display = 'none';
            this.isPanelOpen = false;
        }
    }

    /* ========== 练习逻辑 ========== */

    startPractice() {
        const select = document.getElementById('typingLibrarySelect');
        this.currentLibrary = select.value;
        
        const library = WORD_LIBRARIES[this.currentLibrary];
        if (!library) return;
        
        // 随机打乱单词顺序
        this.currentWords = this.shuffleArray([...library.words]);
        this.currentWordIndex = 0;
        this.correctCount = 0;
        this.errors = 0;
        this.totalCount = this.currentWords.length;
        this.isTyping = true;
        this.startTime = Date.now();
        
        // 显示练习区域
        document.querySelector('.typing-library-selector').style.display = 'none';
        document.getElementById('typingPracticeArea').style.display = 'block';
        
        // 如果是键盘练习模式，显示虚拟键盘
        const keyboard = document.getElementById('virtualKeyboard');
        if (keyboard) {
            keyboard.style.display = this.currentLibrary === 'keyboard' ? 'block' : 'none';
        }
        
        // 显示第一个单词
        this.showNextWord();
    }

    showNextWord() {
        if (this.currentWordIndex >= this.currentWords.length) {
            this.finishPractice();
            return;
        }
        
        this.currentWord = this.currentWords[this.currentWordIndex];
        this.userInput = '';
        
        // 更新显示 - 使用逐字母高亮显示
        const wordEl = document.getElementById('typingWord');
        wordEl.innerHTML = '';
        
        // 为每个字母创建一个 span
        for (let i = 0; i < this.currentWord.word.length; i++) {
            const span = document.createElement('span');
            span.className = 'word-letter';
            span.textContent = this.currentWord.word[i];
            span.dataset.index = i;
            wordEl.appendChild(span);
        }
        
        // 标记第一个字母为当前
        const letters = wordEl.querySelectorAll('.word-letter');
        if (letters.length > 0) {
            letters[0].classList.add('current');
        }
        
        document.getElementById('typingPhonetic').textContent = this.currentWord.phonetic;
        document.getElementById('typingTranslation').textContent = this.currentWord.translation;
        
        // 显示例句（如果有）
        const sentenceEl = document.getElementById('typingSentence');
        const sentenceTransEl = document.getElementById('typingSentenceTrans');
        if (this.currentWord.sentence && sentenceEl) {
            sentenceEl.textContent = this.currentWord.sentence;
            sentenceEl.style.display = 'block';
        } else if (sentenceEl) {
            sentenceEl.style.display = 'none';
        }
        
        if (this.currentWord.sentenceTrans && sentenceTransEl) {
            sentenceTransEl.textContent = this.currentWord.sentenceTrans;
            sentenceTransEl.style.display = 'block';
        } else if (sentenceTransEl) {
            sentenceTransEl.style.display = 'none';
        }
        
        // 重置输入显示
        this.updateInputDisplay();
        
        // 更新进度
        this.updateProgress();
        
        // 发音（如果支持）
        this.speak(this.currentWord.word);
    }

    updateInputDisplay() {
        const wordEl = document.getElementById('typingWord');
        const letters = wordEl.querySelectorAll('.word-letter');
        
        // 清除所有键盘高亮
        if (this.currentLibrary === 'keyboard') {
            const keys = document.querySelectorAll('.virtual-keyboard .key');
            keys.forEach(key => {
                key.classList.remove('highlight', 'pressed', 'next');
            });
        }
        
        // 实时检查输入并高亮字母
        if (this.currentWord && this.userInput.length > 0) {
            let allCorrect = true;
            let nextKeyToPress = null;
            
            // 遍历每个字母，更新状态
            for (let i = 0; i < letters.length; i++) {
                if (i < this.userInput.length) {
                    const inputChar = this.userInput[i].toLowerCase();
                    const targetChar = this.currentWord.word[i].toLowerCase();
                    
                    if (inputChar === targetChar) {
                        letters[i].classList.add('correct');
                        letters[i].classList.remove('error', 'current');
                        
                        // 在键盘上显示已按下的效果
                        if (this.currentLibrary === 'keyboard') {
                            const key = document.querySelector(`.virtual-keyboard .key[data-key="${targetChar}"]`);
                            if (key) {
                                key.classList.add('pressed');
                            }
                        }
                    } else {
                        letters[i].classList.add('error');
                        letters[i].classList.remove('correct', 'current');
                        allCorrect = false;
                    }
                } else if (i === this.userInput.length) {
                    // 当前要输入的字母
                    letters[i].classList.add('current');
                    letters[i].classList.remove('correct', 'error');
                    nextKeyToPress = this.currentWord.word[i].toLowerCase();
                } else {
                    // 还没输入到的字母
                    letters[i].classList.remove('correct', 'error', 'current');
                }
            }
            
            // 高亮下一个要按的键
            if (this.currentLibrary === 'keyboard' && nextKeyToPress) {
                const nextKey = document.querySelector(`.virtual-keyboard .key[data-key="${nextKeyToPress}"]`);
                if (nextKey) {
                    nextKey.classList.add('next');
                }
            }
            
            // 自动提交：当输入长度等于单词长度且全部正确时
            if (this.userInput.length === this.currentWord.word.length && allCorrect) {
                setTimeout(() => {
                    this.checkWord();
                }, 300);
            }
        } else {
            // 清除所有高亮
            letters.forEach(letter => {
                letter.classList.remove('correct', 'error', 'current');
            });
            
            // 标记第一个字母为当前
            if (letters.length > 0) {
                letters[0].classList.add('current');
                
                // 高亮第一个要按的键
                if (this.currentLibrary === 'keyboard') {
                    const firstChar = this.currentWord.word[0].toLowerCase();
                    const firstKey = document.querySelector(`.virtual-keyboard .key[data-key="${firstChar}"]`);
                    if (firstKey) {
                        firstKey.classList.add('next');
                    }
                }
            }
        }
    }

    checkWord() {
        if (!this.currentWord || !this.userInput) return;
        
        const isCorrect = this.userInput.toLowerCase() === this.currentWord.word.toLowerCase();
        
        if (isCorrect) {
            this.correctCount++;
            this.showFeedback('✓ 正确！', 'success');
            
            // 延迟显示下一个单词
            setTimeout(() => {
                this.currentWordIndex++;
                this.showNextWord();
            }, 500);
        } else {
            this.errors++;
            this.showFeedback('✗ 错误，正确答案是: ' + this.currentWord.word, 'error');
            this.userInput = '';
            this.updateInputDisplay();
        }
        
        this.updateProgress();
    }

    finishPractice() {
        this.isTyping = false;
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / 1000; // 秒
        const wpm = Math.round((this.correctCount / duration) * 60);
        
        // 更新统计
        this.stats.totalWords += this.totalCount;
        this.stats.totalCorrect += this.correctCount;
        this.stats.totalErrors += this.errors;
        this.stats.practiceTime += duration;
        if (wpm > this.stats.bestSpeed) {
            this.stats.bestSpeed = wpm;
        }
        this.saveStats();
        
        // 显示结果
        const accuracy = Math.round((this.correctCount / this.totalCount) * 100);
        this.showResultDialog(this.correctCount, this.totalCount, accuracy, wpm, duration);
        
        // 重置界面
        document.getElementById('typingPracticeArea').style.display = 'none';
        document.querySelector('.typing-library-selector').style.display = 'flex';
        this.updateStatsDisplay();
    }

    quitPractice() {
        this.isTyping = false;
        document.getElementById('typingPracticeArea').style.display = 'none';
        document.querySelector('.typing-library-selector').style.display = 'flex';
    }

    /* ========== UI 更新 ========== */

    updateProgress() {
        document.getElementById('typingProgress').textContent = 
            `${this.currentWordIndex}/${this.totalCount}`;
        document.getElementById('typingCorrect').textContent = this.correctCount;
        document.getElementById('typingErrors').textContent = this.errors;
    }

    updateStatsDisplay() {
        document.getElementById('typingStatTotal').textContent = this.stats.totalWords;
        document.getElementById('typingStatCorrect').textContent = this.stats.totalCorrect;
        document.getElementById('typingStatSpeed').textContent = this.stats.bestSpeed;
    }

    showFeedback(message, type) {
        const existing = document.querySelector('.typing-feedback');
        if (existing) existing.remove();
        
        const feedback = document.createElement('div');
        feedback.className = `typing-feedback ${type}`;
        feedback.textContent = message;
        document.getElementById('typingPracticeArea').appendChild(feedback);
        
        setTimeout(() => feedback.classList.add('show'), 10);
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }

    showResultDialog(correct, total, accuracy, wpm, duration) {
        const overlay = document.createElement('div');
        overlay.className = 'typing-dialog-overlay';
        overlay.style.display = 'flex';
        
        const dialog = document.createElement('div');
        dialog.className = 'typing-dialog';
        dialog.innerHTML = `
            <h3>🎉 练习完成！</h3>
            <div class="typing-result">
                <div class="typing-result-item">
                    <span class="typing-result-label">完成单词：</span>
                    <span class="typing-result-value">${correct}/${total}</span>
                </div>
                <div class="typing-result-item">
                    <span class="typing-result-label">准确率：</span>
                    <span class="typing-result-value">${accuracy}%</span>
                </div>
                <div class="typing-result-item">
                    <span class="typing-result-label">速度：</span>
                    <span class="typing-result-value">${wpm} WPM</span>
                </div>
                <div class="typing-result-item">
                    <span class="typing-result-label">用时：</span>
                    <span class="typing-result-value">${Math.round(duration)}秒</span>
                </div>
            </div>
            <div class="dialog-buttons">
                <button class="dialog-confirm-btn">确定</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        dialog.querySelector('.dialog-confirm-btn').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    /* ========== 工具方法 ========== */

    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    speak(text) {
        // 检查是否启用语音（可以添加设置选项）
        const enableVoice = localStorage.getItem('typingPracticeVoice') !== 'false';
        if (!enableVoice) return;
        
        if ('speechSynthesis' in window) {
            // 取消之前的语音
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
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
        const currentState = localStorage.getItem('typingPracticeVoice') !== 'false';
        const newState = !currentState;
        localStorage.setItem('typingPracticeVoice', newState.toString());
        
        this.updateVoiceButton();
        
        return newState;
    }
    
    // 更新语音按钮状态
    updateVoiceButton() {
        const voiceBtn = document.getElementById('typingVoiceToggle');
        if (voiceBtn) {
            const enabled = localStorage.getItem('typingPracticeVoice') !== 'false';
            voiceBtn.textContent = enabled ? '🔊' : '🔇';
            voiceBtn.title = enabled ? '关闭发音' : '开启发音';
        }
    }
}

// 导出到全局
window.TypingPracticeManager = TypingPracticeManager;
