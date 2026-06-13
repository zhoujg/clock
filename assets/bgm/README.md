# BGM 音乐文件夹

## 说明

此文件夹用于存放背景音乐（BGM）文件。音乐播放器会从这个目录读取音乐列表。

## 支持的音乐格式

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)

## 如何添加音乐

1. 将你的音乐文件（MP3、WAV、OGG 或 M4A 格式）复制到此文件夹
2. 编辑 `scripts/bgmPlayer.js` 文件
3. 在 `loadMusicList()` 方法中的 `this.musicList` 数组添加音乐信息

### 示例配置

```javascript
this.musicList = [
    { name: '轻音乐1', file: 'assets/bgm/music1.mp3' },
    { name: '轻音乐2', file: 'assets/bgm/music2.mp3' },
    { name: '自然之声', file: 'assets/bgm/nature.mp3' },
    { name: '钢琴曲', file: 'assets/bgm/piano.mp3' },
    { name: '专注白噪音', file: 'assets/bgm/whitenoise.mp3' }
];
```

## 推荐音乐类型

适合专注工作/学习的音乐：

- 轻音乐、纯音乐
- 钢琴曲、古典音乐
- 自然环境音（雨声、森林、海浪）
- Lo-fi 音乐
- 白噪音、粉红噪音

## 版权说明

请确保你有权使用添加到此文件夹的音乐文件。建议使用：

- 个人创作的音乐
- 免费授权的音乐（CC0、CC BY 等）
- 购买授权的正版音乐
- 免版权音乐网站的资源

## 免费音乐资源网站

- YouTube Audio Library
- Free Music Archive
- Incompetech
- Bensound
- Pixabay Music

## 音乐文件命名建议

使用有意义的英文文件名，避免使用特殊字符：

- ✅ good: `relaxing_piano.mp3`
- ✅ good: `nature_rain_sounds.mp3`
- ❌ bad: `音乐1.mp3`
- ❌ bad: `my song (2024) [final].mp3`
