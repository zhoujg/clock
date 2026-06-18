/**
 * 云端同步管理器
 * 
 * 职责：
 * 1. 管理 JWT token（localStorage + 内存）
 * 2. 封装所有 API 调用
 * 3. 自动同步策略：登录后全量拉取 → 数据变更自动推送 → 定期增量拉取
 * 4. 冲突处理：检测服务端冲突并提示用户
 */
class CloudSync {
    constructor() {
        this.tokenKey = 'clock_auth_token';
        this.userKey = 'clock_user_info';
        this.token = localStorage.getItem(this.tokenKey) || null;
        
        try {
            this.user = JSON.parse(localStorage.getItem(this.userKey) || 'null');
        } catch (e) {
            this.user = null;
        }

        // 上次同步时间戳（用于增量同步）
        this.lastSyncKey = 'clock_last_sync';
        this.lastSync = localStorage.getItem(this.lastSyncKey) || null;

        // API 基础路径（自动区分本地开发和线上环境）
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.baseURL = isLocal ? '/server/api' : '/clockserver/api';

        // 同步状态
        this.isSyncing = false;
        this.syncQueue = [];
        this.listeners = [];  // 登录状态变更监听器
    }

    // ====================
    // 认证相关
    // ====================

    get isLoggedIn() {
        return !!this.token;
    }

    get userPhone() {
        return this.user ? this.user.phone : '';
    }

    get userNickname() {
        return this.user ? (this.user.nickname || '') : '';
    }

    /**
     * 注册
     */
    async register(phone, password, nickname = '') {
        const res = await this._fetch('/register.php', {
            method: 'POST',
            body: JSON.stringify({ phone, password, nickname })
        });
        if (res.success) {
            this._setAuth(res.token, res.user);
        }
        return res;
    }

    /**
     * 登录
     */
    async login(phone, password) {
        const res = await this._fetch('/login.php', {
            method: 'POST',
            body: JSON.stringify({ phone, password })
        });
        if (res.success) {
            this._setAuth(res.token, res.user);
        }
        return res;
    }

    /**
     * 更新昵称
     */
    async updateNickname(nickname) {
        const res = await this._authFetch('/update_nickname.php', {
            method: 'POST',
            body: JSON.stringify({ nickname })
        });
        if (res.success && this.user) {
            this.user.nickname = nickname;
            localStorage.setItem(this.userKey, JSON.stringify(this.user));
        }
        return res;
    }

    /**
     * 登出
     */
    logout() {
        this.token = null;
        this.user = null;
        this.lastSync = null;
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.lastSyncKey);
        this._notifyListeners();
    }

    _setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this._notifyListeners();
    }

    // ====================
    // 用户数据同步
    // ====================

    /**
     * 全量拉取云端用户数据
     */
    async pullAll() {
        const res = await this._authFetch('/sync.php');
        if (res.success) {
            this.lastSync = res.server_time;
            localStorage.setItem(this.lastSyncKey, this.lastSync);
        }
        return res;
    }

    /**
     * 增量拉取（自上次同步以来的变化）
     */
    async pullSince(since) {
        const ts = since || this.lastSync;
        if (!ts) return this.pullAll();
        
        const res = await this._authFetch(`/sync.php?since=${encodeURIComponent(ts)}`);
        if (res.success) {
            this.lastSync = res.server_time;
            localStorage.setItem(this.lastSyncKey, this.lastSync);
        }
        return res;
    }

    /**
     * 推送本地数据到云端
     * @param {Object} data - { settings: {...}, picsumFavorites: [...], ... }
     * @param {Object} clientTimestamps - 各 key 的本地更新时间 { settings: '2026-...', ... }
     */
    async push(data, clientTimestamps = {}) {
        const res = await this._authFetch('/sync.php', {
            method: 'POST',
            body: JSON.stringify({
                data: data,
                client_timestamps: clientTimestamps
            })
        });
        return res;
    }

    // ====================
    // 故事同步
    // ====================

    /**
     * 获取指定日期的故事
     */
    async getStories(date) {
        return this._authFetch(`/stories.php?date=${encodeURIComponent(date)}`);
    }

    /**
     * 获取日期范围的故事
     */
    async getStoriesRange(from, to) {
        return this._authFetch(`/stories.php?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    }

    /**
     * 增量拉取故事（按 updated_at）
     */
    async getStoriesSince(since) {
        return this._authFetch(`/stories.php?since=${encodeURIComponent(since)}`);
    }

    /**
     * 推送今日故事到云端
     */
    async pushStories(date, stories) {
        // 为每条故事附加本地时间戳
        const withTimestamps = stories.map(s => ({
            ...s,
            client_updated_at: s._localUpdatedAt || null
        }));

        return this._authFetch('/stories.php', {
            method: 'POST',
            body: JSON.stringify({ date, stories: withTimestamps })
        });
    }

    // ====================
    // 内部方法
    // ====================

    /**
     * 带认证的 fetch（自动附加 Bearer token）
     */
    async _authFetch(path, options = {}) {
        if (!this.token) {
            return { success: false, error: '未登录' };
        }

        options.headers = {
            ...(options.headers || {}),
            'Authorization': `Bearer ${this.token}`
        };

        return this._fetch(path, options);
    }

    /**
     * 基础 fetch（添加 Content-Type 和错误处理）
     */
    async _fetch(path, options = {}) {
        const url = this.baseURL + path;

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);

            // 如果是 401，自动登出
            if (response.status === 401) {
                this.logout();
                return { success: false, error: '登录已过期，请重新登录' };
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.error('云端请求失败:', err);
            return { success: false, error: '网络请求失败，请检查网络连接' };
        }
    }

    // ====================
    // 事件监听
    // ====================

    onChange(callback) {
        this.listeners.push(callback);
        // 立即触发初始状态
        callback(this.isLoggedIn);
    }

    _notifyListeners() {
        this.listeners.forEach(fn => {
            try { fn(this.isLoggedIn); } catch (e) {}
        });
    }
}

// 全局单例
window.cloudSync = new CloudSync();
