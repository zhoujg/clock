# 快速开始 - 构建安卓应用

## 🌐 应用类型

这是一个 **WebView 应用**，直接加载在线网页：**https://neihou.cn/clock/**

**优势**：修改网站内容，应用立即更新，无需重新发布！

## ✅ 已完成的配置

1. ✅ 安装 Capacitor 依赖
2. ✅ 配置 WebView 加载在线地址
3. ✅ 添加安卓平台
4. ✅ 配置 WebView 高级设置
5. ✅ 同步项目文件

## 🎯 下一步：构建 APK

### 前提条件
确保已安装 **Android Studio**：
- 下载：https://developer.android.com/studio
- 安装后需要配置 Android SDK

### 方法一：使用 Android Studio（推荐）

1. **打开项目：**
```bash
npm run android:open
```

2. **在 Android Studio 中：**
   - 等待 Gradle 同步完成（首次可能需要几分钟）
   - 点击顶部的 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
   - 构建完成后，点击通知中的 "locate" 查看 APK

3. **APK 位置：**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 方法二：使用命令行

```bash
cd android
./gradlew assembleDebug
```

生成的 APK 在：`android/app/build/outputs/apk/debug/app-debug.apk`

### 方法三：直接安装到手机

1. **连接安卓手机：**
   - 启用开发者选项
   - 打开 USB 调试
   - 用 USB 线连接到电脑

2. **运行：**
```bash
npm run android:open
```

3. **在 Android Studio 中：**
   - 点击绿色三角形 "Run" 按钮
   - 选择你的设备
   - 应用会自动安装并启动

## 📱 测试应用

### 在模拟器中测试
1. 在 Android Studio 中打开 AVD Manager（工具栏中的手机图标）
2. 创建新的虚拟设备（如果没有的话）
3. 启动模拟器
4. 点击 "Run" 按钮

### 在真机上测试
1. 启用 USB 调试
2. 连接手机到电脑
3. 在 Android Studio 中选择设备
4. 点击 "Run" 按钮

## 🔄 修改代码后的更新流程

### 更新网站内容（推荐）
直接修改 https://neihou.cn/clock/ 的网站内容，应用会自动加载最新内容。**无需重新构建应用！**

### 更新应用配置
如果修改了应用配置（如 WebView 设置）：

```bash
npm run android:sync
```

然后在 Android Studio 中重新构建和运行。

## 📦 发布版本

构建签名的发布版 APK：

1. 在 Android Studio 中：`Build` > `Generate Signed Bundle / APK`
2. 选择 `APK`，点击 `Next`
3. 创建密钥库（首次）或选择已有密钥库
4. 填写密钥信息
5. 选择 `release` 构建类型
6. 点击 `Finish`

发布版 APK 位于：`android/app/release/app-release.apk`

## 🆘 常见问题

### Android Studio 未安装
下载并安装：https://developer.android.com/studio

### 找不到 Android SDK
在 Android Studio 中：
1. 打开 `Preferences` / `Settings`
2. 进入 `Appearance & Behavior` > `System Settings` > `Android SDK`
3. 确保安装了至少一个 SDK Platform（推荐 API 33+）

### Gradle 同步失败
1. 确保网络连接正常
2. 在 Android Studio 中：`File` > `Invalidate Caches / Restart`
3. 等待自动重新同步

### 应用显示空白屏幕
1. 检查网络连接是否正常
2. 确认 https://neihou.cn/clock/ 可以在浏览器中访问
3. 检查 `capacitor.config.json` 中的 URL 是否正确
4. 在 Chrome 中打开 `chrome://inspect` 进行远程调试

## 🌐 WebView 应用说明

详细配置和说明请查看：[WEBVIEW_CONFIG.md](./WEBVIEW_CONFIG.md)

## 📞 获取帮助

详细文档：查看 [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)

Capacitor 官方文档：https://capacitorjs.com/docs/android

## 🎉 完成！

你现在可以将这个 Web 时钟应用作为原生安卓应用使用了！
