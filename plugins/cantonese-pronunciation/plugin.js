/**
 * 粤语拼读插件
 * 提供粤语拼读学习功能，内嵌 https://neihou.cn/pronunciation
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'cantonese-pronunciation';
    const PRONUNCIATION_URL = 'https://neihou.cn/pronunciation';

    let _modalEl = null;
    let _btnEl = null;
    let _cssInjected = false;

    // ============ CSS 注入 ============

    function _injectCSS() {
        if (_cssInjected || document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) {
            _cssInjected = true;
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'plugins/cantonese-pronunciation/style.css?v=' + Date.now();
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
        if (!_btnEl) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                _btnEl = document.createElement('button');
                _btnEl.id = 'cantoneseBtn';
                _btnEl.className = 'bottom-tool-btn';
                _btnEl.title = '粤语拼读';
                _btnEl.innerHTML = `
                    <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        <path d="M8 10h8"/>
                        <path d="M8 14h4"/>
                    </svg>
                    <span class="tool-btn-label">粤语</span>
                `;
                _btnEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    _openModal();
                });
                toolbar.appendChild(_btnEl);
            }
        }

        // 创建模态框
        if (!_modalEl) {
            _modalEl = document.createElement('div');
            _modalEl.className = 'cantonese-modal';
            _modalEl.innerHTML = `
                <div class="cantonese-modal-content">
                    <button class="cantonese-modal-close" id="cantoneseModalClose" title="关闭 (ESC)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                    <iframe 
                        id="cantoneseIframe" 
                        src="${PRONUNCIATION_URL}" 
                        frameborder="0" 
                        allowfullscreen
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    ></iframe>
                </div>
            `;
            document.body.appendChild(_modalEl);

            // 绑定关闭事件
            const closeBtn = _modalEl.querySelector('#cantoneseModalClose');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    _closeModal();
                });
            }

            // 点击背景关闭
            _modalEl.addEventListener('click', (e) => {
                if (e.target === _modalEl) {
                    _closeModal();
                }
            });

            // ESC 键关闭
            document.addEventListener('keydown', _handleKeydown);
        }
    }

    function _removeUI() {
        if (_modalEl) {
            document.removeEventListener('keydown', _handleKeydown);
            _modalEl.remove();
            _modalEl = null;
        }
        if (_btnEl) {
            _btnEl.remove();
            _btnEl = null;
        }
    }

    // ============ 模态框控制 ============

    function _openModal() {
        if (_modalEl) {
            _modalEl.style.display = 'flex';
            setTimeout(() => {
                _modalEl.classList.add('show');
            }, 10);
        }
    }

    function _closeModal() {
        if (_modalEl) {
            _modalEl.classList.remove('show');
            setTimeout(() => {
                if (_modalEl) {
                    _modalEl.style.display = 'none';
                }
            }, 300);
        }
    }

    function _handleKeydown(e) {
        if (e.key === 'Escape' && _modalEl && _modalEl.classList.contains('show')) {
            _closeModal();
        }
    }

    // ============ 插件注册 ============

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '粤语拼读',
        version: '1.0.0',
        description: '内嵌粤语拼读网站，学习粤语发音',
        icon: '🗣️',
        author: '时钟应用',
        css: 'plugins/cantonese-pronunciation/style.css',

        onInstall: async function () {
            console.log('[粤语拼读] 插件已安装');
        },

        onActivate: async function () {
            console.log('[粤语拼读] 插件已激活');
            _injectCSS();
            _createUI();
        },

        onDeactivate: async function () {
            console.log('[粤语拼读] 插件已停用');
            _removeUI();
        },

        onUninstall: async function () {
            console.log('[粤语拼读] 插件已卸载');
            _removeUI();
            _removeCSS();
        }
    });
})();
