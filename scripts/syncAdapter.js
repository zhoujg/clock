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
     * 登录后全量同步：拉取云端 → 融合到本地
     */
    async syncAfterLogin() {
        if (!this.cloudSync.isLoggedIn) return null;

        console.log('[Sync] 开始全量同步...');
        const result = await this.cloudSync.pullAll();

        if (result.success && result.data) {
            this._mergeCloudToLocal(result.data);
            // 更新本地时间戳
            if (result.timestamps) {
                for (const [key, ts] of Object.entries(result.timestamps)) {
                    this.localTimestamps[key] = ts;
                }
            }
            this._saveTimestamps();
            console.log('[Sync] 全量同步完成');
        }

        return result;
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
     * 将云端数据合并到本地（云端优先策略）
     */
    _mergeCloudToLocal(cloudData) {
        for (const [cloudKey, value] of Object.entries(cloudData)) {
            const localKey = this.keyMap[cloudKey];
            if (!localKey) continue;

            if (value !== null && value !== undefined) {
                const jsonStr = JSON.stringify(value);
                localStorage.setItem(localKey, jsonStr);
            }
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
