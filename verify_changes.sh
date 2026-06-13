#!/bin/bash

echo "=========================================="
echo "验证弹窗样式统一和互斥显示改进"
echo "=========================================="
echo ""

# 检查设置面板关闭按钮
echo "1. 检查设置面板关闭按钮..."
if grep -q "settingsPanelCloseBtn" index.html && grep -q "settingsPanelCloseBtn" scripts/app.js; then
    echo "   ✅ 设置面板关闭按钮已添加"
else
    echo "   ❌ 设置面板关闭按钮缺失"
fi

# 检查统一的panel-header
echo ""
echo "2. 检查统一的panel-header样式..."
PANEL_HEADERS=$(grep -c "panel-header" index.html)
if [ "$PANEL_HEADERS" -ge 2 ]; then
    echo "   ✅ 找到 $PANEL_HEADERS 个panel-header（设置面板+音乐面板）"
else
    echo "   ❌ panel-header数量不足"
fi

# 检查番茄钟使用panel-header
echo ""
echo "3. 检查番茄钟使用统一样式..."
if grep -q "panel-header" scripts/pomodoro.js && grep -q "panel-content" scripts/pomodoro.js; then
    echo "   ✅ 番茄钟已使用统一的panel-header和panel-content"
else
    echo "   ❌ 番茄钟未使用统一样式"
fi

# 检查互斥逻辑 - 设置面板
echo ""
echo "4. 检查设置面板互斥逻辑..."
if grep -A 8 "settingsToggle.addEventListener" scripts/app.js | grep -q "pomodoroPanel"; then
    echo "   ✅ 设置面板会关闭番茄钟面板"
else
    echo "   ❌ 设置面板互斥逻辑不完整"
fi

# 检查互斥逻辑 - 音乐面板
echo ""
echo "5. 检查音乐面板互斥逻辑..."
if grep -A 12 "musicBtn.addEventListener" scripts/app.js | grep -q "pomodoroPanel"; then
    echo "   ✅ 音乐面板会关闭番茄钟面板"
else
    echo "   ❌ 音乐面板互斥逻辑不完整"
fi

# 检查互斥逻辑 - 番茄钟面板
echo ""
echo "6. 检查番茄钟面板互斥逻辑..."
if grep -A 15 "this.toggle.addEventListener" scripts/pomodoro.js | grep -q "settingsPanel"; then
    echo "   ✅ 番茄钟面板会关闭设置面板"
else
    echo "   ❌ 番茄钟面板互斥逻辑不完整"
fi

if grep -A 15 "this.toggle.addEventListener" scripts/pomodoro.js | grep -q "musicPanel"; then
    echo "   ✅ 番茄钟面板会关闭音乐面板"
else
    echo "   ❌ 番茄钟面板互斥逻辑不完整"
fi

# 检查CSS统一样式
echo ""
echo "7. 检查CSS统一样式..."
if grep -q "panel-header span" styles/controls.css; then
    echo "   ✅ panel-header span 样式已添加（支持emoji对齐）"
else
    echo "   ❌ panel-header span 样式缺失"
fi

if grep -q "panel-content" styles/pomodoro.css; then
    echo "   ✅ 番茄钟CSS包含panel-content样式"
else
    echo "   ❌ 番茄钟CSS缺少panel-content样式"
fi

# 检查旧样式是否已移除
echo ""
echo "8. 检查旧样式清理..."
if ! grep -q "pomodoro-header" styles/pomodoro.css; then
    echo "   ✅ 旧的pomodoro-header样式已移除"
else
    echo "   ⚠️  旧的pomodoro-header样式仍存在"
fi

if ! grep -q "pomodoro-close" styles/pomodoro.css; then
    echo "   ✅ 旧的pomodoro-close样式已移除"
else
    echo "   ⚠️  旧的pomodoro-close样式仍存在"
fi

echo ""
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "请在浏览器中测试以下功能："
echo "1. 三个面板的样式是否一致（标题栏、关闭按钮、分隔线）"
echo "2. 同一时间只能打开一个面板"
echo "3. 所有关闭按钮都能正常工作"
echo "4. 响应式布局在不同设备上正常显示"
