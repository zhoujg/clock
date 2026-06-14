# Jamendo API 修复说明

## 问题描述

Jamendo API 返回错误：
```
Parameter 'order' accept only values in [relevance,buzzrate,downloads_week,downloads_month,downloads_total,listens_week,listens_month,listens_total,popularity_week,popularity_month,popularity_total,name,album_name,artist_name,releasedate,duration,id]. 'random' was given
```

**原因**: Jamendo API 不支持 `order=random` 参数。

## 解决方案

### 1. 修改排序策略

将 `order=random` 改为 `order=popularity_week`（按本周流行度排序）

### 2. 添加随机偏移量

使用随机的 `offset` 参数来获取不同的结果集：
```javascript
const randomOffset = Math.floor(Math.random() * 100);
params.append('offset', randomOffset.toString());
```

### 3. 客户端随机打乱

使用 Fisher-Yates 算法在客户端随机打乱结果：
```javascript
shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
```

### 4. 添加错误处理

检查 API 返回的错误信息：
```javascript
if (data.headers && data.headers.status === 'failed') {
    throw new Error(`Jamendo API 错误: ${data.headers.error_message}`);
}
```

## 修改的文件

- `scripts/jamendoAPI.js`
  - 修改 `getRandomTracks()` 方法
  - 修改 `searchTracks()` 方法（添加错误处理）
  - 添加 `shuffleArray()` 方法

## Jamendo API 支持的 order 参数

根据官方文档，`order` 参数支持以下值：

### 相关性和流行度
- `relevance` - 相关性（搜索时使用）
- `buzzrate` - 热度排行
- `popularity_week` - 本周流行度 ⭐ **推荐用于随机**
- `popularity_month` - 本月流行度
- `popularity_total` - 总流行度

### 下载统计
- `downloads_week` - 本周下载量
- `downloads_month` - 本月下载量
- `downloads_total` - 总下载量

### 播放统计
- `listens_week` - 本周播放量
- `listens_month` - 本月播放量
- `listens_total` - 总播放量

### 其他
- `name` - 曲目名称
- `album_name` - 专辑名称
- `artist_name` - 艺术家名称
- `releasedate` - 发布日期
- `duration` - 时长
- `id` - ID

## 实现效果

通过组合以下三种随机化方式，可以实现良好的随机播放效果：

1. **随机偏移量**: 每次请求不同的起始位置（0-100）
2. **流行度排序**: 确保获取质量较高的音乐
3. **客户端打乱**: 在返回结果中进一步随机化

## 测试方法

1. 打开 `test_jamendo.html` 测试页面
2. 多次点击 "获取随机音乐" 按钮
3. 观察每次返回的音乐是否不同
4. 检查浏览器控制台确认没有 API 错误

## 使用示例

```javascript
// 获取随机音乐（使用修复后的方法）
const tracks = await jamendoAPI.getRandomTracks({
    limit: 20,
    tags: 'chillout'
});

// 搜索音乐（使用 relevance 排序）
const results = await jamendoAPI.searchTracks({
    query: 'piano',
    limit: 20
});
```

## 性能优化

### 缓存策略
- 缓存时间：5 分钟
- 缓存键：基于标签和查询参数
- 手动清除：`jamendoAPI.clearCache()`

### 请求优化
- 默认 limit: 20（平衡速度和多样性）
- 音频格式：mp32（32kbps，节省带宽）
- offset 范围：0-100（避免请求过时音乐）

## 后续改进建议

1. **智能缓存**
   - 为不同标签维护独立缓存
   - 实现 LRU 缓存淘汰策略

2. **更好的随机性**
   - 增加 offset 范围到 200-500
   - 使用多个排序标准轮换

3. **音乐去重**
   - 记录最近播放的音乐 ID
   - 避免短期内重复

4. **错误重试**
   - 网络错误自动重试
   - 使用指数退避策略

---

**修复时间**: 2026-06-14
**状态**: ✅ 已修复
**影响**: 所有使用 Jamendo API 的功能
