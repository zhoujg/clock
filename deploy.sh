#!/bin/bash

# 云服务器部署脚本
# 用法: ./deploy.sh [服务器地址] [远程路径]
# 示例: ./deploy.sh user@neihou.cn /var/www/html/clock

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 默认配置
SERVER="${1:-user@neihou.cn}"
REMOTE_PATH="${2:-/var/www/html/clock}"

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  时钟应用部署脚本${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# 检查是否提供了服务器地址
if [ -z "$1" ]; then
    echo -e "${YELLOW}未提供服务器地址，使用默认值: $SERVER${NC}"
    echo -e "${YELLOW}使用方法: ./deploy.sh user@server.com /path/to/deploy${NC}"
    echo ""
    read -p "按 Enter 继续使用默认值，或 Ctrl+C 取消: "
fi

echo -e "${GREEN}[1/5] 检查本地文件...${NC}"
if [ ! -f "index.html" ]; then
    echo -e "${RED}错误: 未找到 index.html，请在项目根目录运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 本地文件检查通过${NC}"
echo ""

echo -e "${GREEN}[2/5] 打包文件...${NC}"
# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "临时目录: $TEMP_DIR"

# 复制需要部署的文件
echo "复制文件到临时目录..."
rsync -a --exclude 'node_modules' \
         --exclude '.git' \
         --exclude 'android' \
         --exclude 'www' \
         --exclude '*.md' \
         --exclude '*.sh' \
         --exclude '*.bat' \
         --exclude '*.py' \
         --exclude 'package*.json' \
         --exclude '.gitignore' \
         --exclude '.vscode' \
         --exclude '*.apk' \
         ./ "$TEMP_DIR/"

echo -e "${GREEN}✓ 文件打包完成${NC}"
echo ""

echo -e "${GREEN}[3/5] 上传到服务器...${NC}"
echo "目标: $SERVER:$REMOTE_PATH"
echo ""

# 使用 rsync 上传文件
rsync -avz --progress \
      --delete \
      "$TEMP_DIR/" \
      "$SERVER:$REMOTE_PATH/"

echo -e "${GREEN}✓ 文件上传完成${NC}"
echo ""

echo -e "${GREEN}[4/5] 设置服务器权限...${NC}"
ssh "$SERVER" << ENDSSH
    # 设置所有者
    if [ -w "$REMOTE_PATH" ]; then
        echo "设置文件所有者..."
        sudo chown -R www-data:www-data "$REMOTE_PATH" 2>/dev/null || chown -R nginx:nginx "$REMOTE_PATH" 2>/dev/null || echo "警告: 无法更改所有者，可能需要手动设置"
        
        echo "设置文件权限..."
        find "$REMOTE_PATH" -type f -exec chmod 644 {} \; 2>/dev/null || echo "警告: 部分文件权限设置失败"
        find "$REMOTE_PATH" -type d -exec chmod 755 {} \; 2>/dev/null || echo "警告: 部分目录权限设置失败"
        
        echo "确保音乐文件可读..."
        chmod 644 "$REMOTE_PATH/assets/bgm/"*.mp3 2>/dev/null || echo "警告: 音乐文件权限设置失败"
        
        echo "✓ 权限设置完成"
    else
        echo "⚠ 无写入权限，跳过权限设置"
    fi
ENDSSH

echo -e "${GREEN}✓ 权限设置完成${NC}"
echo ""

echo -e "${GREEN}[5/5] 清理临时文件...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "访问地址: ${YELLOW}https://neihou.cn/clock/${NC}"
echo ""
echo -e "${YELLOW}部署后检查清单:${NC}"
echo "  □ 访问网站确认页面正常显示"
echo "  □ 检查浏览器控制台无错误"
echo "  □ 测试音乐播放功能"
echo "  □ 测试所有功能模块"
echo ""
echo -e "${YELLOW}如遇到问题，请查看: DEPLOY_GUIDE.md${NC}"
