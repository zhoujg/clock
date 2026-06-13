# 音乐功能部署说明

## 概述

音乐播放器现在支持两种加载方式：
1. **从 music-list.json 读取**（推荐用于生产环境）
2. **直接读取目录**（需要服务器支持目录浏览，适合开发环境）

## 为什么需要 music-list.json？

大多数生产服务器出于安全考虑会禁止目录浏览（返回 403 Forbidden），导致应用无法动态扫描音乐文件。`music-list.json` 提供了一个简单的解决方案。

## 快速开始

### 1. 生成音乐索引

在项目根目录运行：

```bash
./scripts/generate-music-list.sh
```

这会扫描 `assets/bgm/` 目录并生成 `assets/bgm/music-list.json` 文件。

### 2. 查看生成的文件

```bash
cat assets/bgm/music-list.json
```

示例输出：
```json
{
  "generatedAt": "2026-06-13T13:54:33Z",
  "count": 3,
  "music": [
    "The Mass.mp3",
    "Victory.mp3",
    "绝美小提琴演奏.mp3"
  ]
}
```

### 3. 部署到服务器

确保将 `music-list.json` 文件一起上传到服务器：

```bash
# 使用自动部署脚本
./deploy.sh user@neihou.cn /var/www/html/clock

# 或手动上传
rsync -avz ./ user@neihou.cn:/var/www/html/clock/
```

## 工作原理

### 加载流程

```javascript
async loadMusicList() {
    // 步骤 1: 尝试 Capacitor（移动应用）
    if (window.Capacitor) {
        await this.loadMusicFromCapacitor();
        if (this.musicList.length > 0) return;
    }

    // 步骤 2: 尝试 music-list.json 或目录浏览
    await this.probeMusicFiles();
    
    // 步骤 3: 显示空列表
    if (this.musicList.length === 0) {
        this.useDefaultMusicList();
    }
}
```

### probeMusicFiles() 详解

```javascript
async probeMusicFiles() {
    // 1️⃣ 优先读取 music-list.json
    try {
        const response = await fetch('assets/bgm/music-list.json');
        if (response.ok) {
            const data = await response.json();
            const musicFiles = data.music || [];
            // 加载成功，返回
            this.musicList = musicFiles.map(...);
            return;
        }
    } catch (error) {
        // 继续尝试下一个方法
    }

    // 2️⃣ 尝试直接读取目录
    try {
        const response = await fetch('assets/bgm/');
        if (response.ok) {
            // 解析 HTML 获取文件列表
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'));
            // ... 过滤音乐文件
        }
    } catch (error) {
        // 403 错误在这里捕获
        console.log('无法读取 bgm 目录列表');
        this.musicList = [];
    }
}
```

## 使用场景

### 场景 1: 生产服务器（禁止目录浏览）✅ 推荐

```bash
# 1. 生成索引
./scripts/generate-music-list.sh

# 2. 部署
./deploy.sh user@server.com /var/www/html/clock

# 结果：从 music-list.json 加载
```

控制台输出：
```
未找到 music-list.json，尝试读取目录...
无法读取 bgm 目录列表: 无法访问 bgm 目录
✅ 从 music-list.json 加载了 3 首音乐
```

### 场景 2: 开发服务器（支持目录浏览）

```bash
# 使用 Python 启动本地服务器
python3 -m http.server 8000

# 或使用项目脚本
./start-server.sh

# 结果：直接从目录加载，无需 music-list.json
```

控制台输出：
```
✅ 从目录读取了 3 首音乐
```

### 场景 3: 移动应用（Capacitor）

```bash
# 构建 Android 应用
npm run build-android

# 结果：从应用文件系统加载
```

## 常用操作

### 添加新音乐

```bash
# 1. 复制音乐文件
cp ~/Downloads/new-song.mp3 assets/bgm/

# 2. 重新生成索引
./scripts/generate-music-list.sh

# 3. 上传到服务器（只上传新文件和索引）
scp assets/bgm/new-song.mp3 user@server.com:/var/www/html/clock/assets/bgm/
scp assets/bgm/music-list.json user@server.com:/var/www/html/clock/assets/bgm/

# 4. 刷新页面
```

### 删除音乐

```bash
# 1. 删除文件
rm assets/bgm/old-song.mp3

# 2. 重新生成索引
./scripts/generate-music-list.sh

# 3. 同步到服务器
./deploy.sh user@server.com /var/www/html/clock

# 或手动删除
ssh user@server.com "rm /var/www/html/clock/assets/bgm/old-song.mp3"
scp assets/bgm/music-list.json user@server.com:/var/www/html/clock/assets/bgm/
```

### 批量添加音乐

```bash
# 1. 复制所有音乐到目录
cp ~/Music/*.mp3 assets/bgm/

# 2. 生成索引
./scripts/generate-music-list.sh

# 3. 部署
./deploy.sh user@server.com /var/www/html/clock
```

## 验证部署

### 检查文件是否上传

```bash
ssh user@server.com "ls -la /var/www/html/clock/assets/bgm/"
```

应该看到：
```
-rw-r--r-- 1 www-data www-data  147 Jun 13 13:54 music-list.json
-rw-r--r-- 1 www-data www-data 5.2M Jun 13 13:54 The Mass.mp3
-rw-r--r-- 1 www-data www-data 3.8M Jun 13 13:54 Victory.mp3
-rw-r--r-- 1 www-data www-data 4.1M Jun 13 13:54 绝美小提琴演奏.mp3
```

### 测试索引文件

在浏览器访问：
```
https://neihou.cn/clock/assets/bgm/music-list.json
```

应该看到 JSON 内容，而不是 404 错误。

### 检查权限

```bash
# 确保文件可读
ssh user@server.com "chmod 644 /var/www/html/clock/assets/bgm/*"
```

## 故障排除

### 问题 1: 音乐列表为空

**症状**: 播放器打开但没有歌曲

**检查**:
```bash
# 本地检查
ls assets/bgm/music-list.json
cat assets/bgm/music-list.json

# 服务器检查
ssh user@server.com "cat /var/www/html/clock/assets/bgm/music-list.json"
```

**解决**:
```bash
./scripts/generate-music-list.sh
scp assets/bgm/music-list.json user@server.com:/var/www/html/clock/assets/bgm/
```

### 问题 2: music-list.json 404 错误

**症状**: 浏览器控制台显示 `GET .../music-list.json 404`

**原因**: 文件未上传或路径错误

**解决**:
```bash
# 确认文件存在
ls assets/bgm/music-list.json

# 重新上传
scp assets/bgm/music-list.json user@server.com:/var/www/html/clock/assets/bgm/

# 检查权限
ssh user@server.com "chmod 644 /var/www/html/clock/assets/bgm/music-list.json"
```

### 问题 3: 仍然看到 403 错误

**症状**: 控制台显示 `GET .../assets/bgm/ 403`

**这是正常的！** 应用会先尝试读取目录，失败后自动回退到 `music-list.json`。

检查控制台是否有后续的成功消息：
```
无法读取 bgm 目录列表: 无法访问 bgm 目录
✅ 从 music-list.json 加载了 3 首音乐
```

如果没有成功消息，参考**问题 1** 和**问题 2**。

### 问题 4: 音乐文件 403 错误

**症状**: 点击播放后控制台显示 `GET .../some-song.mp3 403`

**原因**: 文件权限不正确

**解决**:
```bash
ssh user@server.com
cd /var/www/html/clock/assets/bgm
chmod 644 *.mp3
ls -la  # 确认权限已更改
```

### 问题 5: 文件名乱码

**症状**: 中文文件名显示为乱码或无法播放

**解决**:
```bash
# 确保服务器使用 UTF-8 编码
ssh user@server.com "locale"

# 在 .htaccess 或 nginx.conf 中添加
AddDefaultCharset UTF-8
```

## 高级配置

### 自定义音乐目录

如果要使用不同的目录，修改 `bgmPlayer.js`:

```javascript
// 修改这些路径
const BGM_PATH = 'assets/bgm/';  // 改为 'music/' 或其他路径
const INDEX_FILE = 'assets/bgm/music-list.json';  // 相应修改
```

### 支持子目录

目前不支持子目录。如果需要，可以修改脚本：

```bash
# 在 generate-music-list.sh 中
# 移除 -maxdepth 1 参数
find "$BGM_DIR" -type f ...
```

### 添加更多元数据

可以扩展 `music-list.json` 格式：

```json
{
  "music": [
    {
      "file": "The Mass.mp3",
      "title": "The Mass",
      "artist": "Era",
      "duration": 243
    }
  ]
}
```

相应修改 `bgmPlayer.js` 中的解析代码。

## 最佳实践

1. ✅ **部署前总是生成 music-list.json**
2. ✅ **将 music-list.json 纳入版本控制**（如果音乐文件也在版本控制中）
3. ✅ **使用脚本自动化部署流程**
4. ✅ **保持音乐文件名简洁，避免特殊字符**
5. ✅ **定期检查服务器上的文件完整性**

## 参考

- **完整部署指南**: `DEPLOY_GUIDE.md`
- **部署修复总结**: `DEPLOYMENT_SUMMARY.md`
- **生成脚本源码**: `scripts/generate-music-list.sh`
- **播放器源码**: `scripts/bgmPlayer.js`

## 支持的格式

| 格式 | 扩展名 | 浏览器支持 |
|------|--------|-----------|
| MP3  | .mp3   | ✅ 所有浏览器 |
| WAV  | .wav   | ✅ 所有浏览器 |
| OGG  | .ogg   | ✅ Chrome, Firefox |
| M4A  | .m4a   | ✅ Safari, Chrome |
| FLAC | .flac  | ✅ Chrome, Edge |
| AAC  | .aac   | ⚠️ 部分浏览器 |

**推荐**: 使用 MP3 格式以获得最佳兼容性。

---

**最后更新**: 2026-06-13
**版本**: 1.0
