/**
 * 每日故事插件
 * 生命周期由 PluginManager 管理
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'daily-stories';
    const CLASS_JS  = 'plugins/daily-stories/dailyStories-class.js';
    const STYLE_CSS = 'plugins/daily-stories/style.css';

    let _classLoaded = false;
    let _loadPromise = null;

    /* 加载 DailyStories 类定义 */
    function _ensureClassLoaded() {
        if (_classLoaded) return Promise.resolve();
        if (_loadPromise)  return _loadPromise;

        _loadPromise = new Promise((resolve, reject) => {
            // 如果已在其他地方加载过（检查全局作用域和 window）
            if (typeof DailyStories !== 'undefined' || typeof window.DailyStories !== 'undefined') {
                _classLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CLASS_JS + '?v=' + Date.now();
            script.onload = () => {
                if (window.DailyStories) {
                    _classLoaded = true;
                    resolve();
                } else {
                    _loadPromise = null;
                    reject(new Error('每日故事：类定义脚本已加载但 DailyStories 未定义'));
                }
            };
            script.onerror = () => {
                _loadPromise = null;
                reject(new Error('每日故事：类定义脚本加载失败'));
            };
            document.body.appendChild(script);
        });

        return _loadPromise;
    }

    /* 注入 CSS（如果尚未注入）— 返回 Promise，等待 CSS 真正加载完成 */
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

            // 无论加载成功或失败，都 resolve（避免阻塞激活流程）
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

    /* 移除故事 UI */
    function _removeUI() {
        // 按创建顺序：按钮、面板、弹窗、模态框
        const ids = [
            'storiesToggle',
            'storiesPanel',
            'storiesStatsPanel',
            'storiesWeeklyReview',   // 周回顾面板
            'storyModalOverlay',     // 添加/编辑故事模态框
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        window.dailyStoriesManager = null;
    }

    // 注册插件
    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '每日故事',
        version: '1.0.0',
        description: '番茄钟完成后记录三个小故事，培养感恩心态。支持按日期查看、周回顾。',
        icon: '📖',
        author: '周墨欣时钟',

        onInstall: async function () {
            console.log('[每日故事] 首次安装');
        },

        onActivate: async function () {
            console.log('[每日故事] 🔄 onActivate 开始...');
            console.log('[每日故事] 等待 CSS 加载...');
            await _ensureCSS();
            console.log('[每日故事] ✅ CSS 加载完成');

            await _ensureClassLoaded();
            console.log('[每日故事] 类加载完成, DailyStories=', typeof window.DailyStories);

            if (!window.DailyStories) {
                console.error('[每日故事] ❌ DailyStories 类未定义');
                return;
            }

            // 如果已存在实例则先销毁
            if (window.dailyStoriesManager) {
                console.log('[每日故事] 清理旧实例');
                _removeUI();
            }

            // 创建实例（构造函数内部会调用 createUI 生成按钮和面板）
            try {
                window.dailyStoriesManager = new DailyStories();
                console.log('[每日故事] 实例创建完成');
            } catch (e) {
                console.error('[每日故事] ❌ 创建实例失败:', e);
                throw e;
            }

            const btn = document.getElementById('storiesToggle');
            console.log('[每日故事] storiesToggle 按钮:', btn ? '✅ 已创建' : '❌ 未创建!');
            console.log('[每日故事] ✅ 已激活');
        },

        onDeactivate: async function () {
            _removeUI();
            // CSS 保留（避免闪烁），下次激活时复用
            console.log('[每日故事] ⏹ 已停用');
        },

        onUninstall: async function () {
            _removeUI();
            _removeCSS();
            // 清理 localStorage 中的故事数据（可选）
            // localStorage.removeItem('dailyStories');
            console.log('[每日故事] 已卸载');
        }
    });
})();
