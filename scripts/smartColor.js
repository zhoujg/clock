// 智能颜色调整管理器
class SmartColorManager {
    constructor() {
        this.elements = {
            dateText: document.getElementById('dateText'),
            weekText: document.getElementById('weekText'),
            weatherWidget: null // 将在天气组件加载后设置
        };
        
        // 采样区域配置 - 精确对应显示元素的位置
        this.sampleRegions = [
            { x: 0.25, y: 0.06, width: 0.15, height: 0.06 },  // 日期文字区域
            { x: 0.45, y: 0.06, width: 0.1, height: 0.06 },   // 星期文字区域
            { x: 0.35, y: 0.45, width: 0.3, height: 0.15 }    // 时钟卡片区域（中心位置）
        ];
        
        // 当前颜色状态
        this.currentMode = 'light'; // 'light' 或 'dark'
        
        // 调试模式
        this.debugMode = false;
        this.debugOverlay = null;
        
        // 绑定背景变化监听
        this.observeBackgroundChanges();
        
        // 监听键盘快捷键开启调试模式（Ctrl+Shift+D）
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggleDebugMode();
            }
        });
    }
    
    // 切换调试模式
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`🐛 调试模式: ${this.debugMode ? '开启' : '关闭'}`);
        
        if (!this.debugMode && this.debugOverlay) {
            this.debugOverlay.remove();
            this.debugOverlay = null;
        } else if (this.debugMode) {
            this.analyzeAndAdjust();
        }
    }
    
    // 绘制调试覆盖层
    drawDebugOverlay() {
        if (!this.debugMode) return;
        
        // 移除旧的覆盖层
        if (this.debugOverlay) {
            this.debugOverlay.remove();
        }
        
        // 创建新的覆盖层
        this.debugOverlay = document.createElement('div');
        this.debugOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        // 绘制采样区域
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        this.sampleRegions.forEach((region, index) => {
            const box = document.createElement('div');
            const x = viewportWidth * region.x;
            const y = viewportHeight * region.y;
            const width = viewportWidth * region.width;
            const height = viewportHeight * region.height;
            
            box.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
                border: 2px dashed ${index === 0 ? '#ff0000' : '#00ff00'};
                background: rgba(255, ${index === 0 ? 0 : 255}, 0, 0.1);
                box-sizing: border-box;
            `;
            
            const label = document.createElement('div');
            label.textContent = `区域 ${index + 1}`;
            label.style.cssText = `
                position: absolute;
                top: 2px;
                left: 2px;
                color: ${index === 0 ? '#ff0000' : '#00ff00'};
                font-size: 10px;
                font-weight: bold;
                text-shadow: 0 0 3px #000, 0 0 3px #000;
            `;
            box.appendChild(label);
            
            this.debugOverlay.appendChild(box);
        });
        
        document.body.appendChild(this.debugOverlay);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (this.debugOverlay && this.debugMode) {
                this.debugOverlay.remove();
                this.debugOverlay = null;
            }
        }, 3000);
    }
    
    // 监听背景变化
    observeBackgroundChanges() {
        // 使用 MutationObserver 监听 body 的 style 变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    this.analyzeAndAdjust();
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        // 初始分析
        setTimeout(() => this.analyzeAndAdjust(), 500);
    }
    
    // 分析背景并调整文字颜色
    async analyzeAndAdjust() {
        try {
            const bodyStyle = window.getComputedStyle(document.body);
            const bgImage = bodyStyle.backgroundImage;
            
            // 如果有背景图片，分析图片颜色
            if (bgImage && bgImage !== 'none') {
                const imageUrl = this.extractImageUrl(bgImage);
                if (imageUrl) {
                    console.log('🖼️ 检测到背景图片:', imageUrl.substring(0, 100));
                    const brightness = await this.analyzeImageBrightness(imageUrl);
                    this.adjustTextColor(brightness);
                    this.drawDebugOverlay(); // 绘制调试覆盖层
                    return;
                }
            }
            
            // 如果是纯色背景，分析背景颜色
            const bgColor = bodyStyle.backgroundColor;
            if (bgColor) {
                console.log('🎨 检测到纯色背景:', bgColor);
                const brightness = this.analyzeColorBrightness(bgColor);
                this.adjustTextColor(brightness);
            }
        } catch (error) {
            console.error('❌ 智能颜色调整失败:', error);
            // 失败时使用默认的浅色文字
            this.adjustTextColor(50);
        }
    }
    
    // 从 CSS 背景图片字符串中提取 URL
    extractImageUrl(bgImage) {
        const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        return matches ? matches[1] : null;
    }
    
    // 分析图片亮度（0-100）
    analyzeImageBrightness(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 获取视口尺寸
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    // 设置 canvas 大小为采样区域
                    canvas.width = viewportWidth;
                    canvas.height = viewportHeight;
                    
                    // 绘制图片（考虑 CSS background-size: cover 的效果）
                    const imgAspect = img.width / img.height;
                    const viewportAspect = viewportWidth / viewportHeight;
                    
                    let drawWidth, drawHeight, drawX, drawY;
                    
                    if (imgAspect > viewportAspect) {
                        // 图片更宽，按高度缩放
                        drawHeight = viewportHeight;
                        drawWidth = img.width * (viewportHeight / img.height);
                        drawX = (viewportWidth - drawWidth) / 2;
                        drawY = 0;
                    } else {
                        // 图片更高，按宽度缩放
                        drawWidth = viewportWidth;
                        drawHeight = img.height * (viewportWidth / img.width);
                        drawX = 0;
                        drawY = (viewportHeight - drawHeight) / 2;
                    }
                    
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    
                    // 采样多个区域的平均亮度
                    let totalBrightness = 0;
                    const brightnessValues = [];
                    
                    for (let i = 0; i < this.sampleRegions.length; i++) {
                        const region = this.sampleRegions[i];
                        const sampleX = Math.floor(viewportWidth * region.x);
                        const sampleY = Math.floor(viewportHeight * region.y);
                        const sampleWidth = Math.floor(viewportWidth * region.width);
                        const sampleHeight = Math.floor(viewportHeight * region.height);
                        
                        console.log(`🔍 采样区域 ${i + 1}: x=${sampleX}, y=${sampleY}, w=${sampleWidth}, h=${sampleHeight}`);
                        
                        const imageData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
                        const brightness = this.calculateBrightness(imageData);
                        brightnessValues.push(brightness);
                        totalBrightness += brightness;
                    }
                    
                    const avgBrightness = totalBrightness / this.sampleRegions.length;
                    console.log(`💡 各区域亮度: [${brightnessValues.map(v => v.toFixed(1)).join('%, ')}%], 平均: ${avgBrightness.toFixed(1)}%`);
                    
                    resolve(avgBrightness);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = imageUrl;
        });
    }
    
    // 计算图像数据的亮度
    calculateBrightness(imageData) {
        const data = imageData.data;
        let totalBrightness = 0;
        let pixelCount = 0;
        
        // 减小采样间隔，提高精度（从 4 改为 2）
        const step = 2;
        
        for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // 跳过透明像素
            if (a < 128) continue;
            
            // 使用感知亮度公式
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            totalBrightness += brightness;
            pixelCount++;
        }
        
        const avgBrightness = pixelCount > 0 ? (totalBrightness / pixelCount) / 255 * 100 : 50;
        
        // 添加调试信息
        console.log(`📊 采样像素数: ${pixelCount}, 平均亮度: ${avgBrightness.toFixed(1)}%`);
        
        return avgBrightness;
    }
    
    // 分析纯色背景的亮度
    analyzeColorBrightness(colorString) {
        const rgb = this.parseColor(colorString);
        if (!rgb) return 50;
        
        // 使用感知亮度公式
        const brightness = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
        return (brightness / 255) * 100;
    }
    
    // 解析 CSS 颜色字符串
    parseColor(colorString) {
        // 处理 rgb/rgba
        const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }
        
        // 处理十六进制
        const hexMatch = colorString.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
        if (hexMatch) {
            return {
                r: parseInt(hexMatch[1], 16),
                g: parseInt(hexMatch[2], 16),
                b: parseInt(hexMatch[3], 16)
            };
        }
        
        return null;
    }
    
    // 根据亮度调整文字颜色
    adjustTextColor(brightness) {
        // 亮度阈值：降低到 60，更容易触发深色文字模式
        const threshold = 60;
        
        let textColor, shadowColor, borderColor, newMode;
        
        if (brightness < threshold) {
            // 深色背景 - 使用浅色文字
            textColor = 'rgba(255, 255, 255, 0.95)';
            shadowColor = 'rgba(0, 0, 0, 0.5)';
            borderColor = 'rgba(255, 255, 255, 0.6)';
            newMode = 'dark';
        } else {
            // 浅色背景 - 使用深色文字
            textColor = 'rgba(0, 0, 0, 0.85)';
            shadowColor = 'rgba(255, 255, 255, 0.8)';
            borderColor = 'rgba(0, 0, 0, 0.4)';
            newMode = 'light';
        }
        
        // 总是应用新颜色（即使模式没变，也确保更新）
        this.currentMode = newMode;
        this.applyColors(textColor, shadowColor, borderColor);
        
        console.log(`🎨 智能颜色调整: 背景亮度=${brightness.toFixed(1)}%, 模式=${newMode}, 文字=${newMode === 'dark' ? '浅色' : '深色'}`);
    }
    
    // 应用颜色到所有元素
    applyColors(textColor, shadowColor, borderColor) {
        // 日期文字
        if (this.elements.dateText) {
            this.elements.dateText.style.color = textColor;
            this.elements.dateText.style.textShadow = `0 2px 10px ${shadowColor}`;
        }
        
        // 星期文字
        if (this.elements.weekText) {
            this.elements.weekText.style.color = textColor;
            this.elements.weekText.style.textShadow = `0 2px 10px ${shadowColor}`;
            this.elements.weekText.style.borderLeftColor = borderColor;
        }
        
        // 时钟卡片（智能调整）
        this.adjustClockPanelColors();
        
        // 天气组件（如果存在）
        this.adjustWeatherColors(textColor, shadowColor);
        
        // 音乐播放器（如果存在）
        this.adjustMusicPlayerColors(textColor, shadowColor, borderColor);
    }
    
    // 调整时钟卡片颜色
    adjustClockPanelColors() {
        // 检查是否有背景图片
        const bodyStyle = window.getComputedStyle(document.body);
        const bgImage = bodyStyle.backgroundImage;
        
        if (!bgImage || bgImage === 'none') {
            // 如果是纯色背景，不做处理（由 BackgroundManager 处理）
            return;
        }
        
        // 有背景图片时，根据当前模式智能调整卡片背景色
        let panelBgColor, panelTextColor, panelShadowColor;
        
        if (this.currentMode === 'dark') {
            // 深色背景 - 使用半透明浅色卡片，确保对比度
            panelBgColor = 'rgba(255, 255, 255, 0.15)';
            panelTextColor = 'rgba(255, 255, 255, 0.98)';
            panelShadowColor = 'rgba(0, 0, 0, 0.6)';
        } else {
            // 浅色背景 - 使用半透明深色卡片
            panelBgColor = 'rgba(0, 0, 0, 0.18)';
            panelTextColor = 'rgba(255, 255, 255, 0.98)';
            panelShadowColor = 'rgba(0, 0, 0, 0.8)';
        }
        
        // 应用到翻转卡片面板
        const style = document.createElement('style');
        style.id = 'dynamic-flip-panel-style-smart';
        
        // 移除旧的智能样式
        const oldStyle = document.getElementById('dynamic-flip-panel-style-smart');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        style.textContent = `
            .tick-flip-panel {
                background-color: ${panelBgColor} !important;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            .tick-flip-panel .tick-text {
                color: ${panelTextColor} !important;
                text-shadow: 0 2px 8px ${panelShadowColor} !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log(`🎴 时钟卡片颜色调整: 模式=${this.currentMode}, 背景=${panelBgColor}`);
    }
    
    // 调整天气组件颜色
    adjustWeatherColors(textColor, shadowColor) {
        // 使用正确的选择器
        const weatherDisplay = document.querySelector('.weather-display');
        if (!weatherDisplay) {
            console.log('⚠️ 天气组件未找到');
            return;
        }
        
        console.log('🌤️ 调整天气组件颜色');
        
        // 调整天气容器背景（根据模式调整透明度和模糊效果）
        if (this.currentMode === 'dark') {
            // 深色背景 - 使用浅色半透明容器
            weatherDisplay.style.background = 'rgba(255, 255, 255, 0.12)';
            weatherDisplay.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            // 浅色背景 - 使用深色半透明容器
            weatherDisplay.style.background = 'rgba(0, 0, 0, 0.12)';
            weatherDisplay.style.borderColor = 'rgba(0, 0, 0, 0.2)';
        }
        
        // 温度文字
        const tempElement = weatherDisplay.querySelector('.weather-temp');
        if (tempElement) {
            tempElement.style.color = textColor;
            tempElement.style.textShadow = `0 2px 8px ${shadowColor}`;
            console.log('  ✓ 温度颜色已更新');
        }
        
        // 天气描述
        const descElement = weatherDisplay.querySelector('.weather-desc');
        if (descElement) {
            descElement.style.color = textColor;
            descElement.style.textShadow = `0 1px 6px ${shadowColor}`;
            console.log('  ✓ 描述颜色已更新');
        }
        
        // 天气图标
        const iconElement = weatherDisplay.querySelector('.weather-icon');
        if (iconElement) {
            iconElement.style.filter = this.currentMode === 'dark' 
                ? 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))' 
                : 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.8))';
            console.log('  ✓ 图标滤镜已更新');
        }
    }
    
    // 调整音乐播放器颜色
    adjustMusicPlayerColors(textColor, shadowColor, borderColor) {
        const playerContainer = document.querySelector('.bgm-player-container');
        if (!playerContainer) {
            console.log('⚠️ 音乐播放器未找到');
            return;
        }
        
        console.log('🎵 调整音乐播放器颜色');
        
        // 使用不透明的纯色背景
        if (this.currentMode === 'dark') {
            // 深色背景 - 使用浅色不透明容器
            playerContainer.style.background = 'rgba(240, 240, 245, 0.98)';
            playerContainer.style.borderColor = 'rgba(200, 200, 210, 0.8)';
            playerContainer.style.color = 'rgba(0, 0, 0, 0.9)';
        } else {
            // 浅色背景 - 使用深色不透明容器
            playerContainer.style.background = 'rgba(30, 30, 35, 0.98)';
            playerContainer.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            playerContainer.style.color = 'rgba(255, 255, 255, 0.95)';
        }
        
        // 播放器标题
        const playerTitle = playerContainer.querySelector('.player-title');
        if (playerTitle) {
            playerTitle.style.color = this.currentMode === 'dark' 
                ? 'rgba(0, 0, 0, 0.9)' 
                : 'rgba(255, 255, 255, 0.95)';
        }
        
        // 当前曲目名称
        const trackName = playerContainer.querySelector('.current-track-name');
        if (trackName) {
            trackName.style.color = this.currentMode === 'dark' 
                ? 'rgba(0, 0, 0, 0.9)' 
                : 'rgba(255, 255, 255, 0.95)';
        }
        
        // 艺术家名称
        const artistName = playerContainer.querySelector('.music-artist');
        if (artistName) {
            artistName.style.color = this.currentMode === 'dark' 
                ? 'rgba(0, 0, 0, 0.6)' 
                : 'rgba(255, 255, 255, 0.6)';
        }
        
        // 时间显示
        const timeDisplays = playerContainer.querySelectorAll('.time-display span');
        timeDisplays.forEach(span => {
            span.style.color = this.currentMode === 'dark' 
                ? 'rgba(0, 0, 0, 0.6)' 
                : 'rgba(255, 255, 255, 0.6)';
        });
        
        // 播放列表中的曲目
        const tracks = playerContainer.querySelectorAll('.music-track');
        tracks.forEach(track => {
            const trackNameEl = track.querySelector('.track-name');
            const trackIcon = track.querySelector('.track-icon');
            
            if (!track.classList.contains('active')) {
                if (trackNameEl) {
                    trackNameEl.style.color = this.currentMode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.85)' 
                        : 'rgba(255, 255, 255, 0.85)';
                }
                if (trackIcon) {
                    trackIcon.style.color = this.currentMode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.5)' 
                        : 'rgba(255, 255, 255, 0.5)';
                }
            }
            
            // 调整音轨背景 - 使用不透明背景
            if (this.currentMode === 'dark') {
                track.style.background = 'rgba(220, 220, 230, 0.5)';
            } else {
                track.style.background = 'rgba(50, 50, 55, 0.5)';
            }
        });
        
        // 无音乐提示
        const noMusic = playerContainer.querySelector('.no-music');
        if (noMusic) {
            noMusic.style.color = this.currentMode === 'dark' 
                ? 'rgba(0, 0, 0, 0.5)' 
                : 'rgba(255, 255, 255, 0.5)';
        }
        
        // 音量图标
        const volumeIcon = playerContainer.querySelector('.volume-icon');
        if (volumeIcon) {
            volumeIcon.style.color = this.currentMode === 'dark' 
                ? 'rgba(0, 0, 0, 0.7)' 
                : 'rgba(255, 255, 255, 0.7)';
        }
        
        // 控制按钮
        const controlBtns = playerContainer.querySelectorAll('.control-btn:not(.play-pause)');
        controlBtns.forEach(btn => {
            if (this.currentMode === 'dark') {
                btn.style.background = 'rgba(220, 220, 230, 0.6)';
                btn.style.borderColor = 'rgba(200, 200, 210, 0.8)';
                btn.style.color = 'rgba(0, 0, 0, 0.8)';
            } else {
                btn.style.background = 'rgba(50, 50, 55, 0.6)';
                btn.style.borderColor = 'rgba(70, 70, 75, 0.8)';
                btn.style.color = 'rgba(255, 255, 255, 0.9)';
            }
        });
        
        // 其他半透明元素 - 改为不透明
        const currentTrack = playerContainer.querySelector('.current-track');
        if (currentTrack) {
            if (this.currentMode === 'dark') {
                currentTrack.style.background = 'rgba(230, 230, 240, 0.6)';
                currentTrack.style.borderColor = 'rgba(200, 200, 210, 0.8)';
            } else {
                currentTrack.style.background = 'rgba(40, 40, 45, 0.6)';
                currentTrack.style.borderColor = 'rgba(60, 60, 65, 0.8)';
            }
        }
        
        const volumeControl = playerContainer.querySelector('.volume-control');
        if (volumeControl) {
            if (this.currentMode === 'dark') {
                volumeControl.style.background = 'rgba(230, 230, 240, 0.5)';
                volumeControl.style.borderColor = 'rgba(200, 200, 210, 0.7)';
            } else {
                volumeControl.style.background = 'rgba(40, 40, 45, 0.5)';
                volumeControl.style.borderColor = 'rgba(60, 60, 65, 0.7)';
            }
        }
        
        const playerHeader = playerContainer.querySelector('.player-header');
        if (playerHeader) {
            if (this.currentMode === 'dark') {
                playerHeader.style.background = 'rgba(220, 220, 230, 0.5)';
                playerHeader.style.borderBottomColor = 'rgba(200, 200, 210, 0.7)';
            } else {
                playerHeader.style.background = 'rgba(40, 40, 45, 0.5)';
                playerHeader.style.borderBottomColor = 'rgba(60, 60, 65, 0.7)';
            }
        }
        
        console.log('  ✓ 音乐播放器颜色已更新');
    }
    
    // 手动触发重新分析（供外部调用）
    refresh() {
        this.analyzeAndAdjust();
    }
}

// 创建全局实例
window.smartColorManager = new SmartColorManager();
