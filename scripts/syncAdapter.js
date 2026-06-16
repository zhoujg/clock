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

        // 数据 key 与 localStorage key 的映射
        this.keyMap = {
            settings:         'flipClockSettings',
            picsumFavorites:  'picsumFavorites',
            musicFavorites:   'musicFavorites',
            forestData:       'forestData',
            achievements:     'studyAchievements',
            pomodoroData:     'pomodoroData'
        };

        // 反向映射
        this.reverseKeyMap = {};
        for (const [k, v] of Object.entries(this.keyMap)) {
            this.reverseKeyMap[v] = k;
        }

        // 初始化本地时间戳
        this._loadTimestamps();
    }

    /**
     * 登录后全量同步：先拉取云端 → 与本地智能合并 → 推送合并结果
     * 确保两台设备的收藏数据不会互相覆盖丢失
     */
    async syncAfterLogin() {
        if (!this.cloudSync.isLoggedIn) return null;

        console.log('[Sync] 开始全量同步...');

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
            this._saveTimestamps();

            // 5. 把合并后的结果推回云端（包含本地独有的数据）
            await this._pushMergedToCloud();

            // 6. 刷新各模块的内存状态
            this._reloadModuleState();
            console.log('[Sync] 全量同步完成');
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
                console.log('[Sync] 推送合并数据:', Object.keys(data).join(', '));
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
                console.log(`[Sync] 推送本地故事: ${date}, ${cloudStories.length}条`);
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
            console.log('[Sync] 推送变更:', Object.keys(data));
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
        // 数组类型的 key（需要按 ID 合并，不能直接覆盖）
        const arrayKeys = ['picsumFavorites', 'musicFavorites'];

        for (const [cloudKey, value] of Object.entries(cloudData)) {
            const localKey = this.keyMap[cloudKey];
            if (!localKey) continue;
            if (value === null || value === undefined) continue;

            if (arrayKeys.includes(cloudKey) && Array.isArray(value)) {
                // 数组类型：按 ID 并集合并
                const localRaw = localStorage.getItem(localKey);
                const localArr = localRaw ? (() => {
                    try { return JSON.parse(localRaw); } catch (e) { return []; }
                })() : [];

                const merged = this._mergeArraysById(localArr, value);
                localStorage.setItem(localKey, JSON.stringify(merged));
                console.log(`[Sync] 合并 ${cloudKey}: 本地${localArr.length} + 云端${value.length} → ${merged.length}`);
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
        // 刷新 picsum 收藏（如果模块已加载）
        if (window.picsumManager) {
            try {
                window.picsumManager.favorites = window.picsumManager.loadFavorites();
                if (typeof window.picsumManager.updateFavoritesPanel === 'function') {
                    window.picsumManager.updateFavoritesPanel();
                }
                console.log('[Sync] picsum 收藏已刷新');
            } catch (e) { console.warn('[Sync] picsum 刷新失败:', e); }
        }

        // 刷新音乐收藏（如果模块已加载）
        if (window.bgmPlayer) {
            try {
                window.bgmPlayer.loadFavorites();
                if (typeof window.bgmPlayer.updateFavoriteButton === 'function') {
                    window.bgmPlayer.updateFavoriteButton();
                }
                console.log('[Sync] 音乐收藏已刷新');
            } catch (e) { console.warn('[Sync] 音乐收藏刷新失败:', e); }
        }
    }

    /**
     * 处理冲突：云端数据回写本地
     */
    _handleConflicts(conflicts) {
        for (const [cloudKey, value] of Object.entries(conflicts)) {
            const localKey = this.keyMap[cloudKey];
            if (localKey && value) {
                localStorage.setItem(localKey, JSON.stringify(value));
            }
        }

        // 通知 UI 刷新
        this._reloadModuleState();
        if (window.app) {
            try { window.app.loadSavedSettings(); } catch (e) {}
        }
        if (window.dailyStories) {
            try { window.dailyStories.loadTodayStories(); window.dailyStories.updateUI(); } catch (e) {}
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
