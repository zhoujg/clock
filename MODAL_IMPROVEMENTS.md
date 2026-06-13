# 弹窗样式统一和互斥显示改进报告

## 改进日期
2026年6月13日

## 改进目标
1. 统一三个弹窗（设置面板、音乐播放器、番茄钟）的样式
2. 实现同一时间只允许一个弹窗显示的互斥逻辑

## 具体改进

### 1. 样式统一

#### 1.1 设置面板 (Settings Panel)
**修改文件**: `index.html`
- ✅ 添加关闭按钮（之前缺失）
- ✅ 统一使用 `panel-header` 和 `panel-close-btn` 类
- ✅ 添加 emoji 图标 ⚙️
- ✅ 保留标题下方的分隔线（`border-bottom`）

**HTML结构**:
```html
<div class="panel-header">
    <span>⚙️ 设置面板</span>
    <button id="settingsPanelCloseBtn" class="panel-close-btn" title="关闭">
        <svg>...</svg>
    </button>
</div>
<div class="panel-content">
    <!-- 设置项 -->
</div>
```

#### 1.2 音乐播放器面板 (Music Panel)
**修改文件**: `index.html`
- ✅ 已经有关闭按钮
- ✅ 已经使用统一的 `panel-header` 类
- ✅ 已经有标题分隔线
- ✅ 样式已符合统一标准

#### 1.3 番茄钟面板 (Pomodoro Panel)
**修改文件**: `scripts/pomodoro.js`, `styles/pomodoro.css`
- ✅ 替换自定义的 `pomodoro-header` 和 `pomodoro-close` 为统一的 `panel-header` 和 `panel-close-btn`
- ✅ 添加 `panel-content` 容器包裹面板内容
- ✅ 统一关闭按钮样式（从 × 改为 SVG 图标）
- ✅ 添加 `overflow: hidden` 防止内容溢出

**新HTML结构**:
```html
<div class="panel-header">
    <span>🍅 番茄钟</span>
    <button class="panel-close-btn" id="pomodoroClose" title="关闭">
        <svg>...</svg>
    </button>
</div>
<div class="panel-content">
    <!-- 番茄钟内容 -->
</div>
```

### 2. 样式细节统一

#### 2.1 通用样式 (controls.css)
- ✅ `panel-header`: 统一内边距 `18px 20px`
- ✅ `panel-header`: 统一字体大小 `15px`
- ✅ `panel-header`: 统一分隔线 `border-bottom: 1px solid rgba(255, 255, 255, 0.1)`
- ✅ `panel-close-btn`: 统一关闭按钮样式
- ✅ 添加 `panel-header span` 样式支持 emoji 图标对齐

#### 2.2 响应式适配
- ✅ 番茄钟面板在不同屏幕尺寸下使用 `panel-content` 统一内边距
- ✅ 平板设备 (481px - 768px)
- ✅ 手机设备 (max-width: 480px)
- ✅ 横屏设备 (landscape)

### 3. 互斥显示逻辑

#### 3.1 设置面板切换
**修改文件**: `scripts/app.js`
- ✅ 点击设置按钮时关闭音乐面板
- ✅ 点击设置按钮时关闭番茄钟面板
- ✅ 添加设置面板关闭按钮事件处理

#### 3.2 音乐面板切换
**修改文件**: `scripts/app.js`
- ✅ 点击音乐按钮时关闭设置面板
- ✅ 点击音乐按钮时关闭番茄钟面板
- ✅ 保留音乐面板关闭按钮事件处理

#### 3.3 番茄钟面板切换
**修改文件**: `scripts/pomodoro.js`
- ✅ 点击番茄钟按钮时关闭设置面板
- ✅ 点击番茄钟按钮时关闭音乐面板
- ✅ 保留番茄钟面板关闭按钮事件处理

#### 3.4 全局点击关闭
**修改文件**: `scripts/app.js`
- ✅ 点击页面其他区域时关闭所有面板（已存在）

## 测试清单

### 样式测试
- [ ] 打开设置面板，检查是否有关闭按钮和分隔线
- [ ] 打开音乐面板，检查样式是否一致
- [ ] 打开番茄钟面板，检查样式是否一致
- [ ] 三个面板的标题栏高度和样式应完全一致

### 互斥测试
- [ ] 打开设置面板后，点击音乐按钮，设置面板应关闭
- [ ] 打开设置面板后，点击番茄钟按钮，设置面板应关闭
- [ ] 打开音乐面板后，点击设置按钮，音乐面板应关闭
- [ ] 打开音乐面板后，点击番茄钟按钮，音乐面板应关闭
- [ ] 打开番茄钟面板后，点击设置按钮，番茄钟面板应关闭
- [ ] 打开番茄钟面板后，点击音乐按钮，番茄钟面板应关闭

### 关闭按钮测试
- [ ] 设置面板的关闭按钮工作正常
- [ ] 音乐面板的关闭按钮工作正常
- [ ] 番茄钟面板的关闭按钮工作正常

### 响应式测试
- [ ] 在手机尺寸下测试所有面板
- [ ] 在平板尺寸下测试所有面板
- [ ] 在横屏模式下测试所有面板

## 修改文件列表

1. `index.html` - 添加设置面板关闭按钮
2. `scripts/app.js` - 实现互斥逻辑和关闭按钮事件
3. `scripts/pomodoro.js` - 统一番茄钟面板结构和互斥逻辑
4. `styles/controls.css` - 统一panel-header样式
5. `styles/pomodoro.css` - 移除自定义样式，使用统一样式

## 注意事项

1. 所有面板现在都使用统一的 CSS 类：
   - `.panel-header` - 标题栏
   - `.panel-close-btn` - 关闭按钮
   - `.panel-content` - 内容区域

2. 关闭按钮使用 SVG 图标而不是文字符号，保持视觉一致性

3. 互斥逻辑通过在每个面板切换时移除其他面板的 `active` 类实现

4. 响应式设计已更新，确保在所有设备上都能正常显示

## 后续建议

1. 考虑添加面板切换动画过渡效果
2. 考虑添加键盘快捷键（如 ESC 关闭面板）
3. 考虑添加面板状态持久化（记住用户上次打开的面板）
