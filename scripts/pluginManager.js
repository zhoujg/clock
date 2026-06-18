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
        console.log(`[PluginManager] 插件已注册: ${descriptor.id} (${descriptor.name})`);

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
     */
    _wasUninstalled(id) {
        try {
            const set = new Set(JSON.parse(localStorage.getItem('userUninstalledPlugins') || '[]'));
            return set.has(id);
        } catch (e) { return false; }
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
        console.log(`[PluginManager] ✅ 插件已激活: ${id}`);
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
        console.log(`[PluginManager] ⏹ 插件已停用: ${id}`);
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

    /* ============ 初始化（DOMContentLoaded 后调用）============ */

    /**
     * 初始化插件系统：
     * 1. 迁移：旧用户已有 dailyStories 数据则自动安装每日故事插件
     * 2. 激活所有已安装且启用的插件
     * 3. 如果某个已安装插件尚未注册（JS 未加载），则动态加载
     */
    async init() {
        // 核心插件：每日故事作为内置功能默认安装（仅首次，尊重用户卸载选择）
        if (!this.installed['daily-stories'] && !this._wasUninstalled('daily-stories')) {
            this.installed['daily-stories'] = { enabled: true, installDate: Date.now(), default: true };
            this._saveState();
            console.log('[PluginManager] 核心插件：已自动安装「每日故事」');
        }

        // 核心插件：音乐播放器作为内置功能默认安装（仅首次，尊重用户卸载选择）
        if (!this.installed['bgm-music'] && !this._wasUninstalled('bgm-music')) {
            this.installed['bgm-music'] = { enabled: true, installDate: Date.now(), default: true };
            this._saveState();
            console.log('[PluginManager] 核心插件：已自动安装「音乐播放器」');
        }

        // 核心插件：粒子动画作为内置功能默认安装（仅首次，尊重用户卸载选择）
        if (!this.installed['particle-lines'] && !this._wasUninstalled('particle-lines')) {
            this.installed['particle-lines'] = { enabled: true, installDate: Date.now(), default: true };
            this._saveState();
            console.log('[PluginManager] 核心插件：已自动安装「粒子动画」');
        }

        const ids = Object.keys(this.installed).filter(
            id => this.installed[id] && this.installed[id].enabled
        );

        for (const id of ids) {
            if (this.plugins[id]) {
                // 已注册，直接激活
                await this._activate(id);
            } else {
                // 未注册，动态加载脚本
                console.log(`[PluginManager] 动态加载插件: ${id}`);
                try {
                    await this._loadPluginScript(id);
                    // _loadPluginScript 完成后 register() 已调用，_activate 已在 register() 中触发
                } catch (e) {
                    console.error(`[PluginManager] 动态加载失败 ${id}:`, e);
                }
            }
        }

        console.log(`[PluginManager] 初始化完成，已激活 ${ids.length} 个插件`);
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
