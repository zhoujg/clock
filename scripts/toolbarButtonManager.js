/**
 * 底部工具栏按钮管理器
 * 支持拖拽排序和位置记忆（桌面和移动端）
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'toolbarButtonOrder';
    const LONG_PRESS_DURATION = 500; // 长按时间（毫秒）
    
    let toolbar = null;
    let draggedElement = null;
    let dragPlaceholder = null;
    
    // 触摸相关
    let touchStartX = 0;
    let touchStartY = 0;
    let longPressTimer = null;
    let isDraggingTouch = false;
    let touchMoved = false;

    // ============ 初始化 ============

    function init() {
        toolbar = document.querySelector('.bottom-toolbar');
        if (!toolbar) {
            console.warn('[工具栏按钮管理] 未找到工具栏元素');
            return;
        }

        // 如果有保存的顺序，先短暂隐藏工具栏避免闪烁
        const hasSavedOrder = localStorage.getItem(STORAGE_KEY);
        if (hasSavedOrder) {
            toolbar.classList.add('toolbar-initializing');
        }

        // 先读取保存的顺序
        loadSavedOrder();

        // 监听按钮添加，并在添加时立即按顺序插入
        observeButtonChanges();

        // 为现有按钮添加拖拽功能
        const existingButtons = toolbar.querySelectorAll('.bottom-tool-btn');
        existingButtons.forEach(btn => {
            makeButtonDraggable(btn);
        });

        // 等待按钮加载完成后显示工具栏
        if (hasSavedOrder) {
            setTimeout(() => {
                toolbar.classList.remove('toolbar-initializing');
            }, 600);
        }
    }

    // ============ 读取保存的顺序 ============
    
    let savedButtonOrder = null;

    function loadSavedOrder() {
        try {
            const savedOrder = localStorage.getItem(STORAGE_KEY);
            if (savedOrder) {
                savedButtonOrder = JSON.parse(savedOrder);
            }
        } catch (e) {
            console.warn('[工具栏按钮管理] 读取顺序失败:', e);
            savedButtonOrder = null;
        }
    }

    // ============ 监听按钮变化 ============

    let buttonObserver = null;
    let isReordering = false; // 标记是否正在重新排列

    function observeButtonChanges() {
        buttonObserver = new MutationObserver((mutations) => {
            // 如果正在重新排列，忽略这次变化
            if (isReordering) {
                return;
            }

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('bottom-tool-btn')) {
                        // 设置重排标记
                        isReordering = true;
                        
                        // 根据保存的顺序插入到正确位置
                        insertButtonAtSavedPosition(node);
                        
                        // 添加拖拽功能
                        makeButtonDraggable(node);
                        
                        // 使用 setTimeout 确保 DOM 操作完成后再清除标记
                        setTimeout(() => {
                            isReordering = false;
                        }, 0);
                    }
                });
            });
        });

        buttonObserver.observe(toolbar, {
            childList: true,
            subtree: false
        });
    }

    // ============ 按保存的顺序插入按钮 ============

    function insertButtonAtSavedPosition(button) {
        if (!savedButtonOrder || !button.id) {
            return;
        }

        const buttonId = button.id;
        const savedIndex = savedButtonOrder.indexOf(buttonId);

        if (savedIndex === -1) {
            // 这是一个新按钮，不在保存的列表中，保持在末尾
            return;
        }

        // 查找应该插入的位置
        const allButtons = Array.from(toolbar.querySelectorAll('.bottom-tool-btn'));
        
        // 找到第一个顺序在当前按钮之后的按钮
        let insertBefore = null;
        for (const existingBtn of allButtons) {
            if (existingBtn === button) continue;
            const existingIndex = savedButtonOrder.indexOf(existingBtn.id);
            if (existingIndex > savedIndex) {
                insertBefore = existingBtn;
                break;
            }
        }

        if (insertBefore && insertBefore !== button.nextSibling) {
            toolbar.insertBefore(button, insertBefore);
        } else if (!insertBefore && toolbar.lastChild !== button) {
            // 如果没有找到，说明应该在最后
            toolbar.appendChild(button);
        } 
    }

    // ============ 使按钮可拖拽 ============

    function makeButtonDraggable(button) {
        if (button.hasAttribute('data-draggable')) {
            return;
        }
        
        button.setAttribute('data-draggable', 'true');
        button.setAttribute('draggable', 'true');

        // ===== 鼠标拖拽事件 =====
        
        // 拖拽开始
        button.addEventListener('dragstart', (e) => {
            draggedElement = button;
            button.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', button.innerHTML);
        });

        // 拖拽结束
        button.addEventListener('dragend', (e) => {
            button.classList.remove('dragging');
            draggedElement = null;
            saveButtonOrder();
        });

        // 拖拽经过
        button.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (draggedElement && draggedElement !== button) {
                // 设置重排标记，避免触发观察器
                isReordering = true;
                
                const rect = button.getBoundingClientRect();
                const midpoint = rect.left + rect.width / 2;
                
                if (e.clientX < midpoint) {
                    toolbar.insertBefore(draggedElement, button);
                } else {
                    toolbar.insertBefore(draggedElement, button.nextSibling);
                }
                
                // 使用 setTimeout 清除标记
                setTimeout(() => {
                    isReordering = false;
                }, 0);
            }
        });

        // 拖拽进入
        button.addEventListener('dragenter', (e) => {
            if (draggedElement && draggedElement !== button) {
                button.classList.add('drag-over');
            }
        });

        // 拖拽离开
        button.addEventListener('dragleave', (e) => {
            button.classList.remove('drag-over');
        });

        // 放置
        button.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.classList.remove('drag-over');
        });

        // ===== 触摸拖拽事件 =====
        
        // 触摸开始
        button.addEventListener('touchstart', (e) => {
            touchMoved = false;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;

            // 启动长按计时器
            longPressTimer = setTimeout(() => {
                isDraggingTouch = true;
                draggedElement = button;
                button.classList.add('dragging');
                
                // 触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // 显示拖拽提示
                showDragHint();
            }, LONG_PRESS_DURATION);
        }, { passive: true });

        // 触摸移动
        button.addEventListener('touchmove', (e) => {
            touchMoved = true;
            
            if (!isDraggingTouch) {
                // 如果移动超过阈值，取消长按
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchStartX);
                const deltaY = Math.abs(touch.clientY - touchStartY);
                
                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(longPressTimer);
                }
                return;
            }

            e.preventDefault();
            
            const touch = e.touches[0];
            const touchX = touch.clientX;
            
            // 移动被拖拽的按钮（视觉反馈）
            const offsetX = touchX - touchStartX;
            if (draggedElement) {
                draggedElement.style.transform = `translateX(${offsetX}px)`;
            }

            // 查找触摸点下的按钮
            const buttons = Array.from(toolbar.querySelectorAll('.bottom-tool-btn:not(.dragging)'));
            buttons.forEach(btn => btn.classList.remove('drag-over'));
            
            for (const btn of buttons) {
                const rect = btn.getBoundingClientRect();
                if (touchX >= rect.left && touchX <= rect.right) {
                    btn.classList.add('drag-over');
                    
                    // 重新排列
                    if (draggedElement !== btn) {
                        // 设置重排标记
                        isReordering = true;
                        
                        const midpoint = rect.left + rect.width / 2;
                        if (touchX < midpoint) {
                            toolbar.insertBefore(draggedElement, btn);
                        } else {
                            toolbar.insertBefore(draggedElement, btn.nextSibling);
                        }
                        
                        // 清除标记
                        setTimeout(() => {
                            isReordering = false;
                        }, 0);
                    }
                    break;
                }
            }
        }, { passive: false });

        // 触摸结束
        button.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            
            if (isDraggingTouch) {
                e.preventDefault();
                button.classList.remove('dragging');
                if (draggedElement) {
                    draggedElement.style.transform = '';
                }
                
                // 清除高亮
                toolbar.querySelectorAll('.bottom-tool-btn').forEach(btn => {
                    btn.classList.remove('drag-over');
                });
                
                draggedElement = null;
                isDraggingTouch = false;
                saveButtonOrder();
                hideDragHint();
            } else if (!touchMoved) {
                // 如果没有移动且不是拖拽，则是正常点击，不阻止默认行为
            }
        });

        // 触摸取消
        button.addEventListener('touchcancel', (e) => {
            clearTimeout(longPressTimer);
            if (isDraggingTouch) {
                button.classList.remove('dragging');
                if (draggedElement) {
                    draggedElement.style.transform = '';
                }
                toolbar.querySelectorAll('.bottom-tool-btn').forEach(btn => {
                    btn.classList.remove('drag-over');
                });
                draggedElement = null;
                isDraggingTouch = false;
                hideDragHint();
            }
        });

        // 添加视觉提示
        addDragHint(button);
    }

    // ============ 占位符 ============

    function createPlaceholder() {
        if (!dragPlaceholder) {
            dragPlaceholder = document.createElement('div');
            dragPlaceholder.className = 'toolbar-drag-placeholder';
            dragPlaceholder.style.cssText = `
                width: 60px;
                height: 60px;
                border: 2px dashed rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.05);
                flex-shrink: 0;
            `;
        }
    }

    function removePlaceholder() {
        if (dragPlaceholder && dragPlaceholder.parentNode) {
            dragPlaceholder.remove();
        }
    }

    // ============ 拖拽提示（全局提示层） ============

    let dragHintOverlay = null;

    function showDragHint() {
        if (!dragHintOverlay) {
            dragHintOverlay = document.createElement('div');
            dragHintOverlay.className = 'toolbar-drag-hint-overlay';
            dragHintOverlay.textContent = '拖动调整按钮顺序';
            dragHintOverlay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                pointer-events: none;
                animation: fadeIn 0.3s;
            `;
            document.body.appendChild(dragHintOverlay);
        }
        dragHintOverlay.style.display = 'block';
    }

    function hideDragHint() {
        if (dragHintOverlay) {
            dragHintOverlay.style.display = 'none';
        }
    }

    // ============ 拖拽提示图标 ============

    function addDragHint(button) {
        // 添加一个小图标表示可拖拽
        if (button.querySelector('.drag-hint')) {
            return;
        }

        const hint = document.createElement('div');
        hint.className = 'drag-hint';
        hint.innerHTML = '⋮⋮';
        hint.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        `;

        // 确保按钮有相对定位
        const currentPosition = window.getComputedStyle(button).position;
        if (currentPosition === 'static') {
            button.style.position = 'relative';
        }
        
        button.appendChild(hint);

        // 桌面端：鼠标悬停时显示提示
        button.addEventListener('mouseenter', () => {
            if (!isDraggingTouch) {
                hint.style.opacity = '1';
            }
        });

        button.addEventListener('mouseleave', () => {
            hint.style.opacity = '0';
        });

        // 移动端：触摸时短暂显示提示
        button.addEventListener('touchstart', () => {
            hint.style.opacity = '1';
            setTimeout(() => {
                if (!isDraggingTouch) {
                    hint.style.opacity = '0';
                }
            }, 2000);
        }, { passive: true });
    }

    // ============ 保存和恢复顺序 ============

    function saveButtonOrder() {
        const buttons = Array.from(toolbar.querySelectorAll('.bottom-tool-btn'));
        const order = buttons.map(btn => btn.id).filter(id => id);
        
        try {
            // 设置重排标记，防止保存时触发观察器
            isReordering = true;
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
            savedButtonOrder = order; // 同时更新内存中的顺序
            
            // 清除标记
            setTimeout(() => {
                isReordering = false;
            }, 0);
        } catch (e) {
            console.warn('[工具栏按钮管理] 保存顺序失败:', e);
            isReordering = false;
        }
    }

    function applySavedOrder() {
        try {
            const savedOrder = localStorage.getItem(STORAGE_KEY);
            if (!savedOrder) {
                return;
            }

            const order = JSON.parse(savedOrder);
            
            const buttons = Array.from(toolbar.querySelectorAll('.bottom-tool-btn'));
            
            // 创建按钮映射
            const buttonMap = {};
            buttons.forEach(btn => {
                if (btn.id) buttonMap[btn.id] = btn;
            });

            // 按保存的顺序重新排列
            let reordered = 0;
            order.forEach((id) => {
                const button = buttonMap[id];
                if (button && button.parentNode === toolbar) {
                    toolbar.appendChild(button);
                    reordered++;
                    delete buttonMap[id]; // 标记为已处理
                }
            });

            // 添加未在保存列表中的新按钮（保持在末尾）
            buttons.forEach(btn => {
                if (btn.id && buttonMap[btn.id] && btn.parentNode === toolbar) {
                    toolbar.appendChild(btn);
                }
            });

        } catch (e) {
            console.warn('[工具栏按钮管理] 恢复顺序失败:', e);
        }
    }

    // ============ 添加样式 ============

    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 初始隐藏工具栏，避免重排闪烁 */
            .bottom-toolbar {
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            .bottom-toolbar.toolbar-initializing {
                opacity: 0;
            }

            .bottom-tool-btn {
                cursor: move;
                transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s;
                touch-action: none;
            }

            .bottom-tool-btn.dragging {
                opacity: 0.6;
                transform: scale(1.1);
                z-index: 1000;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }

            .bottom-tool-btn.drag-over {
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                transform: scale(1.05);
            }

            .toolbar-drag-placeholder {
                pointer-events: none;
            }

            /* 拖拽时的光标 */
            .bottom-tool-btn[draggable="true"] {
                -webkit-user-select: none;
                user-select: none;
            }

            /* 拖拽提示淡入动画 */
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            /* 移动端优化 */
            @media (max-width: 768px) {
                .bottom-tool-btn {
                    cursor: default;
                }
                
                .drag-hint {
                    font-size: 12px !important;
                    opacity: 0.6 !important;
                }
            }

            /* 防止工具栏在拖拽时滚动 */
            .bottom-toolbar.dragging-active {
                overflow-x: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    // ============ 公共 API ============

    window.ToolbarButtonManager = {
        init: init,
        saveOrder: saveButtonOrder,
        restoreOrder: applySavedOrder,
        clearOrder: () => {
            localStorage.removeItem(STORAGE_KEY);
        },
        getOrder: () => {
            const savedOrder = localStorage.getItem(STORAGE_KEY);
            return savedOrder ? JSON.parse(savedOrder) : null;
        },
        getCurrentOrder: () => {
            const buttons = Array.from(toolbar.querySelectorAll('.bottom-tool-btn'));
            return buttons.map(btn => btn.id).filter(id => id);
        }
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addStyles();
            init();
        });
    } else {
        addStyles();
        init();
    }

})();
