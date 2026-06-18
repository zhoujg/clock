/**
 * PluginLibraryUI — 插件库界面
 *
 * 全屏 Modal，展示「已安装」和「插件市场」
 * 依赖：window.PluginManager
 */

const PluginLibraryUI = (() => {
    let _modal   = null;
    let _isOpen = false;

    /* ============ 打开 / 关闭 ============ */

    function open() {
        if (_isOpen) return;
        _ensureModal();
        _modal.classList.add('show');
        _isOpen = true;
        render();
    }

    function close() {
        if (!_isOpen || !_modal) return;
        _modal.classList.remove('show');
        setTimeout(() => { _isOpen = false; }, 300);
    }

    /* ============ 创建 Modal DOM ============ */

    function _ensureModal() {
        if (_modal) return;

        _modal = document.createElement('div');
        _modal.className = 'plugin-library-modal';
        _modal.id = 'pluginLibraryModal';
        _modal.innerHTML = `
            <div class="plugin-library-content">
                <!-- 头部 -->
                <div class="plugin-library-header">
                    <h1 class="plugin-library-title">
                        <span class="title-icon">🧩</span>
                        插件库
                    </h1>
                    <button class="plugin-library-close" id="pluginLibraryClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <!-- 标签页 -->
                <div class="plugin-library-tabs">
                    <button class="plugin-tab active" data-tab="installed">
                        📦 已安装
                    </button>
                    <button class="plugin-tab" data-tab="market">
                        🛒 插件市场
                    </button>
                </div>

                <!-- 内容区 -->
                <div class="plugin-library-body">
                    <!-- 已安装 -->
                    <div class="plugin-tab-content active" data-content="installed" id="pluginInstalledContent">
                        <div class="plugin-empty-hint" id="pluginInstalledEmpty">
                            暂无已安装插件，去看看插件市场吧
                        </div>
                        <div class="plugin-list" id="pluginInstalledList"></div>
                    </div>
                    <!-- 插件市场 -->
                    <div class="plugin-tab-content" data-content="market" id="pluginMarketContent">
                        <div class="plugin-loading-hint" id="pluginMarketLoading">
                            加载中...
                        </div>
                        <div class="plugin-list" id="pluginMarketList"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(_modal);

        // 关闭按钮
        _modal.querySelector('#pluginLibraryClose').addEventListener('click', close);

        // 点击背景关闭
        _modal.addEventListener('click', (e) => {
            if (e.target === _modal) close();
        });

        // 标签页切换
        _modal.querySelectorAll('.plugin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                _modal.querySelectorAll('.plugin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                _modal.querySelectorAll('.plugin-tab-content').forEach(c => c.classList.remove('active'));
                const content = _modal.querySelector(`[data-content="${tab.dataset.tab}"]`);
                if (content) content.classList.add('active');

                // 切换到市场 tab 时渲染市场数据
                if (tab.dataset.tab === 'market') _renderMarket();
            });
        });
    }

    /* ============ 渲染 ============ */

    let _renderTimer = null;
    function render() {
        clearTimeout(_renderTimer);
        _renderTimer = setTimeout(() => {
            _renderInstalled();
        }, 50);
    }

    function _renderInstalled() {
        const list   = document.getElementById('pluginInstalledList');
        const empty  = document.getElementById('pluginInstalledEmpty');
        if (!list) return;

        const pm      = window.PluginManager;
        const enabled = pm.getEnabledList();
        const allIds  = pm.getInstalledList();

        if (allIds.length === 0) {
            list.innerHTML = '';
            if (empty) empty.style.display = '';
            return;
        }
        if (empty) empty.style.display = 'none';

        list.innerHTML = allIds.map(id => {
            const plugin  = pm.getPlugin(id);
            const isOn   = pm.isEnabled(id);
            const name    = plugin ? plugin.name : id;
            const desc    = plugin ? plugin.description : '';
            const icon    = plugin ? plugin.icon : '🧩';
            const version = plugin ? plugin.version : '';

            return `
                <div class="plugin-card installed" data-id="${id}">
                    <div class="plugin-card-icon">${icon}</div>
                    <div class="plugin-card-info">
                        <div class="plugin-card-name">${name}</div>
                        <div class="plugin-card-desc">${desc}</div>
                        ${version ? `<div class="plugin-card-version">v${version}</div>` : ''}
                    </div>
                    <div class="plugin-card-actions">
                        <label class="plugin-toggle">
                            <input type="checkbox" ${isOn ? 'checked' : ''} data-action="toggle" data-id="${id}" />
                            <span class="plugin-toggle-slider"></span>
                        </label>
                        <button class="plugin-btn uninstall" data-action="uninstall" data-id="${id}">卸载</button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定事件
        list.querySelectorAll('[data-action="toggle"]').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (e.currentTarget.checked) {
                    await pm.activate(id);
                } else {
                    await pm.deactivate(id);
                }
                render();
            });
        });

        list.querySelectorAll('[data-action="uninstall"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (!confirm(`确定卸载「${pm.getPlugin(id)?.name || id}」？`)) return;
                await pm.uninstall(id);
                render();
            });
        });
    }

    /* ============ 插件注册表（内嵌，无需 fetch）============ */

    const _REGISTRY = {
        plugins: [
            {
                id: 'particle-lines',
                name: '粒子动画',
                version: '2.0.0',
                description: '极简数字流派艺术。内置秩序之息、虚空引力、生物脉冲、万向之门四套算法，搭载 HSL 全彩光谱和辉光拖尾特效。',
                icon: '✨',
                author: '时钟应用'
            },
            {
                id: 'daily-stories',
                name: '每日故事',
                version: '1.0.0',
                description: '番茄钟完成后记录三个小故事，培养感恩心态。支持按日期查看、周回顾。',
                icon: '📖',
                author: '周墨欣时钟'
            },
            {
                id: 'bgm-music',
                name: '音乐播放器',
                version: '1.0.0',
                description: 'Jamendo 在线音乐播放器，支持播放/暂停、收藏、音量调节、云端同步。',
                icon: '🎵',
                author: '时钟应用'
            },
            {
                id: 'english-daily',
                name: '英语每日单词',
                version: '1.0.0',
                description: '每天展示一个中考核心英语单词，包含音标、释义、例句，支持发音。',
                icon: '🔤',
                author: '周墨欣时钟'
            },
            {
                id: 'cantonese-daily',
                name: '粤语每日一句',
                version: '1.0.0',
                description: '每天展示一句实用粤语，包含汉字、粤拼、普通话翻译，支持发音。',
                icon: '🗣️',
                author: '周墨欣时钟'
            },
            {
                id: 'halftime',
                name: '此间半刻',
                version: '1.0.0',
                description: '极简点阵视觉语言，把一天、一周、一月、一年、一生重新呈现在眼前。内置生之钟·Life Progress。',
                icon: '⏳',
                author: '周墨欣时钟'
            }
        ]
    };

    /* ============ 加载插件市场 ============ */

    function _renderMarket() {
        const list = document.getElementById('pluginMarketList');
        const loading = document.getElementById('pluginMarketLoading');
        if (!list) return;

        if (loading) loading.style.display = 'none';

        const pm = window.PluginManager;
        list.innerHTML = (_REGISTRY.plugins || []).map(p => {
            const installed = pm.isInstalled(p.id);
            const enabled   = pm.isEnabled(p.id);
            return `
                <div class="plugin-card market" data-id="${p.id}">
                    <div class="plugin-card-icon">${p.icon || '🧩'}</div>
                    <div class="plugin-card-info">
                        <div class="plugin-card-name">${p.name}</div>
                        <div class="plugin-card-desc">${p.description || ''}</div>
                        <div class="plugin-card-meta">
                            <span>v${p.version || '1.0.0'}</span>
                            <span>作者: ${p.author || '未知'}</span>
                        </div>
                    </div>
                    <div class="plugin-card-actions">
                        ${
                            installed
                            ? (enabled
                                ? '<span class="plugin-status-label">已启用</span>'
                                : '<span class="plugin-status-label off">已停用</span>')
                            : `<button class="plugin-btn install" data-action="install" data-id="${p.id}">安装</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        // 安装按钮
        list.querySelectorAll('[data-action="install"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                try {
                    const ok = await pm.install(id);
                    if (ok) {
                        _renderMarket();
                        _renderInstalled();
                    } else {
                        alert('安装失败，请查看控制台');
                    }
                } catch (err) {
                    console.error('[PluginLibrary] 安装失败:', err);
                    alert(`安装失败: ${err.message || '未知错误'}`);
                }
            });
        });
    }

    /* ============ 公共接口 ============ */

    // 监听插件状态变化，自动刷新 UI
    window.addEventListener('plugin-state-changed', () => {
        if (_isOpen) render();
    });

    return { open, close };
})();

window.PluginLibraryUI = PluginLibraryUI;
