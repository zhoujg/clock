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
            // 初始化音频分析器
            this.initAudioAnalyser();
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
            
            // 连接音频源到分析器
            if (!this.sourceNode) {
                this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
                this.sourceNode.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
            
            console.log('🎵 音频分析器初始化成功');
        } catch (error) {
            console.error('音频分析器初始化失败:', error);
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
        // 方法1: 检查是否在 Capacitor 环境（Android/iOS 应用）
        if (window.Capacitor) {
            try {
                await this.loadMusicFromCapacitor();
                if (this.musicList.length > 0) {
                    this.renderMusicList();
                    return;
                }
            } catch (error) {
                console.log('Capacitor 加载失败:', error.message);
            }
        }

        // 方法2: 在 Web 环境中尝试探测音乐文件
        try {
            await this.probeMusicFiles();
            if (this.musicList.length > 0) {
                this.renderMusicList();
                return;
            }
        } catch (error) {
            console.log('文件探测失败:', error.message);
        }

        // 方法3: 使用已知存在的默认音乐列表
        this.useDefaultMusicList();
        
        if (this.musicList.length === 0) {
            console.log('未找到音乐文件，请将音乐文件放入 assets/bgm/ 目录');
        }
        
        this.renderMusicList();
    }

    // 使用默认音乐列表
    useDefaultMusicList() {
        // 如果其他方法都失败了，显示空列表
        this.musicList = [];
        console.log('未找到音乐文件，请将音乐文件放入 assets/bgm/ 目录');
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

    // 在 Capacitor 环境中加载音乐
    async loadMusicFromCapacitor() {
        if (!window.Capacitor || !window.Capacitor.Plugins.Filesystem) {
            return;
        }

        try {
            const { Filesystem } = window.Capacitor.Plugins;
            
            // 读取 public/assets/bgm 目录
            const result = await Filesystem.readdir({
                path: 'public/assets/bgm',
                directory: 'APPLICATION'
            });

            const musicExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.mpga'];
            const musicFiles = result.files
                .filter(file => {
                    const ext = file.name.toLowerCase().match(/\.[^.]+$/);
                    return ext && musicExtensions.includes(ext[0]);
                })
                .map(file => file.name || file); // 兼容不同的返回格式

            this.musicList = musicFiles.map(filename => ({
                name: this.extractMusicName(filename),
                file: `assets/bgm/${filename}`
            }));

            // 按名称排序
            this.musicList.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Capacitor 文件读取失败:', error);
        }
    }

    // 探测音乐文件（尝试加载可能存在的文件）
    async probeMusicFiles() {
        // 尝试通过 fetch 获取 bgm 目录的文件列表
        // 注意：这需要服务器支持目录列表，否则会失败
        try {
            const response = await fetch('assets/bgm/');
            if (!response.ok) {
                throw new Error('无法访问 bgm 目录');
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 查找所有链接
            const links = Array.from(doc.querySelectorAll('a'));
            const musicExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.mpga'];
            
            const musicFiles = links
                .map(link => link.getAttribute('href'))
                .filter(href => {
                    if (!href) return false;
                    const lower = href.toLowerCase();
                    return musicExtensions.some(ext => lower.endsWith(ext));
                })
                .map(filename => ({
                    name: this.extractMusicName(filename),
                    file: `assets/bgm/${filename}`
                }));
            
            if (musicFiles.length > 0) {
                this.musicList = musicFiles;
                // 按名称排序
                this.musicList.sort((a, b) => a.name.localeCompare(b.name));
            }
        } catch (error) {
            console.log('无法读取 bgm 目录列表:', error.message);
            // 如果目录列表失败，musicList 保持为空
            this.musicList = [];
        }
    }

    // 检查文件是否存在
    async checkFileExists(filepath) {
        try {
            const response = await fetch(filepath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // 渲染音乐列表（保留方法但不执行，因为不再有右下角播放器）
    renderMusicList() {
        // 触发自定义事件，通知音乐列表已更新
        window.dispatchEvent(new CustomEvent('musicListUpdated'));
    }
    
    // 播放指定曲目
    playTrack(index) {
        if (index < 0 || index >= this.musicList.length) return;
        
        this.currentTrackIndex = index;
        this.currentTrack = this.musicList[index];
        
        this.audio.src = this.currentTrack.file;
        this.audio.load();
        
        // 在开始播放前立即暂停滴答声
        this.pauseTickSound();
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.enabled = true;
                    this.updateCurrentTrackDisplay();
                    this.renderMusicList(); // 更新高亮
                    // 触发自定义事件，通知曲目已更改
                    window.dispatchEvent(new CustomEvent('musicTrackChanged'));
                })
                .catch(error => {
                    console.warn('音乐播放失败:', error);
                    this.showError('播放失败');
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
        // 不再更新右下角播放器的显示，因为已移除
        // 只保留方法以防其他地方调用
    }
    
    // 更新播放/暂停按钮
    updatePlayPauseButton() {
        // 不再更新右下角播放器的按钮，因为已移除
        // 只保留方法以防其他地方调用
    }
    
    // 更新循环按钮
    updateLoopButton() {
        // 不再更新右下角播放器的按钮，因为已移除
        // 只保留方法以防其他地方调用
    }
    
    // 更新进度条
    updateProgressBar() {
        // 不再更新右下角播放器的进度条，因为已移除
        // 只保留方法以防其他地方调用
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
            isLooping: this.isLooping
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
        
        // 不自动播放上次的音乐，只恢复设置
        if (settings.currentTrackIndex !== undefined && settings.currentTrackIndex >= 0) {
            this.currentTrackIndex = settings.currentTrackIndex;
        }
    }
}
