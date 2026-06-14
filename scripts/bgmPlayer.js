// BGM 音乐播放器管理器
class BGMPlayerManager {
    constructor(tickSoundManager = null) {
        this.enabled = false;
        this.audio = null;
        this.currentTrack = null;
        this.volume = 0.5; // 默认音量50%
        this.musicList = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isLooping = false; // 单曲循环
        this.tickSoundManager = tickSoundManager; // 滴答声管理器引用
        this.tickSoundWasEnabled = undefined; // 记录音乐播放前滴答声是否开启，undefined表示未记录
        
        // Jamendo API 集成
        this.jamendoAPI = new JamendoAPI();
        this.musicSource = 'jamendo'; // 只支持 'jamendo' 在线音乐
        
        this.initializeAudio();
        this.loadMusicList();
    }
    
    // 初始化音频对象
    initializeAudio() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        
        // 初始化 Web Audio API 用于音频分析
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.sourceNode = null;
        
        // 监听播放结束事件
        this.audio.addEventListener('ended', () => {
            if (this.isLooping) {
                // 单曲循环
                this.audio.currentTime = 0;
                this.audio.play();
            } else {
                // 自动播放下一曲
                this.playNext();
            }
        });
        
        // 监听播放状态
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
            
            // 只为本地音乐初始化音频分析器（避免 CORS 问题）
            if (this.musicSource === 'local') {
                this.initAudioAnalyser();
            } else {
                console.log('🎵 在线音乐不启用可视化（避免 CORS 问题）');
            }
            
            // 播放音乐时暂停滴答声
            this.pauseTickSound();
            // 触发自定义事件，通知UI更新
            window.dispatchEvent(new CustomEvent('musicPlayStateChanged'));
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();
            // 暂停音乐时恢复滴答声
            this.resumeTickSound();
            // 触发自定义事件，通知UI更新
            window.dispatchEvent(new CustomEvent('musicPlayStateChanged'));
        });
        
        // 监听时间更新，用于更新进度条
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgressBar();
        });
        
        // 处理加载错误
        this.audio.addEventListener('error', (e) => {
            console.error('音乐文件加载失败:', e);
            this.showError('音乐加载失败');
            // 加载失败时也恢复滴答声
            this.resumeTickSound();
        });
    }
    
    // 初始化音频分析器
    initAudioAnalyser() {
        if (this.analyser) return; // 已初始化
        
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256; // 频率分辨率
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            // 尝试连接音频源到分析器
            if (!this.sourceNode) {
                try {
                    this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
                    this.sourceNode.connect(this.analyser);
                    this.analyser.connect(this.audioContext.destination);
                    console.log('🎵 音频分析器初始化成功（带可视化）');
                } catch (corsError) {
                    console.warn('⚠️ CORS 限制，无法创建音频分析器。音乐可以播放，但无法进行可视化分析。', corsError);
                    // CORS 错误时，清除分析器相关对象，让音乐正常播放
                    this.analyser = null;
                    this.sourceNode = null;
                    this.audioContext = null;
                    this.dataArray = null;
                    console.log('🎵 音频分析器已禁用，音乐将正常播放');
                }
            }
            
        } catch (error) {
            console.error('音频分析器初始化失败:', error);
            // 清除所有分析器相关对象
            this.analyser = null;
            this.sourceNode = null;
            this.audioContext = null;
            this.dataArray = null;
        }
    }
    
    // 获取音频频率数据
    getAudioData() {
        if (!this.analyser || !this.isPlaying) {
            return null;
        }
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // 计算低频、中频、高频的平均值
        const third = Math.floor(this.dataArray.length / 3);
        let bass = 0, mid = 0, treble = 0;
        
        for (let i = 0; i < third; i++) {
            bass += this.dataArray[i];
        }
        for (let i = third; i < third * 2; i++) {
            mid += this.dataArray[i];
        }
        for (let i = third * 2; i < this.dataArray.length; i++) {
            treble += this.dataArray[i];
        }
        
        bass /= third;
        mid /= third;
        treble /= third;
        
        // 计算整体音量（0-1）
        const overall = (bass + mid + treble) / 3 / 255;
        
        return {
            bass: bass / 255,
            mid: mid / 255,
            treble: treble / 255,
            overall: overall,
            raw: this.dataArray
        };
    }
    
    // 暂停滴答声
    pauseTickSound() {
        if (this.tickSoundManager) {
            // 只在第一次记录状态，避免重复调用时覆盖
            if (this.tickSoundWasEnabled === undefined) {
                this.tickSoundWasEnabled = this.tickSoundManager.enabled;
            } 
            
            // 如果滴答声开启，关闭它
            if (this.tickSoundManager.enabled) {
                this.tickSoundManager.enabled = false;
                if (this.tickSoundManager.audio) {
                    this.tickSoundManager.audio.pause();
                    this.tickSoundManager.audio.currentTime = 0;
                }
            } 
        }
    }
    
    // 恢复滴答声
    resumeTickSound() {        
        if (this.tickSoundManager && this.tickSoundWasEnabled) {
            // 如果音乐播放前滴答声是开启的，重新开启并立即播放一次
            this.tickSoundManager.enabled = true;
            
            // 立即播放一次滴答声，不等待下一个时钟周期
            if (this.tickSoundManager.audio && this.tickSoundManager.isLoaded) {
                try {
                    this.tickSoundManager.audio.currentTime = 0;
                    const playPromise = this.tickSoundManager.audio.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .catch(error => {
                                console.warn('❌ 滴答声恢复播放失败:', error);
                            });
                    } 
                } catch (error) {
                    console.warn('❌ 滴答声恢复播放异常:', error);
                }
            } else {
                console.warn('⚠️ 无法播放滴答声 - audio:', !!this.tickSoundManager.audio, 'isLoaded:', this.tickSoundManager.isLoaded);
            }
        } 
        
        // 重置标志，以便下次播放音乐时能重新记录状态
        this.tickSoundWasEnabled = undefined;
    }
    
    // 加载音乐列表
    async loadMusicList() {
        // 只支持在线音乐，直接加载 Jamendo 音乐
        await this.loadJamendoMusic();
        
        if (this.musicList.length === 0) {
            console.log('未找到音乐，请检查网络连接');
        }
        
        this.renderMusicList();
    }

    // 从文件名提取音乐名称
    extractMusicName(filename) {
        // 先解码 URL 编码（如 %20 -> 空格）
        try {
            filename = decodeURIComponent(filename);
        } catch (e) {
            // 如果解码失败，使用原始文件名
            console.warn('文件名解码失败:', filename, e);
        }
        
        // 移除文件扩展名
        let name = filename.replace(/\.(mp3|wav|ogg|m4a|flac|aac|mpga)$/i, '');
        
        // 将下划线和连字符替换为空格
        name = name.replace(/[_-]/g, ' ');
        
        // 首字母大写
        name = name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return name;
    }
    
    // 渲染音乐列表（保留方法但不执行，因为不再有右下角播放器）
    renderMusicList_old() {
        // 触发自定义事件，通知音乐列表已更新
        window.dispatchEvent(new CustomEvent('musicListUpdated'));
    }
    
    // 播放指定曲目
    playTrack(index) {
        console.log('🎵 playTrack 调用:', {
            index,
            musicListLength: this.musicList.length,
            isValidIndex: index >= 0 && index < this.musicList.length
        });
        
        if (index < 0 || index >= this.musicList.length) {
            console.warn('❌ 无效的曲目索引:', index);
            return;
        }
        
        this.currentTrackIndex = index;
        this.currentTrack = this.musicList[index];
        
        console.log('🎵 准备播放:', {
            name: this.currentTrack.name,
            artist: this.currentTrack.artist,
            file: this.currentTrack.file,
            source: this.currentTrack.source
        });
        
        // 检查文件URL是否有效
        if (!this.currentTrack.file) {
            console.error('❌ 音频文件URL为空！', this.currentTrack);
            this.showError('音频文件URL无效');
            return;
        }
        
        this.audio.src = this.currentTrack.file;
        this.audio.load();
        
        // 在开始播放前立即暂停滴答声
        this.pauseTickSound();
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ 音乐开始播放:', this.currentTrack.name);
                    this.enabled = true;
                    this.updateCurrentTrackDisplay();
                    this.renderMusicList(); // 更新高亮
                    // 触发自定义事件，通知曲目已更改
                    window.dispatchEvent(new CustomEvent('musicTrackChanged'));
                })
                .catch(error => {
                    console.error('❌ 音乐播放失败:', error);
                    console.error('失败的曲目信息:', {
                        name: this.currentTrack.name,
                        file: this.currentTrack.file,
                        source: this.currentTrack.source
                    });
                    this.showError('播放失败: ' + error.message);
                    // 播放失败时恢复滴答声
                    this.resumeTickSound();
                });
        }
    }
    
    // 播放/暂停
    togglePlay() {
        if (!this.audio.src) {
            // 如果还没有选择音乐，播放第一首
            if (this.musicList.length > 0) {
                this.playTrack(0);
            }
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    // 播放
    play() {
        if (!this.audio.src) return;
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('音乐播放失败:', error);
                this.showError('播放失败');
            });
        }
    }
    
    // 暂停
    pause() {
        this.audio.pause();
    }
    
    // 停止
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.enabled = false;
        this.isPlaying = false;
        this.updatePlayPauseButton();
        // 停止音乐时恢复滴答声
        this.resumeTickSound();
    }
    
    // 上一曲
    playPrevious() {
        if (this.musicList.length === 0) return;
        
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = this.musicList.length - 1;
        }
        
        this.playTrack(newIndex);
    }
    
    // 下一曲
    playNext() {
        if (this.musicList.length === 0) return;
        
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.musicList.length) {
            newIndex = 0;
        }
        
        this.playTrack(newIndex);
    }
    
    // 切换循环模式
    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.updateLoopButton();
        return this.isLooping;
    }
    
    // 设置音量 (0-100)
    setVolume(volumePercent) {
        this.volume = Math.max(0, Math.min(100, volumePercent)) / 100;
        this.audio.volume = this.volume;
    }
    
    // 更新当前播放曲目显示
    updateCurrentTrackDisplay() {
        const currentTrackName = document.getElementById('currentTrackName');
        const currentArtist = document.getElementById('currentArtist');
        
        if (currentTrackName && this.currentTrack) {
            currentTrackName.textContent = this.currentTrack.name;
            
            // 显示艺术家信息
            if (currentArtist && this.currentTrack.artist) {
                currentArtist.textContent = '🎤 ' + this.currentTrack.artist;
                currentArtist.style.display = 'block';
            } else if (currentArtist) {
                currentArtist.style.display = 'none';
            }
        }
    }
    
    // 更新播放/暂停按钮
    updatePlayPauseButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (!playPauseBtn) return;
        
        const playIcon = playPauseBtn.querySelector('.play-icon');
        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
        
        if (this.isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
        }
    }
    
    // 更新循环按钮
    updateLoopButton() {
        const loopBtn = document.getElementById('loopBtn');
        if (!loopBtn) return;
        
        if (this.isLooping) {
            loopBtn.classList.add('active');
        } else {
            loopBtn.classList.remove('active');
        }
    }
    
    // 更新进度条
    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        const currentTimeEl = document.getElementById('currentTime');
        const durationEl = document.getElementById('duration');
        
        if (!progressBar) return;
        
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (!isNaN(duration) && duration > 0) {
            const percent = (currentTime / duration) * 100;
            progressBar.style.width = percent + '%';
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(currentTime);
        }
        
        if (durationEl) {
            durationEl.textContent = this.formatTime(duration);
        }
    }
    
    // 渲染音乐列表
    renderMusicList() {
        const musicListContainer = document.getElementById('musicListContainer');
        if (!musicListContainer) return;
        
        if (this.musicList.length === 0) {
            musicListContainer.innerHTML = '<div class="no-music">暂无音乐文件</div>';
            return;
        }
        
        musicListContainer.innerHTML = '';
        this.musicList.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'music-track';
            if (index === this.currentTrackIndex) {
                trackElement.classList.add('active');
            }
            
            trackElement.innerHTML = `
                <div class="track-info">
                    <span class="track-icon">♪</span>
                    <div style="flex: 1; min-width: 0;">
                        <div class="track-name">${track.name}</div>
                        ${track.artist ? `<div class="music-artist">${track.artist}</div>` : ''}
                    </div>
                </div>
            `;
            
            trackElement.addEventListener('click', () => {
                this.playTrack(index);
            });
            
            musicListContainer.appendChild(trackElement);
        });
        
        // 触发自定义事件，通知UI更新
        window.dispatchEvent(new CustomEvent('musicListUpdated'));
    }
    
    // 格式化时间显示
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 设置播放进度
    setProgress(percent) {
        if (!isNaN(this.audio.duration)) {
            this.audio.currentTime = (percent / 100) * this.audio.duration;
        }
    }
    
    // 显示错误提示（简化版）
    showError(message) {
        console.error('BGM Player Error:', message);
    }
    
    // 获取当前设置
    getSettings() {
        return {
            enabled: this.enabled,
            currentTrackIndex: this.currentTrackIndex,
            volume: this.volume * 100,
            isLooping: this.isLooping,
            musicSource: this.musicSource
        };
    }
    
    // 恢复设置
    restoreSettings(settings) {
        if (!settings) return;
        
        if (settings.volume !== undefined) {
            this.setVolume(settings.volume);
        }
        
        if (settings.isLooping !== undefined) {
            this.isLooping = settings.isLooping;
            this.updateLoopButton();
        }
        
        // 恢复音乐源
        if (settings.musicSource !== undefined) {
            this.musicSource = settings.musicSource;
        }
        
        // 不自动播放上次的音乐，只恢复设置
        if (settings.currentTrackIndex !== undefined && settings.currentTrackIndex >= 0) {
            this.currentTrackIndex = settings.currentTrackIndex;
        }
    }
    
    // ========== Jamendo API 集成方法 ==========
    
    /**
     * 切换音乐源（已废弃，仅保留在线音乐）
     * @param {string} source - 只支持 'jamendo'
     */
    async switchMusicSource(source) {
        if (source !== 'jamendo') {
            console.error('只支持在线音乐 (jamendo)');
            return;
        }
        
        // 停止当前播放
        this.stop();
        
        this.musicSource = 'jamendo';
        console.log('🎵 使用在线音乐源');
        
        // 重新加载音乐列表
        await this.loadJamendoMusic();
        
        // 触发列表更新事件
        window.dispatchEvent(new CustomEvent('musicListUpdated'));
    }
    
    /**
     * 加载 Jamendo 音乐
     * @param {Object} options - 查询选项
     * @param {number} options.limit - 返回曲目数量
     * @param {string} options.tags - 音乐标签
     */
    async loadJamendoMusic(options = {}) {
        try {
            // 每次加载时清除缓存，确保获取新的音乐
            this.jamendoAPI.clearCache();
            
            const tracks = await this.jamendoAPI.getRandomTracks(options);
            
            if (tracks.length === 0) {
                console.warn('⚠️ 未获取到 Jamendo 音乐');
                this.musicList = [];
                return;
            }
            
            // 将 Jamendo 曲目添加到播放列表
            this.musicList = tracks;
            this.currentTrackIndex = -1;
            
            // 触发列表更新事件
            this.renderMusicList();
            
        } catch (error) {
            console.error('❌ 加载 Jamendo 音乐失败:', error);
            this.showError('加载在线音乐失败');
            this.musicList = [];
            // 即使失败也触发更新事件，以显示错误状态
            this.renderMusicList();
        }
    }
    
    /**
     * 按标签加载 Jamendo 音乐
     * @param {string} tag - 音乐标签
     * @param {number} limit - 返回曲目数量
     */
    async loadJamendoByTag(tag, limit = 20) {
        await this.loadJamendoMusic({ tags: tag, limit });
    }
    
    /**
     * 搜索 Jamendo 音乐
     * @param {string} query - 搜索关键词
     * @param {Object} options - 搜索选项
     */
    async searchJamendoMusic(query, options = {}) {
        try {
            console.log('🔍 搜索 Jamendo 音乐:', query);
            
            const tracks = await this.jamendoAPI.searchTracks({
                query,
                ...options
            });
            
            if (tracks.length === 0) {
                console.warn('⚠️ 未找到匹配的音乐');
                this.musicList = [];
                return;
            }
            
            // 更新播放列表
            this.musicList = tracks;
            this.currentTrackIndex = -1;
            
            console.log(`✅ 搜索到 ${tracks.length} 首音乐`);
            
            // 触发列表更新事件
            this.renderMusicList();
            
        } catch (error) {
            console.error('❌ 搜索音乐失败:', error);
            this.showError('搜索音乐失败');
            this.musicList = [];
        }
    }
    
    /**
     * 获取当前音乐源
     * @returns {string} 'local' 或 'jamendo'
     */
    getMusicSource() {
        return this.musicSource;
    }
    
    /**
     * 获取可用的音乐标签
     * @returns {Array<string>} 音乐标签列表
     */
    getAvailableTags() {
        return this.jamendoAPI.getPopularTags();
    }
    
    /**
     * 播放随机 Jamendo 音乐
     */
    async playRandomJamendo(options = {}) {
        await this.switchMusicSource('jamendo');
        await this.loadJamendoMusic(options);
        
        if (this.musicList.length > 0) {
            // 随机选择一首开始播放
            const randomIndex = Math.floor(Math.random() * this.musicList.length);
            this.playTrack(randomIndex);
        }
    }
}
