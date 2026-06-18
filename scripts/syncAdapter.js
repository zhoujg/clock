/**
 * 同步适配器
 * 
 * 在 localStorage 和云端之间架桥：
 * - 未登录：透明使用 localStorage（当前行为，零改动）
 * - 已登录：数据变更时自动推送云端，加载时融合云端数据
 */

class SyncAdapter {
    constructor() {
        this.cloudSync = window.cloudSync;
        this.debounceTimers = {};
        this.localTimestamps = {}; // 跟踪各 key 的本地最后更新时间
        this._pollTimer = null;
        this._pollIntervalMs = 30000; // 30 秒轮询一次

        // 数据 key 与 localStorage key 的映射（内置键）
        this.keyMap = {
            settings:         'flipClockSettings',
            installedPlugins: 'installedPlugins'
        };

        // 插件/模块注册的同步键（自包含）
        // 每个条目：{ cloudKey, storageKey, reloadFn, type }
        // type: 'object' (直接覆盖) | 'array' (按 ID 并集合并)
        this._pluginSyncKeys = [];
        this._pluginReloadFns = {};

        // 记录哪些键是数组类型（需要按 ID 合并）
        this._arrayKeys = new Set();

        // 反向映射
        this.reverseKeyMap = {};
        for (const [k, v] of Object.entries(this.keyMap)) {
            this.reverseKeyMap[v] = k;
        }

        // 初始化本地时间戳
        this._loadTimestamps();

        // 页面回到前台时立即拉取一次（对手机 App 尤其重要）
        this._setupVisibilityListener();
    }

    /**
     * 插件/模块自包含同步注册
     * 在模块初始化时调用，将自身数据纳入同步体系，无需修改 syncAdapter 主代码。
     * @param {string} cloudKey   - 云端 user_data 键名
     * @param {string} storageKey - localStorage 键名
     * @param {Function} reloadFn - 云端数据合并后刷新模块的回调（可选）
     * @param {string} type       - 合并策略：'object'（直接覆盖，默认）| 'array'（按 ID 并集合并）
     */
    registerSyncKey(cloudKey, storageKey, reloadFn, type = 'object') {
        this.keyMap[cloudKey] = storageKey;
        this.reverseKeyMap[storageKey] = cloudKey;
        if (reloadFn) {
            this._pluginReloadFns[cloudKey] = reloadFn;
        }
        if (type === 'array') {
            this._arrayKeys.add(cloudKey);
        }
        this._pluginSyncKeys.push({ cloudKey, storageKey, reloadFn, type });
    }

    /**
     * 取消注册（模块停用/卸载时调用）
     */
    unregisterSyncKey(cloudKey) {
        const storageKey = this.keyMap[cloudKey];
        if (storageKey) delete this.reverseKeyMap[storageKey];
        delete this.keyMap[cloudKey];
        delete this._pluginReloadFns[cloudKey];
        this._arrayKeys.delete(cloudKey);
        this._pluginSyncKeys = this._pluginSyncKeys.filter(k => k.cloudKey !== cloudKey);
    }

    /**
     * 监听页面可见性变化：从后台切回前台时立即同步
     */
    _setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.cloudSync.isLoggedIn) {
                this._pullIncremental();
            }
        });
    }

    /**
     * 启动定期轮询（登录后调用）
     */
    startPeriodicSync(intervalMs) {
        if (intervalMs) this._pollIntervalMs = intervalMs;
        this.stopPeriodicSync(); // 先清除旧的
        this._pollTimer = setInterval(() => {
            if (this.cloudSync.isLoggedIn) {
                this._pullIncremental();
            }
        }, this._pollIntervalMs);
    }

    /**
     * 停止定期轮询（登出时调用）
     */
    stopPeriodicSync() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    /**
     * 增量拉取云端更新（供轮询和前台恢复使用）
     * 只拉取比本地最新时间戳更新的数据
     */
    async _pullIncremental() {
        if (!this.cloudSync.isLoggedIn) return;
        try {
            // 使用上一次拉取时间作为 since 参数
            const lastPull = this.localTimestamps['__lastIncrementalPull'];
            const result = this.cloudSync.isSyncing
                ? null
                : (lastPull
                    ? await this.cloudSync.pullSince(lastPull)
                    : await this.cloudSync.pullAll());

            if (!result || !result.success) return;
            if (!result.data || Object.keys(result.data).length === 0) {
                // 没有新数据，只更新时间戳
                if (result.server_time) {
                    this.localTimestamps['__lastIncrementalPull'] = result.server_time;
                    this._saveTimestamps();
                }
                return;
            }

            // 合并云端数据到本地（数组用并集，对象直接覆盖）
            this._mergeCloudToLocal(result.data);

            // 更新所有时间戳
            if (result.timestamps) {
                for (const [key, ts] of Object.entries(result.timestamps)) {
                    this.localTimestamps[key] = ts;
                }
            }
            if (result.server_time) {
                this.localTimestamps['__lastIncrementalPull'] = result.server_time;
            }
            this._saveTimestamps();

            // 刷新 UI
            this._reloadModuleState();
        } catch (e) {
            console.warn('[Sync] 增量拉取失败:', e);
        }
    }

    /**
     * 登录后全量同步：先拉取云端 → 与本地智能合并 → 推送合并结果
     * 确保两台设备的收藏数据不会互相覆盖丢失
     */
    async syncAfterLogin() {
        if (!this.cloudSync.isLoggedIn) return null;

        // 1. 先把本地故事推送到云端（故事走独立 API，不走 user_data）
        await this._pushLocalStoriesToCloud();

        // 2. 拉取云端 user_data（设置、收藏等）
        const result = await this.cloudSync.pullAll();

        if (result.success && result.data) {
            // 3. 智能合并：云端 + 本地 = 并集（保留两边的收藏）
            this._mergeCloudToLocal(result.data);

            // 4. 更新本地时间戳
            if (result.timestamps) {
                for (const [key, ts] of Object.entries(result.timestamps)) {
                    this.localTimestamps[key] = ts;
                }
            }
            // 记录此次全量拉取时间，后续增量拉取从这里开始
            if (result.server_time) {
                this.localTimestamps['__lastIncrementalPull'] = result.server_time;
            }
            this._saveTimestamps();

            // 5. 把合并后的结果推回云端（包含本地独有的数据）
            await this._pushMergedToCloud();

            // 6. 刷新各模块的内存状态
            this._reloadModuleState();
        }

        return result;
    }

    /**
     * 把合并后的 user_data 推回云端
     * 此时 localStorage 已是云端+本地的并集，推回去让其他设备也能同步到
     */
    async _pushMergedToCloud() {
        try {
            const data = {};
            for (const [cloudKey, localKey] of Object.entries(this.keyMap)) {
                const raw = localStorage.getItem(localKey);
                if (raw) {
                    try {
                        data[cloudKey] = JSON.parse(raw);
                    } catch (e) {
                        data[cloudKey] = raw;
                    }
                }
            }

            if (Object.keys(data).length > 0) {
                await this.cloudSync.push(data, {});
            }
        } catch (e) {
            console.warn('[Sync] 合并数据推送失败:', e);
        }
    }

    /**
     * 登录后将本地所有故事推送到云端
     * 防止用户在匿名期间创建的故事丢失
     */
    async _pushLocalStoriesToCloud() {
        try {
            const storyRaw = localStorage.getItem('dailyStories');
            if (!storyRaw) return;

            const allStories = JSON.parse(storyRaw);
            const dates = Object.keys(allStories);
            for (const date of dates) {
                const stories = allStories[date];
                if (!stories || stories.length === 0) continue;
                const cloudStories = stories.map((story, idx) => ({
                    story_index: idx + 1,
                    title: story.title || '',
                    content: JSON.stringify(story),
                    value_dim: story.value || '',
                    completed: story.completed ? 1 : 0,
                    _localUpdatedAt: new Date().toISOString()
                }));
                await this.cloudSync.pushStories(date, cloudStories);
            }
        } catch (e) {
            console.warn('[Sync] 本地故事推送失败:', e);
        }
    }

    /**
     * 将本地数据变更推送到云端（debounced，500ms 合并）
     */
    pushChanges(changedKeys) {
        if (!this.cloudSync.isLoggedIn) return;

        const keys = Array.isArray(changedKeys) ? changedKeys : [changedKeys];
        const data = {};
        const timestamps = {};

        for (const rawKey of keys) {
            // 解析 key：可能是 cloudKey（如 'settings'）也可能是 localStorageKey（如 'flipClockSettings'）
            let cloudKey = rawKey;
            let localKey = rawKey;

            // 如果是 localStorageKey，反向映射到 cloudKey
            if (this.reverseKeyMap[rawKey]) {
                cloudKey = this.reverseKeyMap[rawKey];
                localKey = rawKey;
            }
            // 如果是 cloudKey，映射到 localStorageKey
            else if (this.keyMap[rawKey]) {
                cloudKey = rawKey;
                localKey = this.keyMap[rawKey];
            }
            // 无法映射，跳过
            else {
                continue;
            }

            const raw = localStorage.getItem(localKey);
            if (raw) {
                try {
                    data[cloudKey] = JSON.parse(raw);
                } catch (e) {
                    data[cloudKey] = raw;
                }
            } else {
                data[cloudKey] = cloudKey === 'settings' ? {} : [];
            }
            timestamps[cloudKey] = this.localTimestamps[cloudKey] || new Date().toISOString();
        }

        // Debounce
        const timerKey = keys.sort().join(',');
        if (this.debounceTimers[timerKey]) {
            clearTimeout(this.debounceTimers[timerKey]);
        }

        this.debounceTimers[timerKey] = setTimeout(async () => {
            const result = await this.cloudSync.push(data, timestamps);

            if (result.success) {
                for (const key of Object.keys(data)) {
                    this.localTimestamps[key] = result.server_time || new Date().toISOString();
                }
                this._saveTimestamps();

                if (result.conflicts && Object.keys(result.conflicts).length > 0) {
                    console.warn('[Sync] 检测到冲突:', Object.keys(result.conflicts));
                    this._handleConflicts(result.conflicts);
                }
            } else {
                console.warn('[Sync] 推送失败:', result.error);
            }
        }, 500);
    }

    /**
     * 将云端数据智能合并到本地
     * - 对象类型（settings）：云端优先覆盖
     * - 数组类型（picsumFavorites, musicFavorites）：按 ID 并集合并
     */
    _mergeCloudToLocal(cloudData) {
        for (const [cloudKey, value] of Object.entries(cloudData)) {
            const localKey = this.keyMap[cloudKey];
            if (!localKey) continue;
            if (value === null || value === undefined) continue;

            if (this._arrayKeys.has(cloudKey) && Array.isArray(value)) {
                // 数组类型：按 ID 并集合并
                const localRaw = localStorage.getItem(localKey);
                const localArr = localRaw ? (() => {
                    try { return JSON.parse(localRaw); } catch (e) { return []; }
                })() : [];

                const merged = this._mergeArraysById(localArr, value);
                localStorage.setItem(localKey, JSON.stringify(merged));
            } else {
                // 对象/简单类型：直接覆盖
                const jsonStr = JSON.stringify(value);
                localStorage.setItem(localKey, jsonStr);
            }
        }
    }

    /**
     * 按 ID 合并两个数组，并集去重（本地 + 云端）
     * 同一 ID 以时间戳较新的为准
     */
    _mergeArraysById(localArr, cloudArr) {
        const map = new Map();

        // 先加入本地数据
        for (const item of localArr) {
            const id = item.id || item.file || item.url || JSON.stringify(item);
            map.set(id, item);
        }

        // 再加入云端数据（同 ID 以云端为准，因为是更新的）
        for (const item of cloudArr) {
            const id = item.id || item.file || item.url || JSON.stringify(item);
            // 云端数据覆盖本地（last-write-wins）
            map.set(id, item);
        }

        return Array.from(map.values());
    }

    /**
     * 合并后刷新各模块的内存状态
     * 确保 UI 展示的是最新合并后的数据
     */
    _reloadModuleState() {
        // 刷新所有插件/模块注册的动态同步键
        for (const [cloudKey, reloadFn] of Object.entries(this._pluginReloadFns)) {
            try {
                reloadFn();
            } catch (e) { console.warn(`[Sync] ${cloudKey} 刷新失败:`, e); }
        }
    }

    /**
     * 处理冲突：云端版本与本地版本合并（不直接覆盖）
     * 数组类型按 ID 并集合并，避免丢失本地独有的数据
     */
    _handleConflicts(conflicts) {
        for (const [cloudKey, value] of Object.entries(conflicts)) {
            const localKey = this.keyMap[cloudKey];
            if (!localKey || !value) continue;

            if (this._arrayKeys.has(cloudKey) && Array.isArray(value)) {
                // 数组类型：云端 + 本地并集合并
                const localRaw = localStorage.getItem(localKey);
                const localArr = localRaw ? (() => {
                    try { return JSON.parse(localRaw); } catch (e) { return []; }
                })() : [];
                const merged = this._mergeArraysById(localArr, value);
                localStorage.setItem(localKey, JSON.stringify(merged));
            } else {
                // 对象/简单类型：云端覆盖本地
                localStorage.setItem(localKey, JSON.stringify(value));
            }
        }

        // 冲突合并后，把合并结果推回云端
        this._pushMergedToCloud();

        // 通知 UI 刷新
        this._reloadModuleState();
        if (window.app) {
            try { window.app.loadSavedSettings(); } catch (e) {}
        }
        if (window.dailyStoriesManager) {
            try { window.dailyStoriesManager.loadTodayStories(); window.dailyStoriesManager.updateUI(); } catch (e) {}
        }
    }

    // ---- 时间戳管理 ----

    _loadTimestamps() {
        try {
            const raw = localStorage.getItem('clock_sync_timestamps');
            this.localTimestamps = raw ? JSON.parse(raw) : {};
        } catch (e) {
            this.localTimestamps = {};
        }
    }

    _saveTimestamps() {
        try {
            localStorage.setItem('clock_sync_timestamps', JSON.stringify(this.localTimestamps));
        } catch (e) {}
    }

    // ---- 故事同步 ----

    /**
     * 从云端拉取指定日期的故事
     */
    async loadStories(date) {
        if (!this.cloudSync.isLoggedIn) return null;

        const result = await this.cloudSync.getStories(date);
        if (result.success && result.stories) {
            return result.stories;
        }
        return null;
    }

    /**
     * 推送故事到云端
     */
    async saveStories(date, stories) {
        if (!this.cloudSync.isLoggedIn) return;

        const result = await this.cloudSync.pushStories(date, stories);
        if (!result.success) {
            console.warn('[Sync] 故事同步失败:', result.error);
        }
        return result;
    }
}

// 全局单例
window.syncAdapter = new SyncAdapter();
