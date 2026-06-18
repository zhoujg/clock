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
        this.quoteManager = new QuoteManager();
        this.tickSoundManager = new TickSoundManager();
        this.bgmPlayerManager = null; // 由音乐播放器插件管理生命周期
        
        this.pomodoroTimer = new PomodoroTimer(clockManager, null);
        
        this.picsumManager = new PicsumManager(this.backgroundManager, this.settingsStorage);
        
        // 设置时钟管理器的滴答声引用
        clockManager.setTickSoundManager(this.tickSoundManager);
        
        this.initializeControls();
        this.initializeColorPanel();
        this.initializeImageInput();
        this.initializeBackgroundPanel();
        this.initializePicsumControls();
        this.initializeDateDisplay();
        this._initPluginSystem();

        // 最后加载保存的设置（这会更新状态显示）
        this.loadSavedSettings();

        // 初始化云端同步监听
        this._initCloudSync();
    }
    
    // ============ 插件系统初始化 ============

    _initPluginSystem() {
        // 绑定插件库按钮（顶部工具栏）
        const pluginBtn = document.getElementById('pluginLibraryBtn');
        if (pluginBtn) {
            pluginBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.PluginLibraryUI) {
                    // 关闭设置面板
                    const settingsPanel = document.getElementById('settingsPanel');
                    const settingsToggle = document.getElementById('settingsToggle');
                    if (settingsPanel) settingsPanel.classList.remove('active');
                    if (settingsToggle) settingsToggle.classList.remove('active');
                    window.PluginLibraryUI.open();
                }
            });
        }

        // 监听插件激活事件（用于设置跨系统引用）
        window.addEventListener('plugin-activated', (e) => {
            const id = e.detail.id;
            if (id === 'daily-stories' && window.dailyStoriesManager) {
                this._wireDailyStoriesRefs();
            }
            if (id === 'bgm-music') {
                // 音乐插件激活后，尝试连接粒子动画
                setTimeout(() => {
                    if (window.ParticleLinesAPI && window.app && window.app.bgmPlayerManager) {
                        window.ParticleLinesAPI.setBGMPlayer(window.app.bgmPlayerManager);
                    }
                }, 300);
            }
        });

        // 监听插件停用事件
        window.addEventListener('plugin-deactivated', (e) => {
            // 可以在这里处理插件停用后的清理
        });

        // 初始化插件管理器（DOM 就绪后）
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.PluginManager.init();
            });
        } else {
            window.PluginManager.init();
        }
    }

    /**
     * 设置 dailyStories 与其他系统的引用
     */
    _wireDailyStoriesRefs() {
        if (!window.dailyStoriesManager) return;
        console.log('✅ 设置故事系统引用...');

        // 设置番茄钟的 dailyStories 引用
        if (this.pomodoroTimer) {
            this.pomodoroTimer.dailyStories = window.dailyStoriesManager;
            console.log('✅ 番茄钟→故事系统引用已设置');
        }

        // 设置 dailyStories 的系统引用
        if (window.dailyStoriesManager.setSystemReferences) {
            window.dailyStoriesManager.setSystemReferences(
                this.pomodoroTimer
            );
            console.log('✅ 故事系统引用已设置');
        }

        // 如果已登录，触发一次故事云端同步
        if (window.cloudSync && window.cloudSync.isLoggedIn) {
            if (window.dailyStoriesManager._loadFromCloud) {
                window.dailyStoriesManager._loadFromCloud().catch(e => {});
            }
        }
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

        // 长按日期弹出万年历
        this._initDateLongPress();
    }

    _initDateLongPress() {
        const dateEl = document.getElementById('dateText');
        if (!dateEl) return;

        let pressTimer = null;
        let startX = 0, startY = 0;
        const LONG_PRESS_MS = 500;
        const MOVE_THRESHOLD = 10;

        // 防止文本选择
        dateEl.style.userSelect = 'none';
        dateEl.style.webkitUserSelect = 'none';
        dateEl.style.cursor = 'pointer';

        const clearTimer = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        dateEl.addEventListener('pointerdown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            pressTimer = setTimeout(() => {
                // 检查万年历插件是否已安装且激活
                const pm = window.PluginManager;
                if (pm && pm.isInstalled('creative-calendar') && pm.isEnabled('creative-calendar')) {
                    // 触觉反馈
                    if (navigator.vibrate) {
                        navigator.vibrate(15);
                    }
                    // 打开万年历
                    if (window.__creativeCalendar && window.__creativeCalendar.show) {
                        window.__creativeCalendar.show();
                    }
                }
                pressTimer = null;
            }, LONG_PRESS_MS);
        });

        dateEl.addEventListener('pointermove', (e) => {
            if (!pressTimer) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
                clearTimer();
            }
        });

        dateEl.addEventListener('pointerup', clearTimer);
        dateEl.addEventListener('pointercancel', clearTimer);
        dateEl.addEventListener('pointerleave', clearTimer);

        // 防止长按弹出系统菜单（移动端）
        dateEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
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
                !e.target.closest('.pomodoro-container') &&
                !e.target.closest('.bottom-toolbar')) {
                settingsPanel.classList.remove('active');
                settingsToggle.classList.remove('active');
                if (backgroundPanel) {
                    backgroundPanel.classList.remove('active');
                }
            }
        });
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
            background: rgba(255, 255, 255, 0.92);
            color: #1d1d1f;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
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
                // 登录后触发全量同步
                console.log('[App] 检测到登录，开始同步...');
                this._syncFromCloud();
                // 启动定期轮询（每 30s 拉取其他设备的更新）
                if (window.syncAdapter) {
                    window.syncAdapter.startPeriodicSync(30000);
                }
            } else {
                // 登出后停止轮询
                if (window.syncAdapter) {
                    window.syncAdapter.stopPeriodicSync();
                }
            }
        });

        // 如果已登录，立即同步并启动轮询
        if (window.cloudSync.isLoggedIn) {
            this._syncFromCloud();
            if (window.syncAdapter) {
                window.syncAdapter.startPeriodicSync(30000);
            }
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
        
        // 恢复滴答声状态（直接设置，不 toggle）
        this.tickSoundManager.setEnabled(!!settings.tickSoundEnabled);

        // 恢复BGM播放器设置（由音乐插件管理）
        if (settings.bgmPlayer && this.bgmPlayerManager) {
            this.bgmPlayerManager.restoreSettings(settings.bgmPlayer);
        }

        // 加载设置后更新状态显示
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
            tickSoundEnabled: this.tickSoundManager.enabled,
            bgmPlayer: this.bgmPlayerManager ? this.bgmPlayerManager.getSettings() : null,
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
