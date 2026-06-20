/**
 * 倒计时·纪念日插件
 * 记录重要日子，距今天数计算，时钟下方常驻显示
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'countdown';
    const CLASS_JS  = 'plugins/countdown/countdown-class.js?v=20260620g';
    const STYLE_CSS = 'plugins/countdown/style.css?v=20260620g';

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
            if (window.CountdownManager) {
                _classLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CLASS_JS + '&t=' + Date.now();
            script.onload = () => {
                if (window.CountdownManager) {
                    _classLoaded = true;
                    resolve();
                } else {
                    _loadPromise = null;
                    reject(new Error('倒计时：类定义脚本已加载但 CountdownManager 未定义'));
                }
            };
            script.onerror = () => {
                _loadPromise = null;
                reject(new Error('倒计时：类定义脚本加载失败'));
            };
            document.body.appendChild(script);
        });

        return _loadPromise;
    }

    /* ========== UI 移除 ========== */

    function _removeUI() {
        const ids = ['countdownToggle', 'countdownPanel', 'countdownOverlay', 'countdownBanner'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    /* ========== 生命周期 ========== */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '倒计时·纪念日',
        version: '1.0.0',
        description: '记录重要日子，距离生日/考试/纪念日还有多少天，时钟下方常驻显示。',
        icon: '⏰',
        author: '时钟应用',
        css: STYLE_CSS,

        async onActivate() {
            _injectCSS();
            try {
                await _ensureClassLoaded();
            } catch (e) {
                console.error('[倒计时]', e.message);
                return;
            }

            if (!_instance && window.CountdownManager) {
                _instance = new window.CountdownManager(window.clockManager);
                window.countdownInstance = _instance;
            }

            // 注册云端同步：将 countdowns 纳入多设备同步
            if (window.syncAdapter) {
                window.syncAdapter.registerSyncKey(
                    'countdowns',
                    'countdowns',
                    () => {
                        if (_instance) {
                            _instance.loadCountdowns();
                            _instance.renderCountdowns();
                            _instance.updateToggleState();
                            _instance.updateBanner();
                        }
                    },
                    'array'
                );
            }
        },

        async onDeactivate() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('countdowns');
            }
            if (_instance) {
                try { _instance.destroy(); } catch (e) {}
                _instance = null;
                window.countdownInstance = null;
            }
            _removeUI();
        },

        async onUninstall() {
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('countdowns');
            }
            if (_instance) {
                try { _instance.destroy(); } catch (e) {}
                _instance = null;
                window.countdownInstance = null;
            }
            _removeUI();
            _removeCSS();
        }
    });
})();
