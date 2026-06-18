# 滴答时钟 - 安卓应用构建指南

本指南将帮助你将这个 Web 应用打包成安卓 APK 应用。

## 📋 前置要求

在开始之前，请确保你的系统已安装以下工具：

### 1. Node.js 和 npm
✅ 已检测到安装（Node.js v22.21.1, npm 10.9.4）

### 2. Android Studio
需要下载并安装 Android Studio：
- 下载地址：https://developer.android.com/studio
- 安装完成后，打开 Android Studio
- 通过 SDK Manager 安装：
  - Android SDK Platform（建议 API 33 或更高版本）
  - Android SDK Build-Tools
  - Android SDK Platform-Tools

### 3. Java Development Kit (JDK)
- Android Studio 通常会自带 JDK
- 或者单独下载 JDK 17 或更高版本

### 4. 环境变量配置
在 macOS 上，需要配置以下环境变量（在 `~/.zshrc` 文件中添加）：

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

配置完成后运行：
```bash
source ~/.zshrc
```

## 🚀 构建步骤

### 步骤 1：安装依赖
在项目根目录执行：
```bash
npm install
```

✅ **已完成**：依赖已安装

### 步骤 2：添加安卓平台
```bash
npm run android:add
```

这将创建 `android/` 目录并生成安卓项目所需的所有文件。

✅ **已完成**：安卓平台已添加

### 步骤 3：同步项目文件
```bash
npm run android:sync
```

每次修改 Web 文件后都需要运行此命令来同步更新。

✅ **已完成**：文件已同步

### 步骤 4：打开 Android Studio
```bash
npm run android:open
```

这会在 Android Studio 中打开安卓项目。

### 步骤 5：构建 APK

在 Android Studio 中：

#### 方式 1：直接运行到设备
1. 连接安卓手机到电脑（启用 USB 调试）
2. 点击顶部工具栏的 "Run" 按钮（绿色三角形）
3. 选择你的设备
4. 应用会自动安装并运行

#### 方式 2：构建 APK 文件
1. 在菜单栏选择 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
2. 等待构建完成
3. 点击通知中的 "locate" 链接查找生成的 APK
4. APK 位置通常在：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 方式 3：构建发布版 APK（签名）
1. 在菜单栏选择 `Build` > `Generate Signed Bundle / APK`
2. 选择 `APK`，点击 `Next`
3. 创建或选择密钥库（Key Store）
4. 填写密钥信息
5. 选择 `release` 构建类型
6. 点击 `Finish`
7. 发布版 APK 位于：`android/app/release/app-release.apk`

## 📱 应用权限说明

本应用需要以下权限（已在配置中自动添加）：
- 网络访问权限（用于加载资源）
- 存储权限（用于保存背景图片和设置）

## 🔧 常见问题

### Q1: 命令找不到 `npx` 或 `npm`
**解决方案**：确保已正确安装 Node.js 并将其添加到系统 PATH。

### Q2: Android Studio 无法找到 SDK
**解决方案**：
1. 打开 Android Studio
2. 进入 `Preferences` > `Appearance & Behavior` > `System Settings` > `Android SDK`
3. 确保已安装必要的 SDK 组件

### Q3: 构建时出现 Gradle 错误
**解决方案**：
1. 在 Android Studio 中打开项目
2. 等待 Gradle 自动同步和下载依赖
3. 如果仍有问题，尝试 `Build` > `Clean Project`，然后 `Build` > `Rebuild Project`

### Q4: 应用安装后显示空白屏幕
**解决方案**：
1. 检查 `capacitor.config.json` 中的 `webDir` 设置是否正确（应该是 "."）
2. 确保运行了 `npm run android:sync` 同步文件
3. 检查浏览器控制台是否有 JavaScript 错误

### Q5: 背景图片或音频无法加载
**解决方案**：
- 确保所有资源文件路径使用相对路径
- Capacitor 会自动处理文件访问，但某些情况下可能需要调整路径

## 📦 应用信息

- **应用 ID**：com.zhoumoxin.clock
- **应用名称**：滴答时钟
- **版本**：1.0.0

## 🔄 更新应用

当你修改了 Web 文件（HTML、CSS、JS）后：

1. 运行同步命令：
```bash
npm run android:sync
```

2. 在 Android Studio 中重新构建并运行

## 📝 自定义应用

### 修改应用图标
1. 准备不同尺寸的图标文件，或使用项目中提供的 `app-icon.svg`
2. 使用在线工具（如 https://icon.kitchen/）生成各种尺寸的图标
3. 将生成的图标放置到 `android/app/src/main/res/` 对应的 `mipmap-*` 文件夹中
4. 替换 `ic_launcher.png` 和 `ic_launcher_round.png` 文件

**推荐的图标尺寸：**
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192

### 修改应用名称
编辑 `capacitor.config.json` 文件中的 `appName` 字段。

### 修改应用 ID
编辑 `capacitor.config.json` 文件中的 `appId` 字段（注意：修改后需要重新添加平台）。

## 🎯 下一步

安装依赖并开始构建：
```bash
npm install
npm run android:add
npm run android:sync
npm run android:open
```

祝你构建成功！🎉
