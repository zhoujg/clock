/**
 * 单词打字背诵插件
 * 通过打字的方式背单词，支持多种词库
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'word-typer';
    const CLASS_JS  = 'plugins/word-typer/word-typer-class.js?v=20260621';
    const STYLE_CSS = 'plugins/word-typer/style.css?v=20260621';

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
            if (window.WordTyperManager) {
                _classLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CLASS_JS + '&t=' + Date.now();
            script.onload = () => {
                if (window.WordTyperManager) {
                    _classLoaded = true;
                    resolve();
                } else {
                    _loadPromise = null;
                    reject(new Error('单词打字背诵：类定义脚本已加载但 WordTyperManager 未定义'));
                }
            };
            script.onerror = () => {
                _loadPromise = null;
                reject(new Error('单词打字背诵：类定义脚本加载失败'));
            };
            document.body.appendChild(script);
        });

        return _loadPromise;
    }

    /* ========== UI 移除 ========== */

    function _removeUI() {
        const ids = ['wordTyperToggle', 'wordTyperPanel', 'wordTyperOverlay'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    /* ========== 生命周期 ========== */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '单词打字背诵',
        version: '1.0.0',
        description: '通过打字的方式背单词，结合英语学习和打字练习，支持多种词库（四级、六级、托福、雅思等）',
        icon: '📖',
        author: 'Clock Team',
        css: STYLE_CSS,

        async onActivate() {
            _injectCSS();
            try {
                await _ensureClassLoaded();
            } catch (e) {
                console.error('[单词打字背诵]', e.message);
                return;
            }

            if (!_instance && window.WordTyperManager) {
                _instance = new window.WordTyperManager();
                window.wordTyperInstance = _instance;
            }

            // 注册云端同步
            if (window.syncAdapter) {
                window.syncAdapter.registerSyncKey(
                    'wordTyperSettings',
                    'wordTyperSettings',
                    () => {
                        if (_instance) {
                            _instance.loadSettings();
                        }
                    },
                    'object'
                );
                
                window.syncAdapter.registerSyncKey(
                    'wordTyperProgress',
                    'wordTyperProgress',
                    () => {
                        if (_instance) {
                            _instance.loadProgress();
                            _instance.updateStatsDisplay();
                        }
                    },
                    'object'
                );
            }
        },

        async onDeactivate() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('wordTyperSettings');
                window.syncAdapter.unregisterSyncKey('wordTyperProgress');
            }
            if (_instance) {
                try { _instance.destroy(); } catch (e) {}
                _instance = null;
                window.wordTyperInstance = null;
            }
            _removeUI();
        },

        async onUninstall() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('wordTyperSettings');
                window.syncAdapter.unregisterSyncKey('wordTyperProgress');
            }
            if (_instance) {
                try { _instance.destroy(); } catch (e) {}
                _instance = null;
                window.wordTyperInstance = null;
            }
            _removeUI();
            _removeCSS();
        }
    });
})();
