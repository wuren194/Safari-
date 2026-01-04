#!/bin/bash
# Downie 后处理脚本：根据视频 ID 从本地服务获取标题并重命名
# 使用方法：在 Downie Preferences > Postprocessing > Run Shell Script 粘贴此脚本

FILE_PATH="$1"
FILENAME=$(basename "$FILE_PATH")
DIR=$(dirname "$FILE_PATH")
EXT="${FILENAME##*.}"

# 从文件名中提取可能的视频 ID（通常是字母数字组合）
# 尝试多种模式匹配
VIDEO_ID=""

# 模式1：文件名就是 ID（如 ft5s5y7h7t9c.mp4）
if [[ "$FILENAME" =~ ^([a-zA-Z0-9]+)\.[^.]+$ ]]; then
    VIDEO_ID="${BASH_REMATCH[1]}"
fi

# 模式2：ID 在文件名开头（如 ft5s5y7h7t9c_720p.mp4）
if [ -z "$VIDEO_ID" ] && [[ "$FILENAME" =~ ^([a-zA-Z0-9]+)[-_] ]]; then
    VIDEO_ID="${BASH_REMATCH[1]}"
fi

# 如果找到 ID，查询本地服务获取标题
if [ -n "$VIDEO_ID" ]; then
    # 查询本地服务
    RESPONSE=$(curl -s "http://127.0.0.1:18080/get?id=$VIDEO_ID" 2>/dev/null)
    
    if [ -n "$RESPONSE" ]; then
        # 解析 JSON 获取 title
        TITLE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('title',''))" 2>/dev/null)
        
        if [ -n "$TITLE" ]; then
            # 清理文件名中的非法字符
            SAFE_TITLE=$(echo "$TITLE" | sed 's/[<>:"/\\|?*]//g' | sed 's/[[:space:]]\+/ /g' | head -c 120)
            
            if [ -n "$SAFE_TITLE" ]; then
                NEW_PATH="$DIR/$SAFE_TITLE.$EXT"
                
                # 如果目标文件已存在，添加数字后缀
                COUNTER=1
                while [ -e "$NEW_PATH" ]; do
                    NEW_PATH="$DIR/$SAFE_TITLE ($COUNTER).$EXT"
                    ((COUNTER++))
                done
                
                # 重命名
                mv "$FILE_PATH" "$NEW_PATH"
                
                # 删除已使用的标题映射
                curl -s -X DELETE "http://127.0.0.1:18080/remove?id=$VIDEO_ID" >/dev/null 2>&1
            fi
        fi
    fi
fi
