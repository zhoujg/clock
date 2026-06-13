// 虚拟森林系统
class ForestSystem {
    constructor(achievementSystem) {
        this.achievementSystem = achievementSystem;
        this.trees = []; // 所有种植的树木
        this.currentTree = null; // 当前正在成长的树
        this.container = null;
        this.panel = null;
        
        // 树的种类配置（根据番茄钟时长）
        this.treeTypes = {
            small: { name: '小树苗', minutes: 15, emoji: '🌱', color: '#90EE90' },
            medium: { name: '小树', minutes: 25, emoji: '🌿', color: '#32CD32' },
            large: { name: '大树', minutes: 45, emoji: '🌳', color: '#228B22' },
            giant: { name: '参天大树', minutes: 60, emoji: '🌲', color: '#006400' }
        };
        
        this.loadData();
        this.init();
    }
    
    init() {
        this.createUI();
        this.bindEvents();
        this.updateDisplay();
        this.initGrowingTreeDisplay();
    }
    
    initGrowingTreeDisplay() {
        // 获取首页树苗显示元素
        this.growingTreeDisplay = document.getElementById('growingTreeDisplay');
        this.treeIconLarge = document.getElementById('treeIconLarge');
        this.treeTypeName = document.getElementById('treeTypeName');
        this.treeProgressMiniFill = document.getElementById('treeProgressMiniFill');
    }
    
    loadData() {
        const data = localStorage.getItem('forestData');
        if (data) {
            const parsed = JSON.parse(data);
            this.trees = parsed.trees || [];
        }
    }
    
    saveData() {
        localStorage.setItem('forestData', JSON.stringify({
            trees: this.trees
        }));
    }
    
    createUI() {
        // 创建森林按钮容器
        this.container = document.createElement('div');
        this.container.className = 'forest-container';
        this.container.innerHTML = `
            <div class="forest-toggle" id="forestToggle" title="我的森林">
                🌲
                <span class="forest-badge" id="forestBadge">0</span>
            </div>
            <div class="forest-panel" id="forestPanel">
                <div class="panel-header">
                    <span>🌲 我的森林</span>
                    <button class="panel-close-btn" id="forestClose" title="关闭">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="panel-content">
                    <div class="forest-stats">
                        <div class="stat-item">
                            <span class="stat-label">种植树木</span>
                            <span class="stat-value" id="totalTrees">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">健康树木</span>
                            <span class="stat-value" id="healthyTrees">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">枯萎树木</span>
                            <span class="stat-value" id="deadTrees">0</span>
                        </div>
                    </div>
                    
                    <div class="current-tree" id="currentTreeSection" style="display: none;">
                        <div class="current-tree-header">🌱 正在成长</div>
                        <div class="tree-growing" id="treeGrowing">
                            <div class="tree-icon" id="currentTreeIcon">🌱</div>
                            <div class="tree-info">
                                <div class="tree-type" id="currentTreeType">小树苗</div>
                                <div class="tree-progress-bar">
                                    <div class="tree-progress-fill" id="treeProgressFill"></div>
                                </div>
                                <div class="tree-time" id="currentTreeTime">剩余 25:00</div>
                            </div>
                        </div>
                        <div class="tree-tip">💡 专注完成，让小树健康成长！</div>
                    </div>
                    
                    <div class="forest-view-section">
                        <button class="forest-view-btn" id="viewForestBtn">
                            🌳 查看完整森林
                        </button>
                    </div>
                    
                    <div class="recent-trees" id="recentTrees">
                        <div class="recent-trees-header">最近种植</div>
                        <div class="recent-trees-list" id="recentTreesList">
                            <div class="no-trees">还没有种植任何树木</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 插入到页面中，成就按钮之后
        const achievementToggle = document.getElementById('achievementToggle');
        if (achievementToggle && achievementToggle.parentElement) {
            achievementToggle.parentElement.insertBefore(this.container, achievementToggle.nextSibling);
        } else {
            document.body.appendChild(this.container);
        }
        
        // 获取DOM元素引用
        this.toggle = document.getElementById('forestToggle');
        this.badge = document.getElementById('forestBadge');
        this.panel = document.getElementById('forestPanel');
        this.currentTreeSection = document.getElementById('currentTreeSection');
        this.treeGrowing = document.getElementById('treeGrowing');
        this.currentTreeIcon = document.getElementById('currentTreeIcon');
        this.currentTreeType = document.getElementById('currentTreeType');
        this.treeProgressFill = document.getElementById('treeProgressFill');
        this.currentTreeTime = document.getElementById('currentTreeTime');
        this.recentTreesList = document.getElementById('recentTreesList');
    }
    
    bindEvents() {
        const closeBtn = document.getElementById('forestClose');
        
        // 切换面板显示
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            // 直接打开森林模态框，不显示小面板
            this.showForestModal();
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.panel.classList.remove('active');
            this.toggle.classList.remove('active');
        });
        
        // 阻止面板内点击冒泡
        this.panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    closeOtherPanels() {
        const panels = ['settingsPanel', 'musicPanel', 'pomodoroPanel', 'achievementPanel'];
        const toggles = ['settingsToggle', 'musicBtn', 'pomodoroToggle', 'achievementToggle'];
        
        panels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) panel.classList.remove('active');
        });
        
        toggles.forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) toggle.classList.remove('active');
        });
    }
    
    // 开始种树（番茄钟开始时调用）
    startPlanting(duration) {
        // 确定树的类型
        const treeType = this.getTreeType(duration);
        
        this.currentTree = {
            type: treeType,
            startTime: Date.now(),
            duration: duration * 60 * 1000, // 转换为毫秒
            status: 'growing', // growing, completed, dead
            completedTime: null
        };
        
        // 更新UI
        this.updateCurrentTree();
        this.currentTreeSection.style.display = 'block';
        
        // 显示首页成长树苗
        this.showGrowingTreeOnMainPage();
    }
    
    // 更新当前树的状态（番茄钟运行时定时调用）
    updateTreeProgress(remainingSeconds) {
        if (!this.currentTree) return;
        
        const totalSeconds = this.currentTree.duration / 1000;
        const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
        
        this.treeProgressFill.style.width = `${Math.min(progress, 100)}%`;
        
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        this.currentTreeTime.textContent = `剩余 ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 根据进度更新树的图标
        this.updateTreeIcon(progress);
        
        // 更新首页树苗显示
        this.updateGrowingTreeOnMainPage(progress);
    }
    
    updateTreeIcon(progress) {
        if (!this.currentTree) return;
        
        const typeConfig = this.treeTypes[this.currentTree.type];
        
        if (progress < 25) {
            this.currentTreeIcon.textContent = '🌱';
        } else if (progress < 50) {
            this.currentTreeIcon.textContent = '🌿';
        } else if (progress < 75) {
            this.currentTreeIcon.textContent = '🌳';
        } else {
            this.currentTreeIcon.textContent = typeConfig.emoji;
        }
    }
    
    // 完成种树（番茄钟成功完成时调用）
    completePlanting() {
        if (!this.currentTree) return;
        
        this.currentTree.status = 'completed';
        this.currentTree.completedTime = Date.now();
        
        // 添加到森林
        this.trees.push(this.currentTree);
        this.saveData();
        
        // 显示成功动画
        this.showTreeCompletedAnimation();
        
        // 首页树苗完成动画
        this.completeGrowingTreeOnMainPage();
        
        // 重置当前树
        this.currentTree = null;
        this.currentTreeSection.style.display = 'none';
        
        // 更新显示
        this.updateDisplay();
        
        // 触发成就检查
        if (this.achievementSystem) {
            this.checkForestAchievements();
        }
    }
    
    // 放弃种树（番茄钟中途放弃时调用）
    abandonPlanting() {
        if (!this.currentTree) return;
        
        this.currentTree.status = 'dead';
        this.currentTree.completedTime = Date.now();
        
        // 添加到森林（枯萎的树也保留）
        this.trees.push(this.currentTree);
        this.saveData();
        
        // 显示枯萎动画
        this.showTreeDeadAnimation();
        
        // 首页树苗枯萎动画
        this.witherGrowingTreeOnMainPage();
        
        // 重置当前树
        this.currentTree = null;
        this.currentTreeSection.style.display = 'none';
        
        // 更新显示
        this.updateDisplay();
    }
    
    showTreeCompletedAnimation() {
        const typeConfig = this.treeTypes[this.currentTree.type];
        
        // 创建通知提示
        const notification = document.createElement('div');
        notification.className = 'forest-notification success';
        notification.innerHTML = `
            <div class="notification-icon">${typeConfig.emoji}</div>
            <div class="notification-text">
                <div class="notification-title">🎉 种植成功！</div>
                <div class="notification-desc">获得一棵${typeConfig.name}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    showTreeDeadAnimation() {
        const notification = document.createElement('div');
        notification.className = 'forest-notification failed';
        notification.innerHTML = `
            <div class="notification-icon">🥀</div>
            <div class="notification-text">
                <div class="notification-title">💔 树苗枯萎了</div>
                <div class="notification-desc">继续努力，下次一定能种出健康的树！</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    updateCurrentTree() {
        if (!this.currentTree) return;
        
        const typeConfig = this.treeTypes[this.currentTree.type];
        this.currentTreeIcon.textContent = '🌱';
        this.currentTreeType.textContent = typeConfig.name;
        
        const minutes = Math.floor(this.currentTree.duration / 60000);
        this.currentTreeTime.textContent = `剩余 ${String(minutes).padStart(2, '0')}:00`;
        this.treeProgressFill.style.width = '0%';
    }
    
    updateDisplay() {
        // 更新统计数据
        const totalTrees = this.trees.length;
        const healthyTrees = this.trees.filter(t => t.status === 'completed').length;
        const deadTrees = this.trees.filter(t => t.status === 'dead').length;
        
        document.getElementById('totalTrees').textContent = totalTrees;
        document.getElementById('healthyTrees').textContent = healthyTrees;
        document.getElementById('deadTrees').textContent = deadTrees;
        
        // 更新徽章
        this.badge.textContent = healthyTrees;
        if (healthyTrees > 0) {
            this.badge.style.display = 'flex';
        } else {
            this.badge.style.display = 'none';
        }
        
        // 更新最近种植列表
        this.updateRecentTrees();
    }
    
    updateRecentTrees() {
        if (this.trees.length === 0) {
            this.recentTreesList.innerHTML = '<div class="no-trees">还没有种植任何树木</div>';
            return;
        }
        
        // 显示最近10棵树
        const recentTrees = [...this.trees].reverse().slice(0, 10);
        
        this.recentTreesList.innerHTML = recentTrees.map(tree => {
            const typeConfig = this.treeTypes[tree.type];
            const date = new Date(tree.completedTime);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            return `
                <div class="tree-item ${tree.status}">
                    <div class="tree-item-icon">${tree.status === 'completed' ? typeConfig.emoji : '🥀'}</div>
                    <div class="tree-item-info">
                        <div class="tree-item-name">${tree.status === 'completed' ? typeConfig.name : '枯萎的树苗'}</div>
                        <div class="tree-item-time">${dateStr}</div>
                    </div>
                    <div class="tree-item-status ${tree.status}">
                        ${tree.status === 'completed' ? '✓' : '✗'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getTreeType(minutes) {
        if (minutes >= 60) return 'giant';
        if (minutes >= 45) return 'large';
        if (minutes >= 25) return 'medium';
        return 'small';
    }
    
    openForestView() {
        // 创建并显示全屏森林模态框
        this.showForestModal();
    }
    
    checkForestAchievements() {
        const healthyTrees = this.trees.filter(t => t.status === 'completed').length;
        
        // 这里可以添加森林相关的成就
        // 例如：种植10棵树、种植50棵树、连续7天种树等
    }
    
    // 导出数据供森林页面使用
    exportForestData() {
        return {
            trees: this.trees,
            treeTypes: this.treeTypes
        };
    }
    
    // ===== 首页成长树苗显示方法 =====
    
    // 显示首页成长树苗
    showGrowingTreeOnMainPage() {
        if (!this.growingTreeDisplay || !this.currentTree) return;
        
        const typeConfig = this.treeTypes[this.currentTree.type];
        
        // 设置初始状态
        this.treeIconLarge.textContent = '🌱';
        this.treeIconLarge.className = 'tree-icon-large stage-seed';
        this.treeTypeName.textContent = typeConfig.name;
        this.treeProgressMiniFill.style.width = '0%';
        
        // 显示组件
        this.growingTreeDisplay.style.display = 'block';
        setTimeout(() => {
            this.growingTreeDisplay.classList.add('show');
        }, 100);
    }
    
    // 更新首页成长树苗
    updateGrowingTreeOnMainPage(progress) {
        if (!this.growingTreeDisplay || !this.currentTree) return;
        
        const typeConfig = this.treeTypes[this.currentTree.type];
        
        // 更新进度条
        this.treeProgressMiniFill.style.width = `${Math.min(progress, 100)}%`;
        
        // 根据进度更新图标和大小
        let icon = '🌱';
        let stage = 'stage-seed';
        
        if (progress < 20) {
            icon = '🌱';
            stage = 'stage-seed';
        } else if (progress < 40) {
            icon = '🌿';
            stage = 'stage-sprout';
        } else if (progress < 60) {
            icon = '🌳';
            stage = 'stage-young';
        } else if (progress < 80) {
            icon = typeConfig.emoji;
            stage = 'stage-mature';
        } else {
            icon = typeConfig.emoji;
            stage = 'stage-full';
        }
        
        this.treeIconLarge.textContent = icon;
        this.treeIconLarge.className = `tree-icon-large ${stage}`;
    }
    
    // 完成首页成长树苗（播放完成动画）
    completeGrowingTreeOnMainPage() {
        if (!this.growingTreeDisplay || !this.treeIconLarge) return;
        
        // 播放完成动画
        this.treeIconLarge.classList.add('complete');
        
        // 动画结束后隐藏
        setTimeout(() => {
            this.hideGrowingTreeOnMainPage();
        }, 1500);
    }
    
    // 枯萎首页成长树苗（播放枯萎动画）
    witherGrowingTreeOnMainPage() {
        if (!this.growingTreeDisplay || !this.treeIconLarge) return;
        
        // 改变为枯萎图标
        this.treeIconLarge.textContent = '🥀';
        
        // 播放枯萎动画
        this.treeIconLarge.classList.add('wither');
        
        // 动画结束后隐藏
        setTimeout(() => {
            this.hideGrowingTreeOnMainPage();
        }, 1200);
    }
    
    // 隐藏首页成长树苗
    hideGrowingTreeOnMainPage() {
        if (!this.growingTreeDisplay) return;
        
        this.growingTreeDisplay.classList.remove('show');
        
        setTimeout(() => {
            this.growingTreeDisplay.style.display = 'none';
            // 清除动画类
            if (this.treeIconLarge) {
                this.treeIconLarge.classList.remove('complete', 'wither');
            }
        }, 500);
    }
    
    // ===== 森林模态框方法 =====
    
    // 显示森林模态框
    showForestModal() {
        // 创建模态框（如果不存在）
        if (!document.getElementById('forestModal')) {
            this.createForestModal();
        }
        
        // 渲染森林内容
        this.renderForestContent();
        
        // 显示模态框
        const modal = document.getElementById('forestModal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    // 创建森林模态框
    createForestModal() {
        const modal = document.createElement('div');
        modal.id = 'forestModal';
        modal.className = 'forest-modal';
        modal.innerHTML = `
            <div class="forest-modal-content">
                <div class="forest-modal-header">
                    <h1 class="forest-modal-title">
                        <span class="title-icon">🌲</span>
                        我的森林
                        <span class="title-icon">🌳</span>
                    </h1>
                    <button class="forest-modal-close" id="forestModalClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <p class="forest-modal-subtitle">每一棵树，都是你努力的见证</p>
                
                <div class="forest-modal-stats">
                    <div class="modal-stat-card">
                        <div class="modal-stat-label">总种植</div>
                        <div class="modal-stat-value" id="modalTotalTrees">0</div>
                    </div>
                    <div class="modal-stat-card">
                        <div class="modal-stat-label">健康树木</div>
                        <div class="modal-stat-value" id="modalHealthyTrees">0</div>
                    </div>
                    <div class="modal-stat-card">
                        <div class="modal-stat-label">枯萎树木</div>
                        <div class="modal-stat-value" id="modalDeadTrees">0</div>
                    </div>
                    <div class="modal-stat-card">
                        <div class="modal-stat-label">成功率</div>
                        <div class="modal-stat-value" id="modalSuccessRate">0%</div>
                    </div>
                </div>
                
                <div class="forest-modal-grid" id="forestModalGrid">
                    <!-- 树木将通过 JavaScript 动态生成 -->
                </div>
                
                <div class="forest-modal-empty" id="forestModalEmpty" style="display: none;">
                    <div class="empty-icon">🌱</div>
                    <h2>你的森林还是空的</h2>
                    <p>完成一个番茄钟，开始种植你的第一棵树吧！</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = document.getElementById('forestModalClose');
        closeBtn.addEventListener('click', () => this.hideForestModal());
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideForestModal();
            }
        });
    }
    
    // 渲染森林内容
    renderForestContent() {
        const totalTrees = this.trees.length;
        const healthyTrees = this.trees.filter(t => t.status === 'completed').length;
        const deadTrees = this.trees.filter(t => t.status === 'dead').length;
        const successRate = totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 100) : 0;
        
        // 更新统计数据
        document.getElementById('modalTotalTrees').textContent = totalTrees;
        document.getElementById('modalHealthyTrees').textContent = healthyTrees;
        document.getElementById('modalDeadTrees').textContent = deadTrees;
        document.getElementById('modalSuccessRate').textContent = successRate + '%';
        
        const grid = document.getElementById('forestModalGrid');
        const empty = document.getElementById('forestModalEmpty');
        
        if (totalTrees === 0) {
            grid.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }
        
        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        // 按时间倒序排列
        const sortedTrees = [...this.trees].reverse();
        
        grid.innerHTML = sortedTrees.map((tree, index) => {
            const typeConfig = this.treeTypes[tree.type] || this.treeTypes.small;
            const date = new Date(tree.completedTime);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            const isHealthy = tree.status === 'completed';
            const emoji = isHealthy ? typeConfig.emoji : '🥀';
            const name = isHealthy ? typeConfig.name : '枯萎的树苗';
            
            return `
                <div class="modal-tree-card ${isHealthy ? 'healthy' : 'dead'}" 
                     style="animation-delay: ${Math.min(index * 0.02, 2)}s;"
                     title="${name} - ${dateStr} ${timeStr}">
                    <div class="modal-tree-emoji">${emoji}</div>
                    <div class="modal-tree-name">${name}</div>
                    <div class="modal-tree-date">${dateStr}</div>
                </div>
            `;
        }).join('');
    }
    
    // 隐藏森林模态框
    hideForestModal() {
        const modal = document.getElementById('forestModal');
        if (!modal) return;
        
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}
