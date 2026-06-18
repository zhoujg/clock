/**
 * 英语每日单词插件
 * 每天展示一个中考核心英语单词，带音标、释义、例句和发音
 */
(function () {
    'use strict';
    console.log('[英语每日单词] 📦 插件脚本已加载 v3');

    const PLUGIN_ID = 'english-daily';

    const WORDS = [
        { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃，抛弃', sentence: 'He would never abandon his friends.', trans: '他绝不会抛弃他的朋友。' },
        { word: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力，才能', sentence: 'She has the ability to solve complex problems.', trans: '她有解决复杂问题的能力。' },
        { word: 'absent', phonetic: '/ˈæbsənt/', meaning: 'adj. 缺席的，不在的', sentence: 'He was absent from school yesterday.', trans: '他昨天缺课了。' },
        { word: 'absorb', phonetic: '/əbˈzɔːrb/', meaning: 'v. 吸收，吸引', sentence: 'Plants absorb sunlight for energy.', trans: '植物吸收阳光以获取能量。' },
        { word: 'accept', phonetic: '/əkˈsept/', meaning: 'v. 接受，同意', sentence: 'I accept your apology.', trans: '我接受你的道歉。' },
        { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 达到，实现', sentence: 'You can achieve your dreams with hard work.', trans: '通过努力你可以实现梦想。' },
        { word: 'active', phonetic: '/ˈæktɪv/', meaning: 'adj. 积极的，活跃的', sentence: 'She is an active member of the club.', trans: '她是俱乐部的活跃成员。' },
        { word: 'admit', phonetic: '/ədˈmɪt/', meaning: 'v. 承认，准许进入', sentence: 'He admitted his mistake.', trans: '他承认了自己的错误。' },
        { word: 'advice', phonetic: '/ədˈvaɪs/', meaning: 'n. 建议，忠告', sentence: 'Can you give me some advice?', trans: '你能给我一些建议吗？' },
        { word: 'afford', phonetic: '/əˈfɔːrd/', meaning: 'v. 负担得起，提供', sentence: 'I can\'t afford a new car right now.', trans: '我现在买不起新车。' },
        { word: 'amazing', phonetic: '/əˈmeɪzɪŋ/', meaning: 'adj. 令人惊奇的', sentence: 'The view from the top is amazing!', trans: '山顶的景色太惊人了！' },
        { word: 'ancient', phonetic: '/ˈeɪnʃənt/', meaning: 'adj. 古代的，古老的', sentence: 'We visited an ancient temple.', trans: '我们参观了一座古庙。' },
        { word: 'attend', phonetic: '/əˈtend/', meaning: 'v. 参加，出席', sentence: 'I will attend the meeting tomorrow.', trans: '我明天会参加会议。' },
        { word: 'attract', phonetic: '/əˈtrækt/', meaning: 'v. 吸引', sentence: 'The museum attracts many visitors.', trans: '博物馆吸引了许多游客。' },
        { word: 'balance', phonetic: '/ˈbæləns/', meaning: 'n. 平衡 v. 保持平衡', sentence: 'A good diet is about balance.', trans: '好的饮食在于平衡。' },
        { word: 'behavior', phonetic: '/bɪˈheɪvjər/', meaning: 'n. 行为，举止', sentence: 'Good behavior is important at school.', trans: '在学校里良好行为很重要。' },
        { word: 'benefit', phonetic: '/ˈbenɪfɪt/', meaning: 'n. 好处 v. 使受益', sentence: 'Exercise has many health benefits.', trans: '锻炼有很多健康好处。' },
        { word: 'breathe', phonetic: '/briːð/', meaning: 'v. 呼吸', sentence: 'Breathe deeply and relax.', trans: '深呼吸，放松。' },
        { word: 'celebrate', phonetic: '/ˈselɪbreɪt/', meaning: 'v. 庆祝', sentence: 'We will celebrate your birthday together.', trans: '我们会一起庆祝你的生日。' },
        { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: 'n. 挑战 v. 向…挑战', sentence: 'Every challenge is an opportunity to grow.', trans: '每个挑战都是成长的机会。' },
        { word: 'character', phonetic: '/ˈkærəktər/', meaning: 'n. 性格，角色，字符', sentence: 'She has a strong and kind character.', trans: '她有坚强而善良的性格。' },
        { word: 'comfortable', phonetic: '/ˈkʌmfərtəbl/', meaning: 'adj. 舒适的', sentence: 'This chair is very comfortable.', trans: '这把椅子很舒服。' },
        { word: 'communicate', phonetic: '/kəˈmjuːnɪkeɪt/', meaning: 'v. 交流，沟通', sentence: 'We communicate with each other every day.', trans: '我们每天互相交流。' },
        { word: 'compare', phonetic: '/kəmˈper/', meaning: 'v. 比较', sentence: 'Don\'t compare yourself to others.', trans: '不要拿自己和别人比较。' },
        { word: 'confident', phonetic: '/ˈkɒnfɪdənt/', meaning: 'adj. 自信的', sentence: 'She is confident about the exam.', trans: '她对考试很自信。' },
        { word: 'consider', phonetic: '/kənˈsɪdər/', meaning: 'v. 考虑，认为', sentence: 'Please consider my suggestion.', trans: '请考虑我的建议。' },
        { word: 'continue', phonetic: '/kənˈtɪnjuː/', meaning: 'v. 继续', sentence: 'We will continue our work tomorrow.', trans: '我们明天继续工作。' },
        { word: 'conversation', phonetic: '/ˌkɒnvərˈseɪʃn/', meaning: 'n. 对话，交谈', sentence: 'We had a good conversation.', trans: '我们进行了一场愉快的对话。' },
        { word: 'courage', phonetic: '/ˈkʌrɪdʒ/', meaning: 'n. 勇气', sentence: 'It takes courage to speak the truth.', trans: '说真话需要勇气。' },
        { word: 'curious', phonetic: '/ˈkjʊriəs/', meaning: 'adj. 好奇的', sentence: 'Children are naturally curious.', trans: '孩子天生好奇。' },
        { word: 'dangerous', phonetic: '/ˈdeɪndʒərəs/', meaning: 'adj. 危险的', sentence: 'This road is dangerous at night.', trans: '这条路晚上很危险。' },
        { word: 'decision', phonetic: '/dɪˈsɪʒn/', meaning: 'n. 决定', sentence: 'Making a decision is not always easy.', trans: '做决定并不总是容易的。' },
        { word: 'depend', phonetic: '/dɪˈpend/', meaning: 'v. 依赖，取决于', sentence: 'It depends on the weather.', trans: '这取决于天气。' },
        { word: 'describe', phonetic: '/dɪˈskraɪb/', meaning: 'v. 描述', sentence: 'Can you describe what you saw?', trans: '你能描述一下你看到了什么吗？' },
        { word: 'discover', phonetic: '/dɪˈskʌvər/', meaning: 'v. 发现', sentence: 'Scientists discover new things every day.', trans: '科学家每天都有新发现。' },
        { word: 'education', phonetic: '/ˌedʒuˈkeɪʃn/', meaning: 'n. 教育', sentence: 'Education is the key to success.', trans: '教育是成功的关键。' },
        { word: 'encourage', phonetic: '/ɪnˈkʌrɪdʒ/', meaning: 'v. 鼓励', sentence: 'Teachers encourage students to ask questions.', trans: '老师鼓励学生提问。' },
        { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', meaning: 'n. 环境', sentence: 'We should protect the environment.', trans: '我们应该保护环境。' },
        { word: 'excellent', phonetic: '/ˈeksələnt/', meaning: 'adj. 优秀的，极好的', sentence: 'You did an excellent job!', trans: '你做得很棒！' },
        { word: 'experience', phonetic: '/ɪkˈspɪriəns/', meaning: 'n. 经验，经历', sentence: 'Traveling is a great experience.', trans: '旅行是一次很棒的经历。' },
        { word: 'explain', phonetic: '/ɪkˈspleɪn/', meaning: 'v. 解释', sentence: 'Could you explain this to me?', trans: '你能给我解释一下吗？' },
        { word: 'familiar', phonetic: '/fəˈmɪliər/', meaning: 'adj. 熟悉的', sentence: 'This song sounds familiar.', trans: '这首歌听起来很熟悉。' },
        { word: 'forever', phonetic: '/fərˈevər/', meaning: 'adv. 永远', sentence: 'Friends forever, never apart.', trans: '永远的朋友，永不分离。' },
        { word: 'friendly', phonetic: '/ˈfrendli/', meaning: 'adj. 友好的', sentence: 'The people here are very friendly.', trans: '这里的人很友好。' },
        { word: 'generous', phonetic: '/ˈdʒenərəs/', meaning: 'adj. 慷慨的', sentence: 'He is generous with his time.', trans: '他很大方地付出自己的时间。' },
        { word: 'gradually', phonetic: '/ˈɡrædʒuəli/', meaning: 'adv. 逐渐地', sentence: 'Gradually, she became more confident.', trans: '逐渐地，她变得更自信了。' },
        { word: 'habit', phonetic: '/ˈhæbɪt/', meaning: 'n. 习惯', sentence: 'Reading is a good habit.', trans: '阅读是个好习惯。' },
        { word: 'imagine', phonetic: '/ɪˈmædʒɪn/', meaning: 'v. 想象', sentence: 'Imagine a world without war.', trans: '想象一个没有战争的世界。' },
        { word: 'important', phonetic: '/ɪmˈpɔːrtnt/', meaning: 'adj. 重要的', sentence: 'This is an important decision.', trans: '这是一个重要的决定。' },
        { word: 'independent', phonetic: '/ˌɪndɪˈpendənt/', meaning: 'adj. 独立的', sentence: 'She is a strong and independent girl.', trans: '她是一个坚强独立的女孩。' },
        { word: 'influence', phonetic: '/ˈɪnfluəns/', meaning: 'n. 影响 v. 影响', sentence: 'Friends can influence our choices.', trans: '朋友会影响我们的选择。' },
        { word: 'inspire', phonetic: '/ɪnˈspaɪər/', meaning: 'v. 激励，鼓舞', sentence: 'Your story inspires me.', trans: '你的故事激励了我。' },
        { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', meaning: 'n. 知识', sentence: 'Knowledge is power.', trans: '知识就是力量。' },
        { word: 'necessary', phonetic: '/ˈnesəseri/', meaning: 'adj. 必要的', sentence: 'Sleep is necessary for good health.', trans: '睡眠对健康是必要的。' },
        { word: 'opportunity', phonetic: '/ˌɒpərˈtjuːnəti/', meaning: 'n. 机会', sentence: 'Don\'t miss this opportunity.', trans: '别错过这个机会。' },
        { word: 'patience', phonetic: '/ˈpeɪʃns/', meaning: 'n. 耐心', sentence: 'Patience is a virtue.', trans: '耐心是一种美德。' },
        { word: 'practice', phonetic: '/ˈpræktɪs/', meaning: 'n. 练习 v. 练习', sentence: 'Practice makes perfect.', trans: '熟能生巧。' },
        { word: 'purpose', phonetic: '/ˈpɜːrpəs/', meaning: 'n. 目的', sentence: 'What is the purpose of life?', trans: '人生的目的是什么？' },
        { word: 'remember', phonetic: '/rɪˈmembər/', meaning: 'v. 记住，记得', sentence: 'Remember to bring your book.', trans: '记得带你的书。' },
        { word: 'responsibility', phonetic: '/rɪˌspɒnsəˈbɪləti/', meaning: 'n. 责任', sentence: 'With freedom comes responsibility.', trans: '自由伴随责任。' }
    ];

    let _cardEl = null;
    let _currentIndex = 0;
    let _usingHub = false;

    function _getDailyIndex() {
        const start = new Date(2026, 5, 1).getTime();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = Math.floor((today.getTime() - start) / 86400000);
        return ((days % WORDS.length) + WORDS.length) % WORDS.length;
    }

    /**
     * 英语发音：优先系统 TTS → 有道词典 TTS（国内可用）
     */
    let _enVoice = null;

    function _initVoices() {
        if (!('speechSynthesis' in window)) return;
        const voices = speechSynthesis.getVoices();
        if (voices.length === 0) return;

        // 输出所有语音，方便排查
        console.log('[英语每日单词] 可用语音:', voices.map(v => `${v.name}(${v.lang})`).join(', '));

        // 优先选苹果原生的高质量英文语音
        const preferred = ['Samantha', 'Alex', 'Karen', 'Daniel', 'Moira', 'Fiona', 'Veena', 'Tom'];
        for (const name of preferred) {
            const v = voices.find(v => v.name === name);
            if (v) { _enVoice = v; break; }
        }
        // 其次按 lang 匹配
        if (!_enVoice) {
            _enVoice = voices.find(v => v.lang === 'en-US')
                || voices.find(v => v.lang.startsWith('en-'))
                || voices.find(v => v.lang.startsWith('en'));
        }

        if (_enVoice) {
            console.log('[英语每日单词] 选中语音:', _enVoice.name, _enVoice.lang);
        } else {
            console.log('[英语每日单词] 无英文语音，将使用有道词典 TTS');
        }
    }

    // 脚本加载时预加载语音列表
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        speechSynthesis.addEventListener('voiceschanged', _initVoices);
        _initVoices();
    }

    function _speakWord(word) {
        console.log('[英语每日单词] _speakWord 调用:', word, '_enVoice:', _enVoice ? _enVoice.name : 'null');

        // 方案一：系统英文 TTS
        if (_enVoice) {
            console.log('[英语每日单词] 使用系统 TTS:', _enVoice.name);
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(word);
            u.voice = _enVoice;
            u.lang = _enVoice.lang;  // 直接用 voice 自带的 lang
            u.rate = 1.0;             // 正常语速，避免低质量引擎失真
            u.pitch = 1;
            window.speechSynthesis.speak(u);
            return;
        }

        // 方案二：有道词典 TTS（国内可用，type=0 美式发音）
        console.log('[英语每日单词] 使用有道 TTS:', word);
        const audio = new Audio();
        audio.src = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`;
        audio.oncanplaythrough = () => console.log('[英语每日单词] 有道 TTS 音频已就绪');
        audio.onerror = (e) => console.error('[英语每日单词] 有道 TTS 加载失败:', e);
        audio.play().then(() => {
            console.log('[英语每日单词] 有道 TTS 播放中');
        }).catch((err) => {
            console.error('[英语每日单词] 有道 TTS 播放失败:', err);
        });
    }

    function _renderToContainer(container) {
        _currentIndex = _getDailyIndex();
        const w = WORDS[_currentIndex];

        container.innerHTML = `
            <div class="hub-item-header">
                <span class="hub-item-label">每日单词</span>
                <span class="hub-item-index">${_currentIndex + 1}/${WORDS.length}</span>
            </div>
            <div class="hub-item-main" style="color:#4facfe;">${w.word}</div>
            <div class="hub-item-sub">${w.phonetic}</div>
            <div class="hub-item-desc">${w.meaning}</div>
            <div class="hub-item-quote">"${w.sentence}"</div>
            <div class="hub-item-trans">${w.trans}</div>
            <div class="hub-item-action">
                <button class="hub-item-btn hub-speak-btn" style="border-color: rgba(79,172,254,0.3); color: #4facfe;">
                    🔊 听发音
                </button>
            </div>
        `;

        const speakBtn = container.querySelector('.hub-speak-btn');
        console.log('[英语每日单词] _renderToContainer: speakBtn found=', !!speakBtn, 'word=', w.word);
        if (speakBtn) {
            speakBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[英语每日单词] 🔈 发音按钮被点击');
                _speakWord(w.word);
            });
        }
    }

    function _renderCard() {
        _currentIndex = _getDailyIndex();
        const w = WORDS[_currentIndex];

        if (!_cardEl) {
            _cardEl = document.createElement('div');
            _cardEl.className = 'english-daily-card';
            _cardEl.id = 'englishDailyCard';
            document.body.appendChild(_cardEl);
        }

        _cardEl.innerHTML = `
            <div class="english-daily-header">
                <span class="english-daily-label">🔤 每日单词</span>
                <span class="english-daily-index">${_currentIndex + 1}/${WORDS.length}</span>
            </div>
            <div class="english-daily-word">${w.word}</div>
            <div class="english-daily-phonetic">${w.phonetic}</div>
            <div class="english-daily-meaning">${w.meaning}</div>
            <div class="english-daily-sentence">"${w.sentence}"</div>
            <div class="english-daily-trans">${w.trans}</div>
            <div class="english-daily-actions">
                <button class="english-daily-speak" id="englishSpeakBtn" title="点击发音">
                    🔊 听发音
                </button>
            </div>
        `;

        const speakBtn = _cardEl.querySelector('#englishSpeakBtn');
        if (speakBtn) {
            speakBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _speakWord(w.word);
            });
        }

        _cardEl.style.display = 'block';
    }

    function _destroyCard() {
        if (_cardEl) {
            _cardEl.remove();
            _cardEl = null;
        }
    }

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '英语每日单词',
        version: '1.0.0',
        description: '每天展示一个中考核心英语单词，包含音标、释义、例句和发音功能。',
        icon: '🔤',
        author: '滴答时钟',
        css: 'plugins/english-daily/style.css',

        onInstall: async function () {
            console.log('[英语每日单词] 首次安装');
        },

        onActivate: async function () {
            if (!document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'plugins/english-daily/style.css?v=20260617b';
                link.dataset.pluginCss = PLUGIN_ID;
                document.head.appendChild(link);
            }

            // 检测 LearningHub 是否可用
            if (window.LearningHub) {
                window.LearningHub.registerTab({
                    id: PLUGIN_ID,
                    label: '英语',
                    icon: '🔤',
                    accentColor: '#4facfe',
                    render: _renderToContainer
                });
                _usingHub = true;
                console.log('[英语每日单词] ✅ 已注册到学习中心');
            } else {
                _renderCard();
                console.log('[英语每日单词] ✅ 独立渲染已激活');
            }
        },

        onDeactivate: async function () {
            if (_usingHub && window.LearningHub) {
                window.LearningHub.unregisterTab(PLUGIN_ID);
            }
            _destroyCard();
            _usingHub = false;
            console.log('[英语每日单词] ⏹ 已停用');
        },

        onUninstall: async function () {
            if (_usingHub && window.LearningHub) {
                window.LearningHub.unregisterTab(PLUGIN_ID);
            }
            _destroyCard();
            _usingHub = false;
            const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
            if (link) link.remove();
            console.log('[英语每日单词] 已卸载');
        }
    });
})();
