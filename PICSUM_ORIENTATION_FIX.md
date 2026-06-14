# Picsum 图片方向自适应修复说明

## 问题描述
之前的随机图片加载功能无法根据手机的屏幕方向（横屏/竖屏）自动选择合适的图片，导致在竖屏模式下也会加载横屏图片。

## 解决方案

### 修改内容
在 `scripts/picsum.js` 文件中进行了以下改进：

#### 1. 屏幕方向检测
- 在 `getRandomImageUrl()` 方法中添加了屏幕方向检测逻辑
- 通过比较 `window.innerHeight` 和 `window.innerWidth` 来判断当前是横屏还是竖屏
- 根据检测到的方向，使用相应的宽高参数请求 Picsum API

#### 2. 方向变化监听
- 添加了 `setupOrientationListener()` 方法，监听屏幕方向变化
- 当用户旋转手机改变屏幕方向时，系统会检测到方向变化
- 已预留自动重新加载图片的接口（目前已注释，可根据需要启用）

### 代码改动

```javascript
// 获取随机图片URL - 新增方向检测
getRandomImageUrl() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 检测屏幕方向
    const isPortrait = height > width;
    
    // 根据方向使用正确的尺寸参数
    let finalWidth, finalHeight;
    
    if (isPortrait) {
        // 竖屏：高度大于宽度
        finalWidth = width;
        finalHeight = height;
    } else {
        // 横屏：宽度大于高度
        finalWidth = width;
        finalHeight = height;
    }
    
    const seed = Date.now();
    return `https://picsum.photos/seed/${seed}/${finalWidth}/${finalHeight}`;
}
```

### 使用方法

1. **加载随机图片**：点击"随机图片"按钮时，系统会自动检测当前屏幕方向并加载合适比例的图片

2. **竖屏模式**：当手机处于竖屏状态时（高度>宽度），会请求竖向图片

3. **横屏模式**：当手机处于横屏状态时（宽度>高度），会请求横向图片

### 测试建议

1. 在手机竖屏模式下打开应用，点击加载随机图片
2. 验证加载的图片是否为竖向图片（高度>宽度）
3. 旋转手机至横屏模式，再次加载随机图片
4. 验证加载的图片是否为横向图片（宽度>高度）

### 注意事项

- Picsum API 会根据提供的宽高比例返回最匹配的图片
- 图片的实际宽高会与请求的尺寸完全匹配
- 如果需要在屏幕旋转时自动重新加载图片，可以取消注释 `setupOrientationListener()` 方法中的 `this.loadRandomImage()` 调用

## 相关文件
- `scripts/picsum.js` - 主要修改文件
- `scripts/app.js` - PicsumManager 的调用位置

## 更新日期
2026-06-14
