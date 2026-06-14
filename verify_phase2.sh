#!/bin/bash

echo "================================================"
echo "🎯 Phase 2 整合功能 - 完整性验证"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
total=0
passed=0
failed=0

check_file() {
    total=$((total + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        passed=$((passed + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $1 (缺失)"
        failed=$((failed + 1))
        return 1
    fi
}

check_content() {
    total=$((total + 1))
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        passed=$((passed + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $3"
        failed=$((failed + 1))
        return 1
    fi
}

# Phase 1 核心文件
echo "📁 Phase 1 核心文件检查："
check_file "scripts/dailyStories.js"
check_file "styles/dailyStories.css"
echo ""

# Phase 2 更新检查
echo "🔄 Phase 2 代码更新检查："
check_content "scripts/dailyStories.js" "setSystemReferences" "dailyStories.js - 系统引用方法"
check_content "scripts/dailyStories.js" "onPomodoroComplete" "dailyStories.js - 番茄钟回调"
check_content "scripts/dailyStories.js" "pomodoroCount" "dailyStories.js - 番茄钟计数"
check_content "scripts/dailyStories.js" "linkToPomodoro" "dailyStories.js - 关联功能"
check_content "scripts/achievement.js" "checkStoriesAchievements" "achievement.js - 故事成就检查"
check_content "scripts/achievement.js" "firstStory" "achievement.js - 故事开端成就"
check_content "scripts/achievement.js" "stories" "achievement.js - 故事分类"
check_content "scripts/pomodoro.js" "dailyStories" "pomodoro.js - 故事引用"
check_content "scripts/app.js" "dailyStoriesManager" "app.js - 故事管理器"
check_content "scripts/app.js" "initializeIntegratedSystems" "app.js - 集成初始化"
echo ""

# CSS 更新检查
echo "🎨 CSS 样式更新检查："
check_content "styles/dailyStories.css" "link-pomodoro-btn" "dailyStories.css - 关联按钮样式"
check_content "styles/dailyStories.css" "story-stats" "dailyStories.css - 统计样式"
check_content "styles/dailyStories.css" "story-link-notification" "dailyStories.css - 通知样式"
echo ""

# HTML 引用检查
echo "🔗 HTML 集成检查："
check_content "index.html" "dailyStories.css" "index.html - CSS 引用"
check_content "index.html" "dailyStories.js" "index.html - JS 引用"
echo ""

# 文档文件检查
echo "📚 Phase 2 文档检查："
check_file "PHASE2_INTEGRATION_GUIDE.md"
check_file "TEST_PHASE2_INTEGRATION.md"
check_file "PHASE2_SUMMARY.md"
echo ""

# CHANGELOG 检查
echo "📝 更新日志检查："
check_content "CHANGELOG.md" "Phase 2" "CHANGELOG - Phase 2 记录"
check_content "CHANGELOG.md" "番茄钟整合" "CHANGELOG - 番茄钟整合说明"
check_content "CHANGELOG.md" "成就系统整合" "CHANGELOG - 成就系统整合说明"
echo ""

# README 更新检查
echo "�� README 更新检查："
check_content "README.md" "番茄钟整合" "README - 功能说明"
check_content "README.md" "PHASE2_INTEGRATION_GUIDE.md" "README - Phase 2 链接"
echo ""

# 文件大小检查
echo "📊 文件大小统计："
echo "  dailyStories.js: $(wc -l < scripts/dailyStories.js) 行"
echo "  achievement.js: $(wc -l < scripts/achievement.js) 行"
echo "  pomodoro.js: $(wc -l < scripts/pomodoro.js) 行"
echo "  app.js: $(wc -l < scripts/app.js) 行"
echo "  dailyStories.css: $(wc -l < styles/dailyStories.css) 行"
echo ""

# 总结
echo "================================================"
echo "📊 验证结果总结"
echo "================================================"
echo -e "总测试项: ${total}"
echo -e "通过: ${GREEN}${passed}${NC}"
echo -e "失败: ${RED}${failed}${NC}"

if [ $failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ 所有检查通过！Phase 2 整合完成！${NC}"
    echo ""
    echo "🚀 下一步："
    echo "  1. 启动服务器: ./start-server.sh"
    echo "  2. 访问: http://localhost:8000"
    echo "  3. 测试功能: 参考 TEST_PHASE2_INTEGRATION.md"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}✗ 发现 ${failed} 个问题，请检查！${NC}"
    echo ""
    exit 1
fi

