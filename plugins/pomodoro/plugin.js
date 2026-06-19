/**
 * 番茄钟插件
 * 聚焦之环：光环进度，粒子环绕，背景呼吸
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'pomodoro';
    const CLASS_JS  = 'plugins/pomodoro/pomodoro-class.js?v=20260619f';
    const STYLE_CSS = 'plugins/pomodoro/style.css?v=20260619f';

    let _classLoaded = false;
    let _loadPromise = null;
    let _instance = null;
    let _cssInjected = false;

    /* 加载 PomodoroTimer 类定义 */
    function _ensureClassLoaded() {
        if (_classLoaded) return Promise.resolve();
        if (_loadPromise)  return _loadPromise;

        _loadPromise = new Promise((resolve, reject) => {
            // 如果已在其他地方加载过
            if (window.PomodoroTimer) {
                _classLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CLASS_JS + '?v=' + Date.now();
            script.onload = () => {
                if (window.PomodoroTimer) {
                    _classLoaded = true;
                    resolve();
                } else {
                    _loadPromise = null;
                    reject(new Error('番茄钟：类定义脚本已加载但 PomodoroTimer 未定义'));
                }
            };
            script.onerror = () => {
                _loadPromise = null;
                reject(new Error('番茄钟：类定义脚本加载失败'));
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
        // 停止番茄钟
        if (_instance) {
            _instance.pause();
            _instance = null;
        }
        // 移除动态创建的元素
        const ids = [
            'pomodoroToggle',
            'pomodoroCanvas',
            'pomodoroBreath',
            'pomodoroRadial',
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
            name: '番茄钟',
            version: '1.0.0',
            description: '专注计时器，支持工作/休息模式切换，光环进度可视化',
            icon: '🍅',
            author: '系统内置',
            css: STYLE_CSS,

            async onInstall() {
                // 不需要额外安装操作
            },

            async onActivate() {
                await _ensureCSS();
                await _ensureClassLoaded();

                // 创建实例
                if (!_instance && window.PomodoroTimer && window.clockManager) {
                    _instance = new window.PomodoroTimer(window.clockManager, null);
                    window.pomodoroTimerInstance = _instance;
                    // 触发番茄钟就绪事件，让 daily-stories 插件连接引用
                    window.dispatchEvent(new CustomEvent('pomodoro-ready', { detail: { instance: _instance } }));
                }
            },

            async onDeactivate() {
                _removeUI();
            },

            async onUninstall() {
                _removeUI();
                _classLoaded = false;
                _loadPromise = null;
                _instance = null;
            },
        });
    }
})();
