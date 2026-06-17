/**
 * 粤语每日一句插件
 * 每天展示一句实用粤语，包含汉字、粤拼、普通话翻译和发音
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'cantonese-daily';

    const PHRASES = [
        { phrase: '早晨', jyutping: 'zou2 san4', mandarin: '早上好', category: '问候' },
        { phrase: '你好嗎？', jyutping: 'nei5 hou2 maa3', mandarin: '你好吗？', category: '问候' },
        { phrase: '多謝晒', jyutping: 'do1 ze6 saai3', mandarin: '非常感谢', category: '问候' },
        { phrase: '唔該', jyutping: 'm4 goi1', mandarin: '谢谢/劳驾', category: '问候' },
        { phrase: '對唔住', jyutping: 'deoi3 m4 zyu6', mandarin: '对不起', category: '问候' },
        { phrase: '唔使客氣', jyutping: 'm4 sai2 haak3 hei3', mandarin: '不客气', category: '问候' },
        { phrase: '再見', jyutping: 'zoi3 gin3', mandarin: '再见', category: '问候' },
        { phrase: '好耐冇見', jyutping: 'hou2 noi6 mou5 gin3', mandarin: '好久不见', category: '问候' },
        { phrase: '我想食飯', jyutping: 'ngo5 soeng2 sik6 faan6', mandarin: '我想吃饭', category: '餐饮' },
        { phrase: '有咩好食？', jyutping: 'jau5 me1 hou2 sik6', mandarin: '有什么好吃的？', category: '餐饮' },
        { phrase: '埋單吖', jyutping: 'maai4 daan1 aa1', mandarin: '买单结账', category: '餐饮' },
        { phrase: '飲杯茶先啦', jyutping: 'jam2 bui1 caa4 sin1 laa1', mandarin: '先喝杯茶吧', category: '餐饮' },
        { phrase: '好好味喎', jyutping: 'hou2 hou2 mei6 wo3', mandarin: '很好吃哦', category: '餐饮' },
        { phrase: '食咗飯未？', jyutping: 'sik6 zo2 faan6 mei6', mandarin: '吃饭了吗？', category: '餐饮' },
        { phrase: '搭地鐵去邊度？', jyutping: 'daap3 dei6 tit3 heoi3 bin1 dou6', mandarin: '搭地铁去哪里？', category: '交通' },
        { phrase: '幾多錢？', jyutping: 'gei2 do1 cin2', mandarin: '多少钱？', category: '交通' },
        { phrase: '喺邊度上車？', jyutping: 'hai2 bin1 dou6 soeng5 ce1', mandarin: '在哪里上车？', category: '交通' },
        { phrase: '唔該前面落', jyutping: 'm4 goi1 cin4 min6 lok6', mandarin: '麻烦前面下车', category: '交通' },
        { phrase: '等一陣', jyutping: 'dang2 jat1 zan6', mandarin: '等一下', category: '交通' },
        { phrase: '轉左就係', jyutping: 'zyun3 zo2 zau6 hai6', mandarin: '左转就是了', category: '交通' },
        { phrase: '返學啦', jyutping: 'faan1 hok6 laa1', mandarin: '上学了', category: '学校' },
        { phrase: '做功課未？', jyutping: 'zou6 gung1 fo3 mei6', mandarin: '做功课了吗？', category: '学校' },
        { phrase: '我唔識呢個', jyutping: 'ngo5 m4 sik1 ni1 go3', mandarin: '我不懂这个', category: '学校' },
        { phrase: '可唔可以教我？', jyutping: 'ho2 m4 ho2 ji5 gaau3 ngo5', mandarin: '可以教我吗？', category: '学校' },
        { phrase: '今日有功課交', jyutping: 'gam1 jat6 jau5 gung1 fo3 gaau1', mandarin: '今天有功课要交', category: '学校' },
        { phrase: '考試加油', jyutping: 'haau2 si5 gaa1 jau2', mandarin: '考试加油', category: '学校' },
        { phrase: '好開心見到你', jyutping: 'hou2 hoi1 sam1 gin3 dou2 nei5', mandarin: '很高兴见到你', category: '日常' },
        { phrase: '慢慢行', jyutping: 'maan6 maan6 haang4', mandarin: '慢走', category: '日常' },
        { phrase: '好攰呀', jyutping: 'hou2 gui6 aa3', mandarin: '好累啊', category: '日常' },
        { phrase: '頂得住', jyutping: 'ding2 dak1 zyu6', mandarin: '顶得住/坚持得住', category: '日常' },
        { phrase: '冇問題', jyutping: 'mou5 man6 tai4', mandarin: '没问题', category: '日常' },
        { phrase: '我哋一齊去啦', jyutping: 'ngo5 dei6 jat1 cai4 heoi3 laa1', mandarin: '我们一起去吧', category: '日常' }
    ];

    let _cardEl = null;
    let _currentIndex = 0;
    let _usingHub = false;

    function _getDailyIndex() {
        const start = new Date(2026, 5, 1).getTime();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = Math.floor((today.getTime() - start) / 86400000);
        return ((days % PHRASES.length) + PHRASES.length) % PHRASES.length;
    }

    function _speakPhrase(text, lang) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 0.85;
        u.pitch = 1;

        const voices = speechSynthesis.getVoices();
        const hasLang = voices.some(v => v.lang.startsWith(lang));
        if (!hasLang && lang === 'yue-HK') {
            u.lang = 'zh-HK';
        }

        window.speechSynthesis.speak(u);
    }

    function _renderToContainer(container) {
        _currentIndex = _getDailyIndex();
        const p = PHRASES[_currentIndex];

        container.innerHTML = `
            <div class="hub-item-header">
                <span class="hub-item-label">每日粤语</span>
                <span class="hub-item-category" style="color: rgba(255,180,80,0.8); background: rgba(255,180,80,0.12); border-radius: 6px;">${p.category}</span>
            </div>
            <div class="hub-item-main" style="color:#ffb450;">${p.phrase}</div>
            <div class="hub-item-sub" style="font-style:italic;">${p.jyutping}</div>
            <div class="hub-item-desc">${p.mandarin}</div>
            <div class="hub-item-action">
                <button class="hub-item-btn hub-speak-btn" style="border-color: rgba(255,180,80,0.3); color: #ffb450;">
                    🔊 听发音
                </button>
                <span class="hub-item-index" style="margin-right:0;">${_currentIndex + 1}/${PHRASES.length}</span>
            </div>
        `;

        const speakBtn = container.querySelector('.hub-speak-btn');
        if (speakBtn) {
            speakBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _speakPhrase(p.phrase, 'yue-HK');
            });
        }
    }

    function _renderCard() {
        _currentIndex = _getDailyIndex();
        const p = PHRASES[_currentIndex];

        if (!_cardEl) {
            _cardEl = document.createElement('div');
            _cardEl.className = 'cantonese-daily-card';
            _cardEl.id = 'cantoneseDailyCard';
            document.body.appendChild(_cardEl);
        }

        _cardEl.innerHTML = `
            <div class="cantonese-daily-header">
                <span class="cantonese-daily-label">🗣️ 每日粤语</span>
                <span class="cantonese-daily-category">${p.category}</span>
            </div>
            <div class="cantonese-daily-phrase">${p.phrase}</div>
            <div class="cantonese-daily-jyutping">${p.jyutping}</div>
            <div class="cantonese-daily-mandarin">${p.mandarin}</div>
            <div class="cantonese-daily-actions">
                <button class="cantonese-daily-speak" id="cantoneseSpeakBtn" title="听发音">
                    🔊 听发音
                </button>
                <span class="cantonese-daily-index">${_currentIndex + 1}/${PHRASES.length}</span>
            </div>
        `;

        const speakBtn = _cardEl.querySelector('#cantoneseSpeakBtn');
        if (speakBtn) {
            speakBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _speakPhrase(p.phrase, 'yue-HK');
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
        name: '粤语每日一句',
        version: '1.0.0',
        description: '每天展示一句实用粤语，包含粤语汉字、粤拼注音和普通话翻译，支持发音。',
        icon: '🗣️',
        author: '周墨欣时钟',
        css: 'plugins/cantonese-daily/style.css',

        onInstall: async function () {
            console.log('[粤语每日一句] 首次安装');
        },

        onActivate: async function () {
            if (!document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'plugins/cantonese-daily/style.css?v=20260617b';
                link.dataset.pluginCss = PLUGIN_ID;
                document.head.appendChild(link);
            }
            if ('speechSynthesis' in window) {
                speechSynthesis.getVoices();
            }

            // 检测 LearningHub 是否可用
            if (window.LearningHub) {
                window.LearningHub.registerTab({
                    id: PLUGIN_ID,
                    label: '粤语',
                    icon: '🗣️',
                    accentColor: '#ffb450',
                    render: _renderToContainer
                });
                _usingHub = true;
                console.log('[粤语每日一句] ✅ 已注册到学习中心');
            } else {
                _renderCard();
                console.log('[粤语每日一句] ✅ 独立渲染已激活');
            }
        },

        onDeactivate: async function () {
            if (_usingHub && window.LearningHub) {
                window.LearningHub.unregisterTab(PLUGIN_ID);
            }
            _destroyCard();
            _usingHub = false;
            console.log('[粤语每日一句] ⏹ 已停用');
        },

        onUninstall: async function () {
            if (_usingHub && window.LearningHub) {
                window.LearningHub.unregisterTab(PLUGIN_ID);
            }
            _destroyCard();
            _usingHub = false;
            const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
            if (link) link.remove();
            console.log('[粤语每日一句] 已卸载');
        }
    });
})();
