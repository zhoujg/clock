# Android 全屏空白区域修复

## 问题描述

安装在安卓手机后，顶部状态栏虽然不显示内容，但位置还保留着，造成了空白区域。

## 原因分析

虽然已经配置了隐藏状态栏，但没有设置让内容绘制在系统栏区域，导致：
- 状态栏被隐藏（不显示内容）
- 但应用内容不会占用该区域（留下空白）

## 解决方案

### 1. MainActivity.java 修改

在 `setFullScreenMode()` 方法中添加：

```java
// 让内容绘制在系统栏下方
getWindow().setFlags(
    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
);

// Android 11+ 需要额外设置
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    getWindow().setDecorFitsSystemWindows(false);
}
```

**关键标志说明：**
- `FLAG_LAYOUT_NO_LIMITS`：允许窗口扩展到屏幕边界之外，包括系统栏区域
- `setDecorFitsSystemWindows(false)`：Android 11+ 告诉系统不要为系统栏保留空间

### 2. AndroidManifest.xml 修改

在 Activity 中添加：
```xml
android:windowSoftInputMode="adjustResize"
```

这确保软键盘弹出时的正确行为。

## 构建步骤

```bash
# 1. 同步 Capacitor 配置
npx cap sync android

# 2. 在 Android Studio 中打开
npx cap open android

# 3. 重新构建并安装到手机
# 在 Android Studio 中点击 Run 按钮
```

或使用命令行：
```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## 测试验证

安装新版本后检查：
1. ✅ 状态栏区域应该没有空白
2. ✅ 应用内容延伸到屏幕顶部
3. ✅ 时钟、兔子等元素应该可见且位置正确
4. ✅ 从顶部下滑可以临时显示系统状态栏

## 技术细节

### FLAG_LAYOUT_NO_LIMITS 的作用

这个标志让窗口可以：
- 延伸到状态栏区域
- 延伸到导航栏区域
- 延伸到屏幕切口（刘海）区域

### setDecorFitsSystemWindows(false)

Android 11 引入的新 API：
- `true`（默认）：系统会自动为系统栏添加内边距
- `false`：应用完全控制布局，内容可以绘制在系统栏下方

### 与之前配置的区别

**之前：**
- 隐藏了系统栏
- 但系统仍为其保留空间

**现在：**
- 隐藏系统栏
- 内容占用系统栏空间
- 真正的全屏体验

## 兼容性

- ✅ Android 5.0+ (API 21+)
- ✅ Android 11+ (API 30+) 使用新 API
- ✅ 所有屏幕尺寸和比例
- ✅ 刘海屏/水滴屏设备

## 注意事项

1. **安全区域**：内容会延伸到屏幕边缘，注意重要内容不要被遮挡
2. **状态栏高度**：不同设备状态栏高度不同，布局应该灵活适应
3. **软键盘**：输入框获得焦点时，布局会自动调整（因为设置了 adjustResize）

## 如果还有问题

### 问题：顶部仍有黑边

可能是 WebView 的 CSS 问题，检查：
```css
body {
    padding-top: 0 !important;
    margin-top: 0 !important;
}
```

### 问题：内容被切掉

在 CSS 中使用安全区域：
```css
body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}
```

### 问题：某些设备不生效

部分设备制造商（如小米、华为）可能有自定义的系统栏行为，需要：
1. 关闭"显示刘海区域"设置
2. 授予应用"显示在其他应用上层"权限

## 更新日期

2026-06-13

## 相关文件

- `/android/app/src/main/java/com/zhoumoxin/clock/MainActivity.java`
- `/android/app/src/main/AndroidManifest.xml`
- `FULLSCREEN_GUIDE.md`（原始全屏配置指南）
