/**
 * 天气模块
 * 提供天气数据获取和展示功能
 */

class WeatherModule {
    constructor() {
        this.weatherData = null;
        this.apiKey = '69de72f0d73dad0229333346f7fa3514'; // 高德地图API密钥
        this.city = '北京'; // 默认城市
        this.adcode = null; // 城市adcode
        this.updateInterval = 30 * 60 * 1000; // 30分钟更新一次
        this.storageKey = 'weatherData';
        this.locationStorageKey = 'locationData';
        this.mockMode = false; // 使用真实API
        
        // 天气类型映射（高德天气类型）
        this.weatherIcons = {
            // 晴天
            '晴': '☀️',
            '少云': '🌤️',
            '晴间多云': '⛅',
            '多云': '☁️',
            '阴': '☁️',
            // 雨天
            '有风': '💨',
            '平静': '😌',
            '微风': '🍃',
            '和风': '🍃',
            '清风': '💨',
            '强风/劲风': '💨',
            '疾风': '💨',
            '大风': '💨',
            '烈风': '🌪️',
            '风暴': '🌪️',
            '狂爆风': '🌪️',
            '飓风': '🌀',
            '热带风暴': '🌀',
            // 降水
            '阵雨': '🌦️',
            '雷阵雨': '⛈️',
            '雷阵雨并伴有冰雹': '⛈️',
            '小雨': '🌧️',
            '中雨': '🌧️',
            '大雨': '🌧️',
            '暴雨': '⛈️',
            '大暴雨': '⛈️',
            '特大暴雨': '⛈️',
            '强阵雨': '🌧️',
            '强雷阵雨': '⛈️',
            '极端降雨': '⛈️',
            '毛毛雨/细雨': '🌦️',
            '雨': '🌧️',
            '小雨-中雨': '🌧️',
            '中雨-大雨': '🌧️',
            '大雨-暴雨': '⛈️',
            '暴雨-大暴雨': '⛈️',
            '大暴雨-特大暴雨': '⛈️',
            // 雪
            '雨雪天气': '🌨️',
            '雨夹雪': '🌨️',
            '阵雨夹雪': '🌨️',
            '冻雨': '🌨️',
            '雪': '❄️',
            '阵雪': '🌨️',
            '小雪': '🌨️',
            '中雪': '❄️',
            '大雪': '❄️',
            '暴雪': '❄️',
            '小雪-中雪': '🌨️',
            '中雪-大雪': '❄️',
            '大雪-暴雪': '❄️',
            // 其他
            '浮尘': '🌫️',
            '扬沙': '🌫️',
            '沙尘暴': '🌫️',
            '强沙尘暴': '🌫️',
            '龙卷风': '🌪️',
            '雾': '🌫️',
            '浓雾': '🌫️',
            '强浓雾': '🌫️',
            '轻雾': '🌫️',
            '大雾': '🌫️',
            '特强浓雾': '🌫️',
            '霾': '🌫️',
            '中度霾': '🌫️',
            '重度霾': '🌫️',
            '严重霾': '🌫️',
            '热': '🌡️',
            '冷': '🥶',
            '未知': '❓'
        };
        
        this.init();
    }
    
    init() {
        this.createWeatherUI();
        this.loadWeatherData();
        this.startAutoUpdate();
        
        // 天气UI创建后，触发日期更新
        setTimeout(() => {
            if (window.app && window.app.updateDate) {
                window.app.updateDate();
            }
        }, 200);
    }
    
    /**
     * 创建天气UI元素
     */
    createWeatherUI() {
        // 检查是否已存在
        if (document.getElementById('weatherDisplay')) {
            return;
        }
        
        // 将天气显示插入到星期之后
        const dateDisplay = document.querySelector('.date-display');
        const weekText = document.getElementById('weekText');
        
        if (dateDisplay && weekText) {
            const weatherHTML = `
                <div class="weather-display" id="weatherDisplay">
                    <div class="weather-icon" id="weatherIcon">☀️</div>
                    <div class="weather-info">
                        <div class="weather-temp" id="weatherTemp">--°</div>
                        <div class="weather-desc" id="weatherDesc">加载中...</div>
                    </div>
                </div>
            `;
            
            // 在weekText之后插入天气显示
            weekText.insertAdjacentHTML('afterend', weatherHTML);
        }
    }
    
    /**
     * 加载天气数据（优先从缓存读取）
     */
    async loadWeatherData() {
        // 尝试从本地存储读取
        const cached = this.getCachedWeather();
        if (cached && this.isCacheValid(cached)) {
            this.displayWeather(cached);
            return;
        }
        
        // 获取新的天气数据
        await this.fetchWeatherData();
    }
    
    /**
     * 获取缓存的天气数据
     */
    getCachedWeather() {
        try {
            const cached = localStorage.getItem(this.storageKey);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            console.warn('读取天气缓存失败:', e);
            return null;
        }
    }
    
    /**
     * 检查缓存是否有效（30分钟内）
     */
    isCacheValid(cached) {
        if (!cached || !cached.timestamp) return false;
        const now = Date.now();
        return (now - cached.timestamp) < this.updateInterval;
    }
    
    /**
     * 获取天气数据
     */
    async fetchWeatherData() {
        if (this.mockMode) {
            // 模拟数据模式
            this.weatherData = this.getMockWeatherData();
            this.saveWeatherCache(this.weatherData);
            this.displayWeather(this.weatherData);
        } else {
            // 使用高德天气API
            try {
                // 1. 先获取当前位置（使用IP定位）
                if (!this.adcode) {
                    await this.getCurrentLocation();
                }
                
                // 2. 获取天气信息
                if (this.adcode) {
                    await this.fetchAmapWeather();
                } else {
                    throw new Error('无法获取位置信息');
                }
            } catch (error) {
                console.error('获取天气数据失败:', error);
                // 失败时使用模拟数据
                this.weatherData = this.getMockWeatherData();
                this.displayWeather(this.weatherData);
            }
        }
    }
    
    /**
     * 获取当前位置（使用高德IP定位）
     */
    async getCurrentLocation() {
        try {
            // 先检查缓存的位置信息（1天有效）
            const cached = this.getCachedLocation();
            if (cached && this.isLocationCacheValid(cached)) {
                this.adcode = cached.adcode;
                this.city = cached.city;
                return;
            }
            
            // 使用高德IP定位API
            const url = `https://restapi.amap.com/v3/ip?key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.adcode) {
                this.adcode = data.adcode;
                this.city = data.city || data.province;
                
                // 保存位置信息到缓存
                this.saveLocationCache({
                    adcode: this.adcode,
                    city: this.city,
                    timestamp: Date.now()
                });
            } else {
                throw new Error('IP定位失败: ' + (data.info || '未知错误'));
            }
        } catch (error) {
            console.error('获取位置失败:', error);
            // 使用默认位置（北京）
            this.adcode = '110000';
            this.city = '北京';
        }
    }
    
    /**
     * 获取缓存的位置信息
     */
    getCachedLocation() {
        try {
            const cached = localStorage.getItem(this.locationStorageKey);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            console.warn('读取位置缓存失败:', e);
            return null;
        }
    }
    
    /**
     * 检查位置缓存是否有效（1天内）
     */
    isLocationCacheValid(cached) {
        if (!cached || !cached.timestamp) return false;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        return (now - cached.timestamp) < oneDay;
    }
    
    /**
     * 保存位置信息到缓存
     */
    saveLocationCache(data) {
        try {
            localStorage.setItem(this.locationStorageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('保存位置缓存失败:', e);
        }
    }
    
    /**
     * 获取高德天气信息
     */
    async fetchAmapWeather() {
        try {
            // 高德天气查询API
            // extensions=base 返回实况天气
            const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.apiKey}&city=${this.adcode}&extensions=base`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.lives && data.lives.length > 0) {
                const live = data.lives[0];
                
                this.weatherData = {
                    type: live.weather,
                    description: live.weather,
                    temperature: parseInt(live.temperature),
                    humidity: live.humidity,
                    windDirection: live.winddirection,
                    windPower: live.windpower,
                    reportTime: live.reporttime,
                    city: live.city || this.city,
                    timestamp: Date.now()
                };
                
                this.saveWeatherCache(this.weatherData);
                this.displayWeather(this.weatherData);                
            } else {
                throw new Error('天气数据格式错误: ' + (data.info || '未知错误'));
            }
        } catch (error) {
            console.error('获取高德天气失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取模拟天气数据（基于当前时间和随机因素）
     */
    getMockWeatherData() {
        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        // 根据时间和日期生成半随机的天气
        const seed = (month * 100 + day) % 10;
        
        const weatherTypes = [
            { type: 'sunny', desc: '晴朗', temp: [15, 28], season: ['spring', 'summer', 'autumn'] },
            { type: 'cloudy', desc: '多云', temp: [10, 25], season: ['all'] },
            { type: 'partlyCloudy', desc: '晴转多云', temp: [12, 26], season: ['all'] },
            { type: 'rainy', desc: '小雨', temp: [8, 20], season: ['spring', 'summer', 'autumn'] },
            { type: 'overcast', desc: '阴天', temp: [5, 22], season: ['all'] },
            { type: 'clear', desc: '万里无云', temp: [18, 30], season: ['summer'] },
            { type: 'drizzle', desc: '毛毛雨', temp: [10, 18], season: ['spring', 'autumn'] },
            { type: 'windy', desc: '大风', temp: [8, 22], season: ['spring', 'autumn', 'winter'] },
            { type: 'foggy', desc: '雾霾', temp: [5, 20], season: ['autumn', 'winter'] },
            { type: 'snowy', desc: '下雪', temp: [-5, 5], season: ['winter'] }
        ];
        
        // 确定当前季节
        let currentSeason = 'spring';
        if (month >= 3 && month <= 5) currentSeason = 'spring';
        else if (month >= 6 && month <= 8) currentSeason = 'summer';
        else if (month >= 9 && month <= 11) currentSeason = 'autumn';
        else currentSeason = 'winter';
        
        // 筛选适合当前季节的天气
        const seasonalWeather = weatherTypes.filter(w => 
            w.season.includes('all') || w.season.includes(currentSeason)
        );
        
        // 根据seed选择天气类型
        const weatherType = seasonalWeather[seed % seasonalWeather.length];
        
        // 生成温度（添加一些随机性）
        const baseTemp = weatherType.temp[0] + 
            Math.floor((weatherType.temp[1] - weatherType.temp[0]) * (hour / 24));
        const temp = baseTemp + Math.floor(Math.random() * 5) - 2;
        
        return {
            type: weatherType.type,
            description: weatherType.desc,
            temperature: temp,
            city: this.city,
            timestamp: Date.now()
        };
    }
    
    /**
     * 保存天气数据到缓存
     */
    saveWeatherCache(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('保存天气缓存失败:', e);
        }
    }
    
    /**
     * 显示天气信息
     */
    displayWeather(data) {
        if (!data) return;
        
        const iconEl = document.getElementById('weatherIcon');
        const tempEl = document.getElementById('weatherTemp');
        const descEl = document.getElementById('weatherDesc');
        
        // 获取天气图标
        const weatherIcon = this.weatherIcons[data.type] || this.weatherIcons[data.description] || '☀️';
        
        // 显示城市和天气描述
        const cityText = data.city || this.city || '';
        const weatherText = data.description || '';
        const displayText = cityText ? `${cityText} ${weatherText}` : weatherText;
        
        if (iconEl) iconEl.textContent = weatherIcon;
        if (tempEl) tempEl.textContent = `${data.temperature}°`;
        if (descEl) descEl.textContent = displayText;
        
        // 应用天气效果
        this.applyWeatherEffect(data.type || data.description);
        
        // 添加淡入动画
        const weatherDisplay = document.getElementById('weatherDisplay');
        if (weatherDisplay) {
            weatherDisplay.style.opacity = '0';
            setTimeout(() => {
                weatherDisplay.style.opacity = '1';
            }, 100);
        }
    }
    
    /**
     * 应用天气视觉效果
     */
    applyWeatherEffect(weatherType) {
        // 移除之前的效果
        document.body.classList.remove('weather-rainy', 'weather-snowy', 'weather-cloudy');
        
        // 根据天气类型应用效果
        if (!weatherType) return;
        
        // 雨天效果
        if (weatherType.includes('雨') || weatherType.includes('雷')) {
            this.createRainEffect();
        }
        // 雪天效果
        else if (weatherType.includes('雪')) {
            this.createSnowEffect();
        }
        // 阴天效果
        else if (weatherType.includes('阴') || weatherType.includes('多云')) {
            document.body.classList.add('weather-cloudy');
        }
    }
    
    /**
     * 创建下雨效果
     */
    createRainEffect() {
        // 移除已存在的雨效果
        const existingRain = document.getElementById('weatherRainEffect');
        if (existingRain) existingRain.remove();
        
        const rainContainer = document.createElement('div');
        rainContainer.id = 'weatherRainEffect';
        rainContainer.className = 'weather-effect rain-effect';
        
        // 创建雨滴
        for (let i = 0; i < 50; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.animationDelay = `${Math.random() * 2}s`;
            raindrop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            rainContainer.appendChild(raindrop);
        }
        
        document.body.appendChild(rainContainer);
    }
    
    /**
     * 创建下雪效果
     */
    createSnowEffect() {
        // 移除已存在的雪效果
        const existingSnow = document.getElementById('weatherSnowEffect');
        if (existingSnow) existingSnow.remove();
        
        const snowContainer = document.createElement('div');
        snowContainer.id = 'weatherSnowEffect';
        snowContainer.className = 'weather-effect snow-effect';
        
        // 创建雪花
        for (let i = 0; i < 30; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = '❄';
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDelay = `${Math.random() * 5}s`;
            snowflake.style.animationDuration = `${3 + Math.random() * 4}s`;
            snowflake.style.fontSize = `${10 + Math.random() * 20}px`;
            snowContainer.appendChild(snowflake);
        }
        
        document.body.appendChild(snowContainer);
    }
    
    /**
     * 开始自动更新
     */
    startAutoUpdate() {
        setInterval(() => {
            this.fetchWeatherData();
        }, this.updateInterval);
    }
    
    /**
     * 手动刷新天气
     */
    refresh() {
        this.fetchWeatherData();
    }
}

// 初始化天气模块
let weatherModule;
document.addEventListener('DOMContentLoaded', () => {
    weatherModule = new WeatherModule();
});
