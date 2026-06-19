/**
 * 今日打卡 - 核心类
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

class CheckInTimer {
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
        const saved = localStorage.getItem('checkin_habits');
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
        localStorage.setItem('checkin_habits', JSON.stringify(this.habits));
    }

    getDefaultHabits() {
        return [
            {
                id: 'habit_' + Date.now() + '_1',
                name: '跑步',
                icon: '🏃',
                target: 1,
                unit: '次',
                records: {}
            },
            {
                id: 'habit_' + Date.now() + '_2',
                name: '俯卧撑',
                icon: '💪',
                target: 3,
                unit: '组',
                records: {}
            },
            {
                id: 'habit_' + Date.now() + '_3',
                name: '喝水',
                icon: '💧',
                target: 8,
                unit: '杯',
                records: {}
            }
        ];
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
        this.toggle = document.getElementById('checkinToggle');
        if (!this.toggle) {
            const toolbar = document.querySelector('.bottom-toolbar');
            if (toolbar) {
                this.toggle = document.createElement('button');
                this.toggle.id = 'checkinToggle';
                this.toggle.className = 'bottom-tool-btn';
                this.toggle.title = '今日打卡';
                this.toggle.innerHTML = `
                    <svg class="tool-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span class="tool-btn-label">打卡</span>
                    <span class="checkin-badge" id="checkinBadge">0</span>
                    <span class="checkin-status-indicator" id="checkinStatusIndicator"></span>
                `;
                toolbar.appendChild(this.toggle);
            }
        }
    }

    createPanel() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'checkinOverlay';
        this.overlay.className = 'checkin-overlay';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);

        // 创建面板
        this.panel = document.createElement('div');
        this.panel.id = 'checkinPanel';
        this.panel.className = 'checkin-panel';
        this.panel.innerHTML = `
            <div class="checkin-header">
                <h3>今日打卡</h3>
                <button class="checkin-close-btn" id="checkinCloseBtn">✕</button>
            </div>
            <div class="checkin-list" id="checkinList"></div>
            <button class="checkin-add-btn" id="checkinAddBtn">+ 添加习惯</button>
        `;
        document.body.appendChild(this.panel);

        this.renderHabits();
    }

    renderHabits() {
        const list = document.getElementById('checkinList');
        if (!list) return;

        list.innerHTML = '';

        this.habits.forEach(habit => {
            const progress = this.getHabitProgress(habit);
            const habitEl = document.createElement('div');
            habitEl.className = 'checkin-habit-item';
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
            if (e.target.id === 'checkinCloseBtn') {
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

        // 添加习惯按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'checkinAddBtn') {
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
        const existing = document.querySelector('.checkin-undo-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'checkin-undo-toast';
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
        overlay.className = 'checkin-dialog-overlay';
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
        dialog.className = 'checkin-dialog';
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
        overlay.className = 'checkin-dialog-overlay';
        overlay.style.display = 'flex';

        const dialog = document.createElement('div');
        dialog.className = 'checkin-dialog';
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
        const badge = document.getElementById('checkinBadge');
        if (badge) {
            badge.className = 'checkin-badge';

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
        const indicator = document.getElementById('checkinStatusIndicator');
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
            label.textContent = '打卡';
        }
    }

    /* ========== 销毁 ========== */

    destroy() {
        this.closePanel();
        if (this.toggle) {
            this.toggle.remove();
        }
    }
}

// 导出到全局
window.CheckInTimer = CheckInTimer;
