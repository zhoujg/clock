/**
 * PluginManager — 插件系统核心引擎
 * 
 * 生命周期：
 *   register → install → activate / deactivate → uninstall
 *
 * 每个插件是一个 JS 文件，加载后调用 PluginManager.register(descriptor)
 * descriptor 格式：
 *   {
 *     id: 'daily-stories',
 *     name: '每日故事',
 *     version: '1.0.0',
 *     description: '...',
 *     icon: '📖',
 *     author: '...',
 *     css: 'plugins/daily-stories/style.css',  // 可选
 *     onInstall()    { ... },  // 首次安装
 *     onActivate()   { ... },  // 每次启用（创建 UI）
 *     onDeactivate() { ... },  // 停用（销毁 UI）
 *     onUninstall()  { ... }   // 卸载（清理数据）
 *   }
 */

class PluginManager {
    constructor() {
        this.plugins      = {};       // id → descriptor
        this.manifests    = {};       // id → manifest（从 manifest.json 自动发现）
        this.installed    = {};       // id → { enabled, installDate }
        this._cssLinks   = {};       // id → link element（当前已注入的 CSS）
        this._loadState();
    }

    /* ============ 插件注册 ============ */

    /**
     * 插件脚本加载后调用此方法进行注册
     */
    register(descriptor) {
        if (!descriptor || !descriptor.id) {
            console.error('[PluginManager] register: 缺少 id');
            return;
        }
        this.plugins[descriptor.id] = descriptor;

        // 如果已安装且启用，立即激活
        if (this.installed[descriptor.id] && this.installed[descriptor.id].enabled) {
            this._activate(descriptor.id).catch(e => {
                console.error(`[PluginManager] register 时激活失败 ${descriptor.id}:`, e);
            });
        }
    }

    /* ============ 安装 / 卸载 ============ */

    /**
     * 安装插件（从 registry 安装时调用）
     * 如果插件尚未注册，则动态加载其脚本
     */
    async install(id) {
        if (this.installed[id]) return false;

        // 确保 manifest 已加载（用于后续 UI 显示）
        if (!this.manifests[id]) {
            await this._loadManifest(id);
        }

        // 如果插件尚未注册，动态加载脚本
        if (!this.plugins[id]) {
            try {
                await this._loadPluginScript(id);
            } catch (e) {
                console.error(`[PluginManager] 安装失败，无法加载插件: ${id}`, e);
                return false;
            }
        }

        const plugin = this.plugins[id];
        if (!plugin) {
            console.error(`[PluginManager] 插件未找到: ${id}`);
            return false;
        }

        this.installed[id] = { enabled: true, installDate: Date.now() };
        this._saveState();

        try {
            if (plugin.onInstall) await plugin.onInstall();
            await this._activate(id);
            this._notifyChange();
            return true;
        } catch (e) {
            console.error(`[PluginManager] 安装插件失败 ${id}:`, e);
            delete this.installed[id];
            this._saveState();
            return false;
        }
    }

    /**
     * 卸载插件
     */
    async uninstall(id) {
        if (!this.installed[id]) return false;

        await this._deactivate(id);

        const plugin = this.plugins[id];
        try {
            if (plugin && plugin.onUninstall) await plugin.onUninstall();
        } catch (e) {
            console.warn(`[PluginManager] onUninstall 出错 ${id}:`, e);
        }

        delete this.installed[id];
        this._saveState();

        // 记录用户主动卸载，避免 init() 重新自动安装
        this._trackUninstalled(id);

        this._notifyChange();
        return true;
    }

    /**
     * 记录用户主动卸载的插件（跨会话持久化）
     */
    _trackUninstalled(id) {
        try {
            const set = new Set(JSON.parse(localStorage.getItem('userUninstalledPlugins') || '[]'));
            set.add(id);
            localStorage.setItem('userUninstalledPlugins', JSON.stringify([...set]));
        } catch (e) {}
    }

    /**
     * 检查用户是否主动卸载过某个插件
     * 增加控制台警告，帮助调试
     */
    _wasUninstalled(id) {
        try {
            const raw = localStorage.getItem('userUninstalledPlugins');
            if (raw) {
                const set = new Set(JSON.parse(raw));
                if (set.has(id)) {
                    console.warn(`[PluginManager] 插件 ${id} 曾被用户卸载，跳过自动安装。如需恢复，请在插件库中重新安装。`);
                    return true;
                }
            }
            return false;
        } catch (e) { 
            console.warn('[PluginManager] _wasUninstalled 解析失败:', e);
            return false; 
        }
    }

    /* ============ 启用 / 停用 ============ */

    async activate(id) {
        if (!this.installed[id]) return false;
        if (this.installed[id].enabled) return true; // 已启用

        this.installed[id].enabled = true;
        this._saveState();
        await this._activate(id);
        this._notifyChange();
        return true;
    }

    async deactivate(id) {
        if (!this.installed[id]) return false;
        if (!this.installed[id].enabled) return true; // 已停用

        await this._deactivate(id);
        this.installed[id].enabled = false;
        this._saveState();
        this._notifyChange();
        return true;
    }

    /* ============ 内部激活 / 停用 ============ */

    async _activate(id) {
        const plugin = this.plugins[id];
        if (!plugin) return;

        // 注入 CSS
        if (plugin.css && !this._cssLinks[id]) {
            this._injectCSS(plugin.css, id);
        }

        if (plugin.onActivate) {
            await plugin.onActivate();
        }

        window.dispatchEvent(new CustomEvent('plugin-activated', { detail: { id } }));
    }

    async _deactivate(id) {
        const plugin = this.plugins[id];
        if (!plugin) return;

        try {
            if (plugin.onDeactivate) await plugin.onDeactivate();
        } catch (e) {
            console.warn(`[PluginManager] onDeactivate 出错 ${id}:`, e);
        }

        // 移除 CSS
        this._removeCSS(id);
        window.dispatchEvent(new CustomEvent('plugin-deactivated', { detail: { id } }));
    }

    /* ============ 动态加载 JS ============ */

    /**
     * 从 plugins/{id}/plugin.js 动态加载插件脚本
     * 脚本加载后会自动调用 register()
     */
    _loadPluginScript(id) {
        return new Promise((resolve, reject) => {
            // 已注册则直接返回
            if (this.plugins[id]) { resolve(); return; }

            const script = document.createElement('script');
            script.src = `plugins/${id}/plugin.js?v=${Date.now()}`;
            script.onload = () => {
                // register() 应该已经在这时被调用
                if (this.plugins[id]) {
                    resolve();
                } else {
                    reject(new Error(`插件 ${id} 加载后未调用 register()`));
                }
            };
            script.onerror = () => reject(new Error(`插件 ${id} 脚本加载失败`));
            document.body.appendChild(script);
        });
    }

    /* ============ CSS 注入 / 移除 ============ */

    _injectCSS(href, id) {
        if (this._cssLinks[id]) return; // 已注入
        const link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = href + (href.includes('?') ? '&' : '?') + 'v=' + Date.now();
        link.dataset.pluginCss = id;
        document.head.appendChild(link);
        this._cssLinks[id] = link;
    }

    _removeCSS(id) {
        const link = this._cssLinks[id];
        if (link) {
            link.remove();
            delete this._cssLinks[id];
        }
        // 也清理可能残留的
        const stray = document.querySelectorAll(`link[data-plugin-css="${id}"]`);
        stray.forEach(l => l.remove());
    }

    /* ============ 插件自动发现 ============ */

    /**
     * 扫描 plugins/manifest.json，自动发现所有可用插件
     * 返回 manifest 列表
     */
    async discoverPlugins() {
        // 已发现过则直接返回缓存
        if (Object.keys(this.manifests).length > 0) {
            return Object.values(this.manifests);
        }

        // 从 plugins.json 读取插件列表
        let seedIds = [];
        try {
            const resp = await fetch(`plugins/plugins.json?v=${Date.now()}`);
            if (resp.ok) {
                const data = await resp.json();
                seedIds = data.plugins || [];
                console.log(`[PluginManager] 从 plugins.json 读取到 ${seedIds.length} 个插件`);
            }
        } catch (e) {
            console.warn('[PluginManager] 无法读取 plugins.json，使用空列表:', e);
        }

        // 如果 plugins.json 读取失败或为空，使用回退列表
        if (seedIds.length === 0) {
            console.warn('[PluginManager] plugins.json 为空，使用回退列表');
            seedIds = ['pomodoro', 'daily-stories', 'bgm-music', 'particle-lines', 'halftime', 'creative-calendar', 'habit', 'countdown', 'ambient-sound', 'pdf-reader'];
        }

        const results = await Promise.allSettled(
            seedIds.map(id => this._loadManifest(id))
        );

        // 扫描发现到的插件
        const discovered = [];
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                discovered.push(result.value);
            }
        }

        // 也检查 installed 中可能有但种子列表里没有的插件
        const installedIds = Object.keys(this.installed);
        const extraIds = installedIds.filter(id => !this.manifests[id] && !seedIds.includes(id));
        if (extraIds.length > 0) {
            const extraResults = await Promise.allSettled(
                extraIds.map(id => this._loadManifest(id))
            );
            for (const result of extraResults) {
                if (result.status === 'fulfilled' && result.value) {
                    discovered.push(result.value);
                }
            }
        }

        console.log(`[PluginManager] 发现 ${Object.keys(this.manifests).length} 个插件`);
        return Object.values(this.manifests);
    }

    /**
     * 加载单个插件的 manifest.json
     */
    async _loadManifest(id) {
        if (this.manifests[id]) return this.manifests[id];

        try {
            const resp = await fetch(`plugins/${id}/manifest.json?v=${Date.now()}`);
            if (!resp.ok) return null;
            const manifest = await resp.json();
            if (!manifest.id) return null;
            this.manifests[manifest.id] = manifest;
            return manifest;
        } catch (e) {
            return null;
        }
    }

    /**
     * 获取指定插件的 manifest
     */
    getManifest(id) {
        return this.manifests[id] || null;
    }

    /**
     * 获取所有已发现的 manifest 列表
     */
    getAllManifests() {
        return Object.values(this.manifests);
    }

    /* ============ 初始化（DOMContentLoaded 后调用）============ */

    /**
     * 初始化插件系统：
     * 1. 自动发现所有插件（读取 manifest.json）
     * 2. 将标记为 default 的插件自动安装（仅首次，尊重用户卸载选择）
     * 3. 激活所有已安装且启用的插件
     */
    async init() {
        // 调试：允许通过 URL 参数重置插件状态
        if (new URLSearchParams(window.location.search).get('resetPlugins') === 'true') {
            console.warn('[PluginManager] 检测到 resetPlugins=true，正在清除插件数据...');
            localStorage.removeItem('installedPlugins');
            localStorage.removeItem('userUninstalledPlugins');
            console.warn('[PluginManager] 插件数据已清除，即将刷新页面...');
            setTimeout(() => window.location.href = window.location.pathname, 1000);
            return;
        }

        // 第一步：自动发现所有插件
        await this.discoverPlugins();

        // 第二步：自动安装标记为 default 的插件（仅首次，尊重用户卸载选择）
        for (const manifest of Object.values(this.manifests)) {
            if (manifest.default && !this.installed[manifest.id] && !this._wasUninstalled(manifest.id)) {
                console.log(`[PluginManager] 自动安装默认插件: ${manifest.id}`);
                this.installed[manifest.id] = { enabled: true, installDate: Date.now(), default: true };
            }
        }
        this._saveState();

        // 第三步：激活所有已安装且启用的插件
        const ids = Object.keys(this.installed).filter(
            id => this.installed[id] && this.installed[id].enabled
        );

        for (const id of ids) {
            if (this.plugins[id]) {
                await this._activate(id);
            } else {
                try {
                    await this._loadPluginScript(id);
                } catch (e) {
                    console.error(`[PluginManager] 动态加载失败 ${id}:`, e);
                }
            }
        }

        this._notifyChange();
    }

    /* ============ 状态通知 ============ */

    _notifyChange() {
        window.dispatchEvent(new CustomEvent('plugin-state-changed'));
        // 触发云端同步
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            try { window.syncAdapter.pushChanges('installedPlugins'); } catch (e) {}
        }
    }

    /* ============ 持久化 ============ */

    _loadState() {
        try {
            const raw = localStorage.getItem('installedPlugins');
            this.installed = raw ? JSON.parse(raw) : {};
        } catch (e) {
            this.installed = {};
        }
    }

    _saveState() {
        localStorage.setItem('installedPlugins', JSON.stringify(this.installed));
    }

    /* ============ 查询接口 ============ */

    isInstalled(id) {
        return !!this.installed[id];
    }

    isEnabled(id) {
        return !!(this.installed[id] && this.installed[id].enabled);
    }

    getInstalledList() {
        return Object.keys(this.installed).filter(id => this.installed[id]);
    }

    getEnabledList() {
        return Object.keys(this.installed).filter(
            id => this.installed[id] && this.installed[id].enabled
        );
    }

    getPlugin(id) {
        return this.plugins[id] || null;
    }

    getAllPlugins() {
        return { ...this.plugins };
    }
}

// 全局单例
window.PluginManager = new PluginManager();
