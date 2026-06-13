# Android 全屏显示配置指南

## 概述

本应用已配置为真正的全屏模式，隐藏系统状态栏和导航栏，提供沉浸式体验。

## 实现的功能

### 1. 完全隐藏系统 UI
- ✅ 隐藏顶部状态栏（时间、电量等）
- ✅ 隐藏底部导航栏（返回、主页、多任务按钮）
- ✅ 沉浸式粘性模式（用户滑动时暂时显示，然后自动隐藏）

### 2. 兼容性支持
- ✅ Android 11 (API 30) 及以上版本使用新 API (`WindowInsetsController`)
- ✅ Android 11 以下版本使用传统方法 (`SystemUiVisibility`)

### 3. 自动恢复
- ✅ 当应用重新获得焦点时，自动重新应用全屏模式
- ✅ 防止用户操作后系统栏意外显示

## 修改的文件

### 1. MainActivity.java
位置: `android/app/src/main/java/com/zhoumoxin/clock/MainActivity.java`

**新增功能：**
- `setFullScreenMode()` 方法：设置全屏模式
- `onWindowFocusChanged()` 方法：窗口焦点变化时重新应用全屏
- 导入必要的系统类

**关键代码：**
```java
// Android 11+ 使用新 API
controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);

// Android 11- 使用旧 API
View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
```

### 2. styles.xml
位置: `android/app/src/main/res/values/styles.xml`

**修改的主题：**
- `AppTheme.NoActionBar`：应用主主题
- `AppTheme.NoActionBarLaunch`：启动页主题

**新增的样式项：**
```xml
<item name="android:windowFullscreen">true</item>
<item name="android:windowDrawsSystemBarBackgrounds">true</item>
<item name="android:statusBarColor">@android:color/transparent</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
```

## 用户体验说明

### 正常模式
- 应用启动后，状态栏和导航栏完全隐藏
- 屏幕完全由应用内容占据

### 临时显示系统栏
用户从屏幕边缘滑动时：
- 系统栏会**短暂显示**
- 几秒后**自动隐藏**
- 不影响应用使用

### 屏幕常亮
- 已启用 `FLAG_KEEP_SCREEN_ON`
- 应用运行时屏幕保持常亮
- 适合番茄钟等需要持续显示的场景

## 构建和测试

### 重新构建应用
```bash
# 同步 Capacitor 配置
npx cap sync android

# 在 Android Studio 中打开项目
npx cap open android

# 或使用命令行构建
cd android
./gradlew assembleDebug
```

### 测试要点
1. ✅ 启动时检查系统栏是否隐藏
2. ✅ 从屏幕边缘滑动，系统栏应短暂显示后自动隐藏
3. ✅ 按 Home 键回到桌面，再返回应用，系统栏应保持隐藏
4. ✅ 旋转屏幕，全屏模式应保持
5. ✅ 长时间运行，屏幕应保持常亮

## 如果需要调整

### 允许状态栏始终显示
在 `MainActivity.java` 中，修改隐藏的内容：
```java
// 只隐藏导航栏，保留状态栏
controller.hide(WindowInsets.Type.navigationBars());
```

### 关闭屏幕常亮
注释掉这行：
```java
// getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
```

### 改为非粘性模式
```java
// 用户滑动后需要手动隐藏
controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_DEFAULT);
```

## 技术细节

### API 版本差异
- **Android 11+ (API 30+)**：使用 `WindowInsetsController`（推荐方式）
- **Android 5-10 (API 21-29)**：使用 `SYSTEM_UI_FLAG_*` 标志（已弃用但仍可用）

### 沉浸式模式类型
本应用使用：**粘性沉浸模式** (Immersive Sticky)
- 用户滑动时系统栏短暂显示
- 自动隐藏，无需应用干预
- 最佳用户体验

### 权限要求
无需额外权限，这是标准的 UI 行为控制。

## 常见问题

### Q: 系统栏还是会显示？
A: 确保已重新构建并安装应用。旧版本的 APK 不会包含这些更改。

### Q: 状态栏区域显示黑边？
A: 这是正常的。可以在 WebView 的 CSS 中使用 `padding-top` 或设置背景色来优化。

### Q: 导航栏占用空间？
A: 在某些设备上，即使隐藏导航栏，系统仍会保留空间。这是设备制造商的实现差异。

### Q: 全屏模式在模拟器上测试？
A: 模拟器完全支持全屏模式，但效果最好在真机上测试。

## 更新日期

2026-06-13

## 相关文档

- [Android 官方文档 - 隐藏系统栏](https://developer.android.com/training/system-ui/immersive)
- [WindowInsetsController API 参考](https://developer.android.com/reference/android/view/WindowInsetsController)
