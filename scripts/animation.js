// 动画管理器 - 兔子线条动画
class AnimationManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.enabled = false;
        this.particles = [];
        this.time = 0;
        this.isScattering = false;
        this.scatteringDuration = 60000; // 散开状态持续60秒
        this.rabbitDuration = 3000; // 兔子形态静止3秒
        this.lastStateChange = Date.now();
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 如果粒子已经存在，需要重新创建以适应新的画布大小
        if (this.particles.length > 0 && this.enabled) {
            this.createRabbitParticles();
        }
    }

    // 创建极简抽象兔子形状的粒子点（左下角位置）
    getRabbitShape() {
        // 根据屏幕宽度判断是否为移动设备，使用更合理的缩放
        const isMobile = this.canvas.width < 768;
        
        // 移动端使用更大的缩放比例和更宽松的间距
        const baseScale = isMobile ? 
            Math.min(this.canvas.width, this.canvas.height) / 8 : 
            Math.min(this.canvas.width, this.canvas.height) / 12;
        
        const scale = baseScale;
        const offsetX = scale * 1.5; // 距离左边更近
        const offsetY = this.canvas.height - scale * 2.5; // 距离底部更近
        
        const points = [];
        
        // 头部（极简圆形）- 调整点的间距
        const headAngleStep = isMobile ? 1.0 : 0.8;
        for (let angle = 0; angle < Math.PI * 2; angle += headAngleStep) {
            points.push({
                x: offsetX + Math.cos(angle) * scale * 0.7,
                y: offsetY + Math.sin(angle) * scale * 0.8
            });
        }
        
        // 左耳 - 增加点的间距，避免纵向挤压
        const earStep = isMobile ? 0.33 : 0.5;
        for (let t = 0; t <= 1; t += earStep) {
            points.push({
                x: offsetX - scale * 0.4,
                y: offsetY - scale * 0.5 - t * scale * 1.0
            });
        }
        
        // 右耳 - 增加点的间距，避免纵向挤压
        for (let t = 0; t <= 1; t += earStep) {
            points.push({
                x: offsetX + scale * 0.4,
                y: offsetY - scale * 0.5 - t * scale * 1.0
            });
        }
        
        // 身体（极简椭圆）- 调整点的间距
        const bodyAngleStep = isMobile ? 0.9 : 0.7;
        for (let angle = 0; angle < Math.PI * 2; angle += bodyAngleStep) {
            points.push({
                x: offsetX + Math.cos(angle) * scale * 0.8,
                y: offsetY + Math.sin(angle) * scale * 1.0 + scale * 1.2
            });
        }
        
        // 左前腿 - 增加点的间距
        const legStep = isMobile ? 0.5 : 1.0;
        for (let t = 0; t <= 1; t += legStep) {
            points.push({
                x: offsetX - scale * 0.4,
                y: offsetY + scale * 1.2 + t * scale * 0.6
            });
        }
        
        // 右前腿 - 增加点的间距
        for (let t = 0; t <= 1; t += legStep) {
            points.push({
                x: offsetX + scale * 0.4,
                y: offsetY + scale * 1.2 + t * scale * 0.6
            });
        }
        
        // 尾巴（3个点）
        for (let angle = 0; angle < Math.PI * 2; angle += 2.1) {
            points.push({
                x: offsetX + Math.cos(angle) * scale * 0.2 - scale * 0.9,
                y: offsetY + Math.sin(angle) * scale * 0.2 + scale * 1.2
            });
        }
        
        return points;
    }

    createRabbitParticles() {
        this.particles = [];
        const rabbitPoints = this.getRabbitShape();
        
        rabbitPoints.forEach((point, index) => {
            this.particles.push(new Particle(this.canvas, point.x, point.y, index));
        });
    }

    drawLines() {
        const maxDistance = 100;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    const opacity = 0.3 * (1 - distance / maxDistance);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        if (!this.enabled) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 检查是否需要切换状态（聚合 <-> 散开）
        const now = Date.now();
        const timeSinceChange = now - this.lastStateChange;
        
        // 根据当前状态选择对应的持续时间
        const currentDuration = this.isScattering ? this.scatteringDuration : this.rabbitDuration;
        
        if (timeSinceChange > currentDuration) {
            this.isScattering = !this.isScattering;
            this.lastStateChange = now;
        }

        // 更新和绘制粒子
        this.particles.forEach(particle => {
            particle.update(this.isScattering, this.time);
            particle.draw(this.ctx);
        });

        // 绘制连接线
        this.drawLines();

        this.time += 0.01;
        requestAnimationFrame(() => this.animate());
    }

    toggle() {
        this.enabled = !this.enabled;
        this.canvas.classList.toggle('active');
        
        if (this.enabled) {
            this.createRabbitParticles();
            this.time = 0;
            // 初始状态为兔子形态（静止），而不是散开
            this.isScattering = false;
            this.lastStateChange = Date.now();
            this.animate();
        }
    }
}
