// 粒子类 - 用于兔子线条动画（支持散开后随机移动）
class Particle {
    constructor(canvas, targetX, targetY, index) {
        this.canvas = canvas;
        // 目标位置（兔子形状上的点）
        this.targetX = targetX;
        this.targetY = targetY;
        // 当前位置（初始为目标位置）
        this.x = targetX;
        this.y = targetY;
        // 随机位置（散开时的初始位置）
        this.randomX = Math.random() * canvas.width;
        this.randomY = Math.random() * canvas.height;
        // 随机运动的速度（用于散开后的自由移动）
        this.randomVx = (Math.random() - 0.5) * 1.5;
        this.randomVy = (Math.random() - 0.5) * 1.5;
        // 速度
        this.vx = 0;
        this.vy = 0;
        // 粒子大小
        this.radius = 2.5;
        // 用于动画的进度
        this.progress = 0;
        // 缓动速度（降低速度）
        this.easing = 0.02 + Math.random() * 0.01;
        // 索引（用于错开动画）
        this.index = index;
        // 是否处于自由移动状态
        this.isFreeFalling = false;
    }

    // 更新位置 - 在目标位置和随机移动之间切换
    update(isScattering, time) {
        if (isScattering) {
            // 散开状态：自由移动
            if (!this.isFreeFalling) {
                // 刚切换到散开状态，初始化随机位置为当前位置
                this.randomX = this.x;
                this.randomY = this.y;
                this.isFreeFalling = true;
            }
            
            this.x += this.randomVx;
            this.y += this.randomVy;
            
            // 边界反弹
            if (this.x < 0 || this.x > this.canvas.width) {
                this.randomVx *= -1;
                this.x = Math.max(0, Math.min(this.canvas.width, this.x));
            }
            if (this.y < 0 || this.y > this.canvas.height) {
                this.randomVy *= -1;
                this.y = Math.max(0, Math.min(this.canvas.height, this.y));
            }
        } else {
            // 聚合状态：回到兔子形状
            this.isFreeFalling = false;
            
            // 计算与目标位置的距离
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 只有距离大于阈值时才移动，否则完全静止
            if (distance > 0.5) {
                this.vx = dx * this.easing;
                this.vy = dy * this.easing;
                
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // 完全停在目标位置
                this.x = this.targetX;
                this.y = this.targetY;
                this.vx = 0;
                this.vy = 0;
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }
}
