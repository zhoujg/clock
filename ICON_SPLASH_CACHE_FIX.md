# Android 图标和启动画面缓存问题解决方案

## 问题描述
在安卓手机安装新版本 APK 时，没有看到修改后的图标和启动画面（splash screen）。

## 根本原因
Android 系统会缓存应用的图标和启动画面资源，即使重新安装应用，系统仍可能使用旧的缓存资源。

---

## 🔧 解决方案

### 方案 1：完全卸载旧应用（推荐）

这是最彻底的方法，能确保清除所有缓存：

```bash
# 使用 ADB 卸载应用
adb uninstall com.getcapacitor.myapp

# 或者在手机上手动卸载
# 设置 > 应用 > 找到应用 > 卸载
```

**卸载后再安装新 APK：**
```bash
# 安装新构建的 APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 方案 2：清除应用数据和缓存

如果不想完全卸载：

**在手机上操作：**
1. 设置 > 应用 > 找到你的应用
2. 存储 > 清除缓存
3. 存储 > 清除数据
4. 强制停止应用
5. 重启手机
6. 重新安装 APK

**使用 ADB：**
```bash
# 清除应用数据
adb shell pm clear com.getcapacitor.myapp

# 重启设备
adb reboot
```

### 方案 3：修改应用包名（开发期间）

如果是开发测试期间，可以临时修改包名，让系统认为是全新应用：

**修改文件：** `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        applicationId "com.getcapacitor.myapp.v2"  // 添加后缀
        // ... 其他配置
    }
}
```

**注意：** 这会创建一个新的应用实例，之前的数据不会保留。

### 方案 4：重新构建并强制安装

确保资源正确嵌入到 APK：

```bash
# 1. 清理旧构建
cd android
./gradlew clean

# 2. 重新构建
./gradlew assembleDebug

# 3. 强制重新安装（覆盖安装）
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

参数说明：
- `-r`: 替换已存在的应用，保留数据和缓存
- `-d`: 允许降级安装

如果 `-r` 不起作用，先卸载再安装：
```bash
adb uninstall com.getcapacitor.myapp && adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔍 验证资源是否正确打包

在重新安装之前，先验证 APK 中是否包含新的资源：

### 方法 1：使用 Android Studio

1. 打开 Android Studio
2. Build > Analyze APK...
3. 选择你的 APK 文件
4. 查看 `res/` 目录下的资源文件
5. 确认 `drawable/splash_*.xml` 和 `mipmap-*/ic_launcher*.png` 存在且是新版本

### 方法 2：使用命令行解包 APK

```bash
# 解压 APK（APK 本质是 ZIP 文件）
cd android/app/build/outputs/apk/debug
unzip -q app-debug.apk -d apk-contents

# 查看资源文件
ls -la apk-contents/res/drawable*/splash*
ls -la apk-contents/res/mipmap*/ic_launcher*

# 查看 XML 内容（需要 aapt2 工具）
aapt2 dump resources app-debug.apk | grep -A 5 "splash\|ic_launcher"
```

---

## 📱 系统特定问题

### 不同厂商的缓存机制

某些 Android 设备制造商有更激进的缓存策略：

| 厂商 | 已知问题 | 解决方案 |
|------|----------|----------|
| **小米 (MIUI)** | 图标缓存顽固 | 设置 > 应用设置 > 应用管理 > 系统桌面 > 清除数据 |
| **华为 (EMUI)** | 启动画面缓存 | 需完全卸载应用 |
| **OPPO/Vivo** | 桌面图标缓存 | 重启设备 + 清除桌面数据 |
| **三星 (OneUI)** | 通常正常 | 清除应用缓存即可 |

### 清除系统桌面缓存

如果应用图标仍然是旧的：

```bash
# 找到桌面应用包名（常见的）
adb shell pm list packages | grep launcher

# 清除桌面缓存（以小米为例）
adb shell pm clear com.miui.home

# 或
adb shell pm clear com.android.launcher3
```

**注意：** 清除桌面缓存会重置桌面布局！

---

## 🚀 推荐完整流程

### 开发测试期间

```bash
#!/bin/bash
# 文件名: reinstall.sh

echo "🧹 步骤 1: 清理项目..."
cd android
./gradlew clean

echo "🔨 步骤 2: 重新构建..."
./gradlew assembleDebug

echo "🗑️  步骤 3: 卸载旧应用..."
adb uninstall com.getcapacitor.myapp

echo "📦 步骤 4: 安装新应用..."
adb install app/build/outputs/apk/debug/app-debug.apk

echo "🔄 步骤 5: 重启应用..."
adb shell am start -n com.getcapacitor.myapp/.MainActivity

echo "✅ 完成！"
```

保存为脚本并运行：
```bash
chmod +x reinstall.sh
./reinstall.sh
```

### 生产发布前

```bash
#!/bin/bash
# 文件名: build-release.sh

echo "🧹 清理..."
cd android
./gradlew clean

echo "🔨 构建 Release 版本..."
./gradlew assembleRelease

echo "📦 APK 位置："
echo "android/app/build/outputs/apk/release/app-release-unsigned.apk"

echo ""
echo "⚠️  发布前检查清单："
echo "  [ ] 验证 APK 中的图标资源"
echo "  [ ] 在真机上完全卸载旧版本后测试"
echo "  [ ] 检查启动画面显示"
echo "  [ ] 验证应用签名"
```

---

## 🐛 故障排查

### 图标仍然不更新

**检查 1: 确认资源文件存在**
```bash
# 查看所有 mipmap 目录
find android/app/src/main/res -name "ic_launcher*" -type f

# 应该看到：
# mipmap-hdpi/ic_launcher.png
# mipmap-mdpi/ic_launcher.png
# mipmap-xhdpi/ic_launcher.png
# mipmap-xxhdpi/ic_launcher.png
# mipmap-xxxhdpi/ic_launcher.png
# mipmap-anydpi-v26/ic_launcher.xml
# ...
```

**检查 2: 验证 AndroidManifest.xml**
```bash
grep -A 3 "android:icon" android/app/src/main/AndroidManifest.xml

# 应该看到：
# android:icon="@mipmap/ic_launcher"
# android:roundIcon="@mipmap/ic_launcher_round"
```

**检查 3: 查看构建日志**
```bash
cd android
./gradlew assembleDebug --info | grep -i "icon\|splash"
```

### 启动画面不显示

**检查 1: 验证 styles.xml**
```bash
grep -A 3 "NoActionBarLaunch" android/app/src/main/res/values/styles.xml

# 应该看到：
# <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
#     <item name="android:background">@drawable/splash_screen</item>
# </style>
```

**检查 2: 确认 MainActivity 使用了正确的主题**
```bash
grep "NoActionBarLaunch" android/app/src/main/AndroidManifest.xml

# 应该在 MainActivity 中看到：
# android:theme="@style/AppTheme.NoActionBarLaunch"
```

**检查 3: 验证 splash_screen.xml 存在**
```bash
cat android/app/src/main/res/drawable/splash_screen.xml
```

---

## 🎯 最佳实践

### 1. 版本控制
每次修改图标或启动画面时，更新版本号：

```gradle
// android/app/build.gradle
android {
    defaultConfig {
        versionCode 2      // 递增
        versionName "1.1"  // 更新
    }
}
```

### 2. 使用不同的文件名（临时）

在开发期间，如果缓存问题严重，可以使用版本化的文件名：

```xml
<!-- drawable/splash_screen_v2.xml -->
<!-- 然后在 styles.xml 中引用 -->
<item name="android:background">@drawable/splash_screen_v2</item>
```

### 3. 自动化测试脚本

创建一个测试脚本自动验证：

```bash
#!/bin/bash
# test-resources.sh

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

echo "📋 检查 APK 资源..."

# 检查图标
unzip -l "$APK_PATH" | grep -q "res/mipmap.*ic_launcher" && echo "✅ 图标文件存在" || echo "❌ 图标文件缺失"

# 检查启动画面
unzip -l "$APK_PATH" | grep -q "res/drawable.*splash" && echo "✅ 启动画面存在" || echo "❌ 启动画面缺失"

# 检查资源文件大小
echo ""
echo "📦 APK 大小:"
ls -lh "$APK_PATH" | awk '{print $5}'
```

---

## 📝 总结

**推荐操作顺序：**

1. ✅ **完全卸载旧应用**（最重要）
   ```bash
   adb uninstall com.getcapacitor.myapp
   ```

2. ✅ **清理并重新构建**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

3. ✅ **验证 APK 内容**（可选但推荐）
   ```bash
   unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep -E "splash|ic_launcher"
   ```

4. ✅ **安装新版本**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

5. ✅ **重启设备**（某些情况下需要）
   ```bash
   adb reboot
   ```

**如果还是不行：**
- 检查不同的设备或模拟器
- 验证构建配置正确
- 确认没有其他构建变体覆盖了资源

---

## 🔗 相关文档

- [ANDROID_ICON_SPLASH_UPDATE.md](./ANDROID_ICON_SPLASH_UPDATE.md) - 图标和启动画面设计文档
- [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) - Android 构建指南

---

**最后更新：** 2026-06-13
