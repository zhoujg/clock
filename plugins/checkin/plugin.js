/**
 * 今日打卡插件
 * 日常习惯管理，支持自定义习惯、打卡记录
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'checkin';
    const CLASS_JS  = 'plugins/checkin/checkin-class.js?v=20260619n';
    const STYLE_CSS = 'plugins/checkin/style.css?v=20260619n';

    let _classLoaded = false;
    let _loadPromise = null;
    let _instance = null;
    let _cssInjected = false;

    /* 加载 CheckInTimer 类定义 */
    function _ensureClassLoaded() {
        if (_classLoaded) return Promise.resolve();
        if (_loadPromise)  return _loadPromise;

        _loadPromise = new Promise((resolve, reject) => {
            // 如果已在其他地方加载过
            if (window.CheckInTimer) {
                _classLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CLASS_JS + '?v=' + Date.now();
            script.onload = () => {
                if (window.CheckInTimer) {
                    _classLoaded = true;
                    resolve();
                } else {
                    _loadPromise = null;
                    reject(new Error('今日打卡：类定义脚本已加载但 CheckInTimer 未定义'));
                }
            };
            script.onerror = () => {
                _loadPromise = null;
                reject(new Error('今日打卡：类定义脚本加载失败'));
            };
            document.body.appendChild(script);
        });

        return _loadPromise;
    }

    /* 注入 CSS */
    function _ensureCSS() {
        return new Promise((resolve) => {
            // 已注入，直接返回
            if (document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = STYLE_CSS + '?v=' + Date.now();
            link.dataset.pluginCss = PLUGIN_ID;

            link.onload  = () => resolve();
            link.onerror = () => resolve();

            document.head.appendChild(link);
        });
    }

    /* 移除 CSS */
    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
    }

    /* 移除 UI */
    function _removeUI() {
        // 销毁实例
        if (_instance) {
            _instance.destroy();
            _instance = null;
        }
        // 移除动态创建的元素
        const ids = [
            'checkinToggle',
            'checkinPanel',
            'checkinOverlay'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    // ============ 注册插件 ============

    if (window.PluginManager) {
        window.PluginManager.register({
            id: PLUGIN_ID,
            name: '今日打卡',
            version: '1.0.0',
            description: '日常习惯打卡，支持自定义习惯、目标设置和完成统计',
            icon: '✅',
            author: '系统内置',
            css: STYLE_CSS,

            async onInstall() {
                // 不需要额外安装操作
            },

            async onActivate() {
                await _ensureCSS();
                await _ensureClassLoaded();

                // 创建实例
                if (!_instance && window.CheckInTimer && window.clockManager) {
                    _instance = new window.CheckInTimer(window.clockManager);
                    window.checkInTimerInstance = _instance;
                }

                // 注册云端同步：将 checkin_habits 纳入多设备同步
                if (window.syncAdapter) {
                    window.syncAdapter.registerSyncKey(
                        'checkin_habits',       // 云端 user_data 表的 data_key
                        'checkin_habits',       // localStorage 的 key
                        () => {
                            // 云端数据合并到 localStorage 后，刷新 UI
                            if (_instance) {
                                _instance.loadHabits();
                                _instance.renderHabits();
                                _instance.updateToggleState();
                            }
                        },
                        'object'                 // 合并策略：直接覆盖（打卡数据以最新为准）
                    );

                    // 已登录则立即从云端拉取一次
                    if (window.cloudSync && window.cloudSync.isLoggedIn) {
                        window.syncAdapter.syncAfterLogin && window.syncAdapter.syncAfterLogin();
                    }
                }
            },

            async onDeactivate() {
                // 取消同步注册
                if (window.syncAdapter) {
                    window.syncAdapter.unregisterSyncKey('checkin_habits');
                }
                _removeUI();
            },

            async onUninstall() {
                if (window.syncAdapter) {
                    window.syncAdapter.unregisterSyncKey('checkin_habits');
                }
                _removeUI();
                _classLoaded = false;
                _loadPromise = null;
                _instance = null;
            },
        });
    }
})();
