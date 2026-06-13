// 滴答声管理器
class TickSoundManager {
    constructor() {
        this.enabled = false;
        this.audio = null;
        this.isLoaded = false;
        this.initializeAudio();
    }
    
    initializeAudio() {
        // 预加载音频文件
        this.audio = new Audio('assets/slow-tick.mp3');
        this.audio.preload = 'auto';
        this.audio.volume = 0.3; // 设置音量为30%，避免声音过大
        
        // 监听音频加载完成事件
        this.audio.addEventListener('canplaythrough', () => {
            this.isLoaded = true;
        });
        
        // 监听音频播放结束事件，准备下次播放
        this.audio.addEventListener('ended', () => {
            this.audio.currentTime = 0;
        });
        
        // 处理加载错误
        this.audio.addEventListener('error', (e) => {
            console.error('滴答声音频文件加载失败:', e);
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        
        // 如果关闭滴答声，立即停止当前播放的音频
        if (!this.enabled && this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        
        return this.enabled;
    }
    
    playTick() {
        if (!this.enabled || !this.isLoaded || !this.audio) return;
        
        try {
            // 重置播放位置到开头
            this.audio.currentTime = 0;
            // 播放音频
            const playPromise = this.audio.play();
            
            // 处理播放Promise（现代浏览器要求）
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // 自动播放被阻止或其他播放错误
                    console.warn('滴答声播放失败:', error);
                });
            }
        } catch (error) {
            console.warn('滴答声播放异常:', error);
        }
    }
    
    // 设置音量（0.0 到 1.0）
    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }
}
