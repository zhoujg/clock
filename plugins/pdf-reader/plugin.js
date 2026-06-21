/**
 * PDF阅读器插件
 * 基于 Mozilla pdf.js，支持翻页、缩放、目录导航
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'pdf-reader';
    const STYLE_CSS = 'plugins/pdf-reader/style.css';
    const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    let _overlayEl = null;
    let _btnEl = null;
    let _pdfDoc = null;
    let _currentPage = 1;
    let _totalPages = 0;
    let _scale = 1.2;
    let _outline = [];
    let _sidebarOpen = false;
    let _pdfjsReady = false;
    let _rendering = false;
    let _pendingPage = null;
    let _lastFileName = '';

    const STORAGE_KEY = 'pdfReaderState';

    // ============ 持久化（IndexedDB 存文件，localStorage 存状态） ============

    function _openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('PdfReaderDB', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files');
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function _savePdfData(arrayBuffer, fileName) {
        try {
            // 复制 ArrayBuffer，防止 pdf.js detach 后数据丢失
            const copy = new Uint8Array(arrayBuffer).slice().buffer;
            const db = await _openDB();
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            store.put(copy, 'lastPdf');
            store.put(fileName, 'lastPdfName');
            // 等待事务完成，确保页面刷新前数据已持久化
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
            // 同时保存状态到 localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                fileName: fileName,
                page: _currentPage,
                scale: _scale,
                timestamp: Date.now()
            }));
            console.log('[PDF阅读器] 文件已保存:', fileName, '大小:', copy.byteLength);
        } catch (e) {
            console.warn('[PDF阅读器] 保存文件失败:', e);
        }
    }

    async function _loadPdfData() {
        try {
            const db = await _openDB();
            return new Promise((resolve) => {
                const tx = db.transaction('files', 'readonly');
                const store = tx.objectStore('files');
                const nameReq = store.get('lastPdfName');
                nameReq.onsuccess = () => {
                    const name = nameReq.result;
                    if (!name) { resolve(null); return; }
                    const dataReq = store.get('lastPdf');
                    dataReq.onsuccess = () => {
                        if (!dataReq.result) { resolve(null); return; }
                        resolve({ name: name, data: dataReq.result });
                    };
                    dataReq.onerror = () => resolve(null);
                };
                nameReq.onerror = () => resolve(null);
            });
        } catch (e) {
            return null;
        }
    }

    function _loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function _saveCurrentPage() {
        try {
            const state = _loadState() || {};
            state.page = _currentPage;
            state.scale = _scale;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    // ============ 加载 pdf.js ============

    function _loadPdfJs() {
        if (_pdfjsReady) return Promise.resolve();
        if (window.pdfjsLib) {
            _pdfjsReady = true;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = PDFJS_CDN;
            script.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
                    _pdfjsReady = true;
                    resolve();
                } else {
                    reject(new Error('pdf.js 加载失败'));
                }
            };
            script.onerror = () => reject(new Error('pdf.js CDN 不可用'));
            document.head.appendChild(script);
        });
    }

    // ============ 注入 CSS ============

    function _ensureCSS() {
        if (document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = STYLE_CSS + '?v=' + Date.now();
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
    }

    // ============ 底部工具栏按钮 ============

    function _createToolButton() {
        if (_btnEl) return;
        const toolbar = document.querySelector('.bottom-toolbar');
        if (!toolbar) return;

        _btnEl = document.createElement('button');
        _btnEl.id = 'pdfReaderBtn';
        _btnEl.className = 'bottom-tool-btn';
        _btnEl.title = 'PDF阅读器';
        _btnEl.innerHTML = `
            <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span class="tool-btn-label">PDF</span>
        `;
        _btnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            _openReader();
        });
        toolbar.appendChild(_btnEl);
    }

    function _removeToolButton() {
        if (_btnEl) { _btnEl.remove(); _btnEl = null; }
    }

    // ============ 创建阅读器 UI ============

    function _createOverlay() {
        if (_overlayEl) return;

        _overlayEl = document.createElement('div');
        _overlayEl.className = 'pdf-reader-overlay';
        _overlayEl.innerHTML = `
            <div class="pdf-toolbar">
                <div class="pdf-toolbar-left">
                    <button class="pdf-btn" id="pdfCloseBtn" title="关闭">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <button class="pdf-btn" id="pdfSidebarBtn" title="目录">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>
                    <span class="pdf-filename" id="pdfFilename"></span>
                </div>
                <div class="pdf-toolbar-center">
                    <button class="pdf-btn" id="pdfPrevBtn" title="上一页">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                    </button>
                    <span class="pdf-page-info">
                        <input type="number" id="pdfPageInput" min="1" value="1" /> / <span id="pdfTotalPages">0</span>
                    </span>
                    <button class="pdf-btn" id="pdfNextBtn" title="下一页">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>
                <div class="pdf-toolbar-right">
                    <button class="pdf-btn" id="pdfZoomOutBtn" title="缩小">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <span class="pdf-zoom-info" id="pdfZoomInfo">120%</span>
                    <button class="pdf-btn" id="pdfZoomInBtn" title="放大">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button class="pdf-btn" id="pdfOpenFileBtn" title="打开文件">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="pdf-main">
                <div class="pdf-sidebar" id="pdfSidebar">
                    <div class="pdf-sidebar-title">目录</div>
                    <div id="pdfOutlineList"></div>
                </div>
                <div class="pdf-viewer" id="pdfViewer">
                    <div class="pdf-welcome" id="pdfWelcome">
                        <div class="pdf-welcome-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                        </div>
                        <h3>PDF 阅读器</h3>
                        <p>选择或拖入 PDF 文件开始阅读</p>
                        <button class="pdf-open-btn" id="pdfWelcomeOpenBtn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            选择文件
                        </button>
                        <div class="pdf-drop-zone" id="pdfDropZone">
                            拖拽 PDF 文件到此处
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(_overlayEl);
        _bindOverlayEvents();
    }

    // ============ 事件绑定 ============

    function _bindOverlayEvents() {
        // 关闭
        document.getElementById('pdfCloseBtn').addEventListener('click', _closeReader);

        // 翻页
        document.getElementById('pdfPrevBtn').addEventListener('click', () => _goToPage(_currentPage - 1));
        document.getElementById('pdfNextBtn').addEventListener('click', () => _goToPage(_currentPage + 1));

        // 页码输入
        document.getElementById('pdfPageInput').addEventListener('change', (e) => {
            const p = parseInt(e.target.value);
            if (p >= 1 && p <= _totalPages) _goToPage(p);
            else e.target.value = _currentPage;
        });

        // 缩放
        document.getElementById('pdfZoomInBtn').addEventListener('click', () => _setZoom(_scale + 0.2));
        document.getElementById('pdfZoomOutBtn').addEventListener('click', () => _setZoom(_scale - 0.2));

        // 打开文件
        document.getElementById('pdfOpenFileBtn').addEventListener('click', _pickFile);
        document.getElementById('pdfWelcomeOpenBtn').addEventListener('click', _pickFile);

        // 侧边栏
        document.getElementById('pdfSidebarBtn').addEventListener('click', _toggleSidebar);

        // 拖拽
        const dropZone = document.getElementById('pdfDropZone');
        const viewer = document.getElementById('pdfViewer');

        [dropZone, viewer].forEach(el => {
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            });
            el.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            el.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'application/pdf') {
                    _loadFile(file);
                }
            });
        });

        // 键盘
        _overlayEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') _closeReader();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); _goToPage(_currentPage - 1); }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); _goToPage(_currentPage + 1); }
            if (e.key === '+' || e.key === '=') { e.preventDefault(); _setZoom(_scale + 0.1); }
            if (e.key === '-') { e.preventDefault(); _setZoom(_scale - 0.1); }
        });

        // 滚轮翻页（防抖模式：滚动停止后只翻一页）
        let _wheelTimer = null;
        let _wheelDir = 0;
        viewer.addEventListener('wheel', (e) => {
            e.preventDefault();
            _wheelDir = e.deltaY > 0 ? 1 : -1;
            clearTimeout(_wheelTimer);
            _wheelTimer = setTimeout(() => {
                if (_wheelDir > 0) _goToPage(_currentPage + 1);
                else if (_wheelDir < 0) _goToPage(_currentPage - 1);
                _wheelDir = 0;
            }, 50);
        }, { passive: false });
    }

    // ============ 阅读器开关 ============

    function _openReader() {
        _createOverlay();
        _overlayEl.classList.add('active');
        _overlayEl.focus();
        // 尝试恢复上次文档
        _tryRestoreLastDoc();
    }

    function _closeReader() {
        // 保存当前阅读进度
        _saveCurrentPage();
        if (_overlayEl) _overlayEl.classList.remove('active');
    }

    async function _tryRestoreLastDoc() {
        // 如果已有文档打开，不恢复
        if (_pdfDoc) return;
        const state = _loadState();
        if (!state || !state.fileName) {
            console.log('[PDF阅读器] 无上次阅读记录');
            return;
        }

        console.log('[PDF阅读器] 尝试恢复:', state.fileName, '页码:', state.page);

        try {
            const saved = await _loadPdfData();
            if (!saved) {
                console.warn('[PDF阅读器] IndexedDB 中无文件数据');
                return;
            }
            console.log('[PDF阅读器] 从 IndexedDB 读取到文件:', saved.name, '大小:', saved.data.byteLength);

            // 确保欢迎页隐藏
            const welcome = document.getElementById('pdfWelcome');
            if (welcome) welcome.style.display = 'none';

            await _loadPdfJs();

            // 复制 buffer 再传给 pdf.js，防止 detach
            const pdfBuffer = new Uint8Array(saved.data).slice().buffer;
            const loadingTask = window.pdfjsLib.getDocument({ data: pdfBuffer });
            _pdfDoc = await loadingTask.promise;
            _totalPages = _pdfDoc.numPages;
            _currentPage = state.page || 1;
            _scale = state.scale || 1.2;
            _lastFileName = saved.name;

            // 更新 UI
            document.getElementById('pdfTotalPages').textContent = _totalPages;
            document.getElementById('pdfFilename').textContent = saved.name;
            document.getElementById('pdfZoomInfo').textContent = Math.round(_scale * 100) + '%';

            await _loadOutline();
            await _renderPage(Math.min(_currentPage, _totalPages));
            console.log('[PDF阅读器] 恢复成功，页码:', _currentPage);
        } catch (e) {
            console.warn('[PDF阅读器] 恢复上次文档失败:', e);
            // 恢复失败，显示欢迎页
            const welcome = document.getElementById('pdfWelcome');
            if (welcome) welcome.style.display = '';
        }
    }

    // ============ 文件选择 ============

    function _pickFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,.pdf';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) _loadFile(file);
        };
        input.click();
    }

    // ============ 加载 PDF ============

    async function _loadFile(file) {
        // 先确保 pdf.js 已加载
        try {
            await _loadPdfJs();
        } catch (e) {
            alert('PDF.js 库加载失败，请检查网络连接');
            return;
        }

        // 显示加载中
        const viewer = document.getElementById('pdfViewer');
        const welcome = document.getElementById('pdfWelcome');
        if (welcome) welcome.style.display = 'none';

        // 清除旧内容
        viewer.querySelectorAll('canvas').forEach(c => c.remove());

        let loadingEl = document.getElementById('pdfLoadingIndicator');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'pdfLoadingIndicator';
            loadingEl.className = 'pdf-loading';
            loadingEl.innerHTML = '<div class="pdf-spinner"></div><span>加载中...</span>';
            viewer.appendChild(loadingEl);
        }
        loadingEl.style.display = 'flex';

        try {
            const arrayBuffer = await file.arrayBuffer();
            // 先复制一份用于持久化，pdf.js 可能会 detach 原始 buffer
            const savedBuffer = new Uint8Array(arrayBuffer).slice().buffer;
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            _pdfDoc = await loadingTask.promise;
            _totalPages = _pdfDoc.numPages;
            _currentPage = 1;

            // 更新 UI
            document.getElementById('pdfTotalPages').textContent = _totalPages;
            document.getElementById('pdfFilename').textContent = file.name;
            _lastFileName = file.name;
            loadingEl.style.display = 'none';

            // 加载目录
            await _loadOutline();

            // 渲染第一页
            await _renderPage(_currentPage);

            // 持久化文件数据（用于下次恢复）
            await _savePdfData(savedBuffer, file.name);
        } catch (e) {
            console.error('[PDF阅读器] 加载失败:', e);
            loadingEl.innerHTML = '<span style="color:#ff6b6b">加载失败：' + (e.message || '未知错误') + '</span>';
        }
    }

    // ============ 加载目录 ============

    async function _loadOutline() {
        const listEl = document.getElementById('pdfOutlineList');
        listEl.innerHTML = '';

        try {
            const outline = await _pdfDoc.getOutline();
            _outline = outline || [];

            if (_outline.length === 0) {
                listEl.innerHTML = '<div style="padding:12px 16px;color:#666;font-size:12px;">此文档无目录</div>';
                return;
            }

            const renderItems = (items, level = 0) => {
                items.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'pdf-outline-item level-' + level;
                    btn.textContent = item.title;
                    btn.addEventListener('click', async () => {
                        if (!item.dest) return;
                        try {
                            let dest = item.dest;
                            if (typeof dest === 'string') {
                                dest = await _pdfDoc.getDestination(dest);
                            }
                            if (dest) {
                                const ref = dest[0];
                                const pageIndex = await _pdfDoc.getPageIndex(ref);
                                _goToPage(pageIndex + 1);
                            }
                        } catch (e) {
                            console.warn('[PDF阅读器] 跳转失败:', e);
                        }
                    });
                    listEl.appendChild(btn);
                    if (item.items && item.items.length > 0) {
                        renderItems(item.items, level + 1);
                    }
                });
            };

            renderItems(_outline);
        } catch (e) {
            listEl.innerHTML = '<div style="padding:12px 16px;color:#666;font-size:12px;">目录加载失败</div>';
        }
    }

    // ============ 渲染页面 ============

    async function _renderPage(pageNum) {
        if (_rendering) {
            _pendingPage = pageNum;
            return;
        }
        _rendering = true;

        try {
            const page = await _pdfDoc.getPage(pageNum);
            const dpr = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale: _scale });
            const renderViewport = page.getViewport({ scale: _scale * dpr });

            const viewer = document.getElementById('pdfViewer');
            const loadingEl = document.getElementById('pdfLoadingIndicator');

            // 清除旧 canvas
            viewer.querySelectorAll('canvas').forEach(c => c.remove());
            if (loadingEl) loadingEl.style.display = 'none';

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = renderViewport.height;
            canvas.width = renderViewport.width;
            canvas.style.width = viewport.width + 'px';
            canvas.style.height = viewport.height + 'px';

            viewer.appendChild(canvas);

            await page.render({
                canvasContext: ctx,
                viewport: renderViewport
            }).promise;

            _currentPage = pageNum;
            document.getElementById('pdfPageInput').value = pageNum;

            // 保存阅读进度
            _saveCurrentPage();

            // 滚动到顶部
            viewer.scrollTop = 0;
        } catch (e) {
            console.error('[PDF阅读器] 渲染失败:', e);
        }

        _rendering = false;

        if (_pendingPage !== null) {
            const p = _pendingPage;
            _pendingPage = null;
            _renderPage(p);
        }
    }

    // ============ 翻页 ============

    function _goToPage(num) {
        if (!_pdfDoc || num < 1 || num > _totalPages) return;
        _renderPage(num);
    }

    // ============ 缩放 ============

    function _setZoom(newScale) {
        newScale = Math.max(0.3, Math.min(4, newScale));
        _scale = Math.round(newScale * 10) / 10;
        document.getElementById('pdfZoomInfo').textContent = Math.round(_scale * 100) + '%';
        if (_pdfDoc) _renderPage(_currentPage);
    }

    // ============ 侧边栏 ============

    function _toggleSidebar() {
        _sidebarOpen = !_sidebarOpen;
        const sidebar = document.getElementById('pdfSidebar');
        const btn = document.getElementById('pdfSidebarBtn');
        if (_sidebarOpen) {
            sidebar.classList.add('open');
            btn.classList.add('active');
        } else {
            sidebar.classList.remove('open');
            btn.classList.remove('active');
        }
    }

    // ============ 注册插件 ============

    if (window.PluginManager) {
        window.PluginManager.register({
            id: PLUGIN_ID,
            name: 'PDF阅读器',
            version: '1.0.0',
            description: '在线PDF阅读器，支持翻页、缩放、目录导航，基于pdf.js',
            icon: '📄',
            author: '系统内置',
            css: STYLE_CSS,

            async onInstall() {},

            async onActivate() {
                _ensureCSS();
                _createToolButton();
            },

            async onDeactivate() {
                _removeToolButton();
                if (_overlayEl) { _overlayEl.remove(); _overlayEl = null; }
                _pdfDoc = null;
            },

            async onUninstall() {
                _removeToolButton();
                if (_overlayEl) { _overlayEl.remove(); _overlayEl = null; }
                _pdfDoc = null;
            },
        });
    }
})();
