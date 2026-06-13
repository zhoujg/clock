// BGM 音乐播放器管理器
class BGMPlayerManager {
    constructor() {
        this.enabled = false;
        this.audio = null;
        this.currentTrack = null;
        this.volume = 0.5; // 默认音量50%
        this.musicList = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isLooping = false; // 单曲循环
        
        this.initializeAudio();
        this.loadMusicList();
    }
    
    // 初始化音频对象
    initializeAudio() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        
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
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();
        });
        
        // 监听时间更新，用于更新进度条
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgressBar();
        });
        
        // 处理加载错误
        this.audio.addEventListener('error', (e) => {
            console.error('音乐文件加载失败:', e);
            this.showError('音乐加载失败');
        });
    }
    
    // 加载音乐列表
    async loadMusicList() {
        try {
            // 方法1: 尝试从 music-list.json 加载（自动生成的索引文件）
            const response = await fetch('assets/bgm/music-list.json');
            if (response.ok) {
                const data = await response.json();
                if (data.music && Array.isArray(data.music) && data.music.length > 0) {
                    this.musicList = data.music.map(file => ({
                        name: this.extractMusicName(file),
                        file: `assets/bgm/${file}`
                    }));
                    console.log('从 music-list.json 加载了', this.musicList.length, '首音乐');
                    this.renderMusicList();
                    return;
                }
            }
        } catch (error) {
            console.log('无法加载 music-list.json，尝试其他方法:', error.message);
        }

        // 方法2: 检查是否在 Capacitor 环境（Android/iOS 应用）
        if (window.Capacitor) {
            try {
                await this.loadMusicFromCapacitor();
                if (this.musicList.length > 0) {
                    console.log('从 Capacitor 文件系统加载了', this.musicList.length, '首音乐');
                    this.renderMusicList();
                    return;
                }
            } catch (error) {
                console.log('Capacitor 加载失败:', error.message);
            }
        }

        // 方法3: 尝试扫描常见的音乐文件（探测方式）
        await this.probeMusicFiles();
        
        if (this.musicList.length === 0) {
            console.log('未找到音乐文件，请将音乐文件放入 assets/bgm/ 目录');
        }
        
        this.renderMusicList();
    }

    // 从文件名提取音乐名称
    extractMusicName(filename) {
        // 移除文件扩展名
        let name = filename.replace(/\.(mp3|wav|ogg|m4a|flac|aac)$/i, '');
        
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

            const musicExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
            const musicFiles = result.files.filter(file => {
                const ext = file.name.toLowerCase().match(/\.[^.]+$/);
                return ext && musicExtensions.includes(ext[0]);
            });

            this.musicList = musicFiles.map(file => ({
                name: this.extractMusicName(file.name),
                file: `assets/bgm/${file.name}`
            }));

            // 按名称排序
            this.musicList.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Capacitor 文件读取失败:', error);
        }
    }

    // 探测音乐文件（尝试加载可能存在的文件）
    async probeMusicFiles() {
        // 常见的音乐文件名模式
        const commonPatterns = [
            'music1', 'music2', 'music3', 'music4', 'music5',
            'bgm1', 'bgm2', 'bgm3', 'bgm4', 'bgm5',
            'track1', 'track2', 'track3', 'track4', 'track5',
            'ambient', 'chill', 'focus', 'relax', 'calm',
            'piano', 'nature', 'rain', 'ocean', 'forest',
            'lofi', 'jazz', 'classical', 'meditation'
        ];
        
        const extensions = ['mp3', 'wav', 'ogg', 'm4a'];
        
        const probePromises = [];
        
        for (const pattern of commonPatterns) {
            for (const ext of extensions) {
                const filename = `${pattern}.${ext}`;
                const filepath = `assets/bgm/${filename}`;
                
                probePromises.push(
                    this.checkFileExists(filepath).then(exists => {
                        if (exists) {
                            return {
                                name: this.extractMusicName(filename),
                                file: filepath
                            };
                        }
                        return null;
                    })
                );
            }
        }
        
        const results = await Promise.all(probePromises);
        this.musicList = results.filter(item => item !== null);
        
        // 按名称排序
        this.musicList.sort((a, b) => a.name.localeCompare(b.name));
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
    
    // 渲染音乐列表
    renderMusicList() {
        const musicListElement = document.getElementById('musicList');
        if (!musicListElement) return;
        
        musicListElement.innerHTML = '';
        
        if (this.musicList.length === 0) {
            musicListElement.innerHTML = '<div class="no-music">暂无音乐文件</div>';
            return;
        }
        
        this.musicList.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'music-track';
            if (index === this.currentTrackIndex) {
                trackElement.classList.add('active');
            }
            
            trackElement.innerHTML = `
                <div class="track-info">
                    <span class="track-icon">♪</span>
                    <span class="track-name">${track.name}</span>
                </div>
            `;
            
            trackElement.addEventListener('click', () => {
                this.playTrack(index);
            });
            
            musicListElement.appendChild(trackElement);
        });
    }
    
    // 播放指定曲目
    playTrack(index) {
        if (index < 0 || index >= this.musicList.length) return;
        
        this.currentTrackIndex = index;
        this.currentTrack = this.musicList[index];
        
        this.audio.src = this.currentTrack.file;
        this.audio.load();
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.enabled = true;
                    this.updateCurrentTrackDisplay();
                    this.renderMusicList(); // 更新高亮
                })
                .catch(error => {
                    console.warn('音乐播放失败:', error);
                    this.showError('播放失败');
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
        const trackNameElement = document.getElementById('currentTrackName');
        if (trackNameElement && this.currentTrack) {
            trackNameElement.textContent = this.currentTrack.name;
        }
    }
    
    // 更新播放/暂停按钮
    updatePlayPauseButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (!playPauseBtn) return;
        
        if (this.isPlaying) {
            playPauseBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
            playPauseBtn.title = '暂停';
        } else {
            playPauseBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
            playPauseBtn.title = '播放';
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
        const currentTimeElement = document.getElementById('currentTime');
        const durationElement = document.getElementById('duration');
        
        if (!progressBar) return;
        
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (!isNaN(duration)) {
            const progress = (currentTime / duration) * 100;
            progressBar.style.width = progress + '%';
            
            if (currentTimeElement) {
                currentTimeElement.textContent = this.formatTime(currentTime);
            }
            if (durationElement) {
                durationElement.textContent = this.formatTime(duration);
            }
        }
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
    
    // 显示错误提示
    showError(message) {
        const trackNameElement = document.getElementById('currentTrackName');
        if (trackNameElement) {
            const originalText = trackNameElement.textContent;
            trackNameElement.textContent = message;
            trackNameElement.style.color = '#e74c3c';
            
            setTimeout(() => {
                trackNameElement.textContent = originalText || '未选择音乐';
                trackNameElement.style.color = '';
            }, 2000);
        }
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
