#!/bin/bash

# 周墨欣时钟 - 安卓 WebView 应用构建脚本

echo "🚀 开始构建安卓 WebView 应用..."
echo ""
echo "📱 应用类型: WebView 应用"
echo "🌐 在线地址: https://neihou.cn/clock/"
echo ""

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未检测到 npm，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 步骤 1: 检查依赖
echo "📦 步骤 1/3: 检查依赖..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi
echo ""

# 步骤 2: 检查安卓平台
echo "📱 步骤 2/4: 检查安卓平台..."
if [ ! -d "android" ]; then
    echo "正在添加安卓平台..."
    npm run android:add
    if [ $? -ne 0 ]; then
        echo "❌ 添加安卓平台失败"
        exit 1
    fi
    echo "✅ 安卓平台添加完成"
else
    echo "✅ 安卓平台已存在"
fi
echo ""

# 步骤 2.5: 生成音乐列表索引
echo "🎵 步骤 3/4: 生成音乐列表索引..."
./scripts/generate-music-list.sh
if [ $? -ne 0 ]; then
    echo "⚠️  警告: 音乐列表生成失败（不影响构建）"
else
    echo "✅ 音乐列表索引已生成"
fi
echo ""

# 步骤 3: 同步配置
echo "🔄 步骤 4/4: 同步 WebView 配置..."
npm run android:sync
if [ $? -ne 0 ]; then
    echo "❌ 同步失败"
    exit 1
fi
echo "✅ WebView 配置同步完成"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 配置完成！"
echo ""
echo "📌 应用信息："
echo "   名称: 周墨欣时钟"
echo "   类型: WebView 应用"
echo "   地址: https://neihou.cn/clock/"
echo ""
echo "🎯 下一步："
echo "   1. 确保在线地址可访问"
echo "   2. 打开 Android Studio 构建 APK"
echo ""
echo "💡 提示："
echo "   未来更新应用内容，只需修改网站即可！"
echo "   无需重新构建和发布应用。"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 询问是否打开 Android Studio
read -p "是否现在打开 Android Studio? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎨 正在启动 Android Studio..."
    npm run android:open
fi

echo ""
echo "📖 详细文档请查看："
echo "   - WEBVIEW_SUMMARY.md（快速总结）"
echo "   - WEBVIEW_CONFIG.md（详细配置）"
echo "   - QUICK_START.md（快速开始）"
