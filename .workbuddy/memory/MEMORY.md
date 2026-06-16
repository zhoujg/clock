# 时钟应用 - 项目约定

## 技术栈
- 前端：纯 HTML/CSS/JS（无框架）
- 后端：PHP 7.4+ / MySQL 5.7+
- 认证：JWT (HMAC-SHA256)
- 同步策略：last-write-wins，debounce 500ms 推送

## 数据库表
- `users` — 用户（email, bcrypt密码）
- `user_data` — 键值对配置（settings, picsumFavorites, musicFavorites, forestData, studyAchievements, pomodoroData）
- `stories` — 每日故事（独立表，支持增量同步、按日期查询）

## 前端模块加载顺序
1. flip.min.js → storage.js → particle/animation/background/quotes/tickSound
2. jamendoAPI.js → bgmPlayer.js
3. achievement → forest → pomodoro → weather → picsum → smartColor → dailyStories
4. cloudSync.js → syncAdapter.js → authUI.js → app.js

## 已修复的问题
- Safari 时间卡片缩小：移除 `data-layout` 中的 `fit` 关键字
- iPad 滴答声不均：Web Audio API 替代 HTML5 Audio

## 部署
- 参见 `DEPLOYMENT.md`
- API 路径：`/api/*.php`
- CORS 配置在 `server/config.php` 的 `ALLOWED_ORIGINS`
