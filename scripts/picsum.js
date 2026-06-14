// Lorem Picsum 图片管理器
class PicsumManager {
    constructor(backgroundManager, settingsStorage) {
        this.backgroundManager = backgroundManager;
        this.settingsStorage = settingsStorage;
        this.currentPicsumId = null;
        this.currentPicsumUrl = null;
        this.favorites = this.loadFavorites();
        this.initializeFavoritesPanel();
    }

    // 加载收藏的图片
    loadFavorites() {
        try {
            const data = localStorage.getItem('picsumFavorites');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('加载收藏图片失败:', error);
            return [];
        }
    }

    // 保存收藏的图片
    saveFavorites() {
        try {
            localStorage.setItem('picsumFavorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('保存收藏图片失败:', error);
        }
    }

    // 获取随机图片URL
    getRandomImageUrl() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        // 使用时间戳确保每次都是不同的图片
        const seed = Date.now();
        return `https://picsum.photos/seed/${seed}/${width}/${height}`;
    }

    // 加载随机图片
    async loadRandomImage() {
        try {
            const imageUrl = this.getRandomImageUrl();
            
            // 创建一个新的 Image 对象来预加载
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    // 图片加载成功
                    this.currentPicsumUrl = imageUrl;
                    // 从URL中提取seed作为ID
                    const match = imageUrl.match(/seed\/(\d+)\//);
                    this.currentPicsumId = match ? match[1] : Date.now().toString();
                    
                    this.backgroundManager.setImage(imageUrl);
                    
                    // 更新收藏按钮状态
                    this.updateFavoriteButton();
                    
                    resolve(imageUrl);
                };
                
                img.onerror = () => {
                    console.error('图片加载失败');
                    reject(new Error('图片加载失败'));
                };
                
                img.src = imageUrl;
            });
        } catch (error) {
            console.error('加载随机图片失败:', error);
            throw error;
        }
    }

    // 收藏当前图片
    favoriteCurrentImage() {
        if (!this.currentPicsumUrl || !this.currentPicsumId) {
            console.warn('当前没有Picsum图片可以收藏');
            return false;
        }

        // 检查是否已收藏
        const existingIndex = this.favorites.findIndex(
            fav => fav.id === this.currentPicsumId
        );

        if (existingIndex >= 0) {
            // 已收藏，取消收藏
            this.favorites.splice(existingIndex, 1);
            this.saveFavorites();
            this.updateFavoriteButton();
            return false; // 返回 false 表示取消收藏
        } else {
            // 未收藏，添加收藏
            this.favorites.push({
                id: this.currentPicsumId,
                url: this.currentPicsumUrl,
                addedAt: Date.now()
            });
            this.saveFavorites();
            this.updateFavoriteButton();
            return true; // 返回 true 表示已收藏
        }
    }

    // 检查当前图片是否已收藏
    isCurrentImageFavorited() {
        if (!this.currentPicsumId) return false;
        return this.favorites.some(fav => fav.id === this.currentPicsumId);
    }

    // 更新收藏按钮状态
    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('randomFavoriteBtn');
        if (!favoriteBtn) return;

        if (this.isCurrentImageFavorited()) {
            favoriteBtn.classList.add('favorited');
        } else {
            favoriteBtn.classList.remove('favorited');
        }
    }

    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'picsum-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // 触发动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 3秒后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 初始化收藏夹面板
    initializeFavoritesPanel() {
        // 面板会在HTML中定义，这里只需要绑定事件
        setTimeout(() => {
            this.updateFavoritesPanel();
        }, 100);
    }

    // 更新收藏夹面板
    updateFavoritesPanel() {
        const container = document.getElementById('picsumFavoritesContainer');
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="no-favorites">
                    <div class="no-favorites-icon">📷</div>
                    <div class="no-favorites-text">暂无收藏的图片</div>
                    <div class="no-favorites-hint">点击随机图片后，使用收藏按钮保存喜欢的图片</div>
                </div>
            `;
            return;
        }

        // 显示收藏的图片（最新的在前面）
        const sortedFavorites = [...this.favorites].reverse();
        container.innerHTML = sortedFavorites.map((fav, index) => `
            <div class="favorite-item" data-id="${fav.id}" data-index="${this.favorites.length - 1 - index}">
                <div class="favorite-preview" style="background-image: url('${fav.url}');"></div>
                <div class="favorite-actions">
                    <button class="favorite-use-btn" title="使用此图片">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                    </button>
                    <button class="favorite-delete-btn" title="删除收藏">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定事件
        container.querySelectorAll('.favorite-use-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = e.target.closest('.favorite-item');
                const index = parseInt(item.dataset.index);
                this.useFavoriteImage(index);
            });
        });

        container.querySelectorAll('.favorite-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = e.target.closest('.favorite-item');
                const index = parseInt(item.dataset.index);
                this.deleteFavorite(index);
            });
        });
    }

    // 使用收藏的图片
    useFavoriteImage(index) {
        const favorite = this.favorites[index];
        if (!favorite) return;

        this.currentPicsumId = favorite.id;
        this.currentPicsumUrl = favorite.url;
        this.backgroundManager.setImage(favorite.url);
        this.updateFavoriteButton();
    }

    // 删除收藏
    deleteFavorite(index) {
        if (index < 0 || index >= this.favorites.length) return;
        
        const deletedId = this.favorites[index].id;
        this.favorites.splice(index, 1);
        this.saveFavorites();
        
        // 如果删除的是当前显示的图片，更新收藏按钮状态
        if (this.currentPicsumId === deletedId) {
            this.updateFavoriteButton();
        }
    }

    // 检查当前背景是否是Picsum图片
    checkCurrentBackground() {
        const bgImage = document.body.style.backgroundImage;
        if (bgImage && bgImage.includes('picsum.photos')) {
            const match = bgImage.match(/seed\/(\d+)\//);
            if (match) {
                this.currentPicsumId = match[1];
                this.currentPicsumUrl = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/)[1];
                this.updateFavoriteButton();
            }
        }
    }
}
