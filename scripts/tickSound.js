// 滴答声管理器
class TickSoundManager {
    constructor() {
        this.enabled = false;
        this.audioContext = null;
        this.audioBuffer = null;
        this.isLoaded = false;
        this.volume = 0.3;

        // 不立即创建 AudioContext，等待首次用户交互
        // iOS Safari 要求 AudioContext 在用户手势后创建/恢复
        this._initOnUserGesture();
        this._loadAudioBuffer();
    }

    // 等待用户首次交互后创建 AudioContext
    _initOnUserGesture() {
        const createContext = () => {
            if (this.audioContext) return;
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // iOS Safari 下 AudioContext 初始为 suspended，需 resume
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            } catch (e) {
                console.warn('AudioContext 创建失败:', e);
            }
            // 创建成功后移除监听
            ['touchend', 'click', 'keydown'].forEach(evt => {
                document.removeEventListener(evt, createContext);
            });
        };

        ['touchend', 'click', 'keydown'].forEach(evt => {
            document.addEventListener(evt, createContext, { once: false });
        });
    }

    // 用 fetch + decodeAudioData 预解码音频
    async _loadAudioBuffer() {
        try {
            const response = await fetch('assets/slow-tick.mp3');
            if (!response.ok) {
                throw new Error('音频文件加载失败: ' + response.status);
            }
            const arrayBuffer = await response.arrayBuffer();

            // AudioContext 可能还未创建，先创建
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.warn('AudioContext 创建失败:', e);
                    return;
                }
            }

            // 确保 context 运行中
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // 解码音频
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.isLoaded = true;
            console.log('✅ 滴答声音频已预解码 (Web Audio API)');
        } catch (error) {
            console.error('❌ 滴答声音频加载/解码失败:', error);
        }
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    // 直接设置为指定状态（恢复设置时用）
    setEnabled(enabled) {
        if (this.enabled === !!enabled) return;
        this.enabled = !!enabled;

        // 确保 AudioContext 处于运行状态（iOS 需要在用户手势后恢复）
        if (this.enabled && this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn('AudioContext resume 失败:', e));
        }
    }

    playTick() {
        if (!this.enabled || !this.isLoaded || !this.audioContext || !this.audioBuffer) {
            return;
        }

        // iOS：确保 context 在运行状态（可能在后台被挂起）
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
            return; // 本次跳过，下一轮 context 恢复后再播放
        }

        try {
            // 创建音频源节点（一次性用完即丢弃，无状态累积）
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffer;

            // 创建增益节点控制音量
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.volume;

            // 连接：source -> gain -> destination
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // 立即播放（start(0) = 下一帧立即开始）
            source.start(0);

            // 播放结束后自动清理（无 ended 事件堆积问题）
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('滴答声播放异常:', error);
        }
    }

    // 设置音量（0.0 到 1.0）
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}
