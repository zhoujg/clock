/**
 * 强制重新加载词库 - 在浏览器控制台运行
 * 
 * 使用方法：
 * 1. 打开浏览器控制台（F12）
 * 2. 复制粘贴此文件内容并运行
 * 3. 按照提示操作
 */

(async function forceReloadDictionary() {
    console.clear();
    console.log('=== 强制重新加载词库 ===\n');
    
    // 检查管理器是否存在
    if (!window.wordTyperManager) {
        console.error('❌ wordTyperManager 不存在！');
        console.log('请先打开 word-typer 插件');
        return;
    }
    
    const manager = window.wordTyperManager;
    const dictId = manager.currentDict || 'cet4';
    const dict = WORD_DICTIONARIES[dictId];
    
    console.log(`📖 当前词库: ${dict.name} (${dictId})`);
    console.log(`\n🗑️  步骤1: 清除缓存`);
    
    // 清除内存缓存
    dict.words = [];
    console.log('  ✓ 清除内存缓存');
    
    // 清除 localStorage
    localStorage.removeItem(`wordTyperDict_${dictId}`);
    localStorage.removeItem(`wordTyperDict_${dictId}_time`);
    console.log('  ✓ 清除 localStorage 缓存');
    
    console.log(`\n📥 步骤2: 从网络重新加载`);
    
    try {
        const start = performance.now();
        const words = await manager.loadDictionaryWords(dictId);
        const end = performance.now();
        
        console.log(`\n✅ 加载成功！`);
        console.log(`  单词数: ${words.length}`);
        console.log(`  耗时: ${(end - start).toFixed(2)}ms`);
        console.log(`  前10个: ${words.slice(0, 10).map(w => w.word).join(', ')}`);
        
        if (words.length > 100) {
            console.log(`\n🎉 恭喜！成功加载真实词库数据`);
            console.log(`现在可以开始学习了！`);
        } else {
            console.warn(`\n⚠️ 警告：单词数较少（${words.length}），可能是网络加载失败`);
            console.log(`\n尝试手动测试CDN访问：`);
            console.log(`fetch('https://cdn.jsdelivr.net/gh/RealKai42/qwerty-learner@master/public/dicts/CET4_T.json')
    .then(r => r.json())
    .then(d => console.log('CDN可访问，单词数:', d.length))
    .catch(e => console.error('CDN不可访问:', e));`);
        }
        
    } catch (error) {
        console.error(`\n❌ 加载失败:`, error);
        console.log(`\n可能的原因：`);
        console.log(`  1. 网络连接问题`);
        console.log(`  2. CDN被阻止（防火墙/代理）`);
        console.log(`  3. GitHub访问受限`);
        
        console.log(`\n解决方案：`);
        console.log(`  1. 检查网络连接`);
        console.log(`  2. 尝试使用VPN`);
        console.log(`  3. 等待网络恢复后重试`);
    }
    
    console.log(`\n=== 完成 ===`);
})();
