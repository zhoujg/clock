#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import math
import os

def create_splash(width, height, filename):
    """创建启动画面"""
    # 创建深色背景
    img = Image.new('RGB', (width, height), (26, 26, 26))  # #1a1a1a
    draw = ImageDraw.Draw(img)
    
    # 计算中心点
    cx, cy = width // 2, height // 2
    
    # 绘制时钟外圈
    radius = min(width, height) // 4
    draw.ellipse([cx-radius, cy-radius, cx+radius, cy+radius], 
                 outline='white', width=6)
    
    # 绘制12个刻度
    for i in range(12):
        angle = math.radians(i * 30 - 90)
        if i % 3 == 0:  # 12, 3, 6, 9 点位置
            inner_r = radius - 15
            outer_r = radius - 5
            line_width = 5
        else:
            inner_r = radius - 12
            outer_r = radius - 5
            line_width = 3
        
        x1 = cx + inner_r * math.cos(angle)
        y1 = cy + inner_r * math.sin(angle)
        x2 = cx + outer_r * math.cos(angle)
        y2 = cy + outer_r * math.sin(angle)
        
        draw.line([(x1, y1), (x2, y2)], fill='white', width=line_width)
    
    # 绘制时针 (10:00)
    hour_angle = math.radians(10 * 30 - 90)
    hour_len = radius * 0.5
    hour_x = cx + hour_len * math.cos(hour_angle)
    hour_y = cy + hour_len * math.sin(hour_angle)
    draw.line([(cx, cy), (hour_x, hour_y)], fill='white', width=8)
    
    # 绘制分针 (10 分钟)
    min_angle = math.radians(10 * 6 - 90)
    min_len = radius * 0.7
    min_x = cx + min_len * math.cos(min_angle)
    min_y = cy + min_len * math.sin(min_angle)
    draw.line([(cx, cy), (min_x, min_y)], fill='white', width=6)
    
    # 绘制秒针 (30 秒, 红色)
    sec_angle = math.radians(30 * 6 - 90)
    sec_len = radius * 0.8
    sec_x = cx + sec_len * math.cos(sec_angle)
    sec_y = cy + sec_len * math.sin(sec_angle)
    draw.line([(cx, cy), (sec_x, sec_y)], fill=(231, 76, 60), width=4)  # #e74c3c
    
    # 绘制中心点
    center_r = 8
    draw.ellipse([cx-center_r, cy-center_r, cx+center_r, cy+center_r], 
                 fill='white')
    
    # 添加应用名称
    try:
        # 尝试使用系统字体
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", int(height * 0.04))
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", int(height * 0.04))
        except:
            font = ImageFont.load_default()
    
    app_name = "周墨欣时钟"
    bbox = draw.textbbox((0, 0), app_name, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = cy + radius + int(height * 0.08)
    
    draw.text((text_x, text_y), app_name, fill='white', font=font)
    
    # 保存图片
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, 'PNG')
    print(f"✅ Created: {filename} ({width}x{height})")

# 基础路径
base_path = 'android/app/src/main/res'

print("🎨 Creating splash screens...")
print()

# 创建不同尺寸的启动画面
# 竖屏
create_splash(480, 800, f'{base_path}/drawable-port-mdpi/splash.png')
create_splash(720, 1280, f'{base_path}/drawable-port-hdpi/splash.png')
create_splash(960, 1600, f'{base_path}/drawable-port-xhdpi/splash.png')
create_splash(1440, 2560, f'{base_path}/drawable-port-xxhdpi/splash.png')
create_splash(1920, 3200, f'{base_path}/drawable-port-xxxhdpi/splash.png')

# 横屏
create_splash(800, 480, f'{base_path}/drawable-land-mdpi/splash.png')
create_splash(1280, 720, f'{base_path}/drawable-land-hdpi/splash.png')
create_splash(1600, 960, f'{base_path}/drawable-land-xhdpi/splash.png')
create_splash(2560, 1440, f'{base_path}/drawable-land-xxhdpi/splash.png')
create_splash(3200, 1920, f'{base_path}/drawable-land-xxxhdpi/splash.png')

# 通用
create_splash(2732, 2732, f'{base_path}/drawable/splash.png')

print()
print("🎉 All splash screens created successfully!")
print()
print("📁 Files saved in:")
print(f"   {base_path}/drawable-*/splash.png")
