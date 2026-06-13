# 应用图标不显示问题修复指南

## 问题描述
启动画面（Splash Screen）已经更新，但是应用图标还是显示 Capacitor 的默认图标。

## 根本原因
自适应图标配置文件（`mipmap-anydpi-v26/ic_launcher.xml`）中引用了错误的资源：

**错误配置：**
```xml
<adaptive-icon>
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>  <!-- ❌ 引用了不存在的 mipmap 资源 -->
</adaptive-icon>
```

**正确配置：**
```xml
<adaptive-icon>
    <background android:drawable="@drawable/ic_launcher_background"/>  <!-- ✅ 引用 drawable 资源 -->
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>  <!-- ✅ 引用 drawable 资源 -->
</adaptive-icon>
```

---

## ✅ 已修复的问题

### 1. 修复了自适应图标配置

**修改的文件：**
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`

**修改内容：**
- 将 `@mipmap/ic_launcher_foreground` 改为 `@drawable/ic_launcher_foreground`
- 将 `@color/ic_launcher_background` 改为 `@drawable/ic_launcher_background`

### 2. 添加了兼容性支持

**新增文件：**
- `android/app/src/main/res/drawable/ic_launcher_foreground.xml`

从 `drawable-v24/` 复制到 `drawable/`，确保所有 Android 版本都能使用矢量图标。

---

## 🚀 如何应用修复

### 方法 1：使用自动修复脚本（推荐）

```bash
cd android

# 1. 运行诊断和修复脚本
./fix-icon.sh

# 2. 完全重新安装应用
./reinstall.sh
```

### 方法 2：手动操作

```bash
cd android

# 1. 清理旧构建
./gradlew clean

# 2. 重新构建
./gradlew assembleDebug

# 3. 完全卸载旧应用（重要！）
adb uninstall com.getcapacitor.myapp

# 4. 安装新版本
adb install app/build/outputs/apk/debug/app-debug.apk

# 5. 如果图标还没更新，重启设备
adb reboot
```

---

## 🔍 验证修复结果

### 在安装之前验证 APK

```bash
cd android

# 运行验证脚本
./verify-resources.sh

# 或手动检查
unzip -l app/build/outputs/apk/debug/app-debug.apk | grep ic_launcher
```

应该看到：
```
res/drawable/ic_launcher_background.xml
res/drawable/ic_launcher_foreground.xml
res/mipmap-anydpi-v26/ic_launcher.xml
res/mipmap-anydpi-v26/ic_launcher_round.xml
res/mipmap-hdpi/ic_launcher.png
res/mipmap-mdpi/ic_launcher.png
...
```

### 在设备上验证

1. **主屏幕图标**：应该显示白色时钟图标，深色背景
2. **应用抽屉图标**：同上
3. **设置 > 应用**：显示自定义图标
4. **启动画面**：深色背景 + 时钟图标

---

## 📁 图标资源文件结构

正确的文件结构应该是：

```
android/app/src/main/res/
├── drawable/
│   ├── ic_launcher_background.xml     ✅ 图标背景（矢量图）
│   └── ic_launcher_foreground.xml     ✅ 图标前景（矢量图）
├── drawable-v24/
│   └── ic_launcher_foreground.xml     ℹ️  API 24+ 版本（可选）
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml                ✅ 自适应图标配置
│   └── ic_launcher_round.xml          ✅ 圆形图标配置
├── mipmap-hdpi/
│   ├── ic_launcher.png                ℹ️  备用 PNG（旧版 Android）
│   └── ic_launcher_round.png
├── mipmap-mdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
└── values/
    └── ic_launcher_background.xml     ✅ 颜色定义
```

---

## 🐛 常见问题

### Q1: 修复后图标还是默认的

**原因：** 系统缓存

**解决方案：**
```bash
# 完全卸载应用
adb uninstall com.getcapacitor.myapp

# 清除启动器缓存
adb shell pm clear com.miui.home  # 小米
adb shell pm clear com.android.launcher3  # 原生

# 重启设备
adb reboot

# 重新安装
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Q2: 不同设备显示不同的图标

**原因：** PNG 备用图标可能没有更新

**解决方案：**

使用 Android Studio 的 Image Asset Studio 生成所有密度的 PNG 图标：

1. 右键点击 `res` 文件夹
2. New > Image Asset
3. Icon Type: Launcher Icons (Adaptive and Legacy)
4. Foreground Layer: 选择 `ic_launcher_foreground.xml`
5. Background Layer: 选择颜色 `#1a1a1a`
6. Next > Finish

### Q3: Android 7 及以下版本显示默认图标

**原因：** 旧版 Android 不支持自适应图标，需要 PNG 备用图标

**解决方案：**

确保 `mipmap-*/ic_launcher.png` 文件存在并已更新（见 Q2）。

### Q4: 构建时提示找不到资源

**错误信息：**
```
error: failed linking file resources.
error: resource drawable/ic_launcher_foreground (aka com.getcapacitor.myapp:drawable/ic_launcher_foreground) not found.
```

**解决方案：**
```bash
# 确认文件存在
ls -la app/src/main/res/drawable/ic_launcher_foreground.xml

# 如果不存在，从 drawable-v24 复制
cp app/src/main/res/drawable-v24/ic_launcher_foreground.xml \
   app/src/main/res/drawable/ic_launcher_foreground.xml

# 清理并重新构建
./gradlew clean
./gradlew assembleDebug
```

---

## 🎨 图标设计说明

### 矢量图 vs PNG

**矢量图优势：**
- ✅ 任何尺寸都清晰
- ✅ 文件体积小
- ✅ 易于修改颜色和样式
- ✅ Android 5.0+ 原生支持

**PNG 图标作用：**
- 备用方案（Android 7.x 及以下）
- 某些特殊场景（通知图标等）

### 自适应图标说明

Android 8.0 (API 26) 引入的自适应图标系统：

- **前景层 (Foreground)**：108dp × 108dp，安全区域 66dp × 66dp
- **背景层 (Background)**：108dp × 108dp，纯色或图案
- **系统裁剪**：自动裁剪为圆形、方形、圆角矩形等

**安全区域：**
```
┌────────────────────┐
│  ┌──────────────┐  │  108dp × 108dp
│  │              │  │
│  │   66dp安全   │  │  中心 66dp × 66dp
│  │              │  │
│  └──────────────┘  │
└────────────────────┘
```

确保重要内容在中心 66dp 区域内。

---

## 📋 检查清单

安装前检查：
- [ ] `drawable/ic_launcher_foreground.xml` 存在
- [ ] `drawable/ic_launcher_background.xml` 存在
- [ ] `mipmap-anydpi-v26/ic_launcher.xml` 引用 `@drawable` 资源
- [ ] `values/ic_launcher_background.xml` 定义了颜色
- [ ] 运行 `./verify-resources.sh` 验证通过

安装时操作：
- [ ] 完全卸载旧版本应用
- [ ] 清除系统启动器缓存（可选）
- [ ] 安装新版本 APK
- [ ] 重启设备（如果需要）

安装后验证：
- [ ] 主屏幕显示自定义图标
- [ ] 应用抽屉显示自定义图标
- [ ] 启动画面显示正确
- [ ] 设置 > 应用中显示自定义图标

---

## 🛠️ 可用脚本

| 脚本 | 用途 | 命令 |
|------|------|------|
| `fix-icon.sh` | 诊断和修复图标配置问题 | `./fix-icon.sh` |
| `verify-resources.sh` | 验证 APK 资源是否正确 | `./verify-resources.sh` |
| `reinstall.sh` | 完全重新安装应用 | `./reinstall.sh` |

---

## 🔗 相关文档

- [图标和启动画面设计](./ANDROID_ICON_SPLASH_UPDATE.md)
- [缓存问题修复](./ICON_SPLASH_CACHE_FIX.md)
- [快速修复指南](./QUICK_FIX.md)
- [Android 构建指南](./ANDROID_BUILD_GUIDE.md)

---

**最后更新：** 2026-06-13

**修复版本：** v1.1
