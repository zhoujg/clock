/**
 * 习惯 - 核心类
 * 日常习惯管理，支持自定义习惯、打卡记录
 */

// 预设习惯列表
const PRESET_HABITS = [
    // 运动类
    { name: '跑步', icon: '🏃', target: 1, unit: '次' },
    { name: '俯卧撑', icon: '💪', target: 3, unit: '组' },
    { name: '深蹲', icon: '🦵', target: 3, unit: '组' },
    { name: '瑜伽', icon: '🧘', target: 1, unit: '次' },
    { name: '游泳', icon: '🏊', target: 1, unit: '次' },
    { name: '散步', icon: '🚶', target: 1, unit: '次' },
    // 健康类
    { name: '喝水', icon: '💧', target: 8, unit: '杯' },
    { name: '早睡', icon: '🌙', target: 1, unit: '次' },
    { name: '冥想', icon: '🧘', target: 1, unit: '次' },
    { name: '维生素', icon: '💊', target: 1, unit: '次' },
    // 学习类
    { name: '阅读', icon: '📚', target: 1, unit: '次' },
    { name: '编程', icon: '💻', target: 1, unit: '小时' },
    { name: '外语', icon: '🗣️', target: 1, unit: '次' },
    { name: '练字', icon: '✍️', target: 1, unit: '页' },
    // 生活类
    { name: '记账', icon: '💰', target: 1, unit: '次' },
    { name: '整理', icon: '🧹', target: 1, unit: '次' },
    { name: '拍照', icon: '📷', target: 1, unit: '张' },
    { name: '写日记', icon: '📝', target: 1, unit: '篇' }
];

    // 各习惯分类的分享图主题色
const SHARE_THEMES = {
    sport:   { bg: ['#ff6b35', '#f7931e'], accent: '#fff5ee', text: '#3d1c00' },
    health:  { bg: ['#34c759', '#30b350'], accent: '#e8f8ed', text: '#0a2e12' },
    study:   { bg: ['#5e5ce6', '#7b79f7'], accent: '#ecebff', text: '#0d0c3a' },
    life:    { bg: ['#ff9500', '#ffb340'], accent: '#fff6eb', text: '#3d2000' },
    default: { bg: ['#8e8e93', '#aeaeb2'], accent: '#f2f2f7', text: '#1c1c1e' }
};

// 习惯名称 → 分类映射
const SHARE_CATEGORY_MAP = {
    '跑步': 'sport', '俯卧撑': 'sport', '深蹲': 'sport', '瑜伽': 'sport',
    '游泳': 'sport', '散步': 'sport',
    '喝水': 'health', '早睡': 'health', '冥想': 'health', '维生素': 'health',
    '阅读': 'study', '编程': 'study', '外语': 'study', '练字': 'study',
    '记账': 'life', '整理': 'life', '拍照': 'life', '写日记': 'life'
};

class HabitManager {
    constructor(clockManager) {
        this.clockManager = clockManager;
        this.habits = [];
        this.toggle = null;
        this.panel = null;
        this.overlay = null;
        this.isPanelOpen = false;

        this.init();
    }

    init() {
        this.loadHabits();
        this.createUI();
        this.bindEvents();
        this.updateToggleState();
    }

    /* ========== 数据管理 ========== */

    loadHabits() {
        const saved = localStorage.getItem('habit_data');
        if (saved) {
            try {
                this.habits = JSON.parse(saved);
            } catch (e) {
                console.error('加载习惯数据失败:', e);
                this.habits = this.getDefaultHabits();
            }
        } else {
            this.habits = this.getDefaultHabits();
        }
    }

    saveHabits() {
        localStorage.setItem('habit_data', JSON.stringify(this.habits));

        // 同步到云端（多设备同步）
        if (window.syncAdapter && window.cloudSync && window.cloudSync.isLoggedIn) {
            window.syncAdapter.pushChanges('habit_data');
        }
    }

    getDefaultHabits() {
        // 默认无打卡任务，用户可自由添加
        return [];
    }

    getTodayDateStr() {
        const now = new Date();
        return now.getFullYear() + '-' +
               String(now.getMonth() + 1).padStart(2, '0') + '-' +
               String(now.getDate()).padStart(2, '0');
    }

    getTodayRecords(habit) {
        const today = this.getTodayDateStr();
        return habit.records[today] || [];
    }

    getHabitProgress(habit) {
        const todayRecords = this.getTodayRecords(habit);
        return {
            current: todayRecords.length,
            target: habit.target,
            completed: todayRecords.length >= habit.target
        };
    }

    /* ========== UI 创建 ========== */

    createUI() {
        this.createToggle();
        this.createPanel();
    }

    createToggle() {
        this.toggle = document.getElementById('habitToggle');
        if (!this.toggle) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                this.toggle = document.createElement('button');
                this.toggle.id = 'habitToggle';
                this.toggle.className = 'bottom-tool-btn';
                this.toggle.title = '习惯';
                this.toggle.innerHTML = `
                    <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span class="tool-btn-label">习惯</span>
                    <span class="habit-badge" id="habitBadge">0</span>
                    <span class="habit-status-indicator" id="habitStatusIndicator"></span>
                `;
                toolbar.appendChild(this.toggle);
            }
        }
    }

    createPanel() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'habitOverlay';
        this.overlay.className = 'habit-overlay';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);

        // 创建面板
        this.panel = document.createElement('div');
        this.panel.id = 'habitPanel';
        this.panel.className = 'habit-panel';
        this.panel.innerHTML = `
            <div class="habit-header">
                <h3>习惯</h3>
                <button class="habit-close-btn" id="habitCloseBtn">✕</button>
            </div>
            <div class="habit-list" id="habitList"></div>
            <button class="habit-add-btn" id="habitAddBtn">+ 添加习惯</button>
        `;
        document.body.appendChild(this.panel);

        this.renderHabits();
    }

    renderHabits() {
        const list = document.getElementById('habitList');
        if (!list) return;

        list.innerHTML = '';

        this.habits.forEach(habit => {
            const progress = this.getHabitProgress(habit);
            const habitEl = document.createElement('div');
            habitEl.className = 'habit-item';
            habitEl.dataset.habitId = habit.id;

            habitEl.innerHTML = `
                <div class="habit-info">
                    <span class="habit-icon">${habit.icon}</span>
                    <span class="habit-name">${habit.name}</span>
                </div>
                <div class="habit-action">
                    <span class="habit-progress">${progress.current}/${progress.target}${habit.unit}</span>
                    <button class="habit-undo-btn ${progress.current > 0 ? '' : 'hidden'}"
                            data-habit-id="${habit.id}"
                            title="撤销一次打卡">−</button>
                    <button class="habit-checkin-btn ${progress.completed ? 'completed' : ''}"
                            data-habit-id="${habit.id}"
                            title="${progress.completed ? '点击撤销最后一次打卡' : '点击打卡'}">
                        ${progress.completed ? '✓' : '打卡'}
                    </button>
                    ${progress.completed ? `<button class="habit-share-btn" data-habit-id="${habit.id}" title="生成分享图">分享</button>` : ''}
                    <button class="habit-delete-btn" data-habit-id="${habit.id}" title="删除习惯">
                        🗑️
                    </button>
                </div>
            `;

            list.appendChild(habitEl);
        });
    }

    /* ========== 事件绑定 ========== */

    bindEvents() {
        // 切换面板显示
        if (this.toggle) {
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });
        }

        // 关闭按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'habitCloseBtn') {
                this.closePanel();
            }
        });

        // 遮罩层点击关闭
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closePanel();
            });
        }

        // 打卡按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('habit-checkin-btn')) {
                const habitId = e.target.dataset.habitId;
                this.checkin(habitId);
            }
        });

        // 撤销按钮（−）
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('habit-undo-btn')) {
                const habitId = e.target.dataset.habitId;
                this.undoCheckin(habitId);
            }
        });

        // 删除习惯按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('habit-delete-btn')) {
                const habitId = e.target.dataset.habitId;
                this.showDeleteConfirmDialog(habitId);
            }
        });

        // 分享按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('habit-share-btn')) {
                const habitId = e.target.dataset.habitId;
                this.generateShareImage(habitId);
            }
        });

        // 添加习惯按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'habitAddBtn') {
                this.showAddHabitDialog();
            }
        });
    }

    /* ========== 面板控制 ========== */

    togglePanel() {
        if (this.isPanelOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        if (this.panel && this.overlay) {
            this.panel.classList.add('open');
            this.overlay.style.display = 'block';
            this.isPanelOpen = true;
            this.renderHabits();
        }
    }

    closePanel() {
        if (this.panel && this.overlay) {
            this.panel.classList.remove('open');
            this.overlay.style.display = 'none';
            this.isPanelOpen = false;
        }
    }

    /* ========== 打卡逻辑 ========== */

    checkin(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = this.getTodayDateStr();
        if (!habit.records[today]) {
            habit.records[today] = [];
        }

        const progress = this.getHabitProgress(habit);
        const isUndo = progress.completed;

        if (progress.completed) {
            // 已完成目标 → 撤销最后一次打卡
            habit.records[today].pop();
            // 如果今日已无记录，删除该日期键
            if (habit.records[today].length === 0) {
                delete habit.records[today];
            }
        } else {
            // 未完成 → 正常打卡
            habit.records[today].push(Date.now());
        }

        this.saveHabits();
        this.renderHabits();
        this.updateToggleState();

        // 撤销时显示短暂提示
        if (isUndo) {
            this.showUndoToast(habit.name);
        }
    }

    /* ========== 撤销一次打卡 ========== */

    undoCheckin(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = this.getTodayDateStr();
        if (!habit.records[today] || habit.records[today].length === 0) return;

        // 撤销最后一次打卡
        habit.records[today].pop();
        // 如果今日已无记录，删除该日期键
        if (habit.records[today].length === 0) {
            delete habit.records[today];
        }

        this.saveHabits();
        this.renderHabits();
        this.updateToggleState();

        this.showUndoToast(habit.name);
    }

    /* ========== 撤销提示 ========== */

    showUndoToast(habitName) {
        // 移除已有的提示
        const existing = document.querySelector('.habit-undo-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'habit-undo-toast';
        toast.textContent = `已撤销「${habitName}」`;
        document.body.appendChild(toast);

        // 下一帧触发动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 1.5秒后消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    }

    /* ========== 添加习惯 ========== */

    showAddHabitDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'habit-dialog-overlay';
        overlay.style.display = 'flex';

        // 生成预设习惯列表 HTML（标记已添加的习惯）
        const presetHTML = PRESET_HABITS.map(habit => {
            const exists = this.habits.some(h => h.name === habit.name);
            return `
                <div class="preset-habit-item ${exists ? 'added' : ''}"
                     data-name="${habit.name}"
                     data-icon="${habit.icon}"
                     data-target="${habit.target}"
                     data-unit="${habit.unit}">
                    <span class="preset-habit-icon">${habit.icon}</span>
                    <span class="preset-habit-name">${habit.name}</span>
                    <span class="preset-habit-target">${habit.target}${habit.unit}/天</span>
                    ${exists ? '<span class="preset-habit-added">✓</span>' : ''}
                </div>
            `;
        }).join('');

        const dialog = document.createElement('div');
        dialog.className = 'habit-dialog';
        dialog.innerHTML = `
            <h3>添加习惯</h3>
            <div class="preset-habits-section">
                <div class="preset-habits-title">快捷选择</div>
                <div class="preset-habits-list">${presetHTML}</div>
            </div>
            <div class="dialog-divider"><span>或自定义</span></div>
            <div class="dialog-form">
                <div class="form-row">
                    <label>习惯名称</label>
                    <input type="text" id="habitNameInput" placeholder="例如：跑步" />
                </div>
                <div class="form-row">
                    <label>图标</label>
                    <input type="text" id="habitIconInput" placeholder="例如：🏃" value="✅" />
                </div>
                <div class="form-row">
                    <label>目标次数</label>
                    <input type="number" id="habitTargetInput" placeholder="例如：1" value="1" min="1" />
                </div>
                <div class="form-row">
                    <label>单位</label>
                    <input type="text" id="habitUnitInput" placeholder="例如：次" value="次" />
                </div>
            </div>
            <div class="dialog-buttons">
                <button class="dialog-cancel-btn">取消</button>
                <button class="dialog-confirm-btn">添加</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 绑定预设习惯点击事件
        dialog.querySelectorAll('.preset-habit-item:not(.added)').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const icon = item.dataset.icon;
                const target = item.dataset.target;
                const unit = item.dataset.unit;

                // 直接添加
                this.doAddHabit(name, icon, parseInt(target), unit);
                overlay.remove();
            });
        });

        // 绑定已添加习惯的点击提示
        dialog.querySelectorAll('.preset-habit-item.added').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                alert(`"${name}" 已经在习惯列表中了`);
            });
        });

        // 绑定取消按钮事件
        overlay.querySelector('.dialog-cancel-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // 绑定添加按钮事件
        overlay.querySelector('.dialog-confirm-btn').addEventListener('click', () => {
            this.addHabitFromForm(overlay);
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    // 从表单添加习惯
    addHabitFromForm(dialogOverlay) {
        const name = dialogOverlay.querySelector('#habitNameInput').value.trim();
        const icon = dialogOverlay.querySelector('#habitIconInput').value.trim() || '✅';
        const target = parseInt(dialogOverlay.querySelector('#habitTargetInput').value) || 1;
        const unit = dialogOverlay.querySelector('#habitUnitInput').value.trim() || '次';

        if (!name) {
            alert('请输入习惯名称');
            return;
        }

        this.doAddHabit(name, icon, target, unit);
        dialogOverlay.remove();
    }

    // 执行添加习惯
    doAddHabit(name, icon, target, unit) {
        // 检查是否已存在同名习惯
        const exists = this.habits.some(h => h.name === name);
        if (exists) {
            alert(`"${name}" 已经在习惯列表中了`);
            return;
        }

        const newHabit = {
            id: 'habit_' + Date.now(),
            name: name,
            icon: icon,
            target: target,
            unit: unit,
            records: {}
        };

        this.habits.push(newHabit);
        this.saveHabits();
        this.renderHabits();
        this.updateToggleState();
    }

    /* ========== 删除习惯 ========== */

    showDeleteConfirmDialog(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const overlay = document.createElement('div');
        overlay.className = 'habit-dialog-overlay';
        overlay.style.display = 'flex';

        const dialog = document.createElement('div');
        dialog.className = 'habit-dialog';
        dialog.innerHTML = `
            <h3>删除习惯</h3>
            <div class="dialog-form">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #1d1d1f; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;">
                    确定要删除「${habit.name}」吗？
                </p>
                <p style="margin: 0; font-size: 13px; color: #86868b; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;">
                    删除后该习惯的所有打卡记录将无法恢复
                </p>
            </div>
            <div class="dialog-buttons">
                <button class="dialog-cancel-btn">取消</button>
                <button class="dialog-delete-btn">删除</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 绑定事件
        overlay.querySelector('.dialog-cancel-btn').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('.dialog-delete-btn').addEventListener('click', () => {
            this.deleteHabit(habitId);
            overlay.remove();
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    deleteHabit(habitId) {
        this.habits = this.habits.filter(h => h.id !== habitId);
        this.saveHabits();
        this.renderHabits();
        this.updateToggleState();
    }

    /* ========== 状态更新 ========== */

    updateToggleState() {
        if (!this.toggle) return;

        const totalHabits = this.habits.length;
        const completedHabits = this.habits.filter(h => {
            const progress = this.getHabitProgress(h);
            return progress.completed;
        }).length;

        const uncompletedHabits = totalHabits - completedHabits;

        // 更新徽章（显示待打卡数量）
        const badge = document.getElementById('habitBadge');
        if (badge) {
            badge.className = 'habit-badge';

            if (totalHabits === 0) {
                badge.textContent = '0';
            } else if (uncompletedHabits === 0) {
                badge.textContent = '👍';
                badge.classList.add('completed');
            } else {
                badge.textContent = uncompletedHabits;
            }
        }

        // 更新状态指示灯
        const indicator = document.getElementById('habitStatusIndicator');
        if (indicator) {
            if (completedHabits === totalHabits && totalHabits > 0) {
                indicator.style.background = '#34c759';
                indicator.style.boxShadow = '0 0 8px rgba(52, 195, 89, 0.6)';
            } else if (completedHabits > 0) {
                indicator.style.background = '#ff9500';
                indicator.style.boxShadow = '0 0 8px rgba(255, 149, 0, 0.6)';
            } else {
                indicator.style.background = 'transparent';
                indicator.style.boxShadow = 'none';
            }
        }

        // 更新按钮文本
        const label = this.toggle.querySelector('.tool-btn-label');
        if (label) {
            label.textContent = '习惯';
        }
    }

    /* ========== 销毁 ========== */

    destroy() {
        this.closePanel();
        if (this.toggle) {
            this.toggle.remove();
        }
    }

    /* ========== 分享图生成 ========== */

    getShareTheme(habit) {
        const cat = SHARE_CATEGORY_MAP[habit.name] || 'default';
        return SHARE_THEMES[cat] || SHARE_THEMES['default'];
    }

    generateShareImage(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const theme = this.getShareTheme(habit);
        const today = new Date();
        const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = '周' + weekDays[today.getDay()];

        // 计算连续打卡天数
        const streak = this.calcStreak(habit);

        // 画布尺寸（竖版 9:16）
        const W = 750;
        const H = 1334;

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // ── 背景渐变 ──
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, theme.bg[0]);
        grad.addColorStop(1, theme.bg[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── 装饰圆 ──
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(W * 0.75, H * 0.18, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W * 0.2, H * 0.55, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W * 0.65, H * 0.72, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ── 顶部品牌 ──
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('滴答时钟 · 习惯', W / 2, 70);

        // ── 习惯图标（大号居中） ──
        ctx.fillStyle = '#ffffff';
        ctx.font = '120px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(habit.icon, W / 2, 250);

        // ── 底部装饰线 ──
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 60, 310);
        ctx.lineTo(W / 2 + 60, 310);
        ctx.stroke();

        // ── 习惯名称 ──
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 52px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(habit.name, W / 2, 340);

        // ── 打卡完成徽章 ──
        const badgeY = 460;
        const badgeW = 360;
        const badgeH = 80;

        // 徽章背景
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        this._roundRect(ctx, W / 2 - badgeW / 2, badgeY, badgeW, badgeH, 40);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 36px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✅ 今日已完成 ${habit.target} ${habit.unit}`, W / 2, badgeY + badgeH / 2);

        // ── 日期 ──
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '400 30px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(dateStr + ' ' + weekDay, W / 2, 590);

        // ── 连续打卡 ──
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 28px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(`🔥 连续打卡 ${streak} 天`, W / 2, 650);

        // ── 分隔线 ──
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, 720);
        ctx.lineTo(W - 80, 720);
        ctx.stroke();

        // ── 一句话激励 ──
        const quotes = [
            '坚持就是胜利 ✨',
            '每一个好习惯，都是未来的礼物 🎁',
            '今天的努力，明天的底气 💪',
            '日拱一卒，功不唐捐 🏃',
            '自律给我自由 🕊️',
            '优于别人并不高贵，真正的高贵是优于过去的自己 🌟'
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'italic 400 26px "PingFang SC", "Noto Serif SC", serif';
        ctx.fillText(quote, W / 2, 800);

        // ── 底部品牌 ──
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('— 滴答时钟 · 记录每一刻 —', W / 2, H - 80);

        // 底部装饰线
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 80, H - 55);
        ctx.lineTo(W / 2 + 80, H - 55);
        ctx.stroke();

        // 导出并预览
        const dataUrl = canvas.toDataURL('image/png');
        this.showSharePreview(habit, dataUrl);
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    calcStreak(habit) {
        let streak = 0;
        const today = new Date();
        // 检查今天是否完成
        const todayStr = this.getTodayDateStr();
        const todayRecords = habit.records[todayStr];
        const progress = todayRecords ? todayRecords.length : 0;
        if (progress < habit.target) {
            // 今天未完成，检查昨天
            const d = new Date(today);
            d.setDate(d.getDate() - 1);
            const yStr = d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
            const recs = habit.records[yStr];
            if (!recs || recs.length < habit.target) return 0;
            streak = 1;
            d.setDate(d.getDate() - 1);
            while (true) {
                const s = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
                const r = habit.records[s];
                if (!r || r.length < habit.target) break;
                streak++;
                d.setDate(d.getDate() - 1);
            }
            return streak;
        }
        // 今天已完成
        streak = 1;
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        while (true) {
            const s = d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
            const r = habit.records[s];
            if (!r || r.length < habit.target) break;
            streak++;
            d.setDate(d.getDate() - 1);
        }
        return streak;
    }

    showSharePreview(habit, dataUrl) {
        // 移除已有预览
        const existing = document.querySelector('.habit-share-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'habit-share-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'habit-share-dialog';
        dialog.innerHTML = `
            <div class="share-dialog-header">
                <span>${habit.icon} ${habit.name} · 打卡分享</span>
                <button class="share-close-btn">&times;</button>
            </div>
            <div class="share-image-wrap">
                <img src="${dataUrl}" alt="${habit.name}打卡分享图" />
            </div>
            <div class="share-actions">
                <button class="share-save-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    保存图片
                </button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 关闭
        overlay.querySelector('.share-close-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // 保存
        overlay.querySelector('.share-save-btn').addEventListener('click', () => {
            this.downloadShareImage(dataUrl, habit.name);
        });
    }

    downloadShareImage(dataUrl, habitName) {
        const link = document.createElement('a');
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        link.download = `${habitName}_打卡_${dateStr}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 导出到全局
window.HabitManager = HabitManager;
