# WebView 应用配置说明

## 📱 应用类型

此应用已配置为 **WebView 应用**，直接加载在线网页，无需打包本地资源。

## 🌐 在线地址

应用加载的在线地址：**https://neihou.cn/clock/**

## ✅ 优势

### 1. 便于更新
- ✅ 更新网站内容，应用立即生效
- ✅ 无需重新发布应用到应用商店
- ✅ 用户无需更新应用

### 2. 维护简单
- ✅ 只需维护一个网站
- ✅ Web 和 App 体验一致
- ✅ 减少开发和测试成本

### 3. 灵活性高
- ✅ 可随时修改功能
- ✅ 可实时修复 Bug
- ✅ 可进行 A/B 测试

## 🔧 技术配置

### Capacitor 配置
在 `capacitor.config.json` 中配置：

```json
{
  "server": {
    "url": "https://neihou.cn/clock/",
    "cleartext": true,
    "androidScheme": "https"
  }
}
```

### WebView 设置
在 `MainActivity.java` 中配置：

- ✅ 启用 JavaScript
- ✅ 启用 DOM 存储（LocalStorage）
- ✅ 启用数据库存储
- ✅ 启用缓存
- ✅ 支持混合内容（HTTP/HTTPS）
- ✅ 自适应屏幕
- ✅ 自定义 User Agent

### 网络权限
在 `AndroidManifest.xml` 中已添加：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## 📦 应用行为

### 启动流程
1. 应用启动
2. 显示加载页面（本地 fallback）
3. 自动跳转到 https://neihou.cn/clock/
4. 加载在线网页内容

### 离线处理
- 如果网络不可用，显示本地加载页面
- 提供"重试"按钮
- 提示用户检查网络连接

### 缓存策略
- 使用 WebView 默认缓存策略
- 优先加载缓存，同时检查更新
- 确保内容始终是最新的

## 🚀 构建步骤

### 1. 同步配置
```bash
npm run android:sync
```

### 2. 打开 Android Studio
```bash
npm run android:open
```

### 3. 构建 APK
在 Android Studio 中：
- `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`

### 4. 测试应用
- 在模拟器或真机上运行
- 确保能正常访问 https://neihou.cn/clock/
- 测试网络断开时的行为

## 🔄 更新流程

### 更新网站内容
1. 修改 https://neihou.cn/clock/ 的网站内容
2. **完成！** - 应用会自动加载新内容

### 更新应用配置
如果需要修改 WebView 配置或应用设置：

1. 修改配置文件
2. 运行同步：`npm run android:sync`
3. 重新构建 APK
4. 发布新版本应用

## 🎨 自定义

### 修改加载页面
编辑 `www/index.html` 文件，修改：
- 应用图标
- 加载文案
- 错误提示
- 重试按钮样式

### 修改在线地址
编辑 `capacitor.config.json` 中的 `server.url` 字段

### 修改应用名称/ID
编辑 `capacitor.config.json`：
```json
{
  "appId": "com.zhoumoxin.clock",
  "appName": "周墨欣时钟"
}
```

## 🔍 调试

### 启用 WebView 调试
已在配置中启用：
```json
{
  "android": {
    "webContentsDebuggingEnabled": true
  }
}
```

### Chrome 远程调试
1. 连接设备到电脑
2. 在 Chrome 浏览器打开：`chrome://inspect`
3. 找到你的应用
4. 点击 "inspect" 开始调试

### 查看控制台日志
在 Android Studio 的 Logcat 中查看：
- 过滤：`tag:Capacitor`
- 或者：`tag:WebView`

## ⚠️ 注意事项

### 1. 网络依赖
- 应用需要网络连接才能正常使用
- 建议在应用商店描述中说明
- 考虑添加离线提示

### 2. HTTPS 要求
- 确保网站使用 HTTPS
- 避免证书错误
- Android 9+ 默认不允许 HTTP

### 3. 性能考虑
- WebView 首次加载可能较慢
- 考虑添加启动画面
- 优化网站加载速度

### 4. 兼容性
- 测试不同 Android 版本
- 确保网站支持移动端
- 处理各种屏幕尺寸

### 5. 用户体验
- 提供加载反馈
- 处理网络错误
- 添加重试机制

## 📊 应用信息

| 项目 | 值 |
|------|-----|
| 应用类型 | WebView 应用 |
| 在线地址 | https://neihou.cn/clock/ |
| 更新方式 | 自动（无需发布新版本） |
| 网络需求 | 必需 |
| 缓存支持 | 是 |
| 离线模式 | 部分支持 |

## 🎯 测试清单

发布前确保测试：

- [ ] 应用能正常启动
- [ ] 能加载在线网页
- [ ] 所有功能正常工作
- [ ] LocalStorage 数据正常保存
- [ ] 音频播放正常
- [ ] 图片加载正常
- [ ] 动画效果流畅
- [ ] 网络断开时有提示
- [ ] 重试功能正常
- [ ] 不同屏幕尺寸显示正常
- [ ] 横竖屏切换正常

## 📞 常见问题

### Q: 应用显示白屏？
**A**: 检查网络连接和在线地址是否可访问

### Q: LocalStorage 数据丢失？
**A**: 确保 MainActivity 中启用了 DOM 存储

### Q: 音频无法播放？
**A**: 检查网站的音频文件路径是否正确

### Q: 如何更新应用内容？
**A**: 直接更新网站即可，无需更新应用

### Q: 需要重新发布应用吗？
**A**: 仅当修改应用配置时需要，修改网站内容不需要

## ✨ 总结

你的应用现在是一个纯 WebView 应用，直接加载 https://neihou.cn/clock/。

**优势**：
- 🎯 更新便捷 - 修改网站即可
- 🚀 维护简单 - 只需维护网站
- 💪 灵活性高 - 随时修改功能

**下一步**：
1. 构建 APK
2. 测试应用
3. 发布到应用商店

祝你发布顺利！🎉
