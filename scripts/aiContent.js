/**
 * AI 内容生成模块
 * 功能：天气解读、每日故事
 * 作者：时钟应用
 * 版本：1.0.1
 */

const AIContent = (() => {
    // 缓存 key 前缀
    const CACHE_PREFIX = 'ai_content_';
    const CACHE_DURATION = 1000 * 60 * 30; // 30 分钟缓存

    // API 基础路径（与 cloudSync.js 保持一致）
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = isLocal ? '/server/api' : '/clockserver/api';

    /**
     * 获取缓存
     */
    function getCache(key) {
        try {
            const raw = localStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (Date.now() - cached.ts > CACHE_DURATION) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return cached.data;
        } catch {
            return null;
        }
    }

    /**
     * 设置缓存
     */
    function setCache(key, data) {
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                ts: Date.now(),
                data
            }));
        } catch {
            // 静默失败
        }
    }

    /**
     * 通用 API 调用（使用相对路径拼接，与 cloudSync.js 一致，避免 new URL() 兼容性问题）
     */
    async function callApi(action, params = {}) {
        const cacheKey = action + '_' + JSON.stringify(params);
        const cached = getCache(cacheKey);
        if (cached) {
            return { ...cached, cached: true };
        }

        // 构建查询参数
        const qs = new URLSearchParams();
        qs.set('action', action);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) {
                qs.set(k, v);
            }
        });
        const url = `${API_BASE}/ai-content.php?${qs.toString()}`;

        try {
            const headers = { 'Accept': 'application/json' };
            // 携带 JWT Token（如果需要认证）
            if (window.AuthUI && window.AuthUI.getToken) {
                headers['Authorization'] = 'Bearer ' + window.AuthUI.getToken();
            }

            const resp = await fetch(url, {
                method: 'GET',
                headers,
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }

            const result = await resp.json();
            if (result.success && result.content) {
                setCache(cacheKey, result);
                return result;
            }
            throw new Error(result.error || 'API 返回失败');
        } catch (err) {
            console.warn(`[AIContent] API 调用失败 (${action}):`, err.message);
            return null;
        }
    }

    /**
     * 获取天气解读
     * @param {string} weather - 天气描述（晴、雨、多云等）
     * @param {string|number} temp - 温度
     * @param {string} city - 城市名
     * @returns {Promise<string|null>}
     */
    async function getWeatherInsight(weather, temp, city) {
        const result = await callApi('weather-insight', { weather, temp, city });
        return result ? result.content : null;
    }

    /**
     * 获取 AI 每日故事
     * @param {string} [date] - 日期字符串 YYYY-MM-DD，默认今天
     * @returns {Promise<string|null>}
     */
    async function getDailyStory(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const result = await callApi('daily-story', { date: targetDate });
        return result ? result.content : null;
    }

    /**
     * 将天气解读显示在天气区域
     * @param {string} insight - 解读内容
     */
    function displayWeatherInsight(insight) {
        if (!insight) return;

        let container = document.getElementById('weather-insight');
        if (!container) {
            // 动态创建容器
            container = document.createElement('div');
            container.id = 'weather-insight';
            container.className = 'weather-insight';

            const weatherEl = document.getElementById('weather');
            if (weatherEl) {
                weatherEl.appendChild(container);
            } else {
                document.querySelector('.clock-container')?.appendChild(container);
            }
        }

        container.textContent = insight;
        // 不自动显示，由用户点击天气文本触发
        container.style.display = 'none';
    }

    /**
     * 切换天气解读的显示/隐藏
     */
    function toggleWeatherInsight() {
        const container = document.getElementById('weather-insight');
        if (!container || !container.textContent) return;

        if (container.style.display === 'none' || container.style.display === '') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    /**
     * 初始化：结合天气模块自动获取天气解读
     * @param {object} weatherData - { weather, temp, city }
     */
    async function initWeatherInsight(weatherData) {
        if (!weatherData || !weatherData.weather) return;

        try {
            const insight = await getWeatherInsight(
                weatherData.weather,
                weatherData.temp,
                weatherData.city
            );
            if (insight) {
                displayWeatherInsight(insight);
            }
        } catch (err) {
            console.warn('[AIContent] 初始化天气解读失败:', err);
        }
    }

    // 公开 API
    return {
        getWeatherInsight,
        getDailyStory,
        displayWeatherInsight,
        toggleWeatherInsight,
        initWeatherInsight,
    };
})();

// 使用事件委托绑定天气文本点击（天气元素由 weather.js 异步创建）
(function setupWeatherInsightToggle() {
    function tryBind() {
        const weatherDisplay = document.getElementById('weatherDisplay');
        if (!weatherDisplay) {
            // 天气元素尚未创建，稍后重试
            setTimeout(tryBind, 500);
            return;
        }
        weatherDisplay.style.cursor = 'pointer';
        weatherDisplay.title = '点击查看 AI 天气解读';
        weatherDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.AIContent) {
                AIContent.toggleWeatherInsight();
            }
        });
    }
    tryBind();
})();

// 挂载到全局
window.AIContent = AIContent;
