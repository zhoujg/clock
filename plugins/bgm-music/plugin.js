/**
 * 音乐播放器插件
 * 提供 Jamendo 在线音乐播放、收藏、云端同步功能
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'bgm-music';

    const MUSIC_MODAL_HTML = `
<div class="music-modal" id="musicModal">
    <div class="music-modal-content">
        <div class="music-modal-header">
            <h1 class="music-modal-title">
                <span class="title-icon">🎵</span>
                音乐播放器
            </h1>
            <button class="music-modal-close" id="musicModalClose">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
        <div class="music-modal-current">
            <div class="current-track-cover">
                <div class="vinyl-record" id="vinylRecord">
                    <div class="vinyl-center"></div>
                </div>
            </div>
            <div class="current-track-info">
                <div class="current-track-name" id="currentTrackName">未播放</div>
                <div class="current-artist" id="currentArtist" style="display: none;"></div>
            </div>
        </div>
        <div class="music-modal-progress">
            <span class="time-current" id="currentTime">0:00</span>
            <div class="progress-container" id="progressContainer">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <span class="time-duration" id="duration">0:00</span>
        </div>
        <div class="music-modal-controls">
            <button class="control-btn-large" id="musicFavoriteBtn" title="收藏">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
            <button class="control-btn-large" id="prevBtn" title="上一曲">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
            </button>
            <button class="control-btn-xlarge play-pause" id="playPauseBtn" title="播放/暂停">
                <svg class="play-icon" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg class="pause-icon" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
            </button>
            <button class="control-btn-large" id="nextBtn" title="下一曲">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
            </button>
            <button class="control-btn-large" id="loopBtn" title="循环">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                </svg>
            </button>
        </div>
        <div class="music-modal-volume">
            <span class="volume-icon">🔊</span>
            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="50" />
            <span class="volume-value" id="volumeValue">50%</span>
        </div>
        <div class="music-modal-tabs">
            <button class="music-tab active" data-tab="playlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
                播放列表
            </button>
            <button class="music-tab" data-tab="favorites">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                我的收藏
                <span class="favorites-count-badge" id="favoritesCountBadge">0</span>
            </button>
        </div>
        <div class="music-modal-list" id="musicListContainer">
            <div class="no-music">加载中...</div>
        </div>
    </div>
</div>`;

    const MUSIC_BTN_HTML = '<button id="musicBtn" class="bottom-tool-btn" title="音乐播放器"><span class="tool-btn-icon">🎵</span><span class="tool-btn-label">音乐</span></button>';

    let _modalEl = null;
    let _btnEl = null;
    let _manager = null;
    let _cssInjected = false;
    let _eventCleanups = [];

    // ============ 工具方法 ============

    function _getApp() {
        return window.app;
    }

    function _getAnimationAPI() {
        if (window.ParticleLinesAPI && typeof window.ParticleLinesAPI.setBGMPlayer === 'function') {
            return window.ParticleLinesAPI;
        }
        return null;
    }

    function _saveSettings() {
        const app = _getApp();
        if (app && typeof app.saveCurrentSettings === 'function') {
            app.saveCurrentSettings();
        }
    }

    function _showNotification(msg, type) {
        const app = _getApp();
        if (app && typeof app.showNotification === 'function') {
            app.showNotification(msg, type);
        }
    }

    // ============ CSS 注入 ============

    function _injectCSS() {
        if (_cssInjected || document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) {
            _cssInjected = true;
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'plugins/bgm-music/style.css?v=20260618a';
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
        _cssInjected = true;
    }

    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
        _cssInjected = false;
    }

    // ============ 创建/销毁 UI ============

    function _createUI() {
        // 创建按钮
        if (!document.getElementById('musicBtn')) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                const temp = document.createElement('div');
                temp.innerHTML = MUSIC_BTN_HTML.trim();
                _btnEl = temp.firstChild;
                // 插入到番茄钟之后
                const pomodoroBtn = document.getElementById('pomodoroToggle');
                if (pomodoroBtn && pomodoroBtn.nextSibling) {
                    toolbar.insertBefore(_btnEl, pomodoroBtn.nextSibling);
                } else {
                    toolbar.appendChild(_btnEl);
                }
            }
        } else {
            _btnEl = document.getElementById('musicBtn');
        }

        // 创建模态框
        if (!document.getElementById('musicModal')) {
            const temp = document.createElement('div');
            temp.innerHTML = MUSIC_MODAL_HTML.trim();
            _modalEl = temp.firstChild;
            document.body.appendChild(_modalEl);
        } else {
            _modalEl = document.getElementById('musicModal');
            _modalEl.style.display = 'none';
            _modalEl.classList.remove('show');
        }
    }

    function _removeUI() {
        if (_modalEl) {
            _modalEl.remove();
            _modalEl = null;
        }
        if (_btnEl) {
            _btnEl.remove();
            _btnEl = null;
        }
        // 清理事件
        _eventCleanups.forEach(fn => { try { fn(); } catch(e) {} });
        _eventCleanups = [];
    }

    // ============ 事件绑定（从 app.js initializeBGMPlayer 迁移） ============

    function _wireEvents() {
        const app = _getApp();
        const mgr = _manager;

        // 打开模态框
        if (_btnEl) {
            _btnEl.addEventListener('click', (e) => {
                e.stopPropagation();
                _modalEl.style.display = 'flex';
                setTimeout(() => _modalEl.classList.add('show'), 10);
                if (mgr && mgr.isPlaying) {
                    _modalEl.classList.add('playing');
                }
            });
        }

        // 关闭模态框
        const closeBtn = document.getElementById('musicModalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _closeModal();
            });
        }

        // 点击背景关闭
        if (_modalEl) {
            _modalEl.addEventListener('click', (e) => {
                if (e.target === _modalEl) _closeModal();
            });
        }

        // 标签页切换
        document.querySelectorAll('.music-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.music-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.dataset.tab === 'favorites') {
                    mgr.showingFavorites = true;
                    mgr.showFavoritesList();
                } else {
                    mgr.showingFavorites = false;
                    mgr.renderMusicList();
                }
            });
        });

        // 播放控制按钮
        ['playPauseBtn', 'prevBtn', 'nextBtn', 'loopBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (id === 'playPauseBtn') mgr.togglePlay();
                else if (id === 'prevBtn') mgr.playPrevious();
                else if (id === 'nextBtn') mgr.playNext();
                else if (id === 'loopBtn') mgr.toggleLoop();
                _saveSettings();
            });
        });

        // 音量
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value);
                mgr.setVolume(vol);
                if (volumeValue) volumeValue.textContent = vol + '%';
                _saveSettings();
            });
        }

        // 进度条
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = progressContainer.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                mgr.setProgress(percent);
            });
        }

        // 收藏按钮
        const favBtn = document.getElementById('musicFavoriteBtn');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isFav = mgr.favoriteCurrentTrack();
                _showNotification(isFav ? '❤️ 已收藏' : '💔 已取消收藏', isFav ? 'success' : 'info');
            });
        }

        // 音乐播放状态变化 → 唱片旋转
        const onPlayState = () => {
            if (_modalEl) {
                _modalEl.classList.toggle('playing', !!(mgr && mgr.isPlaying));
            }
        };
        window.addEventListener('musicPlayStateChanged', onPlayState);
        _eventCleanups.push(() => window.removeEventListener('musicPlayStateChanged', onPlayState));

        // 曲目切换 → 更新收藏按钮
        const onTrackChange = () => {
            if (mgr) mgr.updateFavoriteButton();
            _updateFavCount();
        };
        window.addEventListener('musicTrackChanged', onTrackChange);
        _eventCleanups.push(() => window.removeEventListener('musicTrackChanged', onTrackChange));

        // 列表更新 → 更新收藏计数
        const onListUpdate = () => _updateFavCount();
        window.addEventListener('musicListUpdated', onListUpdate);
        _eventCleanups.push(() => window.removeEventListener('musicListUpdated', onListUpdate));
    }

    function _updateFavCount() {
        const badge = document.getElementById('favoritesCountBadge');
        if (badge && _manager) {
            badge.textContent = _manager.getFavoritesCount();
        }
    }

    // ============ 关闭模态框 ============

    function _closeModal() {
        if (_modalEl) {
            _modalEl.classList.remove('show');
            setTimeout(() => {
                if (_modalEl) _modalEl.style.display = 'none';
            }, 300);
        }
    }

    // ============ 设置恢复 ============

    function _restoreSettings() {
        if (!_manager) return;
        try {
            const raw = localStorage.getItem('flipClockSettings');
            if (!raw) return;
            const settings = JSON.parse(raw);
            if (settings.bgmPlayer) {
                _manager.restoreSettings(settings.bgmPlayer);
            }
        } catch (e) {
            console.warn('[音乐播放器] 恢复设置失败:', e);
        }
    }

    // ============ 生命周期 ============

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '音乐播放器',
        version: '1.0.0',
        description: 'Jamendo 在线音乐播放器，支持播放/暂停/收藏/云端同步。',
        icon: '🎵',
        author: '时钟应用',
        css: 'plugins/bgm-music/style.css',

        onInstall: async function () {
            console.log('[音乐播放器] 首次安装');
        },

        onActivate: async function () {
            console.log('[音乐播放器] 🔄 激活中...');

            // 1. 注入 CSS
            _injectCSS();
            console.log('[音乐播放器] CSS 已注入');

            // 2. 创建 UI
            _createUI();
            console.log('[音乐播放器] UI 已创建');

            // 3. 初始化 BGMPlayerManager（如果尚未创建）
            const app = _getApp();
            if (!_manager) {
                const tickMgr = app ? app.tickSoundManager : null;
                const quoteMgr = app ? app.quoteManager : null;
                if (typeof BGMPlayerManager !== 'undefined') {
                    _manager = new BGMPlayerManager(tickMgr, quoteMgr);
                    console.log('[音乐播放器] BGMPlayerManager 已创建');
                } else {
                    console.error('[音乐播放器] ❌ BGMPlayerManager 未定义，请确保 bgmPlayer.js 已加载');
                    return;
                }
            }

            // 4. 设置 app 引用
            if (app) {
                app.bgmPlayerManager = _manager;
            }

            // 5. 设置动画引用
            const animAPI = _getAnimationAPI();
            if (animAPI && typeof animAPI.setBGMPlayer === 'function') {
                animAPI.setBGMPlayer(_manager);
            }

            // 6. 绑定事件
            _wireEvents();
            console.log('[音乐播放器] 事件已绑定');

            // 7. 恢复设置
            _restoreSettings();

            // 8. 加载音乐列表
            try {
                await _manager.loadJamendoMusic({ tags: 'ambient', limit: 20 });
                console.log('[音乐播放器] 音乐列表已加载');
            } catch (e) {
                console.warn('[音乐播放器] 加载音乐列表失败:', e);
            }

            // 9. 更新收藏计数
            _updateFavCount();

            console.log('[音乐播放器] ✅ 已激活');
        },

        onDeactivate: async function () {
            console.log('[音乐播放器] ⏹ 停用中...');

            // 停止播放
            if (_manager) {
                try { _manager.stop(); } catch(e) {}
                _manager = null;
            }

            // 清理 app 引用
            const app = _getApp();
            if (app) app.bgmPlayerManager = null;

            // 清理动画引用
            const animMgr = _getAnimationAPI();
            if (animMgr && typeof animMgr.setBGMPlayer === 'function') {
                animMgr.setBGMPlayer(null);
            }

            // 移除 UI
            _removeUI();

            console.log('[音乐播放器] ⏹ 已停用');
        },

        onUninstall: async function () {
            console.log('[音乐播放器] 卸载中...');

            if (_manager) {
                try { _manager.stop(); } catch(e) {}
                _manager = null;
            }

            const app = _getApp();
            if (app) app.bgmPlayerManager = null;

            const animMgr = _getAnimationAPI();
            if (animMgr && typeof animMgr.setBGMPlayer === 'function') {
                animMgr.setBGMPlayer(null);
            }

            _removeUI();
            _removeCSS();

            console.log('[音乐播放器] 已卸载');
        }
    });
})();
