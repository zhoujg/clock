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
    
    // 暂停滴答声
    pauseTickSound() {
        console.log('pauseTickSound 被调用', {
            hasManager: !!this.tickSoundManager,
            currentEnabled: this.tickSoundManager?.enabled,
            alreadyRecorded: this.tickSoundWasEnabled
        });
        
        if (this.tickSoundManager) {
            // 只在第一次记录状态，避免重复调用时覆盖
            if (this.tickSoundWasEnabled === undefined) {
                this.tickSoundWasEnabled = this.tickSoundManager.enabled;
                console.log('📝 首次记录滴答声状态 tickSoundWasEnabled =', this.tickSoundWasEnabled);
            } else {
                console.log('⚠️ 已经记录过状态，不覆盖。当前记录值 =', this.tickSoundWasEnabled);
            }
            
            // 如果滴答声开启，关闭它
            if (this.tickSoundManager.enabled) {
                this.tickSoundManager.enabled = false;
                if (this.tickSoundManager.audio) {
                    this.tickSoundManager.audio.pause();
                    this.tickSoundManager.audio.currentTime = 0;
                }
                console.log('🔇 滴答声已关闭');
            } else {
                console.log('⚠️ 滴答声已经是关闭状态');
            }
        }
    }
    
    // 恢复滴答声
    resumeTickSound() {
        console.log('resumeTickSound 被调用', {
            hasManager: !!this.tickSoundManager,
            wasEnabled: this.tickSoundWasEnabled,
            currentEnabled: this.tickSoundManager?.enabled,
            hasAudio: !!this.tickSoundManager?.audio,
            isLoaded: this.tickSoundManager?.isLoaded
        });
        
        if (this.tickSoundManager && this.tickSoundWasEnabled) {
            // 如果音乐播放前滴答声是开启的，重新开启并立即播放一次
            this.tickSoundManager.enabled = true;
            console.log('✅ 滴答声 enabled 已设置为 true');
            
            // 立即播放一次滴答声，不等待下一个时钟周期
            if (this.tickSoundManager.audio && this.tickSoundManager.isLoaded) {
                console.log('🎵 尝试立即播放滴答声...');
                try {
                    this.tickSoundManager.audio.currentTime = 0;
                    const playPromise = this.tickSoundManager.audio.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log('✅ 滴答声播放成功');
                            })
                            .catch(error => {
                                console.warn('❌ 滴答声恢复播放失败:', error);
                            });
                    } else {
                        console.log('✅ 滴答声播放调用完成（旧浏览器API）');
                    }
                } catch (error) {
                    console.warn('❌ 滴答声恢复播放异常:', error);
                }
            } else {
                console.warn('⚠️ 无法播放滴答声 - audio:', !!this.tickSoundManager.audio, 'isLoaded:', this.tickSoundManager.isLoaded);
            }
            console.log('滴答声已恢复并播放');
        } else {
            console.log('⚠️ 不恢复滴答声 - hasManager:', !!this.tickSoundManager, 'wasEnabled:', this.tickSoundWasEnabled);
        }
        
        // 重置标志，以便下次播放音乐时能重新记录状态
        this.tickSoundWasEnabled = undefined;
        console.log('🔄 重置 tickSoundWasEnabled 标志');
    }
    
    // 加载音乐列表
    async loadMusicList() {
        // 方法1: 检查是否在 Capacitor 环境（Android/iOS 应用）
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

        // 方法2: 在 Web 环境中尝试探测音乐文件
        try {
            await this.probeMusicFiles();
            if (this.musicList.length > 0) {
                console.log('通过文件探测加载了', this.musicList.length, '首音乐');
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
        // 从已知存在的文件开始（基于项目文件树）
        const knownMusicFiles = [
            'The Mass.mp3',
            'Victory.mp3'
        ];
        
        this.musicList = knownMusicFiles.map(file => ({
            name: this.extractMusicName(file),
            file: `assets/bgm/${file}`
        }));
        
        console.log('使用默认音乐列表，共', this.musicList.length, '首音乐');
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
            
            console.log('从 Capacitor 加载的音乐文件:', musicFiles);
        } catch (error) {
            console.error('Capacitor 文件读取失败:', error);
        }
    }

    // 探测音乐文件（尝试加载可能存在的文件）
    async probeMusicFiles() {
        // 先尝试读取 assets/bgm 目录下的所有文件
        // 这里我们使用一个技巧：尝试读取目录的 index 页面（如果服务器支持目录列表）
        // 或者使用已知的文件列表
        
        const knownFiles = [
            'The Mass.mp3',
            'Victory.mp3'
        ];
        
        // 常见的音乐文件名模式（作为补充）
        const commonPatterns = [
            'music1', 'music2', 'music3', 'music4', 'music5',
            'music6', 'music7', 'music8', 'music9', 'music10',
            'bgm1', 'bgm2', 'bgm3', 'bgm4', 'bgm5',
            'track1', 'track2', 'track3', 'track4', 'track5',
            'ambient', 'chill', 'focus', 'relax', 'calm',
            'piano', 'nature', 'rain', 'ocean', 'forest',
            'lofi', 'jazz', 'classical', 'meditation', 'study',
            'work', 'sleep', 'morning', 'evening', 'night'
        ];
        
        const extensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];
        
        const probePromises = [];
        
        // 首先检查已知存在的文件
        for (const filename of knownFiles) {
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
        
        // 然后探测常见模式的文件
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
        const foundFiles = results.filter(item => item !== null);
        
        // 去重（因为已知文件可能也在常见模式中）
        const uniqueFiles = new Map();
        foundFiles.forEach(file => {
            uniqueFiles.set(file.file, file);
        });
        
        this.musicList = Array.from(uniqueFiles.values());
        
        // 按名称排序
        this.musicList.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('通过文件探测找到的音乐:', this.musicList.map(m => m.file));
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
