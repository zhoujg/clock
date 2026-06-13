#!/usr/bin/env node

/**
 * 自动生成音乐列表索引文件
 * 扫描 assets/bgm 目录下的音乐文件，生成 music-list.json
 * 
 * 使用方法：
 * node scripts/generate-music-list.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const BGM_DIR = path.join(__dirname, '..', 'assets', 'bgm');
const OUTPUT_FILE = path.join(BGM_DIR, 'music-list.json');
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查目录是否存在
if (!fs.existsSync(BGM_DIR)) {
    log('❌ 错误: assets/bgm 目录不存在', 'red');
    log(`请创建目录: ${BGM_DIR}`, 'yellow');
    process.exit(1);
}

// 读取目录
try {
    log('\n🔍 正在扫描音乐文件...', 'blue');
    
    const files = fs.readdirSync(BGM_DIR);
    
    // 过滤音乐文件
    const musicFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        const isMusic = SUPPORTED_EXTENSIONS.includes(ext);
        const isNotHidden = !file.startsWith('.');
        const isNotJson = !file.endsWith('.json');
        const isNotMd = !file.endsWith('.md');
        const isNotTxt = !file.endsWith('.txt');
        
        return isMusic && isNotHidden && isNotJson && isNotMd && isNotTxt;
    });
    
    if (musicFiles.length === 0) {
        log('⚠️  未找到音乐文件', 'yellow');
        log(`支持的格式: ${SUPPORTED_EXTENSIONS.join(', ')}`, 'yellow');
        
        // 仍然生成空的 JSON 文件
        const emptyData = {
            generatedAt: new Date().toISOString(),
            count: 0,
            music: []
        };
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(emptyData, null, 2));
        log(`\n✅ 已生成空的索引文件: ${OUTPUT_FILE}`, 'green');
        process.exit(0);
    }
    
    // 排序
    musicFiles.sort((a, b) => a.localeCompare(b));
    
    // 显示找到的文件
    log(`\n📁 找到 ${musicFiles.length} 个音乐文件:`, 'green');
    musicFiles.forEach((file, index) => {
        log(`   ${index + 1}. ${file}`, 'bright');
    });
    
    // 生成 JSON 数据
    const data = {
        generatedAt: new Date().toISOString(),
        count: musicFiles.length,
        music: musicFiles
    };
    
    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    
    log(`\n✅ 成功生成索引文件: ${path.relative(process.cwd(), OUTPUT_FILE)}`, 'green');
    log(`📊 共计 ${musicFiles.length} 首音乐`, 'blue');
    
    // 显示文件大小
    const stats = fs.statSync(OUTPUT_FILE);
    log(`💾 文件大小: ${stats.size} 字节`, 'blue');
    
    log('\n🎵 现在可以刷新页面，音乐播放器会自动加载这些音乐！', 'green');
    
} catch (error) {
    log(`\n❌ 错误: ${error.message}`, 'red');
    process.exit(1);
}
