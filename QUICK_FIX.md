# 🚀 快速修复指南

## 问题 1：安卓应用图标和启动画面未更新

### 最快解决方案（推荐）⚡

```bash
# 1. 进入 android 目录
cd android

# 2. 诊断图标配置问题
./fix-icon.sh

# 3. 完全重新安装
./reinstall.sh
```

这些脚本会自动完成：
- ✅ 检查和修复图标配置错误
- ✅ 清理旧构建
- ✅ 重新构建 APK
- ✅ 验证资源
- ✅ 完全卸载旧应用
- ✅ 清除系统缓存
- ✅ 安装新版本

---

## 问题 2：图标仍然是 Capacitor 默认图标

### 原因
自适应图标配置文件引用了错误的资源路径。

### 快速修复

已经修复了配置文件！现在只需重新构建：

```bash
cd android
./gradlew clean
./gradlew assembleDebug
adb uninstall com.getcapacitor.myapp
adb install app/build/outputs/apk/debug/app-debug.apk
```

📘 详细说明：[ICON_FIX_GUIDE.md](./ICON_FIX_GUIDE.md)

---

### 手动操作步骤

如果自动脚本不可用，按以下步骤操作：

```bash
# 1. 清理并构建
cd android
./gradlew clean
./gradlew assembleDebug

# 2. 完全卸载旧应用（重要！）
adb uninstall com.getcapacitor.myapp

# 3. 安装新版本
adb install app/build/outputs/apk/debug/app-debug.apk

# 4. 如果还不行，重启设备
adb reboot
```

---

### 验证资源是否正确打包

运行验证脚本：
```bash
cd android
./verify-resources.sh
```

---

### 常见问题

**Q: 图标还是旧的？**
A: 可能是启动器缓存，尝试：
```bash
# 清除小米启动器缓存
adb shell pm clear com.miui.home

# 或通用启动器
adb shell pm clear com.android.launcher3
```

**Q: 启动画面不显示？**
A: 检查文件：
```bash
ls android/app/src/main/res/drawable/splash*
```

**Q: 如何确认 APK 中有新资源？**
A: 运行：
```bash
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep -E "splash|ic_launcher"
```

---

### 详细文档

- 📘 完整解决方案：[ICON_SPLASH_CACHE_FIX.md](./ICON_SPLASH_CACHE_FIX.md)
- 🎨 图标设计说明：[ANDROID_ICON_SPLASH_UPDATE.md](./ANDROID_ICON_SPLASH_UPDATE.md)
- 🔧 构建指南：[ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)

---

## 脚本位置

| 脚本 | 位置 | 用途 |
|------|------|------|
| `reinstall.sh` | `android/` | 自动清理、构建、卸载、安装 |
| `verify-resources.sh` | `android/` | 验证 APK 资源是否正确 |

---

**最后更新：** 2026-06-13
