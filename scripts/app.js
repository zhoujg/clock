// 时钟管理器
class ClockManager {
    constructor() {
        this.tickInstance = null;
        this.isPomodoroMode = false;
        this.normalClockInterval = null;
        this.tickSoundManager = null; // 将在app初始化时设置
    }
    
    // 设置滴答声管理器引用
    setTickSoundManager(tickSoundManager) {
        this.tickSoundManager = tickSoundManager;
    }
    
    // 初始化正常时钟
    initNormalClock(tick) {
        this.tickInstance = tick;
        this.startNormalClock();
    }
    
    // 启动正常时钟
    startNormalClock() {
        if (!this.tickInstance) return;
        
        // 清除之前的计时器
        if (this.normalClockInterval) {
            clearInterval(this.normalClockInterval);
        }
        
        this.isPomodoroMode = false;
        this.normalClockInterval = setInterval(() => {
            if (this.isPomodoroMode) return;
            var d = Tick.helper.date();
            this.tickInstance.value = {
                hours: d.getHours(),
                minutes: d.getMinutes(),
                seconds: d.getSeconds()
            };
            
            // 播放滴答声
            if (this.tickSoundManager) {
                this.tickSoundManager.playTick();
            }
        }, 1000);
    }
    
    // 更新番茄钟显示
    updatePomodoroDisplay(minutes, seconds) {
        if (!this.tickInstance) return;
        
        this.isPomodoroMode = true;
        this.tickInstance.value = {
            hours: 0,
            minutes: minutes,
            seconds: seconds
        };
        
        // 番茄钟模式也播放滴答声
        if (this.tickSoundManager) {
            this.tickSoundManager.playTick();
        }
    }
    
    // 切换到正常时钟模式
    switchToNormalMode() {
        this.isPomodoroMode = false;
        this.startNormalClock();
    }
}

// 全局时钟管理器实例
const clockManager = new ClockManager();

// 时钟初始化函数
function handleTickInit(tick) {
    clockManager.initNormalClock(tick);
}

// 应用主控制器
class App {
    constructor() {
        this.settingsStorage = new SettingsStorage();
        this.backgroundManager = new BackgroundManager();
        this.animationManager = new AnimationManager('animationCanvas');
        this.quoteManager = new QuoteManager();
        this.tickSoundManager = new TickSoundManager();
        this.bgmPlayerManager = new BGMPlayerManager(this.tickSoundManager); // 传递滴答声管理器
        this.achievementSystem = new AchievementSystem();
        this.forestSystem = new ForestSystem(this.achievementSystem);
        this.pomodoroTimer = new PomodoroTimer(clockManager, this.achievementSystem, this.forestSystem);
        
        // 设置时钟管理器的滴答声引用
        clockManager.setTickSoundManager(this.tickSoundManager);
        
        // 设置动画管理器的 BGM 播放器引用，用于音乐可视化
        this.animationManager.setBGMPlayer(this.bgmPlayerManager);
        
        this.initializeControls();
        this.initializeColorPanel();
        this.initializeImageInput();
        this.initializeDateDisplay();
        this.initializeBGMPlayer();
        
        // 监听音乐列表更新事件
        window.addEventListener('musicListUpdated', () => {
            if (document.getElementById('musicPanel').classList.contains('active')) {
                this.renderMusicPanelList();
            }
        });
        
        // 监听音乐曲目更改事件
        window.addEventListener('musicTrackChanged', () => {
            if (document.getElementById('musicPanel').classList.contains('active')) {
                this.renderMusicPanelList();
            }
        });
        
        // 监听音乐播放状态改变事件
        window.addEventListener('musicPlayStateChanged', () => {
            if (document.getElementById('musicPanel').classList.contains('active')) {
                this.updateMusicControlButtons();
            }
        });
        
        // 最后加载保存的设置（这会更新状态显示）
        this.loadSavedSettings();
    }

    initializeDateDisplay() {
        this.updateDate();
        // 每分钟更新一次日期（因为日期可能在午夜改变）
        setInterval(() => this.updateDate(), 60000);
    }

    updateDate() {
        const now = new Date();
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const weekDay = weekDays[now.getDay()];
        
        const dateText = `${year}年${month}月${date}日`;
        const weekText = weekDay;
        
        document.getElementById('dateText').textContent = dateText;
        document.getElementById('weekText').textContent = weekText;
    }

    initializeControls() {
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsPanel = document.getElementById('settingsPanel');
        const musicBtn = document.getElementById('musicBtn');
        const musicPanel = document.getElementById('musicPanel');
        const bgColorBtn = document.getElementById('bgColorBtn');
        const animationBtn = document.getElementById('animationBtn');
        const tickSoundBtn = document.getElementById('tickSoundBtn');
        const imageBtn = document.getElementById('imageBtn');

        // 设置按钮切换
        settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsToggle.classList.toggle('active');
            settingsPanel.classList.toggle('active');
            // 关闭其他面板
            musicPanel.classList.remove('active');
            musicBtn.classList.remove('active');
            // 关闭番茄钟面板
            const pomodoroPanel = document.getElementById('pomodoroPanel');
            if (pomodoroPanel) {
                pomodoroPanel.classList.remove('active');
            }
        });

        // 设置面板关闭按钮
        const settingsPanelCloseBtn = document.getElementById('settingsPanelCloseBtn');
        settingsPanelCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.remove('active');
            settingsToggle.classList.remove('active');
        });

        // 音乐按钮切换
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            musicBtn.classList.toggle('active');
            musicPanel.classList.toggle('active');
            // 关闭其他面板
            settingsPanel.classList.remove('active');
            settingsToggle.classList.remove('active');
            // 关闭番茄钟面板
            const pomodoroPanel = document.getElementById('pomodoroPanel');
            if (pomodoroPanel) {
                pomodoroPanel.classList.remove('active');
            }
            // 渲染音乐列表到面板
            this.renderMusicPanelList();
            // 更新控制按钮状态
            this.updateMusicControlButtons();
        });

        // 音乐面板关闭按钮
        const musicPanelCloseBtn = document.getElementById('musicPanelCloseBtn');
        musicPanelCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            musicPanel.classList.remove('active');
            musicBtn.classList.remove('active');
        });

        // 音乐控制按钮
        const musicPlayPauseBtn = document.getElementById('musicPlayPauseBtn');
        const musicStopBtn = document.getElementById('musicStopBtn');
        const musicPrevBtn = document.getElementById('musicPrevBtn');
        const musicNextBtn = document.getElementById('musicNextBtn');

        // 播放/暂停按钮
        musicPlayPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.bgmPlayerManager.togglePlay();
            this.updateMusicControlButtons();
            this.saveCurrentSettings();
        });

        // 停止按钮
        musicStopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.bgmPlayerManager.stop();
            this.updateMusicControlButtons();
            this.renderMusicPanelList(); // 更新曲目显示
            this.saveCurrentSettings();
        });

        // 上一曲按钮
        musicPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.bgmPlayerManager.playPrevious();
            this.renderMusicPanelList();
            this.updateMusicControlButtons();
            this.saveCurrentSettings();
        });

        // 下一曲按钮
        musicNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.bgmPlayerManager.playNext();
            this.renderMusicPanelList();
            this.updateMusicControlButtons();
            this.saveCurrentSettings();
        });

        // 阻止设置面板内点击冒泡
        settingsPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 阻止音乐面板内点击冒泡
        musicPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 背景色按钮
        bgColorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const colorPanel = document.getElementById('colorPanel');
            colorPanel.classList.toggle('active');
        });

        // 动画线条按钮
        animationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.animationManager.toggle();
            this.updateAnimationStatus();
            this.saveCurrentSettings();
        });

        // 滴答声音按钮
        tickSoundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tickSoundManager.toggle();
            this.updateTickSoundStatus();
            this.saveCurrentSettings();
        });

        // 背景图片按钮
        imageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('imageInput').click();
        });

        // 点击其他地方关闭所有面板
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.controls') && !e.target.closest('.color-panel') && !e.target.closest('.pomodoro-container')) {
                settingsPanel.classList.remove('active');
                settingsToggle.classList.remove('active');
                musicPanel.classList.remove('active');
                musicBtn.classList.remove('active');
                document.getElementById('colorPanel').classList.remove('active');
            }
        });
    }

    updateAnimationStatus() {
        const statusElement = document.getElementById('animationStatus');
        if (statusElement) {
            if (this.animationManager.enabled) {
                statusElement.textContent = '开启';
                statusElement.classList.add('active');
            } else {
                statusElement.textContent = '关闭';
                statusElement.classList.remove('active');
            }
        }
    }

    updateTickSoundStatus() {
        const statusElement = document.getElementById('tickSoundStatus');
        if (statusElement) {
            if (this.tickSoundManager.enabled) {
                statusElement.textContent = '开启';
                statusElement.classList.add('active');
            } else {
                statusElement.textContent = '关闭';
                statusElement.classList.remove('active');
            }
        }
    }

    updateMusicControlButtons() {
        const playPauseBtn = document.getElementById('musicPlayPauseBtn');
        if (playPauseBtn) {
            if (this.bgmPlayerManager.isPlaying) {
                playPauseBtn.classList.add('playing');
            } else {
                playPauseBtn.classList.remove('playing');
            }
        }
    }

    initializeColorPanel() {
        const colorOptions = document.querySelectorAll('.color-option');
        
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.getAttribute('data-color');
                this.backgroundManager.setColor(color);
                document.getElementById('colorPanel').classList.remove('active');
                this.saveCurrentSettings();
            });
        });
    }

    initializeImageInput() {
        const imageInput = document.getElementById('imageInput');
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.backgroundManager.setImage(event.target.result);
                    this.saveCurrentSettings();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    initializeBGMPlayer() {
        // BGM 播放器不再需要 UI 初始化
        // 音乐播放完全通过顶部音乐按钮和面板控制
    }

    // 渲染音乐面板列表
    renderMusicPanelList() {
        const musicPanelList = document.getElementById('musicPanelList');
        const musicPanelTrackName = document.getElementById('musicPanelTrackName');
        
        if (!musicPanelList) return;
        
        // 获取 BGM 播放器的音乐列表
        const musicList = this.bgmPlayerManager.musicList;
        const currentTrackIndex = this.bgmPlayerManager.currentTrackIndex;
        
        if (musicList.length === 0) {
            musicPanelList.innerHTML = '<div class="no-music">暂无音乐文件</div>';
            return;
        }
        
        // 更新当前播放的音乐名称
        if (currentTrackIndex >= 0 && currentTrackIndex < musicList.length) {
            musicPanelTrackName.textContent = '♪ ' + musicList[currentTrackIndex].name;
        } else {
            musicPanelTrackName.textContent = '未播放';
        }
        
        // 渲染音乐列表
        musicPanelList.innerHTML = '';
        musicList.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'music-panel-track';
            if (index === currentTrackIndex) {
                trackElement.classList.add('active');
            }
            
            trackElement.innerHTML = `
                <span class="track-icon">♪</span>
                <span class="track-name">${track.name}</span>
            `;
            
            trackElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.bgmPlayerManager.playTrack(index);
                this.renderMusicPanelList(); // 重新渲染以更新活动状态
                this.saveCurrentSettings();
            });
            
            musicPanelList.appendChild(trackElement);
        });
    }

    // 加载保存的设置
    loadSavedSettings() {
        const settings = this.settingsStorage.load();
        
        // 恢复背景色
        if (settings.backgroundColor) {
            this.backgroundManager.setColor(settings.backgroundColor);
        } else {
            // 如果没有保存的设置，使用默认背景色并更新翻转卡片颜色
            this.backgroundManager.updateFlipPanelColor(this.backgroundManager.currentBackground);
        }
        
        // 恢复背景图片
        if (settings.backgroundImage) {
            this.backgroundManager.setImage(settings.backgroundImage);
        }
        
        // 恢复动画状态
        if (settings.animationEnabled) {
            this.animationManager.toggle();
        }

        // 恢复滴答声状态
        if (settings.tickSoundEnabled) {
            this.tickSoundManager.toggle();
        }

        // 恢复BGM播放器设置
        if (settings.bgmPlayer) {
            this.bgmPlayerManager.restoreSettings(settings.bgmPlayer);
        }

        // 加载设置后更新状态显示
        this.updateAnimationStatus();
        this.updateTickSoundStatus();
    }

    // 保存当前设置
    saveCurrentSettings() {
        // 提取背景图片URL，排除CSS关键字'none'
        let backgroundImage = null;
        const bgImageStyle = document.body.style.backgroundImage;
        if (bgImageStyle && bgImageStyle !== 'none') {
            const match = bgImageStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match) {
                backgroundImage = match[1];
            }
        }
        
        const settings = {
            backgroundColor: this.backgroundManager.currentBackground,
            backgroundImage: backgroundImage,
            animationEnabled: this.animationManager.enabled,
            tickSoundEnabled: this.tickSoundManager.enabled,
            bgmPlayer: this.bgmPlayerManager.getSettings()
        };
        
        this.settingsStorage.save(settings);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
