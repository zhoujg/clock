/**
 * Halftime · 此间半刻
 * 极简点阵视觉语言，把一天、一周、一月、一年、一生重新呈现在眼前。
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'halftime';

    /* ────── CSS 注入 ────── */

    function _ensureCSS() {
        if (document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `plugins/${PLUGIN_ID}/style.css?v=${Date.now()}`;
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
    }

    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
    }

    /* ────── 状态 ────── */

    let _modalEl = null;
    let _overlayEl = null;
    let _settingItemEl = null;
    let _activeTab = 'today';
    let _rafId = null;

    // 生之钟设定（持久化到 localStorage）
    let _birthday = null;      // ISO date string
    let _lifespan = 85;        // 预期寿命（岁）

    const LS_PREFIX = 'halftime_';

    function _loadSettings() {
        try {
            const raw = localStorage.getItem(LS_PREFIX + 'settings');
            if (raw) {
                const s = JSON.parse(raw);
                _birthday = s.birthday || null;
                _lifespan = s.lifespan || 85;
            }
        } catch (e) { /* ignore */ }
    }

    function _saveSettings() {
        try {
            localStorage.setItem(LS_PREFIX + 'settings', JSON.stringify({
                birthday: _birthday,
                lifespan: _lifespan
            }));
            // 通知同步系统推送更新到云端
            if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
                window.syncAdapter.pushChanges('halftimeSettings');
            }
        } catch (e) { /* ignore */ }
    }

    /* ────── 时间计算 ────── */

    function _now() { return new Date(); }

    function _todayProgress() {
        const n = _now();
        const elapsed = n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600;
        return { total: 24, elapsed: elapsed, pct: elapsed / 24 };
    }

    function _weekProgress() {
        const n = _now();
        const day = n.getDay(); // 0=Sun, 1=Mon, ...
        const elapsed = day === 0 ? 6 : day - 1; // Mon=0, Sun=6
        const hourFrac = n.getHours() / 24;
        return { total: 7, elapsed: elapsed + hourFrac, pct: (elapsed + hourFrac) / 7 };
    }

    function _monthProgress() {
        const n = _now();
        const year = n.getFullYear();
        const month = n.getMonth();
        const today = n.getDate();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const elapsed = today - 1 + n.getHours() / 24;
        return { total: totalDays, elapsed: elapsed, pct: elapsed / totalDays };
    }

    function _yearProgress() {
        const n = _now();
        const start = new Date(n.getFullYear(), 0, 1);
        const isLeap = (n.getFullYear() % 4 === 0 && n.getFullYear() % 100 !== 0) || n.getFullYear() % 400 === 0;
        const total = 365 + (isLeap ? 1 : 0);
        const elapsed = (n - start) / (1000 * 60 * 60 * 24);
        return { total: total, elapsed: elapsed, pct: elapsed / total };
    }

    function _lifeProgress() {
        const weeksPerYear = 52.1429;
        const totalWeeks = Math.round(80 * weeksPerYear); // 4000 周
        const n = _now();
        // 粗略以 2000 年为基准估算（实际应由用户出生日期决定）
        const birthYear = _birthday ? new Date(_birthday).getFullYear() : 1990;
        const ageInYears = (n - new Date(_birthday || '1990-01-01')) / (1000 * 60 * 60 * 24 * 365.25);
        const elapsedWeeks = Math.max(0, ageInYears * weeksPerYear);
        return { total: totalWeeks, elapsed: elapsedWeeks, pct: Math.min(1, elapsedWeeks / totalWeeks) };
    }

    function _lifeProgressFromSettings() {
        if (!_birthday) return null;
        const birth = new Date(_birthday);
        const n = _now();
        const livedMs = n - birth;
        const livedYears = livedMs / (1000 * 60 * 60 * 24 * 365.25);
        const pct = Math.min(1, livedYears / _lifespan);
        const totalWeeks = Math.round(_lifespan * 52.1429);
        const elapsedWeeks = Math.round(livedYears * 52.1429);
        return {
            livedYears: livedYears,
            totalYears: _lifespan,
            pct: pct,
            totalWeeks: totalWeeks,
            elapsedWeeks: Math.min(elapsedWeeks, totalWeeks),
            remainingYears: Math.max(0, _lifespan - livedYears)
        };
    }

    /* ────── DOM 创建 ────── */

    function _createToolButton() {
        if (_settingItemEl) return;
        const toolbar = document.querySelector('.bottom-toolbar');
        if (!toolbar) return;

        _settingItemEl = document.createElement('button');
        _settingItemEl.id = 'halftimeBtn';
        _settingItemEl.className = 'bottom-tool-btn';
        _settingItemEl.title = '此间半刻';
        _settingItemEl.innerHTML = `
            <span class="tool-btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </span>
            <span class="tool-btn-label">半刻</span>
        `;
        _settingItemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            _showModal();
        });
        toolbar.appendChild(_settingItemEl);
    }

    function _removeToolButton() {
        if (_settingItemEl) {
            _settingItemEl.remove();
            _settingItemEl = null;
        }
    }

    function _createModal() {
        if (_modalEl) return;

        // 遮罩
        _overlayEl = document.createElement('div');
        _overlayEl.className = 'halftime-overlay';
        _overlayEl.addEventListener('click', _hideModal);

        // 弹窗
        _modalEl = document.createElement('div');
        _modalEl.className = 'halftime-modal';
        _modalEl.addEventListener('click', (e) => e.stopPropagation());

        // 顶部信息栏
        const header = document.createElement('div');
        header.className = 'halftime-header';
        header.innerHTML = `
            <div class="halftime-header-title">此间半刻</div>
            <div class="halftime-header-sub" id="halftimeSubtitle"></div>
            <button class="halftime-close" title="关闭">&times;</button>
        `;
        header.querySelector('.halftime-close').addEventListener('click', _hideModal);

        // 标签导航
        const tabs = document.createElement('div');
        tabs.className = 'halftime-tabs';
        tabs.innerHTML = `
            <button class="halftime-tab active" data-tab="today">今日</button>
            <button class="halftime-tab" data-tab="week">本周</button>
            <button class="halftime-tab" data-tab="month">本月</button>
            <button class="halftime-tab" data-tab="year">今年</button>
            <button class="halftime-tab" data-tab="life">一生</button>
            <button class="halftime-tab" data-tab="lifeprogress">生之钟</button>
        `;
        tabs.querySelectorAll('.halftime-tab').forEach(btn => {
            btn.addEventListener('click', () => _switchTab(btn.dataset.tab));
        });

        // 内容区域
        const body = document.createElement('div');
        body.className = 'halftime-body';
        body.id = 'halftimeBody';

        _modalEl.appendChild(header);
        _modalEl.appendChild(tabs);
        _modalEl.appendChild(body);

        // 先隐藏再插入 DOM，避免 CSS 加载延迟导致闪烁
        _overlayEl.style.display = 'none';
        _modalEl.style.display = 'none';
        document.body.appendChild(_overlayEl);
        document.body.appendChild(_modalEl);
    }

    function _showModal() {
        _createModal();
        _overlayEl.style.display = 'block';
        _modalEl.style.display = 'block';
        _switchTab(_activeTab);
        // 启动实时更新
        _startTick();
    }

    function _hideModal() {
        if (_overlayEl) _overlayEl.style.display = 'none';
        if (_modalEl) _modalEl.style.display = 'none';
        _stopTick();
    }

    /* ────── 实时刷新 ────── */

    function _startTick() {
        if (_rafId) return;
        let lastMinute = -1;
        function tick() {
            const m = _now().getMinutes();
            if (m !== lastMinute) {
                lastMinute = m;
                _switchTab(_activeTab);
            }
            _rafId = requestAnimationFrame(tick);
        }
        _rafId = requestAnimationFrame(tick);
    }

    function _stopTick() {
        if (_rafId) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
    }

    /* ────── 标签切换 ────── */

    function _switchTab(tabName) {
        _activeTab = tabName;
        const body = document.getElementById('halftimeBody');
        if (!body) return;

        // 更新标签高亮
        const modal = _modalEl;
        if (modal) {
            modal.querySelectorAll('.halftime-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tabName);
            });
        }

        // 渲染对应视图
        body.innerHTML = '';
        switch (tabName) {
            case 'today': _renderToday(body); break;
            case 'week': _renderWeek(body); break;
            case 'month': _renderMonth(body); break;
            case 'year': _renderYear(body); break;
            case 'life': _renderLife(body); break;
            case 'lifeprogress': _renderLifeProgress(body); break;
        }
    }

    /* ────── 通用工具 ────── */

    function _setSubtitle(text) {
        const el = document.getElementById('halftimeSubtitle');
        if (el) el.textContent = text;
    }

    function _createDot(filled, hue = 210, size = 'medium') {
        const dot = document.createElement('span');
        dot.className = 'halftime-dot halftime-' + size;
        if (filled) {
            dot.classList.add('filled');
            dot.style.setProperty('--dot-hue', hue);
        }
        return dot;
    }

    function _createDotsGrid(container, total, elapsed, cols, dotSize, hueBase = 210) {
        const grid = document.createElement('div');
        grid.className = 'halftime-dots-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let i = 0; i < total; i++) {
            const filled = i < Math.floor(elapsed);
            // 当前进度点用不同色相
            const isNow = (i === Math.floor(elapsed));
            const hue = isNow ? hueBase + 30 : hueBase;
            const dot = _createDot(filled, hue, dotSize);
            if (isNow && filled) {
                dot.classList.add('pulse');
            }
            grid.appendChild(dot);
        }

        container.appendChild(grid);
        return grid;
    }

    /* ────── 今日视图 (24小时 · SVG 自适应) ────── */

    function _renderToday(container) {
        const p = _todayProgress();
        _setSubtitle(`${_now().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })} · 已过 ${Math.floor(p.elapsed)} 时 ${Math.floor((p.elapsed % 1) * 60)} 分`);

        const wrapper = document.createElement('div');
        wrapper.className = 'halftime-clock-wrapper';

        // SVG 环形时钟 - viewBox 保证自适应
        const svgNS = 'http://www.w3.org/2000/svg';
        const vb = 300; // viewBox 尺寸
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'halftime-clock');
        svg.setAttribute('viewBox', `0 0 ${vb} ${vb}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // 发光滤镜
        const defs = document.createElementNS(svgNS, 'defs');
        defs.innerHTML = `<filter id="halftimeGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
        svg.appendChild(defs);

        const radius = 130;
        const cx = vb / 2, cy = vb / 2;
        const dotR = 10;

        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            const filled = i < Math.floor(p.elapsed);
            const isNow = (i === Math.floor(p.elapsed));

            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', dotR);
            circle.setAttribute('fill', filled ? 'hsl(210, 55%, 55%)' : 'rgba(0,0,0,0.08)');
            if (filled) circle.setAttribute('filter', 'url(#halftimeGlow)');
            if (isNow && filled) circle.classList.add('halftime-dot', 'pulse');
            circle.innerHTML = `<title>${i}:00</title>`;
            svg.appendChild(circle);
        }

        // 中心文字
        const h = _now().getHours(), m = _now().getMinutes();
        const txt = document.createElementNS(svgNS, 'text');
        txt.setAttribute('x', cx); txt.setAttribute('y', cy - 6);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('font-size', '42'); txt.setAttribute('font-weight', '300');
        txt.setAttribute('fill', '#1d1d1f'); txt.setAttribute('font-family', 'Helvetica Neue, sans-serif');
        txt.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        svg.appendChild(txt);

        const pct = document.createElementNS(svgNS, 'text');
        pct.setAttribute('x', cx); pct.setAttribute('y', cy + 16);
        pct.setAttribute('text-anchor', 'middle');
        pct.setAttribute('font-size', '14'); pct.setAttribute('fill', 'rgba(134,134,139,0.6)');
        pct.textContent = `${Math.round(p.pct * 100)}%`;
        svg.appendChild(pct);

        wrapper.appendChild(svg);
        container.appendChild(wrapper);
    }

    /* ────── 本周视图 (7天) ────── */

    function _renderWeek(container) {
        const p = _weekProgress();
        const days = ['一', '二', '三', '四', '五', '六', '日'];
        const now = _now();
        const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

        _setSubtitle(`第 ${_getWeekNumber(now)} 周 · ${days[todayIdx]} · 已过 ${Math.round(p.pct * 100)}%`);

        const wrapper = document.createElement('div');
        wrapper.className = 'halftime-week-wrapper';

        const row = document.createElement('div');
        row.className = 'halftime-week-row';

        for (let i = 0; i < 7; i++) {
            const filled = i < todayIdx || (i === todayIdx && now.getHours() > 0);
            const isToday = i === todayIdx;

            const dotWrapper = document.createElement('div');
            dotWrapper.className = 'halftime-week-item';

            const dot = _createDot(filled, 260, 'xlarge');
            if (isToday) dot.classList.add('pulse');

            const label = document.createElement('span');
            label.className = 'halftime-week-label';
            label.textContent = days[i];

            dotWrapper.appendChild(dot);
            dotWrapper.appendChild(label);
            row.appendChild(dotWrapper);
        }

        wrapper.appendChild(row);
        container.appendChild(wrapper);
    }

    function _getWeekNumber(d) {
        const start = new Date(d.getFullYear(), 0, 1);
        const diff = d - start;
        return Math.ceil(((diff / (1000 * 60 * 60 * 24)) + start.getDay() + 1) / 7);
    }

    /* ────── 本月视图 ────── */

    function _renderMonth(container) {
        const p = _monthProgress();
        const n = _now();
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

        _setSubtitle(`${n.getFullYear()}年${monthNames[n.getMonth()]} · 已过 ${Math.round(p.pct * 100)}%`);

        const cols = 7; // 按周排列更直观
        const rows = Math.ceil(p.total / cols);

        _createDotsGrid(container, p.total, p.elapsed, cols, 'medium', 280);

        // 底部日期标注
        const legend = document.createElement('div');
        legend.className = 'halftime-legend';
        const today = n.getDate();
        legend.textContent = `第 ${today} 天 / 共 ${p.total} 天`;
        container.appendChild(legend);
    }

    /* ────── 今年视图 (365天) ────── */

    function _renderYear(container) {
        const p = _yearProgress();
        const n = _now();
        _setSubtitle(`${n.getFullYear()}年 · ${_getDayOfYear(n)} 天 · 已过 ${(p.pct * 100).toFixed(1)}%`);

        const cols = 31; // 每月一行，共12行
        _createDotsGrid(container, p.total, p.elapsed, cols, 'small', 320);

        const legend = document.createElement('div');
        legend.className = 'halftime-legend';
        legend.textContent = `第 ${Math.floor(p.elapsed)} 天 / 共 ${p.total} 天`;
        container.appendChild(legend);
    }

    function _getDayOfYear(d) {
        const start = new Date(d.getFullYear(), 0, 1);
        return Math.floor((d - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    /* ────── 一生视图 (4000周) ────── */

    function _renderLife(container) {
        const p = _lifeProgress();
        const data = _lifeProgressFromSettings();
        const display = data || p;

        const age = display.livedYears.toFixed(1);
        _setSubtitle(`若活到 ${display.totalYears} 岁 · 已过 ${Math.round(display.pct * 100)}% · 约 ${Math.round(display.elapsedWeeks)}/${display.totalWeeks} 周`);

        const cols = 50;
        _createDotsGrid(container, display.totalWeeks, display.elapsedWeeks, cols, 'tiny', 0);

        const legend = document.createElement('div');
        legend.className = 'halftime-legend';
        legend.textContent = `每个点代表一周 · 一生若 ${display.totalYears} 年，共 ${display.totalWeeks} 周`;
        container.appendChild(legend);

        // 如果未设置生之钟
        if (!_birthday) {
            const hint = document.createElement('div');
            hint.className = 'halftime-hint';
            hint.innerHTML = '💡 前往「生之钟」设置出生日期与预期寿命，获得个性化一生视图';
            container.appendChild(hint);
        }
    }

    /* ────── 生之钟 (Life Progress) ────── */

    function _renderLifeProgress(container) {
        const data = _lifeProgressFromSettings();
        const n = _now();

        // 设置区域
        const settingsSection = document.createElement('div');
        settingsSection.className = 'halftime-lifesettings';

        // 出生日期
        const birthRow = document.createElement('div');
        birthRow.className = 'halftime-lifesetting-row';
        birthRow.innerHTML = `
            <label class="halftime-lifesetting-label">出生日期</label>
            <input type="date" class="halftime-input" id="halftimeBirthday" value="${_birthday || ''}" max="${n.toISOString().split('T')[0]}">
        `;

        // 预期寿命
        const lifeRow = document.createElement('div');
        lifeRow.className = 'halftime-lifesetting-row';
        lifeRow.innerHTML = `
            <label class="halftime-lifesetting-label">预期寿命 <span class="halftime-lifesetting-val">${_lifespan} 岁</span></label>
            <input type="range" class="halftime-range" id="halftimeLifespan" min="50" max="120" value="${_lifespan}" step="1">
        `;

        settingsSection.appendChild(birthRow);
        settingsSection.appendChild(lifeRow);
        container.appendChild(settingsSection);

        // 绑定事件
        const birthdayInput = settingsSection.querySelector('#halftimeBirthday');
        const lifespanInput = settingsSection.querySelector('#halftimeLifespan');
        const lifespanVal = settingsSection.querySelector('.halftime-lifesetting-val');

        function _onSettingChange() {
            _birthday = birthdayInput.value || null;
            _lifespan = parseInt(lifespanInput.value) || 85;
            lifespanVal.textContent = _lifespan + ' 岁';
            _saveSettings();
            _renderLifeProgressDisplay(container);
        }

        birthdayInput.addEventListener('change', _onSettingChange);
        lifespanInput.addEventListener('input', () => {
            lifespanVal.textContent = lifespanInput.value + ' 岁';
        });
        lifespanInput.addEventListener('change', _onSettingChange);

        // 进度展示区
        const displayArea = document.createElement('div');
        displayArea.className = 'halftime-lifedisplay';
        displayArea.id = 'halftimeLifeDisplay';
        container.appendChild(displayArea);

        _renderLifeProgressDisplay(container);
    }

    function _renderLifeProgressDisplay(container) {
        const displayArea = container.querySelector('#halftimeLifeDisplay');
        if (!displayArea) return;

        const data = _lifeProgressFromSettings();

        if (!data || !_birthday) {
            displayArea.innerHTML = `
                <div class="halftime-life-empty">
                    <div class="halftime-life-empty-icon">🕰️</div>
                    <p>请先设置出生日期与预期寿命</p>
                    <p class="halftime-life-empty-sub">你已度过的人生，比想象中更多还是更少？</p>
                </div>
            `;
            _setSubtitle('设置出生日期以查看');
            return;
        }

        _setSubtitle(`${_birthday} 出生 · 预期 ${_lifespan} 岁 · 已过 ${(data.pct * 100).toFixed(1)}%`);

        // 圆环进度
        const pct = data.pct;
        const circumference = 2 * Math.PI * 110;
        const offset = circumference * (1 - pct);

        displayArea.innerHTML = `
            <div class="halftime-life-ring-wrapper">
                <svg class="halftime-life-ring" viewBox="0 0 260 260">
                    <circle class="halftime-life-ring-bg" cx="130" cy="130" r="110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
                    <circle class="halftime-life-ring-fg" cx="130" cy="130" r="110" fill="none" stroke="url(#halftimeGradient)" stroke-width="8"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        stroke-linecap="round" transform="rotate(-90 130 130)"/>
                    <defs>
                        <linearGradient id="halftimeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#64b5f6"/>
                            <stop offset="50%" stop-color="#ba68c8"/>
                            <stop offset="100%" stop-color="#ef5350"/>
                        </linearGradient>
                    </defs>
                </svg>
                <div class="halftime-life-ring-center">
                    <div class="halftime-life-ring-pct">${(pct * 100).toFixed(1)}%</div>
                    <div class="halftime-life-ring-age">${data.livedYears.toFixed(1)} / ${data.totalYears} 岁</div>
                </div>
            </div>
            <div class="halftime-life-stats">
                <div class="halftime-life-stat">
                    <span class="halftime-life-stat-val">${Math.round(data.elapsedWeeks).toLocaleString()}</span>
                    <span class="halftime-life-stat-label">已过周数</span>
                </div>
                <div class="halftime-life-stat">
                    <span class="halftime-life-stat-val">${Math.round(data.totalWeeks - data.elapsedWeeks).toLocaleString()}</span>
                    <span class="halftime-life-stat-label">剩余周数</span>
                </div>
                <div class="halftime-life-stat">
                    <span class="halftime-life-stat-val">${data.remainingYears.toFixed(1)}</span>
                    <span class="halftime-life-stat-label">剩余年数</span>
                </div>
            </div>
            <div class="halftime-life-quote" id="halftimeLifeQuote"></div>
        `;

        // 根据进度显示不同文案
        const quoteEl = displayArea.querySelector('#halftimeLifeQuote');
        if (quoteEl) {
            const quotes = [
                { max: 0.15, text: '人生刚刚开始，未来一切皆有可能。' },
                { max: 0.3, text: '最好的时光，或许就在此刻。' },
                { max: 0.5, text: '一半已过，一半犹存。半刻之间，亦有永恒。' },
                { max: 0.7, text: '每一个当下，都是余生最年轻的一天。' },
                { max: 0.85, text: '岁月从不败美人，亦不欺智者。' },
                { max: 1.0, text: '生命的长度有界，深度无边。' }
            ];
            for (const q of quotes) {
                if (pct < q.max) {
                    quoteEl.textContent = '「' + q.text + '」';
                    break;
                }
            }
        }
    }

    /* ────── 注册插件 ────── */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '此间半刻',
        version: '1.0.0',
        description: '极简点阵视觉语言，把一天、一周、一月、一年、一生重新呈现在眼前。',
        icon: '⏳',
        author: '滴答时钟',
        css: 'plugins/halftime/style.css',

        onInstall: async function () {
        },

        onActivate: async function () {
            _loadSettings();
            _createToolButton();
            // 注册同步键（自包含，无需修改 syncAdapter 主代码）
            if (window.syncAdapter) {
                window.syncAdapter.registerSyncKey('halftimeSettings', 'halftime_settings', _loadSettings);
            }
        },

        onDeactivate: async function () {
            _hideModal();
            _removeToolButton();
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('halftimeSettings');
            }
        },

        onUninstall: async function () {
            _hideModal();
            _removeToolButton();
            if (_modalEl) { _modalEl.remove(); _modalEl = null; }
            if (_overlayEl) { _overlayEl.remove(); _overlayEl = null; }
            if (window.syncAdapter) {
                window.syncAdapter.unregisterSyncKey('halftimeSettings');
            }
        }
    });

})();
