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
        this.bgmPlayerManager = new BGMPlayerManager(this.tickSoundManager, this.quoteManager); // 传递滴答声管理器和谚语管理器
        this.achievementSystem = new AchievementSystem();
        this.forestSystem = new ForestSystem(this.achievementSystem);
        
        // 先创建一个占位的番茄钟（不传 dailyStories）
        this.pomodoroTimer = new PomodoroTimer(clockManager, this.achievementSystem, this.forestSystem, null);
        
        this.picsumManager = new PicsumManager(this.backgroundManager, this.settingsStorage);
        
        // 设置时钟管理器的滴答声引用
        clockManager.setTickSoundManager(this.tickSoundManager);
        
        // 设置动画管理器的 BGM 播放器引用，用于音乐可视化
        this.animationManager.setBGMPlayer(this.bgmPlayerManager);
        
        this.initializeControls();
        this.initializeColorPanel();
        this.initializeImageInput();
        this.initializeBackgroundPanel();
        this.initializePicsumControls();
        this.initializeDateDisplay();
        this.initializeBGMPlayer();
        
        // 延迟设置 dailyStories 引用
        this.initializeIntegratedSystems();
        
        // 最后加载保存的设置（这会更新状态显示）
        this.loadSavedSettings();

        // 初始化云端同步监听
        this._initCloudSync();
    }
    
    // 初始化集成系统（设置 dailyStories 引用）
    initializeIntegratedSystems() {
        // 等待 dailyStoriesManager 创建完成
        setTimeout(() => {
            if (window.dailyStoriesManager) {
                console.log('✅ 设置系统引用...');
                
                // 设置番茄钟的 dailyStories 引用
                this.pomodoroTimer.dailyStories = window.dailyStoriesManager;
                console.log('✅ 番茄钟→故事系统引用已设置');
                
                // 设置 dailyStories 的系统引用
                if (window.dailyStoriesManager.setSystemReferences) {
                    window.dailyStoriesManager.setSystemReferences(
                        this.achievementSystem,
                        this.forestSystem,
                        this.pomodoroTimer
                    );
                    console.log('✅ 故事系统引用已设置');
                } else {
                    console.warn('⚠️ dailyStories.setSystemReferences 方法不存在');
                }
            } else {
                console.error('❌ dailyStoriesManager 未初始化');
            }
        }, 500);
    }

    initializeDateDisplay() {
        // 延迟执行以确保DOM完全加载
        setTimeout(() => {
            this.updateDate();
            // 每分钟更新一次日期（因为日期可能在午夜改变）
            setInterval(() => this.updateDate(), 60000);
        }, 100);
        
        // 同时也立即执行一次
        this.updateDate();
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
        
        const dateElement = document.getElementById('dateText');
        const weekElement = document.getElementById('weekText');
                
        if (dateElement) {
            dateElement.textContent = dateText;
            dateElement.style.display = 'block';
            dateElement.style.visibility = 'visible';
            dateElement.style.opacity = '1';
        }
        
        if (weekElement) {
            weekElement.textContent = weekText;
            weekElement.style.display = 'block';
            weekElement.style.visibility = 'visible';
            weekElement.style.opacity = '1';
        }
    }

    initializeControls() {
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsPanel = document.getElementById('settingsPanel');
        const backgroundBtn = document.getElementById('backgroundBtn');
        const animationBtn = document.getElementById('animationBtn');
        const tickSoundBtn = document.getElementById('tickSoundBtn');

        // 设置按钮切换
        settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsToggle.classList.toggle('active');
            settingsPanel.classList.toggle('active');
            // 关闭番茄钟面板和背景面板
            const pomodoroPanel = document.getElementById('pomodoroPanel');
            const backgroundPanel = document.getElementById('backgroundPanel');
            if (pomodoroPanel) {
                pomodoroPanel.classList.remove('active');
            }
            if (backgroundPanel) {
                backgroundPanel.classList.remove('active');
            }
        });

        // 设置面板关闭按钮
        const settingsPanelCloseBtn = document.getElementById('settingsPanelCloseBtn');
        settingsPanelCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.remove('active');
            settingsToggle.classList.remove('active');
        });

        // 背景设置按钮
        if (backgroundBtn) {
            backgroundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const backgroundPanel = document.getElementById('backgroundPanel');
                if (backgroundPanel) {
                    backgroundPanel.classList.toggle('active');
                    // 关闭设置面板
                    settingsPanel.classList.remove('active');
                    settingsToggle.classList.remove('active');
                }
            });
        }

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

        // 点击其他地方关闭所有面板
        document.addEventListener('click', (e) => {
            const backgroundPanel = document.getElementById('backgroundPanel');
            
            if (!e.target.closest('.controls') && 
                !e.target.closest('.background-panel') && 
                !e.target.closest('.pomodoro-container')) {
                settingsPanel.classList.remove('active');
                settingsToggle.classList.remove('active');
                if (backgroundPanel) {
                    backgroundPanel.classList.remove('active');
                }
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

    initializeColorPanel() {
        // 废弃的旧方法，已整合到背景面板
    }

    initializeImageInput() {
        const imageInput = document.getElementById('imageInput');
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.backgroundManager.setImage(event.target.result);
                    // 清除当前的 Picsum 状态
                    this.picsumManager.currentPicsumId = null;
                    this.picsumManager.currentPicsumUrl = null;
                    this.picsumManager.updateFavoriteButton();
                    this.saveCurrentSettings();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    initializeBackgroundPanel() {
        const backgroundPanel = document.getElementById('backgroundPanel');
        const backgroundPanelCloseBtn = document.getElementById('backgroundPanelCloseBtn');
        
        // 关闭按钮
        if (backgroundPanelCloseBtn) {
            backgroundPanelCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                backgroundPanel.classList.remove('active');
            });
        }
        
        // 标签页切换
        const tabs = document.querySelectorAll('.background-tab');
        const contents = document.querySelectorAll('.background-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabName = tab.dataset.tab;
                
                // 移除所有活动状态
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // 添加当前活动状态
                tab.classList.add('active');
                const content = document.querySelector(`[data-content="${tabName}"]`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
        
        // 初始化各个标签页
        this.initializeColorTab();
        this.initializeUploadTab();
        this.initializeRandomTab();
    }
    
    initializeColorTab() {
        const colorItems = document.querySelectorAll('.color-item');
        
        colorItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = item.dataset.color;
                
                // 更新选中状态
                colorItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // 应用背景色
                this.backgroundManager.setColor(color);
                
                // 清除 Picsum 状态
                this.picsumManager.currentPicsumId = null;
                this.picsumManager.currentPicsumUrl = null;
                this.picsumManager.updateFavoriteButton();
                
                this.saveCurrentSettings();
                this.showNotification('已应用纯色背景 ✓');
            });
        });
    }
    
    initializeUploadTab() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        
        // 点击上传区域
        uploadArea.addEventListener('click', (e) => {
            e.stopPropagation();
            imageInput.click();
        });
        
        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.backgroundManager.setImage(event.target.result);
                        this.picsumManager.currentPicsumId = null;
                        this.picsumManager.currentPicsumUrl = null;
                        this.picsumManager.updateFavoriteButton();
                        this.saveCurrentSettings();
                        this.showNotification('已应用本地图片 ✓');
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }
    
    initializeRandomTab() {
        const randomLoadBtn = document.getElementById('randomLoadBtn');
        const randomFavoriteBtn = document.getElementById('randomFavoriteBtn');
        const favoritesGrid = document.getElementById('favoritesGrid');
        
        // 加载随机图片
        if (randomLoadBtn) {
            randomLoadBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    randomLoadBtn.classList.add('loading');
                    await this.picsumManager.loadRandomImage();
                    randomFavoriteBtn.disabled = false;
                    this.saveCurrentSettings();
                    this.showNotification('已加载随机图片 ✓');
                } catch (error) {
                    console.error('加载随机图片失败:', error);
                    this.showNotification('加载失败 ✗');
                } finally {
                    randomLoadBtn.classList.remove('loading');
                }
            });
        }
        
        // 收藏按钮
        if (randomFavoriteBtn) {
            randomFavoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.picsumManager.favoriteCurrentImage();
                this.updateFavoritesGrid();
            });
        }
        
        // 初始化收藏网格
        this.updateFavoritesGrid();
    }
    
    updateFavoritesGrid() {
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesCount = document.getElementById('favoritesCount');
        const randomFavoriteBtn = document.getElementById('randomFavoriteBtn');
        
        if (!favoritesGrid) return;
        
        const favorites = this.picsumManager.favorites;
        
        // 更新计数
        if (favoritesCount) {
            favoritesCount.textContent = favorites.length;
        }
        
        // 更新收藏按钮状态
        if (randomFavoriteBtn && this.picsumManager.currentPicsumId) {
            const isFavorited = this.picsumManager.isCurrentImageFavorited();
            if (isFavorited) {
                randomFavoriteBtn.classList.add('favorited');
            } else {
                randomFavoriteBtn.classList.remove('favorited');
            }
        }
        
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="no-favorites-placeholder">
                    <div class="placeholder-icon">📷</div>
                    <div class="placeholder-text">暂无收藏</div>
                </div>
            `;
            return;
        }
        
        // 渲染收藏项（最新的在前面）
        const sortedFavorites = [...favorites].reverse();
        favoritesGrid.innerHTML = sortedFavorites.map((fav, index) => {
            const originalIndex = favorites.length - 1 - index;
            return `
                <div class="favorite-item" style="background-image: url('${fav.url}');" data-index="${originalIndex}">
                    <div class="favorite-item-actions">
                        <button class="favorite-item-btn use">✓</button>
                        <button class="favorite-item-btn delete">✕</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定事件
        favoritesGrid.querySelectorAll('.favorite-item').forEach(item => {
            const index = parseInt(item.dataset.index);
            
            // 应用按钮
            const useBtn = item.querySelector('.use');
            if (useBtn) {
                useBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.picsumManager.useFavoriteImage(index);
                    this.saveCurrentSettings();
                    this.showNotification('已应用收藏图片 ✓');
                    if (randomFavoriteBtn) {
                        randomFavoriteBtn.disabled = false;
                        randomFavoriteBtn.classList.add('favorited');
                    }
                });
            }
            
            // 删除按钮
            const deleteBtn = item.querySelector('.delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.picsumManager.deleteFavorite(index);
                    this.updateFavoritesGrid();
                    this.showNotification('已删除收藏 ✓');
                });
            }
        });
    }
    
    showNotification(message) {
        // 移除旧的通知
        const oldNotification = document.querySelector('.background-notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'background-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    initializePicsumControls() {
        // 废弃的旧方法，已整合到背景面板
        // 检查当前背景是否是 Picsum 图片
        this.picsumManager.checkCurrentBackground();
    }

    initializeBGMPlayer() {
        // 音乐播放器模态框
        const musicBtn = document.getElementById('musicBtn');
        const musicModal = document.getElementById('musicModal');
        const musicModalClose = document.getElementById('musicModalClose');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const loopBtn = document.getElementById('loopBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        const progressContainer = document.getElementById('progressContainer');
        const musicFavoriteBtn = document.getElementById('musicFavoriteBtn');
        
        // 打开模态框
        if (musicBtn) {
            musicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                musicModal.style.display = 'flex';
                // 延迟添加 show 类以触发动画
                setTimeout(() => {
                    musicModal.classList.add('show');
                }, 10);
                
                // 根据播放状态添加 class
                if (this.bgmPlayerManager.isPlaying) {
                    musicModal.classList.add('playing');
                }
            });
        }
        
        // 关闭模态框
        if (musicModalClose) {
            musicModalClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeMusicModal();
            });
        }
        
        // 点击背景关闭
        if (musicModal) {
            musicModal.addEventListener('click', (e) => {
                if (e.target === musicModal) {
                    this.closeMusicModal();
                }
            });
        }
        
        // 标签页切换
        const musicTabs = document.querySelectorAll('.music-tab');
        musicTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabName = tab.dataset.tab;
                
                // 切换激活状态
                musicTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 切换内容
                if (tabName === 'favorites') {
                    this.bgmPlayerManager.showingFavorites = true;
                    this.bgmPlayerManager.showFavoritesList();
                } else {
                    this.bgmPlayerManager.showingFavorites = false;
                    this.bgmPlayerManager.renderMusicList();
                }
            });
        });
        
        // 绑定浮动播放器的控制按钮
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.bgmPlayerManager.togglePlay();
                this.saveCurrentSettings();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.bgmPlayerManager.playPrevious();
                this.saveCurrentSettings();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.bgmPlayerManager.playNext();
                this.saveCurrentSettings();
            });
        }
        
        if (loopBtn) {
            loopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.bgmPlayerManager.toggleLoop();
                this.saveCurrentSettings();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                this.bgmPlayerManager.setVolume(volume);
                if (volumeValue) {
                    volumeValue.textContent = volume + '%';
                }
                this.saveCurrentSettings();
            });
        }
        
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = progressContainer.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                this.bgmPlayerManager.setProgress(percent);
            });
        }
        
        // 收藏按钮
        if (musicFavoriteBtn) {
            musicFavoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isFavorited = this.bgmPlayerManager.favoriteCurrentTrack();
                
                // 显示提示信息
                if (isFavorited) {
                    this.showNotification('❤️ 已收藏', 'success');
                } else {
                    this.showNotification('💔 已取消收藏', 'info');
                }
            });
        }
        
        // 监听音乐播放状态变化，更新唱片旋转动画
        window.addEventListener('musicPlayStateChanged', () => {
            if (musicModal) {
                if (this.bgmPlayerManager.isPlaying) {
                    musicModal.classList.add('playing');
                } else {
                    musicModal.classList.remove('playing');
                }
            }
        });
        
        // 监听音乐切换事件，更新收藏按钮和收藏数量显示
        window.addEventListener('musicTrackChanged', () => {
            this.bgmPlayerManager.updateFavoriteButton();
            this.updateFavoritesCount();
        });
        
        // 监听音乐列表更新事件，更新收藏数量显示
        window.addEventListener('musicListUpdated', () => {
            this.updateFavoritesCount();
        });
        
        // 初始加载音乐列表
        this.loadJamendoMusicForFloatingPlayer();
    }
    
    // 关闭音乐模态框
    closeMusicModal() {
        const musicModal = document.getElementById('musicModal');
        if (musicModal) {
            musicModal.classList.remove('show');
            setTimeout(() => {
                musicModal.style.display = 'none';
            }, 300);
        }
    }
    
    // 更新收藏数量显示
    updateFavoritesCount() {
        const favoritesCountBadge = document.getElementById('favoritesCountBadge');
        if (favoritesCountBadge) {
            const count = this.bgmPlayerManager.getFavoritesCount();
            favoritesCountBadge.textContent = count;
        }
    }
    
    // 显示通知消息
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(30, 30, 35, 0.95);
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
            font-size: 14px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // 为浮动播放器加载音乐
    async loadJamendoMusicForFloatingPlayer() {
        try {
            // 使用 BGM 标签组合加载音乐
            await this.bgmPlayerManager.loadJamendoMusic({
                tags: 'ambient',  // 使用组合标签
                limit: 20
            });
            
        } catch (error) {
            console.error('❌ 加载浮动播放器音乐失败:', error);
        }
    }
    
    // 初始化云端同步
    _initCloudSync() {
        if (!window.cloudSync) return;

        // 监听登录状态变化
        window.cloudSync.onChange((isLoggedIn) => {
            if (isLoggedIn) {
                // 登录后触发同步
                console.log('[App] 检测到登录，开始同步...');
                this._syncFromCloud();
            }
        });

        // 如果已登录，立即同步
        if (window.cloudSync.isLoggedIn) {
            this._syncFromCloud();
        }
    }

    // 从云端同步数据
    async _syncFromCloud() {
        if (!window.syncAdapter) return;

        const result = await window.syncAdapter.syncAfterLogin();
        if (result && result.success) {
            // 刷新设置
            this.loadSavedSettings();

            // 刷新故事
            if (window.dailyStoriesManager) {
                try {
                    await window.dailyStoriesManager._loadFromCloud();
                } catch (e) {}
            }

            // 刷新森林（如果已初始化）
            if (this.forestSystem && this.forestSystem.updateUI) {
                try { this.forestSystem.updateUI(); } catch (e) {}
            }
        }
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
            // 恢复 Picsum 状态
            if (settings.picsumId && settings.picsumUrl) {
                this.picsumManager.currentPicsumId = settings.picsumId;
                this.picsumManager.currentPicsumUrl = settings.picsumUrl;
                this.picsumManager.updateFavoriteButton();
            } else {
                // 检查是否是 Picsum 图片
                this.picsumManager.checkCurrentBackground();
            }
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
        
        // 触发智能颜色调整
        if (window.smartColorManager) {
            setTimeout(() => window.smartColorManager.refresh(), 300);
        }
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
            bgmPlayer: this.bgmPlayerManager.getSettings(),
            picsumId: this.picsumManager.currentPicsumId,
            picsumUrl: this.picsumManager.currentPicsumUrl
        };
        
        this.settingsStorage.save(settings);
        
        // 推送到云端
        if (window.syncAdapter && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('flipClockSettings');
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // 确保日期显示被更新
    setTimeout(() => {
        if (window.app && window.app.updateDate) {
            window.app.updateDate();
        }
    }, 500);
});
