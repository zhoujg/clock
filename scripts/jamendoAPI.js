// Jamendo API 集成
class JamendoAPI {
    constructor() {
        this.clientId = '18522544';
        this.baseURL = 'https://api.jamendo.com/v3.0';
        this.cache = {
            tracks: [],
            lastFetch: 0,
            cacheDuration: 5 * 60 * 1000 // 5分钟缓存
        };
    }
    
    /**
     * 获取随机音乐曲目
     * @param {Object} options - 查询选项
     * @param {number} options.limit - 返回曲目数量，默认20
     * @param {string} options.tags - 音乐标签（如 'pop', 'rock', 'electronic', 'classical'）
     * @param {string} options.audioformat - 音频格式，默认 'mp32'
     * @param {boolean} options.include - 包含额外信息（如 'musicinfo'）
     * @returns {Promise<Array>} 音乐曲目数组
     */
    async getRandomTracks(options = {}) {
        const {
            limit = 20,
            tags = '',
            audioformat = 'mp32',
            include = 'musicinfo'
        } = options;
        
        // 检查缓存
        const now = Date.now();
        if (this.cache.tracks.length > 0 && (now - this.cache.lastFetch) < this.cache.cacheDuration) {
            return this.cache.tracks;
        }
        
        try {
            const params = new URLSearchParams({
                client_id: this.clientId,
                format: 'json',
                limit: limit.toString(),
                audioformat: audioformat,
                include: include,
                // 明确指定需要音频下载URL
                audiodownload: 'true'
            });
            
            // 添加标签过滤（如果指定）
            if (tags) {
                params.append('tags', tags);
            }
            
            // 使用 popularity_week 排序，然后通过随机偏移量实现随机效果
            // Jamendo API 不支持 'random' 排序，我们使用受欢迎度排序
            params.append('order', 'popularity_week');
            
            // 添加随机偏移量来获得不同的结果集
            // 使用随机的 offset 来模拟随机获取
            const randomOffset = Math.floor(Math.random() * 100);
            params.append('offset', randomOffset.toString());
            
            const url = `${this.baseURL}/tracks/?${params.toString()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Jamendo API 请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
                        
            // 检查是否有错误信息
            if (data.headers && data.headers.status === 'failed') {
                throw new Error(`Jamendo API 错误: ${data.headers.error_message}`);
            }
            
            if (!data.results || data.results.length === 0) {
                console.warn('⚠️ Jamendo API 未返回音乐');
                return [];
            }
            
            // 转换为应用的音乐格式
            let tracks = data.results.map(track => {
                // 优先使用 audiodownload，因为 audio 字段可能为空
                const audioUrl = track.audiodownload || track.audio;
                
                return {
                    id: track.id,
                    name: track.name,
                    artist: track.artist_name,
                    duration: track.duration,
                    file: audioUrl,
                    image: track.image || track.album_image,
                    license: track.license_ccurl,
                    source: 'jamendo'
                };
            });
            
            // 客户端随机打乱顺序，增加随机性
            tracks = this.shuffleArray(tracks);
            
            // 更新缓存
            this.cache.tracks = tracks;
            this.cache.lastFetch = now;
            
            return tracks;
            
        } catch (error) {
            console.error('❌ Jamendo API 请求失败:', error);
            throw error;
        }
    }
    
    /**
     * 打乱数组顺序（Fisher-Yates 算法）
     * @param {Array} array - 要打乱的数组
     * @returns {Array} 打乱后的数组
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * 按音乐类型获取曲目
     * @param {string} tag - 音乐标签（如 'pop', 'rock', 'electronic', 'classical', 'jazz', 'ambient'）
     * @param {number} limit - 返回曲目数量
     * @returns {Promise<Array>} 音乐曲目数组
     */
    async getTracksByTag(tag, limit = 20) {
        return this.getRandomTracks({ limit, tags: tag });
    }
    
    /**
     * 搜索音乐
     * @param {Object} options - 搜索选项
     * @param {string} options.query - 搜索关键词
     * @param {number} options.limit - 返回曲目数量
     * @param {string} options.tags - 音乐标签
     * @returns {Promise<Array>} 音乐曲目数组
     */
    async searchTracks(options = {}) {
        const {
            query = '',
            limit = 20,
            tags = '',
            audioformat = 'mp32',
            include = 'musicinfo'
        } = options;
        
        try {
            const params = new URLSearchParams({
                client_id: this.clientId,
                format: 'json',
                limit: limit.toString(),
                audioformat: audioformat,
                include: include,
                // 明确指定需要音频下载URL
                audiodownload: 'true'
            });
            
            // 添加搜索关键词
            if (query) {
                params.append('search', query);
            }
            
            // 添加标签过滤
            if (tags) {
                params.append('tags', tags);
            }
            
            // 使用 relevance 排序（相关性）
            params.append('order', 'relevance');
            
            const url = `${this.baseURL}/tracks/?${params.toString()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Jamendo API 搜索失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 检查是否有错误信息
            if (data.headers && data.headers.status === 'failed') {
                throw new Error(`Jamendo API 错误: ${data.headers.error_message}`);
            }
            
            if (!data.results || data.results.length === 0) {
                console.warn('⚠️ 未找到匹配的音乐');
                return [];
            }
            
            // 转换为应用的音乐格式
            const tracks = data.results.map(track => {
                // 优先使用 audiodownload，因为 audio 字段可能为空
                const audioUrl = track.audiodownload || track.audio;
                
                return {
                    id: track.id,
                    name: track.name,
                    artist: track.artist_name,
                    duration: track.duration,
                    file: audioUrl,
                    image: track.image || track.album_image,
                    license: track.license_ccurl,
                    source: 'jamendo'
                };
            });
            
            return tracks;
            
        } catch (error) {
            console.error('❌ Jamendo 搜索失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取热门音乐标签
     * @returns {Array<string>} 推荐的音乐标签列表
     */
    getPopularTags() {
        return [
            'ambient',
            'instrumental',
            'cinematic',
            'chillout',
            'lounge',
            'classical',
            'acoustic',
            'soundtrack',
            'electronic',
            'world',
            'jazz'
        ];
    }
    
    /**
     * 获取默认 BGM 标签组合
     * @returns {string} 默认的 BGM 标签组合
     */
    getDefaultBGMTags() {
        // 使用 + 连接多个标签，表示同时匹配
        return 'ambient+instrumental';
    }
    
    /**
     * 获取随机 BGM 标签
     * @returns {string} 随机选择的 BGM 标签
     */
    getRandomBGMTag() {
        const bgmTags = ['ambient', 'instrumental', 'cinematic', 'chillout', 'acoustic'];
        return bgmTags[Math.floor(Math.random() * bgmTags.length)];
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.tracks = [];
        this.cache.lastFetch = 0;
    }
}
