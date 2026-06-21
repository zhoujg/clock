# 打字练习插件 ⌨️

英语单词打字练习插件，帮助提升英语打字速度和准确性。

## 最新更新 🎉

### v1.4 (2026-06-21) - 语音质量优化 🔊
- ✅ **新增语音开关按钮**（🔊/🔇）- 一键控制发音
- ✅ **智能语音选择** - 自动选择最佳语音（优先 Samantha、Alex 等高质量语音）
- ✅ **优化语音参数** - 速度 0.8x，音量 0.9，更清晰自然
- ✅ **增强稳定性** - 异步加载处理、自动备用方案
- ✅ **调试信息** - 控制台输出当前使用的语音

**详细说明**：查看 [VOICE_IMPROVEMENT.md](./VOICE_IMPROVEMENT.md)

## 功能特性

### 📚 四种词库
1. **⌨️ 键盘练习**（初学者）- 10 个练习项目，适合刚接触打字的同学
2. **📝 基础词汇** - 10 个常用词
3. **📚 大学英语四级** - 10 个 CET-4 词汇
4. **🎓 大学英语六级** - 10 个 CET-6 词汇

### 🎯 核心功能
- ✅ **逐字母高亮显示**（参考 TypeWords）
- ✅ **实时反馈**（正确显示绿色，错误显示红色）
- ✅ **无输入框**，直接键盘输入
- ✅ **虚拟键盘**（仅键盘练习模式显示）
- ✅ **英文发音**（智能语音选择，支持开关）
- ✅ **音标、翻译、例句**显示
- ✅ **统计数据**（累计练习、正确次数、最快速度）
- ✅ **自动提交**（输入完成后自动检查）

### 🎨 设计风格
- **Apple 毛玻璃效果**（`backdrop-filter: blur(40px)`）
- **统一配色方案**（蓝色 #0071e3，绿色 #30d158，红色 #ff453a）
- **流畅动画效果**
- **响应式布局**（支持移动端）

### ⌨️ 快捷键
- **字母键（a-z）**：输入字母
- **Backspace**：删除最后一个字母
- **Enter**：提交当前单词（可选，自动提交开启时不需要）
- **Escape**：退出练习

### 🔊 语音功能（v1.4 新增）
- **语音开关按钮**：点击 🔊/🔇 切换发音
- **智能选择最佳语音**：
  - macOS: Samantha（⭐⭐⭐⭐⭐）> Alex > Karen
  - Windows: Microsoft Zira > David
  - Chrome: Google US English
- **优化参数**：
  - 速度：0.8x（更自然）
  - 音量：0.9（更清晰）
  - 音调：1.0（标准）
- **设置持久化**：开关状态自动保存

## 使用方法

### 开始练习
1. 点击底部工具栏"**打字**"按钮
2. 选择词库
3. 点击"**开始练习**"
4. 直接输入键盘字母
5. 输入完成后自动检查

### 切换语音开关（v1.4）
1. 打开打字练习面板
2. 点击词库选择器右侧的 **🔊** 按钮
3. 按钮变为 🔇 表示已关闭发音
4. 再次点击恢复发音
5. 设置自动保存，刷新页面后保持

### 键盘练习模式（v1.3）
1. 选择"**⌨️ 键盘练习（初学者）**"
2. 虚拟键盘会自动显示
3. **蓝色脉冲**高亮显示下一个要按的键
4. 按下正确的键后会显示**绿色**
5. **ASDF JKL** 基准键位有特殊标记

### 查看统计
- 面板底部显示历史统计数据
- 完成练习后显示本次成绩（准确率、速度、用时）

### 调试语音（v1.4）
打开浏览器控制台（F12），查看当前使用的语音：
```
使用语音: Samantha en-US
```

查看所有可用语音：
```javascript
speechSynthesis.getVoices().forEach(v => 
  console.log(`${v.name} (${v.lang})`)
)
```

## 技术实现

### 核心类：TypingPracticeManager
```javascript
// 主要方法
- init()                    // 初始化
- createUI()                // 创建界面
- startPractice()           // 开始练习
- showNextWord()            // 显示下一个单词
- updateInputDisplay()      // 更新输入显示（逐字母高亮）
- checkWord()               // 检查单词
- speak(text)               // 语音播放
- setPreferredVoice()       // 智能选择语音（v1.4 新增）
- toggleVoice()             // 切换语音开关（v1.4 优化）
- updateVoiceButton()       // 更新按钮状态（v1.4 新增）
```

### 数据结构
```javascript
WORD_LIBRARIES = {
    keyboard: { name, words: [...] },
    basic: { name, words: [...] },
    cet4: { name, words: [...] },
    cet6: { name, words: [...] }
}

Word = {
    word: string,           // 单词
    translation: string,    // 翻译
    phonetic: string,       // 音标
    sentence: string,       // 例句
    sentenceTrans: string   // 例句翻译
}
```

### 本地存储
- `typingPracticeStats` - 统计数据
- `typingPracticeVoice` - 语音开关状态（"true"/"false"）

## 样式特点

### 逐字母高亮
- `.word-letter` - 基础字母样式
- `.word-letter.current` - 当前要输入的字母（蓝色 + 下划线动画）
- `.word-letter.correct` - 已正确输入的字母（绿色）
- `.word-letter.error` - 错误输入的字母（红色 + 抖动动画）

### 虚拟键盘
- `.key` - 基础按键样式
- `.key.home-key` - 基准键位（ASDF JKL）
- `.key.next` - 下一个要按的键（蓝色脉冲动画）
- `.key.pressed` - 已按下的键（绿色）

### 语音按钮（v1.4 新增）
- `.typing-voice-toggle` - 语音开关按钮
- 蓝色主题色（#0071e3）
- 悬停动画效果
- 响应式尺寸

### Apple 风格
- 毛玻璃背景：`backdrop-filter: blur(40px) saturate(180%)`
- 圆角：24px（面板）、12px（按钮）
- 阴影：`box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15)`
- 颜色：`rgba(255, 255, 255, 0.92)`

## 文件结构
```
plugins/typing-practice/
├── manifest.json              # 插件配置
├── plugin.js                  # 插件注册
├── typing-class.js            # 核心逻辑（1070+ 行）
├── style.css                  # Apple 风格样式
├── README.md                  # 本文档
└── VOICE_IMPROVEMENT.md       # 语音优化技术文档（v1.4 新增）
```

## 浏览器兼容性

| 浏览器 | 基础功能 | 语音功能 | 推荐度 |
|--------|----------|----------|--------|
| Safari (macOS) | ✅ | ⭐⭐⭐⭐⭐ | 强烈推荐 |
| Chrome | ✅ | ⭐⭐⭐⭐ | 推荐 |
| Edge | ✅ | ⭐⭐⭐⭐ | 推荐 |
| Firefox | ✅ | ⭐⭐⭐ | 支持 |

**语音说明**：
- Safari (macOS) 支持最多系统语音，音质最佳（推荐使用 Samantha）
- Chrome/Edge 支持 Google 语音和部分系统语音
- Firefox 语音选择相对较少

## 参考资料
- 灵感来源：[TypeWords](https://typewords.cc/)
- 设计参考：plugins/bgm-music（Apple 风格）
- Speech Synthesis API：[MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

## 版本历史

### v1.4 (2026-06-21) - 语音质量优化 🔊
- ✅ 新增语音开关按钮（🔊/🔇）
- ✅ 智能选择最佳语音（优先 Samantha、Alex 等高质量语音）
- ✅ 优化语音参数（速度 0.8x，音量 0.9）
- ✅ 增强稳定性（异步加载处理、自动备用方案）
- ✅ 添加调试信息（控制台输出当前语音）
- ✅ 新增技术文档 VOICE_IMPROVEMENT.md

### v1.3 (2026-06-20) - 虚拟键盘
- ✅ 键盘练习模式显示虚拟键盘
- ✅ 实时高亮下一个要按的键（蓝色脉冲动画）
- ✅ 显示已按下的键（绿色）
- ✅ 基准键位（ASDF JKL）特殊标记
- ✅ 响应式设计，适配移动端

### v1.2 (2026-06-19) - 键盘练习
- ✅ 新增"键盘练习"模式，适合初学者
- ✅ 10 个练习项目（asdf、jkl、qwerty 等）
- ✅ 手指位置指导说明

### v1.1 (2026-06-18) - Apple 风格重构
- ✅ 重构为 Apple 风格设计
- ✅ 移除 typing-input-display
- ✅ 实现逐字母高亮
- ✅ 优化动画效果

### v1.0 (2026-06-17) - 初始版本
- 初始版本
- 基础打字练习功能
- 四种词库（后来增加到四种）

## 未来计划
- [ ] 支持自定义词库导入
- [ ] 添加错词本功能
- [ ] 集成在线 TTS API（Google/Amazon/Azure）
- [ ] 增加更多词库（托福、雅思、GRE）
- [ ] 添加练习历史曲线图
- [ ] 支持句子练习模式
- [ ] 添加打字游戏模式
- [ ] 支持多语言（不仅仅是英语）

## 反馈与建议

如果发音质量仍不满意，请：
1. 检查浏览器控制台，确认使用的语音
2. 尝试使用 Safari（macOS 用户，语音质量最佳）
3. 在系统设置中安装更多语音（系统设置 → 辅助功能 → 语音内容）
4. 考虑使用外部 TTS 服务（未来版本计划支持）

如有其他问题或建议，请联系开发者。
