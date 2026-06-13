#!/bin/bash

# 自动生成音乐列表索引文件
# 扫描 assets/bgm 目录下的音乐文件，生成 music-list.json

BGM_DIR="$(cd "$(dirname "$0")/../assets/bgm" && pwd)"
OUTPUT_FILE="$BGM_DIR/music-list.json"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 正在扫描音乐文件...${NC}"

# 检查目录是否存在
if [ ! -d "$BGM_DIR" ]; then
    echo -e "${RED}❌ 错误: assets/bgm 目录不存在${NC}"
    echo -e "${YELLOW}请创建目录: $BGM_DIR${NC}"
    exit 1
fi

# 切换到目录
cd "$BGM_DIR" || exit 1

# 查找音乐文件
MUSIC_FILES=$(find . -maxdepth 1 -type f \( -iname "*.mp3" -o -iname "*.wav" -o -iname "*.ogg" -o -iname "*.m4a" -o -iname "*.flac" -o -iname "*.aac" \) | sed 's|^\./||' | sort)

# 统计数量
COUNT=$(echo "$MUSIC_FILES" | grep -c .)
if [ -z "$MUSIC_FILES" ] || [ "$COUNT" -eq 0 ]; then
    COUNT=0
    MUSIC_FILES=""
fi

# 显示找到的文件
if [ "$COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  未找到音乐文件${NC}"
    echo -e "${YELLOW}支持的格式: .mp3, .wav, .ogg, .m4a, .flac, .aac${NC}"
else
    echo -e "${GREEN}📁 找到 $COUNT 个音乐文件:${NC}"
    echo "$MUSIC_FILES" | nl -w2 -s'. '
fi

# 生成 JSON
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 开始构建 JSON
echo "{" > "$OUTPUT_FILE"
echo "  \"generatedAt\": \"$TIMESTAMP\"," >> "$OUTPUT_FILE"
echo "  \"count\": $COUNT," >> "$OUTPUT_FILE"
echo "  \"music\": [" >> "$OUTPUT_FILE"

# 添加音乐文件列表
if [ "$COUNT" -gt 0 ]; then
    FIRST=true
    while IFS= read -r file; do
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            echo "," >> "$OUTPUT_FILE"
        fi
        echo -n "    \"$file\"" >> "$OUTPUT_FILE"
    done <<< "$MUSIC_FILES"
    echo "" >> "$OUTPUT_FILE"
fi

echo "  ]" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

# 显示成功信息
echo ""
echo -e "${GREEN}✅ 成功生成索引文件: music-list.json${NC}"
echo -e "${BLUE}📊 共计 $COUNT 首音乐${NC}"

FILE_SIZE=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
echo -e "${BLUE}💾 文件大小: $FILE_SIZE 字节${NC}"

if [ "$COUNT" -gt 0 ]; then
    echo ""
    echo -e "${GREEN}🎵 现在可以刷新页面，音乐播放器会自动加载这些音乐！${NC}"
fi
