/**
 * 学习中心 — 统一卡片+Tab切换
 * 当多个学习类插件同时激活时，将它们的内容整合到一个统一卡片中
 */
(function () {
    'use strict';

    const TABS = [];
    let _hubEl = null;
    let _tabBar = null;
    let _contentArea = null;
    let _activeTabId = null;

    window.LearningHub = {
        registerTab(config) {
            const { id, label, icon, accentColor, render } = config;
            if (TABS.find(t => t.id === id)) return;

            TABS.push({ id, label, icon, accentColor, render });
            _ensureHub();
            _addTab(config);
            _updateTabBarVisibility();

            if (!_activeTabId) {
                _switchTab(id);
            }
        },

        unregisterTab(id) {
            const idx = TABS.findIndex(t => t.id === id);
            if (idx === -1) return;
            TABS.splice(idx, 1);
            _removeTab(id);
            _updateTabBarVisibility();

            if (TABS.length === 0 && _hubEl) {
                _hubEl.remove();
                _hubEl = null;
                _tabBar = null;
                _contentArea = null;
                _activeTabId = null;
            } else if (_activeTabId === id && TABS.length > 0) {
                _switchTab(TABS[0].id);
            }
        },

        // 检查是否有活跃的学习插件
        get activeCount() {
            return TABS.length;
        }
    };

    function _ensureHub() {
        if (_hubEl) return;

        _hubEl = document.createElement('div');
        _hubEl.className = 'learning-hub';
        _hubEl.id = 'learningHub';
        _hubEl.innerHTML = `
            <div class="learning-hub-tabs" id="learningHubTabs"></div>
            <div class="learning-hub-content" id="learningHubContent"></div>
        `;
        document.body.appendChild(_hubEl);

        _tabBar = _hubEl.querySelector('#learningHubTabs');
        _contentArea = _hubEl.querySelector('#learningHubContent');
    }

    function _addTab(config) {
        const { id, label, icon, accentColor, render } = config;

        const btn = document.createElement('button');
        btn.className = 'learning-hub-tab';
        btn.dataset.tabId = id;
        btn.innerHTML = `<span class="learning-hub-tab-icon">${icon}</span><span class="learning-hub-tab-label">${label}</span>`;
        if (accentColor) btn.style.setProperty('--tab-accent', accentColor);
        btn.addEventListener('click', () => _switchTab(id));
        _tabBar.appendChild(btn);

        const panel = document.createElement('div');
        panel.className = 'learning-hub-panel';
        panel.dataset.tabId = id;
        _contentArea.appendChild(panel);

        // 调用插件的渲染函数
        try {
            render(panel);
        } catch (e) {
            console.error(`[LearningHub] 渲染失败 ${id}:`, e);
        }
    }

    function _removeTab(id) {
        const btn = _tabBar.querySelector(`[data-tab-id="${id}"]`);
        if (btn) btn.remove();
        const panel = _contentArea.querySelector(`[data-tab-id="${id}"]`);
        if (panel) panel.remove();
    }

    function _switchTab(id) {
        _activeTabId = id;

        _tabBar.querySelectorAll('.learning-hub-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.tabId === id);
        });

        _contentArea.querySelectorAll('.learning-hub-panel').forEach(p => {
            p.style.display = p.dataset.tabId === id ? 'block' : 'none';
        });
    }

    function _updateTabBarVisibility() {
        if (!_hubEl) return;
        _hubEl.classList.toggle('single-tab', TABS.length <= 1);
    }
})();
