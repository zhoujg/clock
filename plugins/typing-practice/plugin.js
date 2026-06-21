/**
 * 打字练习插件
 * 英语单词打字练习，支持多种词库和练习模式
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'typing-practice';
    const CLASS_JS  = 'plugins/typing-practice/typing-class.js?v=20260621';
    const STYLE_CSS = 'plugins/typing-practice/style.css?v=20260621';

    let _instance = null;
    let _classLoaded = false;
    let _loadPromise = null;

    /* ========== CSS 注入 ========== */

    function _injectCSS() {
        if (document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = STYLE_CSS;
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
    }

    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
    }

    /* ========== 类定义懒加载 ========== */

    function _ensureClassLoaded() {
        if (_classLoaded) return Promise.resolve();
        if (_loadPromise)  return _loadPromise;

        _loadPromise = new Promise((resolve, reject) => {
            if (window.TypingPracticeManager) {
                _classLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CLASS_JS + '&t=' + Date.now();
            script.onload = () => {
                if (window.TypingPracticeManager) {
                    _classLoaded = true;
                    resolve();
                } else {
                    _loadPromise = null;
                    reject(new Error('打字练习：类定义脚本已加载但 TypingPracticeManager 未定义'));
                }
            };
            script.onerror = () => {
                _loadPromise = null;
                reject(new Error('打字练习：类定义脚本加载失败'));
            };
            document.body.appendChild(script);
        });

        return _loadPromise;
    }

    /* ========== UI 移除 ========== */

    function _removeUI() {
        const ids = ['typingPracticeToggle', 'typingPracticePanel', 'typingPracticeOverlay'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    /* ========== 生命周期 ========== */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '打字练习',
        version: '1.0.0',
        description: '英语单词打字练习，通过键盘输入记忆单词，支持多种词库和练习模式。',
        icon: '⌨️',
        author: '时钟应用',
        css: STYLE_CSS,

        async onActivate() {
            _injectCSS();
            try {
                await _ensureClassLoaded();
            } catch (e) {
                console.error('[打字练习]', e.message);
                return;
            }

            if (!_instance && window.TypingPracticeManager) {
                _instance = new window.TypingPracticeManager();
                window.typingPracticeInstance = _instance;
            }

            // 注册云端同步
            if (window.syncAdapter) {
                window.syncAdapter.registerSyncKey(
                    'typingPracticeStats',
                    'typingPracticeStats',
                    () => {
                        if (_instance) {
                            _instance.loadStats();
                        }
                    },
                    'object'
                );
            }
        },

        async onDeactivate() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('typingPracticeStats');
            }
            if (_instance) {
                try { _instance.destroy(); } catch (e) {}
                _instance = null;
                window.typingPracticeInstance = null;
            }
            _removeUI();
        },

        async onUninstall() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('typingPracticeStats');
            }
            if (_instance) {
                try { _instance.destroy(); } catch (e) {}
                _instance = null;
                window.typingPracticeInstance = null;
            }
            _removeUI();
            _removeCSS();
        }
    });
})();
