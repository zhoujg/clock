// 背景管理器
class BackgroundManager {
    constructor() {
        this.currentBackground = '#e74c3c';
    }

    setColor(color) {
        document.body.style.background = color;
        document.body.style.backgroundImage = 'none';
        this.currentBackground = color;
        this.updateFlipPanelColor(color);
    }

    // 根据背景色计算合适的翻转卡片颜色
    updateFlipPanelColor(bgColor) {
        // 解析背景色的RGB值
        const rgb = this.hexToRgb(bgColor);
        if (!rgb) return;

        // 计算亮度 (使用相对亮度公式)
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

        // 根据背景色亮度调整卡片颜色
        let panelColor;
        if (brightness > 128) {
            // 浅色背景，使用深色卡片
            panelColor = this.adjustColor(bgColor, -40);
        } else {
            // 深色背景，使用稍亮的卡片
            panelColor = this.adjustColor(bgColor, 30);
        }

        // 应用到翻转卡片面板
        const style = document.createElement('style');
        style.id = 'dynamic-flip-panel-style';
        
        // 移除旧的动态样式
        const oldStyle = document.getElementById('dynamic-flip-panel-style');
        if (oldStyle) {
            oldStyle.remove();
        }

        style.textContent = `
            .tick-flip-panel {
                background-color: ${panelColor} !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 将十六进制颜色转换为RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // 调整颜色亮度
    adjustColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        const r = Math.max(0, Math.min(255, rgb.r + amount));
        const g = Math.max(0, Math.min(255, rgb.g + amount));
        const b = Math.max(0, Math.min(255, rgb.b + amount));

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    setImage(imageUrl) {
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            this.setImage(event.target.result);
        };
        reader.readAsDataURL(file);
    }
}
