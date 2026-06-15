// 励志语管理器
class QuoteManager {
    constructor() {
        this.quotes = [];
        this.currentQuoteIndex = 0;
        this.displayDuration = 10000; // 10秒切换一次
        this.fadeDuration = 1000; // 1秒淡入淡出
        this.init();
    }
    
    // 从assets/quotes.txt加载励志语
    loadQuotesFromData() {
        fetch('assets/quotes.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                this.quotes = this.parseQuotesText(text);
                // 如果有DOM已经初始化，显示第一条励志语并开始轮播
                if (this.quoteContainer) {
                    this.showRandomQuote();
                    this.startRotation();
                }
            })
            .catch(error => {
                console.warn('加载励志语数据失败，使用默认励志语:', error);
                this.quotes = [{
                    english: "Every day is a new beginning.",
                    chinese: "每一天都是新的开始。"
                }];
                // 如果有DOM已经初始化，显示默认励志语并开始轮播
                if (this.quoteContainer) {
                    this.showRandomQuote();
                    this.startRotation();
                }
            });
    }
    
    // 解析文本格式：英文|中文
    parseQuotesText(text) {
        const quotes = [];
        const lines = text.trim().split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // 使用 | 分隔符分割英文和中文
            const parts = trimmedLine.split('|');
            if (parts.length >= 2) {
                const english = parts[0].trim();
                const chinese = parts[1].trim();
                if (english && chinese) {
                    quotes.push({ english, chinese });
                }
            }
        }
        
        return quotes.length > 0 ? quotes : [{
            english: "Every day is a new beginning.",
            chinese: "每一天都是新的开始。"
        }];
    }
    
    init() {
        this.quoteContainer = document.querySelector('.quote-container');
        if (this.quoteContainer) {
            // 异步加载励志语，加载完成后会自动显示第一条并开始轮播
            this.loadQuotesFromData();
        }
    }

    
    // 获取随机励志语
    getRandomQuote() {
        // 如果还没有加载励志语，返回默认励志语
        if (!this.quotes || this.quotes.length === 0) {
            return {
                english: "Every day is a new beginning.",
                chinese: "每一天都是新的开始。"
            };
        }
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
