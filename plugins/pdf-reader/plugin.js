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
    const ANNOTATIONS_KEY = 'pdfReaderAnnotations';

    // 笔记状态
    let _annotMode = null;       // null | 'highlight' | 'text' | 'draw' | 'eraser'
    let _annotColor = '#FFEB3B'; // 高亮颜色
    let _drawing = false;        // 画笔是否按下
    let _drawCtx = null;         // 画笔 canvas 上下文
    let _highlightStart = null;  // 高亮起始点
    let _currentPath = [];       // 当前画笔路径

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

    // ============ 笔记持久化 ============

    function _getAnnotKey() {
        if (!_lastFileName) return null;
        return ANNOTATIONS_KEY + ':' + _lastFileName;
    }

    function _loadAnnotations() {
        try {
            const key = _getAnnotKey();
            if (!key) return {};
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function _saveAnnotations(annotations) {
        try {
            const key = _getAnnotKey();
            if (!key) return;
            localStorage.setItem(key, JSON.stringify(annotations));
        } catch (e) {
            console.warn('[PDF阅读器] 保存笔记失败:', e);
        }
    }

    function _getPageAnnotations(pageNum) {
        const all = _loadAnnotations();
        return all[pageNum] || { highlights: [], texts: [], drawings: [] };
    }

    function _setPageAnnotations(pageNum, data) {
        const all = _loadAnnotations();
        all[pageNum] = data;
        _saveAnnotations(all);
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
                    <div class="pdf-annot-tools">
                        <button class="pdf-btn pdf-annot-btn" id="pdfHighlightBtn" title="高亮" data-mode="highlight">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" opacity="0.3"/>
                                <rect x="4" y="4" width="16" height="16" rx="2"/>
                            </svg>
                        </button>
                        <button class="pdf-btn pdf-annot-btn" id="pdfTextBtn" title="文本批注" data-mode="text">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                        </button>
                        <button class="pdf-btn pdf-annot-btn" id="pdfDrawBtn" title="画笔" data-mode="draw">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                        </button>
                        <button class="pdf-btn pdf-annot-btn" id="pdfEraserBtn" title="橡皮擦" data-mode="eraser">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.8 1.4c.8-.8 2-.8 2.8 0l5 5c.8.8.8 2 0 2.8L11 20"/>
                                <line x1="18" y1="13" x2="11" y2="20"/>
                            </svg>
                        </button>
                        <div class="pdf-color-picker" id="pdfColorPicker">
                            <span class="pdf-color-dot active" data-color="#FFEB3B" style="background:#FFEB3B"></span>
                            <span class="pdf-color-dot" data-color="#4FC3F7" style="background:#4FC3F7"></span>
                            <span class="pdf-color-dot" data-color="#81C784" style="background:#81C784"></span>
                            <span class="pdf-color-dot" data-color="#FF8A65" style="background:#FF8A65"></span>
                            <span class="pdf-color-dot" data-color="#CE93D8" style="background:#CE93D8"></span>
                        </div>
                    </div>
                    <div class="pdf-toolbar-sep"></div>
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

        // 笔记工具栏
        const annotBtns = _overlayEl.querySelectorAll('.pdf-annot-btn');
        annotBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (_annotMode === mode) {
                    _setAnnotMode(null);
                } else {
                    _setAnnotMode(mode);
                }
            });
        });

        // 颜色选择
        const colorDots = _overlayEl.querySelectorAll('.pdf-color-dot');
        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                _annotColor = dot.dataset.color;
                colorDots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
        });

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
            if (e.key === 'Escape') {
                if (_annotMode) { _setAnnotMode(null); return; }
                _closeReader();
            }
            if (!_annotMode) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); _goToPage(_currentPage - 1); }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); _goToPage(_currentPage + 1); }
                if (e.key === '+' || e.key === '=') { e.preventDefault(); _setZoom(_scale + 0.1); }
                if (e.key === '-') { e.preventDefault(); _setZoom(_scale - 0.1); }
            }
        });

        // 滚轮翻页（防抖模式：滚动停止后只翻一页）
        let _wheelTimer = null;
        let _wheelDir = 0;
        viewer.addEventListener('wheel', (e) => {
            if (_annotMode) return; // 笔记模式下不翻页
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

    // ============ 笔记模式 ============

    function _setAnnotMode(mode) {
        _annotMode = mode;
        const btns = _overlayEl.querySelectorAll('.pdf-annot-btn');
        btns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        const viewer = document.getElementById('pdfViewer');
        if (viewer) {
            viewer.classList.remove('annot-highlight', 'annot-text', 'annot-draw', 'annot-eraser');
            if (mode) viewer.classList.add('annot-' + mode);
        }
        // 显示/隐藏颜色选择器
        const colorPicker = _overlayEl.querySelector('#pdfColorPicker');
        if (colorPicker) {
            colorPicker.style.display = (mode === 'highlight' || mode === 'draw' || mode === 'text') ? 'flex' : 'none';
        }
        // 切换模式时移除临时元素
        _removeTempAnnotElements();
    }

    function _removeTempAnnotElements() {
        _overlayEl.querySelectorAll('.pdf-highlight-temp').forEach(el => el.remove());
        _overlayEl.querySelectorAll('.pdf-text-input-popup').forEach(el => el.remove());
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
        viewer.querySelectorAll('.pdf-page-container').forEach(c => c.remove());
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

            // 清除旧内容
            viewer.querySelectorAll('canvas').forEach(c => c.remove());
            viewer.querySelectorAll('.pdf-page-container').forEach(c => c.remove());
            if (loadingEl) loadingEl.style.display = 'none';

            // 创建页面容器
            const pageContainer = document.createElement('div');
            pageContainer.className = 'pdf-page-container';
            pageContainer.style.position = 'relative';
            pageContainer.style.width = viewport.width + 'px';
            pageContainer.style.height = viewport.height + 'px';
            pageContainer.style.flexShrink = '0';

            // PDF canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = renderViewport.height;
            canvas.width = renderViewport.width;
            canvas.style.width = viewport.width + 'px';
            canvas.style.height = viewport.height + 'px';
            canvas.style.display = 'block';
            pageContainer.appendChild(canvas);

            // 高亮层 (SVG)
            const highlightLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            highlightLayer.classList.add('pdf-highlight-layer');
            highlightLayer.style.width = viewport.width + 'px';
            highlightLayer.style.height = viewport.height + 'px';
            highlightLayer.setAttribute('viewBox', `0 0 ${viewport.width} ${viewport.height}`);
            pageContainer.appendChild(highlightLayer);

            // 画笔层 (canvas)
            const drawCanvas = document.createElement('canvas');
            drawCanvas.classList.add('pdf-draw-layer');
            drawCanvas.width = viewport.width * dpr;
            drawCanvas.height = viewport.height * dpr;
            drawCanvas.style.width = viewport.width + 'px';
            drawCanvas.style.height = viewport.height + 'px';
            const drawCtx = drawCanvas.getContext('2d');
            drawCtx.scale(dpr, dpr);
            pageContainer.appendChild(drawCanvas);

            // 文本批注层
            const textLayer = document.createElement('div');
            textLayer.classList.add('pdf-text-layer');
            textLayer.style.width = viewport.width + 'px';
            textLayer.style.height = viewport.height + 'px';
            pageContainer.appendChild(textLayer);

            // 交互层 (透明，接收鼠标事件)
            const interactionLayer = document.createElement('div');
            interactionLayer.classList.add('pdf-interaction-layer');
            interactionLayer.style.width = viewport.width + 'px';
            interactionLayer.style.height = viewport.height + 'px';
            pageContainer.appendChild(interactionLayer);

            viewer.appendChild(pageContainer);

            // 渲染 PDF
            await page.render({
                canvasContext: ctx,
                viewport: renderViewport
            }).promise;

            // 加载并绘制已有笔记
            _renderAnnotations(pageNum, viewport, highlightLayer, drawCanvas, drawCtx, textLayer, dpr);

            // 绑定交互层事件
            _bindInteractionEvents(interactionLayer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr);

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

    // ============ 渲染已有笔记 ============

    function _renderAnnotations(pageNum, viewport, highlightLayer, drawCanvas, drawCtx, textLayer, dpr) {
        const annots = _getPageAnnotations(pageNum);

        // 渲染高亮
        if (annots.highlights && annots.highlights.length > 0) {
            annots.highlights.forEach(h => {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', h.x);
                rect.setAttribute('y', h.y);
                rect.setAttribute('width', h.w);
                rect.setAttribute('height', h.h);
                rect.setAttribute('fill', h.color || '#FFEB3B');
                rect.setAttribute('opacity', '0.35');
                rect.setAttribute('rx', '2');
                rect.dataset.annotId = h.id;
                rect.classList.add('pdf-highlight-rect');
                highlightLayer.appendChild(rect);
            });
        }

        // 渲染画笔路径
        if (annots.drawings && annots.drawings.length > 0) {
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            annots.drawings.forEach(d => {
                if (!d.points || d.points.length < 2) return;
                drawCtx.beginPath();
                drawCtx.strokeStyle = d.color || '#FF0000';
                drawCtx.lineWidth = d.width || 2;
                drawCtx.moveTo(d.points[0].x, d.points[0].y);
                for (let i = 1; i < d.points.length; i++) {
                    drawCtx.lineTo(d.points[i].x, d.points[i].y);
                }
                drawCtx.stroke();
            });
        }

        // 渲染文本批注
        if (annots.texts && annots.texts.length > 0) {
            annots.texts.forEach(t => {
                _createTextMarker(textLayer, t);
            });
        }
    }

    function _createTextMarker(textLayer, t) {
        const marker = document.createElement('div');
        marker.className = 'pdf-text-marker';
        marker.style.left = t.x + 'px';
        marker.style.top = t.y + 'px';
        marker.dataset.annotId = t.id;

        const icon = document.createElement('div');
        icon.className = 'pdf-text-marker-icon';
        icon.style.background = t.color || '#FFEB3B';
        icon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

        const tooltip = document.createElement('div');
        tooltip.className = 'pdf-text-marker-tooltip';
        tooltip.textContent = t.text;

        marker.appendChild(icon);
        marker.appendChild(tooltip);
        textLayer.appendChild(marker);

        // 点击显示/隐藏 tooltip
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = tooltip.classList.contains('show');
            // 关闭所有其他 tooltip
            textLayer.querySelectorAll('.pdf-text-marker-tooltip.show').forEach(t => t.classList.remove('show'));
            if (!isOpen) tooltip.classList.add('show');
        });
    }

    // ============ 交互层事件 ============

    function _bindInteractionEvents(layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr) {
        layer.addEventListener('mousedown', (e) => _onAnnotMouseDown(e, layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr));
        layer.addEventListener('mousemove', (e) => _onAnnotMouseMove(e, layer, highlightLayer, drawCanvas, drawCtx, viewport, dpr));
        layer.addEventListener('mouseup', (e) => _onAnnotMouseUp(e, layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr));
        // 触摸支持
        layer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            _onAnnotMouseDown(_touchToMouse(touch, e.target), layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr);
        }, { passive: false });
        layer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            _onAnnotMouseMove(_touchToMouse(touch, e.target), layer, highlightLayer, drawCanvas, drawCtx, viewport, dpr);
        }, { passive: false });
        layer.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            _onAnnotMouseUp(_touchToMouse(touch, e.target), layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr);
        }, { passive: false });
    }

    function _touchToMouse(touch, target) {
        return { clientX: touch.clientX, clientY: touch.clientY, target: target };
    }

    function _getPagePos(e, layer, viewport) {
        const rect = layer.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width * viewport.width,
            y: (e.clientY - rect.top) / rect.height * viewport.height
        };
    }

    function _onAnnotMouseDown(e, layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr) {
        if (!_annotMode) return;
        const pos = _getPagePos(e, layer, viewport);

        if (_annotMode === 'highlight') {
            _highlightStart = pos;
            // 创建临时高亮矩形
            const tempRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            tempRect.classList.add('pdf-highlight-temp');
            tempRect.setAttribute('x', pos.x);
            tempRect.setAttribute('y', pos.y);
            tempRect.setAttribute('width', 0);
            tempRect.setAttribute('height', 0);
            tempRect.setAttribute('fill', _annotColor);
            tempRect.setAttribute('opacity', '0.35');
            tempRect.setAttribute('rx', '2');
            highlightLayer.appendChild(tempRect);
        } else if (_annotMode === 'text') {
            _showTextInput(e, pos, textLayer, layer, viewport);
        } else if (_annotMode === 'draw') {
            _drawing = true;
            _currentPath = [pos];
            drawCtx.beginPath();
            drawCtx.strokeStyle = _annotColor;
            drawCtx.lineWidth = 2;
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            drawCtx.moveTo(pos.x, pos.y);
        } else if (_annotMode === 'eraser') {
            _handleEraser(pos, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr);
        }
    }

    function _onAnnotMouseMove(e, layer, highlightLayer, drawCanvas, drawCtx, viewport, dpr) {
        if (!_annotMode) return;

        if (_annotMode === 'highlight' && _highlightStart) {
            const pos = _getPagePos(e, layer, viewport);
            const tempRect = highlightLayer.querySelector('.pdf-highlight-temp');
            if (tempRect) {
                const x = Math.min(_highlightStart.x, pos.x);
                const y = Math.min(_highlightStart.y, pos.y);
                const w = Math.abs(pos.x - _highlightStart.x);
                const h = Math.abs(pos.y - _highlightStart.y);
                tempRect.setAttribute('x', x);
                tempRect.setAttribute('y', y);
                tempRect.setAttribute('width', w);
                tempRect.setAttribute('height', h);
            }
        } else if (_annotMode === 'draw' && _drawing) {
            const pos = _getPagePos(e, layer, viewport);
            _currentPath.push(pos);
            drawCtx.lineTo(pos.x, pos.y);
            drawCtx.stroke();
            drawCtx.beginPath();
            drawCtx.moveTo(pos.x, pos.y);
        }
    }

    function _onAnnotMouseUp(e, layer, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr) {
        if (!_annotMode) return;
        const pos = _getPagePos(e, layer, viewport);

        if (_annotMode === 'highlight' && _highlightStart) {
            const tempRect = highlightLayer.querySelector('.pdf-highlight-temp');
            if (tempRect) {
                const x = Math.min(_highlightStart.x, pos.x);
                const y = Math.min(_highlightStart.y, pos.y);
                const w = Math.abs(pos.x - _highlightStart.x);
                const h = Math.abs(pos.y - _highlightStart.y);

                if (w > 3 && h > 3) {
                    // 保存高亮
                    const annots = _getPageAnnotations(_currentPage);
                    const id = 'hl_' + Date.now();
                    annots.highlights.push({ id, x, y, w, h, color: _annotColor });
                    _setPageAnnotations(_currentPage, annots);

                    // 将临时矩形转为正式
                    tempRect.classList.remove('pdf-highlight-temp');
                    tempRect.setAttribute('x', x);
                    tempRect.setAttribute('y', y);
                    tempRect.setAttribute('width', w);
                    tempRect.setAttribute('height', h);
                    tempRect.dataset.annotId = id;
                    tempRect.classList.add('pdf-highlight-rect');
                } else {
                    tempRect.remove();
                }
            }
            _highlightStart = null;
        } else if (_annotMode === 'draw' && _drawing) {
            _drawing = false;
            if (_currentPath.length >= 2) {
                const annots = _getPageAnnotations(_currentPage);
                const id = 'dr_' + Date.now();
                annots.drawings.push({
                    id,
                    points: _currentPath.map(p => ({ x: p.x, y: p.y })),
                    color: _annotColor,
                    width: 2
                });
                _setPageAnnotations(_currentPage, annots);
            }
            _currentPath = [];
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

    // ============ 文本批注输入 ============

    function _showTextInput(e, pos, textLayer, interactionLayer, viewport) {
        // 移除已有弹窗
        _overlayEl.querySelectorAll('.pdf-text-input-popup').forEach(el => el.remove());

        const popup = document.createElement('div');
        popup.className = 'pdf-text-input-popup';

        // 转换为屏幕坐标定位弹窗
        const layerRect = interactionLayer.getBoundingClientRect();
        popup.style.left = (e.clientX - layerRect.left) + 'px';
        popup.style.top = (e.clientY - layerRect.top) + 'px';

        const textarea = document.createElement('textarea');
        textarea.className = 'pdf-text-input-field';
        textarea.placeholder = '输入批注...';
        textarea.rows = 3;

        const btnRow = document.createElement('div');
        btnRow.className = 'pdf-text-input-btns';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '确定';
        confirmBtn.className = 'pdf-text-input-confirm';
        confirmBtn.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text) {
                const annots = _getPageAnnotations(_currentPage);
                const id = 'tx_' + Date.now();
                const t = { id, x: pos.x, y: pos.y, text: text, color: _annotColor };
                annots.texts.push(t);
                _setPageAnnotations(_currentPage, annots);
                _createTextMarker(textLayer, t);
            }
            popup.remove();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.className = 'pdf-text-input-cancel';
        cancelBtn.addEventListener('click', () => popup.remove());

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        popup.appendChild(textarea);
        popup.appendChild(btnRow);

        interactionLayer.parentElement.appendChild(popup);
        textarea.focus();

        // 回车确认
        textarea.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                confirmBtn.click();
            }
            if (ev.key === 'Escape') {
                popup.remove();
            }
        });
    }

    // ============ 橡皮擦 ============

    function _handleEraser(pos, highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr) {
        const annots = _getPageAnnotations(_currentPage);
        let modified = false;
        const ERASER_RADIUS = 15;

        // 检查文本批注
        if (annots.texts) {
            const newTexts = annots.texts.filter(t => {
                const dx = pos.x - t.x;
                const dy = pos.y - t.y;
                if (Math.sqrt(dx * dx + dy * dy) < ERASER_RADIUS + 10) {
                    modified = true;
                    return false;
                }
                return true;
            });
            annots.texts = newTexts;
        }

        // 检查高亮
        if (annots.highlights) {
            const newHighlights = annots.highlights.filter(h => {
                // 检查点击位置是否在高亮矩形内
                if (pos.x >= h.x && pos.x <= h.x + h.w && pos.y >= h.y && pos.y <= h.y + h.h) {
                    modified = true;
                    return false;
                }
                return true;
            });
            annots.highlights = newHighlights;
        }

        // 检查画笔路径
        if (annots.drawings) {
            const newDrawings = annots.drawings.filter(d => {
                if (!d.points) return true;
                const hit = d.points.some(p => {
                    const dx = pos.x - p.x;
                    const dy = pos.y - p.y;
                    return Math.sqrt(dx * dx + dy * dy) < ERASER_RADIUS;
                });
                if (hit) { modified = true; return false; }
                return true;
            });
            annots.drawings = newDrawings;
        }

        if (modified) {
            _setPageAnnotations(_currentPage, annots);
            // 重绘整个页面的笔记
            _redrawAnnotations(highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr);
        }
    }

    function _redrawAnnotations(highlightLayer, drawCanvas, drawCtx, textLayer, viewport, dpr) {
        const annots = _getPageAnnotations(_currentPage);

        // 清空高亮层
        while (highlightLayer.firstChild) highlightLayer.firstChild.remove();

        // 清空画笔层
        drawCtx.clearRect(0, 0, drawCanvas.width / dpr, drawCanvas.height / dpr);

        // 清空文本层（保留交互层）
        textLayer.querySelectorAll('.pdf-text-marker').forEach(el => el.remove());

        // 重新渲染
        _renderAnnotations(_currentPage, viewport, highlightLayer, drawCanvas, drawCtx, textLayer, dpr);
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
