#!/bin/bash

echo "=================================="
echo "🎯 每日三个故事 - 功能验证脚本"
echo "=================================="
echo ""

# 检查文件是否存在
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        return 0
    else
        echo "❌ $1 (缺失)"
        return 1
    fi
}

# 核心文件检查
echo "📁 核心文件检查："
check_file "scripts/dailyStories.js"
check_file "styles/dailyStories.css"
echo ""

# 文档文件检查
echo "📚 文档文件检查："
check_file "DAILY_STORIES_GUIDE.md"
check_file "QUICK_START_DAILY_STORIES.md"
check_file "TEST_DAILY_STORIES.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "START_HERE.md"
echo ""

# HTML 集成检查
echo "🔗 HTML 集成检查："
if grep -q "dailyStories.css" index.html; then
    echo "✅ CSS 已引用"
else
    echo "❌ CSS 未引用"
fi

if grep -q "dailyStories.js" index.html; then
    echo "✅ JS 已引用"
else
    echo "❌ JS 未引用"
fi
echo ""

# README 更新检查
echo "�� README 更新检查："
if grep -q "每日三个故事" README.md; then
    echo "✅ README 已更新"
else
    echo "❌ README 未更新"
fi
echo ""

# 文件大小检查
echo "📊 文件大小统计："
echo "JavaScript: $(du -h scripts/dailyStories.js | awk '{print $1}')"
echo "CSS: $(du -h styles/dailyStories.css | awk '{print $1}')"
echo ""

# 总结
echo "=================================="
echo "✨ 验证完成！"
echo "=================================="
echo ""
echo "🚀 下一步："
echo "1. 运行: ./start-server.sh"
echo "2. 访问: http://localhost:8000"
echo "3. 点击左上角 🎯 按钮体验功能"
echo ""

