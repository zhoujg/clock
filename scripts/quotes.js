// 励志语管理器
class QuoteManager {
    constructor() {
        this.quotes = [];
        this.currentQuoteIndex = 0;
        this.displayDuration = 10000; // 10秒切换一次
        this.fadeDuration = 1000; // 1秒淡入淡出
        this.init();
    }
    
    // 从quotes-data.js加载励志语
    loadQuotesFromData() {
        // quotes-data.js 会定义全局变量 QUOTES_DATA
        if (window.QUOTES_DATA && Array.isArray(window.QUOTES_DATA)) {
            this.quotes = window.QUOTES_DATA;
        } else {
            console.warn('未找到励志语数据，使用默认励志语');
            this.quotes = [{
                english: "Every day is a new beginning.",
                chinese: "每一天都是新的开始。"
            }];
        }
    }
    
    init() {
        this.quoteContainer = document.querySelector('.quote-container');
        if (this.quoteContainer) {
            // 加载励志语
            this.loadQuotesFromData();
            // 显示第一条
            this.showRandomQuote();
            // 开始轮播
            this.startRotation();
        }
    }

    
    // 获取随机励志语
    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        this.currentQuoteIndex = randomIndex;
        return this.quotes[randomIndex];
    }
    
    // 显示励志语
    showRandomQuote() {
        if (!this.quoteContainer) return;
        
        const quote = this.getRandomQuote();
        const quoteElement = document.getElementById('quoteDisplay');
        const englishElement = document.getElementById('quoteEnglish');
        const chineseElement = document.getElementById('quoteChinese');
        
        // 在动画开始前暂时禁用 backdrop-filter 以避免闪烁
        const originalBackdropFilter = quoteElement.style.backdropFilter || '';
        const originalWebkitBackdropFilter = quoteElement.style.webkitBackdropFilter || '';
        
        // 使用requestAnimationFrame确保流畅渲染
        requestAnimationFrame(() => {
            // 临时禁用 backdrop-filter
            quoteElement.style.backdropFilter = 'none';
            quoteElement.style.webkitBackdropFilter = 'none';
            
            // 淡出
            quoteElement.style.opacity = '0';
            
            setTimeout(() => {
                // 更新内容
                englishElement.textContent = quote.english;
                chineseElement.textContent = quote.chinese;
                
                // 使用requestAnimationFrame确保DOM更新后再淡入
                requestAnimationFrame(() => {
                    quoteElement.style.opacity = '1';
                    
                    // 淡入完成后恢复 backdrop-filter
                    setTimeout(() => {
                        quoteElement.style.backdropFilter = originalBackdropFilter || 'blur(15px)';
                        quoteElement.style.webkitBackdropFilter = originalWebkitBackdropFilter || 'blur(15px)';
                    }, this.fadeDuration);
                });
            }, this.fadeDuration);
        });
    }
    
    // 开始轮播
    startRotation() {
        this.rotationInterval = setInterval(() => {
            this.showRandomQuote();
        }, this.displayDuration);
    }
    
    // 停止轮播
    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
    }
    
    // 添加新励志语
    addQuote(quote) {
        if (quote && typeof quote === 'string' && quote.trim()) {
            this.quotes.push(quote.trim());
        }
    }
    
    // 获取当前励志语
    getCurrentQuote() {
        return this.quotes[this.currentQuoteIndex];
    }
    
    // 隐藏谚语
    hide() {
        if (this.quoteContainer) {
            this.quoteContainer.style.opacity = '0';
            this.quoteContainer.style.visibility = 'hidden';
            this.stopRotation(); // 停止轮播
        }
    }
    
    // 显示谚语
    show() {
        if (this.quoteContainer) {
            this.quoteContainer.style.opacity = '1';
            this.quoteContainer.style.visibility = 'visible';
            this.startRotation(); // 恢复轮播
        }
    }
}
