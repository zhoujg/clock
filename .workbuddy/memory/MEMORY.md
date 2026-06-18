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

## 视觉主题（Apple 浅色风格，2026-06-17 启用）
- 主文字 `#1d1d1f`，次要文字 `#86868b`，次级元素 `rgba(134,134,139,*）`
- 强调蓝 `#0071e3`，成功绿 `#34c759`，错误红 `#ff3b30`，警告橙 `#ff9500`
- 毛玻璃面板：`rgba(255,255,255,0.85)` + `backdrop-filter: blur(40px) saturate(180%)`
- 阴影：`0 2px 12px rgba(0,0,0,0.08)`，边框：`1px solid rgba(0,0,0,0.06)`
- 默认背景：`#f5f5f7`（storage.js getDefaultSettings）
- smartColor.js 动态调色（背景亮度≥60→深文字，<60→浅文字）
- iOS 状态栏：`default`（深色文字状态栏）
- 新增样式禁止使用旧的深色 rgb/rgba 值；全部 JS/CSS 文件已统一改造

## 部署
- 参见 `DEPLOYMENT.md`
- API 路径：`/api/*.php`
- CORS 配置在 `server/config.php` 的 `ALLOWED_ORIGINS`
