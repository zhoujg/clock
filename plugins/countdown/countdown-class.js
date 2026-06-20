/**
 * 倒计时·纪念日 - 核心类
 * 记录重要日子，计算距今天数，时钟下方常驻显示最近倒计时
 */

// 预设图标列表（添加事件时快捷选择）
const PRESET_ICONS = [
    '🎉', '🎂', '🎄', '🧧', '💝', '💍', '🎓', '✈️',
    '🏖️', '🏠', '🚗', '🏥', '📝', '💼', '🏆', '🎁',
    '❤️', '⭐', '🌟', '🔥'
];

// 预设颜色列表
const PRESET_COLORS = [
    '#FF6B6B', '#FF9500', '#FFCC00', '#34C759',
    '#5AC8FA', '#007AFF', '#5856D6', '#AF52DE',
    '#FF2D55', '#A2845E', '#8E8E93', '#00C7BE'
];

class CountdownManager {
    constructor(clockManager) {
        this.clockManager = clockManager;
        this.countdowns = [];
        this.toggle = null;
        this.panel = null;
        this.overlay = null;
        this.banner = null;
        this.isPanelOpen = false;
        this._refreshTimer = null;

        this.init();
    }

    init() {
        this.loadCountdowns();
        this.createUI();
        this.bindEvents();
        this.updateToggleState();
        this.updateBanner();
        this.startAutoRefresh();
    }

    destroy() {
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
        }
        if (this._boundPositionBanner) {
            window.removeEventListener('resize', this._boundPositionBanner);
            window.removeEventListener('orientationchange', this._boundPositionBanner);
        }
        if (this.banner && this.banner.parentNode) {
            this.banner.remove();
        }
    }

    /* ========== 数据管理 ========== */

    loadCountdowns() {
        const saved = localStorage.getItem('countdowns');
        if (saved) {
            try {
                this.countdowns = JSON.parse(saved);
            } catch (e) {
                console.error('加载倒计时数据失败:', e);
                this.countdowns = [];
            }
        } else {
            this.countdowns = [];
        }
    }

    saveCountdowns() {
        localStorage.setItem('countdowns', JSON.stringify(this.countdowns));

        // 同步到云端（多设备同步）
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('countdowns');
        }
    }

    /* ========== 核心日期算法 ========== */

    /**
     * 计算事件距今天数
     * @param {string} dateStr 'YYYY-MM-DD'
     * @param {string} repeat 'once' | 'yearly' | 'monthly'
     * @returns {{days: number, isPast: boolean, targetDate: Date}}
     */
    getDaysUntil(dateStr, repeat) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const baseDate = new Date(dateStr + 'T00:00:00');
        if (isNaN(baseDate.getTime())) {
            return { days: 0, isPast: false, targetDate: today };
        }

        if (repeat === 'once') {
            const diff = this._diffDays(today, baseDate);
            return { days: Math.abs(diff), isPast: diff < 0, targetDate: baseDate };
        }

        // 将基准日期滚动到 >= 今天的最近周期点
        let target = new Date(baseDate);
        if (repeat === 'yearly') {
            // 先把年份设为今年，若已过则设为明年
            target.setFullYear(today.getFullYear());
            if (target < today) {
                target.setFullYear(today.getFullYear() + 1);
            }
            // 处理 2 月 29 日：非闰年自动调整到 3 月 1 日
            if (target.getMonth() !== baseDate.getMonth()) {
                target = new Date(baseDate);
                target.setFullYear(today.getFullYear() + 1);
            }
        } else if (repeat === 'monthly') {
            // 月份滚动到 >= 今天
            while (target < today) {
                target.setMonth(target.getMonth() + 1);
            }
        }

        const diff = this._diffDays(today, target);
        return { days: Math.abs(diff), isPast: diff < 0, targetDate: target };
    }

    _diffDays(a, b) {
        const MS = 24 * 60 * 60 * 1000;
        return Math.round((b.getTime() - a.getTime()) / MS);
    }

    /**
     * 获取最近一个未来事件（用于常驻横幅）
     */
    getNearestFuture() {
        const futures = this.countdowns
            .map(c => ({ c, info: this.getDaysUntil(c.date, c.repeat) }))
            .filter(x => !x.info.isPast);

        if (futures.length === 0) return null;

        futures.sort((a, b) => a.info.days - b.info.days);
        return futures[0];
    }

    /* ========== UI 创建 ========== */

    createUI() {
        this.createToggle();
        this.createPanel();
        this.createBanner();
    }

    createToggle() {
        this.toggle = document.getElementById('countdownToggle');
        if (!this.toggle) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                this.toggle = document.createElement('button');
                this.toggle.id = 'countdownToggle';
                this.toggle.className = 'bottom-tool-btn';
                this.toggle.title = '倒计时·纪念日';
                this.toggle.innerHTML = `
                    <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="13" r="8"/>
                        <path d="M12 9v4l2 2"/>
                        <path d="M5 3L2 6"/>
                        <path d="M22 6l-3-3"/>
                    </svg>
                    <span class="tool-btn-label">倒数</span>
                `;
                toolbar.appendChild(this.toggle);
            }
        }
    }

    createPanel() {
        // 遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'countdownOverlay';
        this.overlay.className = 'countdown-overlay';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);

        // 面板
        this.panel = document.createElement('div');
        this.panel.id = 'countdownPanel';
        this.panel.className = 'countdown-panel';
        this.panel.innerHTML = `
            <div class="countdown-header">
                <h3>倒计时·纪念日</h3>
                <button class="countdown-close-btn" id="countdownCloseBtn">✕</button>
            </div>
            <div class="countdown-list" id="countdownList"></div>
            <button class="countdown-add-btn" id="countdownAddBtn">+ 添加倒计时</button>
        `;
        document.body.appendChild(this.panel);

        this.renderCountdowns();
    }

    /**
     * 常驻横幅：插在时钟下方，显示最近一个未来倒计时
     */
    createBanner() {
        if (document.getElementById('countdownBanner')) {
            this.banner = document.getElementById('countdownBanner');
            return;
        }
        this.banner = document.createElement('div');
        this.banner.id = 'countdownBanner';
        this.banner.className = 'countdown-banner';
        this.banner.style.display = 'none';
        this.banner.innerHTML = `
            <span class="banner-icon">🎉</span>
            <span class="banner-text"></span>
        `;
        // 追加到 body，用 fixed 定位不参与 flex 布局
        document.body.appendChild(this.banner);

        // 横幅创建后立即应用智能颜色（smartColor 初始化时横幅还不存在）
        if (window.smartColorManager) {
            window.smartColorManager.adjustCountdownBannerColors();
        }

        // 绑定 resize / orientationchange 动态重算位置
        this._boundPositionBanner = () => this.positionBanner();
        window.addEventListener('resize', this._boundPositionBanner);
        window.addEventListener('orientationchange', this._boundPositionBanner);
    }

    renderCountdowns() {
        const list = document.getElementById('countdownList');
        if (!list) return;

        list.innerHTML = '';

        if (this.countdowns.length === 0) {
            list.innerHTML = `
                <div class="countdown-empty">
                    <span class="empty-icon">⏰</span>
                    <p>还没有倒计时</p>
                    <span class="empty-hint">添加生日、考试、纪念日等重要日子</span>
                </div>
            `;
            return;
        }

        // 排序：未来事件按天数升序，过去事件排在最后
        const sorted = [...this.countdowns].sort((a, b) => {
            const ia = this.getDaysUntil(a.date, a.repeat);
            const ib = this.getDaysUntil(b.date, b.repeat);
            if (ia.isPast !== ib.isPast) return ia.isPast ? 1 : -1;
            return ia.days - ib.days;
        });

        sorted.forEach(item => {
            const info = this.getDaysUntil(item.date, item.repeat);
            const el = document.createElement('div');
            el.className = 'countdown-item' + (info.isPast ? ' past' : '');
            el.dataset.countdownId = item.id;

            const repeatLabel = { once: '仅一次', yearly: '每年', monthly: '每月' }[item.repeat] || '';
            const dateText = this._formatDate(info.targetDate);

            el.innerHTML = `
                <div class="countdown-item-icon" style="background:${item.color}20;color:${item.color};">${item.icon}</div>
                <div class="countdown-item-body">
                    <div class="countdown-item-name">${this._escape(item.title)}</div>
                    <div class="countdown-item-meta">
                        <span>${dateText}</span>
                        <span class="dot">·</span>
                        <span>${repeatLabel}</span>
                    </div>
                </div>
                <div class="countdown-item-days">
                    <span class="countdown-day-number" style="color:${info.isPast ? '#86868b' : item.color};">${info.days}</span>
                    <span class="countdown-day-unit">${info.isPast ? '天前' : '天后'}</span>
                </div>
                <button class="countdown-delete-btn" data-countdown-id="${item.id}" title="删除">🗑️</button>
            `;
            list.appendChild(el);
        });
    }

    /* ========== 事件绑定 ========== */

    bindEvents() {
        // 切换面板
        if (this.toggle) {
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });
        }

        // 关闭按钮 / 遮罩
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdownCloseBtn') this.closePanel();
        });
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closePanel());
        }

        // 添加按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdownAddBtn') this.showAddDialog();
        });

        // 删除按钮（事件委托）
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.countdown-delete-btn');
            if (btn) {
                this.showDeleteConfirmDialog(btn.dataset.countdownId);
            }
        });

        // 点击横幅打开面板
        if (this.banner) {
            this.banner.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPanel();
            });
        }
    }

    /* ========== 面板控制 ========== */

    togglePanel() {
        this.isPanelOpen ? this.closePanel() : this.openPanel();
    }

    openPanel() {
        if (this.panel && this.overlay) {
            this.panel.classList.add('open');
            this.overlay.style.display = 'block';
            this.isPanelOpen = true;
            this.renderCountdowns();
        }
    }

    closePanel() {
        if (this.panel && this.overlay) {
            this.panel.classList.remove('open');
            this.overlay.style.display = 'none';
            this.isPanelOpen = false;
        }
    }

    /* ========== 常驻横幅 ========== */

    updateBanner() {
        if (!this.banner) return;
        const nearest = this.getNearestFuture();
        if (!nearest) {
            this.banner.style.display = 'none';
            return;
        }
        const { c, info } = nearest;
        const iconEl = this.banner.querySelector('.banner-icon');
        const textEl = this.banner.querySelector('.banner-text');
        if (iconEl) iconEl.textContent = c.icon;
        if (textEl) {
            textEl.textContent = info.days === 0
                ? `今天是「${c.title}」`
                : `距${c.title}还有 ${info.days} 天`;
        }
        this.banner.style.display = 'flex';
        // 动态定位到时钟卡片左下方
        this.positionBanner();
    }

    /**
     * 动态计算横幅位置：对齐到最左边时钟卡片（小时）的正下方
     * 适配横屏/竖屏，resize/orientationchange 时自动重算
     */
    positionBanner() {
        if (!this.banner || this.banner.style.display === 'none') return;

        // 找到 flip 时钟容器
        const tickEl = document.querySelector('.tick');
        if (!tickEl) return;

        // flip 库渲染后的实际 DOM 结构：
        // .tick > [data-layout="horizontal"] > .tick-segment > .tick-flip-panel（可见卡片）
        // 必须找到第一个可视翻牌面板（小时卡片），而不是整个容器
        //
        // 按优先级尝试多种选择器：
        const targetEl =
            // 方案A：直接找第一个翻牌面板（最精确，这是用户看到的卡片）
            tickEl.querySelector('.tick-flip-panel') ||
            // 方案B：找第一个分段容器
            tickEl.querySelector('.tick-segment') ||
            // 方案C：用原始 data-key 属性找 hours
            tickEl.querySelector('[data-key="hours"]') ||
            // 方案D：兜底取整个 tick 容器（最不理想）
            tickEl;

        const rect = targetEl.getBoundingClientRect();

        const isLandscape = window.innerWidth > window.innerHeight;
        // 横屏时钟卡片更大，需要更多间距避免重叠；竖屏相对紧凑
        const GAP = isLandscape ? 130 : 60;
        const LEFT_OFFSET = isLandscape ? 4 : 4;

        let left = rect.left + LEFT_OFFSET;
        let top = rect.bottom + GAP;

        // 边界保护
        const bannerWidth = this.banner.offsetWidth || 200;
        if (left + bannerWidth > window.innerWidth - 10) {
            left = window.innerWidth - bannerWidth - 10;
        }
        if (left < 5) left = 5;
        if (top < 5) top = 5;
        const maxTop = window.innerHeight - (isLandscape ? 55 : 65);
        if (top > maxTop) top = maxTop;

        this.banner.style.left = left + 'px';
        this.banner.style.top = top + 'px';
    }

    startAutoRefresh() {
        // 每 60 秒刷新一次横幅/面板（应对跨天）
        this._refreshTimer = setInterval(() => {
            this.updateBanner();
            if (this.isPanelOpen) this.renderCountdowns();
        }, 60000);

        // 页面回到前台时刷新
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateBanner();
                if (this.isPanelOpen) this.renderCountdowns();
            }
        });
    }

    /* ========== 添加倒计时 ========== */

    showAddDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'countdown-dialog-overlay';
        overlay.style.display = 'flex';

        const today = new Date();
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

        const iconHTML = PRESET_ICONS.map((ic, i) =>
            `<span class="countdown-icon-pick${i === 0 ? ' selected' : ''}" data-icon="${ic}">${ic}</span>`
        ).join('');

        const colorHTML = PRESET_COLORS.map((cl, i) =>
            `<span class="countdown-color-pick${i === 0 ? ' selected' : ''}" data-color="${cl}" style="background:${cl};"></span>`
        ).join('');

        const dialog = document.createElement('div');
        dialog.className = 'countdown-dialog';
        dialog.innerHTML = `
            <h3>添加倒计时</h3>
            <div class="countdown-form">
                <div class="form-row">
                    <label>名称</label>
                    <input type="text" id="countdownTitleInput" placeholder="例如：生日" maxlength="20" />
                </div>
                <div class="form-row">
                    <label>日期</label>
                    <input type="date" id="countdownDateInput" value="${todayStr}" />
                </div>
                <div class="form-row">
                    <label>重复</label>
                    <select id="countdownRepeatInput">
                        <option value="once">仅一次</option>
                        <option value="yearly">每年（生日/纪念日）</option>
                        <option value="monthly">每月</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>图标</label>
                    <div class="countdown-icon-grid">${iconHTML}</div>
                </div>
                <div class="form-row">
                    <label>颜色</label>
                    <div class="countdown-color-grid">${colorHTML}</div>
                </div>
            </div>
            <div class="dialog-buttons">
                <button class="dialog-cancel-btn">取消</button>
                <button class="dialog-confirm-btn">添加</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 图标选择
        let selectedIcon = PRESET_ICONS[0];
        dialog.querySelectorAll('.countdown-icon-pick').forEach(el => {
            el.addEventListener('click', () => {
                dialog.querySelectorAll('.countdown-icon-pick').forEach(x => x.classList.remove('selected'));
                el.classList.add('selected');
                selectedIcon = el.dataset.icon;
            });
        });

        // 颜色选择
        let selectedColor = PRESET_COLORS[0];
        dialog.querySelectorAll('.countdown-color-pick').forEach(el => {
            el.addEventListener('click', () => {
                dialog.querySelectorAll('.countdown-color-pick').forEach(x => x.classList.remove('selected'));
                el.classList.add('selected');
                selectedColor = el.dataset.color;
            });
        });

        // 取消
        overlay.querySelector('.dialog-cancel-btn').addEventListener('click', () => overlay.remove());

        // 添加
        overlay.querySelector('.dialog-confirm-btn').addEventListener('click', () => {
            const title = dialog.querySelector('#countdownTitleInput').value.trim();
            const date = dialog.querySelector('#countdownDateInput').value;
            const repeat = dialog.querySelector('#countdownRepeatInput').value;

            if (!title) { this._toast('请输入名称'); return; }
            if (!date) { this._toast('请选择日期'); return; }

            this.doAdd(title, date, repeat, selectedIcon, selectedColor);
            overlay.remove();
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    doAdd(title, date, repeat, icon, color) {
        const item = {
            id: 'cd_' + Date.now(),
            title, date, repeat, icon, color,
            createdAt: Date.now()
        };
        this.countdowns.push(item);
        this.saveCountdowns();
        this.renderCountdowns();
        this.updateToggleState();
        this.updateBanner();
    }

    /* ========== 删除 ========== */

    showDeleteConfirmDialog(id) {
        const item = this.countdowns.find(c => c.id === id);
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'countdown-dialog-overlay';
        overlay.style.display = 'flex';

        const dialog = document.createElement('div');
        dialog.className = 'countdown-dialog';
        dialog.innerHTML = `
            <h3>删除倒计时</h3>
            <div class="countdown-confirm-text">
                <p>确定要删除「${this._escape(item.title)}」吗？</p>
            </div>
            <div class="dialog-buttons">
                <button class="dialog-cancel-btn">取消</button>
                <button class="dialog-delete-btn">删除</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        overlay.querySelector('.dialog-cancel-btn').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.dialog-delete-btn').addEventListener('click', () => {
            this.deleteCountdown(id);
            overlay.remove();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    deleteCountdown(id) {
        this.countdowns = this.countdowns.filter(c => c.id !== id);
        this.saveCountdowns();
        this.renderCountdowns();
        this.updateToggleState();
        this.updateBanner();
    }

    /* ========== 状态更新 ========== */

    updateToggleState() {
        // 不再需要徽章数字
    }

    /* ========== 工具方法 ========== */

    _formatDate(d) {
        return d.getFullYear() + '年' +
            (d.getMonth() + 1) + '月' +
            d.getDate() + '日';
    }

    _escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    _toast(msg) {
        const toast = document.createElement('div');
        toast.className = 'countdown-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    }
}

// 导出到全局
window.CountdownManager = CountdownManager;
