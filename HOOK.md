---
name: model-router
description: "Smart model router - Auto-detects task type and routes to optimal model (free/low-cost/fast first)"
homepage: https://github.com/ra1nzzz/model-router
metadata:
  {
    "clawdbot":
      {
        "emoji": "🔄",
        "events": ["message:received"],
        "requires": { "config": ["workspace.dir"] },
        "install": [{ "id": "local", "kind": "local", "label": "Local skill" }],
      }
  }
---

# model-router | 智能模型路由器

**English** | [中文](#中文)

---

## English

🚀 **Smart Model Router for OpenClaw** - Automatically routes messages to the optimal model based on task type, prioritizing free, low-cost, and fast-response models.

### ✨ Features

1. **Auto-Register Hook** - Installs and activates automatically, no manual configuration needed
2. **Smart Task Detection** - Analyzes message content to identify: Code / Reasoning / Creative / Quick Q&A
3. **Intelligent Model Selection** - Scans user's model list and prioritizes:
   - ✅ Free models (highest priority)
   - ✅ Low token cost models
   - ✅ Fast response models (flash/mini/turbo)
   - ✅ Specialized models (code models for coding tasks)
4. **Model Switch Notifications** - Notifies when switching models and when restoring default
5. **Universal Compatibility** - Works with any OpenClaw installation, any user's model list

### 🎯 How It Works

```
User sends message
    ↓
Detect task type (code/reasoning/creative/fast)
    ↓
Scan user's model list
    ↓
Score models (free +100, task-match +50, low-cost +30, fast +20)
    ↓
Select best model
    ↓
Execute task + Notify user
```

### 📋 Task Type Detection

| Type | Keywords (EN/CN) | Example Models |
|------|------------------|----------------|
| **Code** | code, python, debug, 代码，编程 | qwen3-coder-plus, deepseek-coder |
| **Reasoning** | analyze, why, complex, 分析，推理 | qwen3.5-plus, glm-4.7 |
| **Creative** | write, story, create, 写，创作 | step-3.5-flash, gpt-4o-mini |
| **Fast Q&A** | what is, simple, quick, 是什么，简单 | step-3.5-flash, mini models |

### 💬 Usage Examples

**Without tags (auto-routing):**
```
帮我写个 Python 脚本
→ [model-router] 为您智能匹配 step-3.5-flash 模型为您执行该需求

分析一下这个复杂问题
→ [model-router] 为您智能匹配 glm-4.7 模型为您执行该需求
```

**With manual override:**
```
[model: bailian/qwen3-coder-plus] 帮我重构这段代码
→ Uses specified model
```

**Model switch notification:**
```
(Previous task used step-3.5-flash)
现在需要处理复杂推理
→ [model-router] 为您智能匹配 qwen3.5-plus 模型为您执行该需求

(Next task is simple)
今天天气怎么样
→ [model-router] 已恢复默认模型 step-3.5-flash，请放心使用
```

### 🔧 Configuration

No configuration needed! The hook automatically:
- Reads your `openclaw.json` model list
- Scores models based on cost, speed, and task match
- Selects the best model for each task

### 📊 Model Scoring System

| Factor | Score | Description |
|--------|-------|-------------|
| Free model | +100 | Models with "free" in ID or zero cost |
| Task match | +50 | Model keywords match task type (code/plus/flash) |
| Zero cost | +30 | Both input and output cost are 0 |
| Low cost | +20 | Cost < $0.001/M tokens |
| Fast response | +20 | Models with "flash/fast/mini/turbo" |
| Optimal context | +10 | Context window 32K-128K |

### 🌍 Universal Compatibility

Works with any OpenClaw setup:
- ✅ Any model provider (OpenRouter, Bailian, BigModel, etc.)
- ✅ Any number of models
- ✅ Any model naming convention
- ✅ Automatic adaptation to user's model list

### 📦 Installation

```bash
# Install from ClawHub
npx clawhub@latest install model-router

# Or install locally
openclaw hooks install /path/to/model-router
```

After installation, the hook automatically:
1. Registers itself in `openclaw.json`
2. Activates immediately
3. Shows installation message

### 📝 Logs

View routing logs:
```bash
# Check console output
tail -f ~/.openclaw/logs/gateway.log | grep model-router
```

### 🛠️ Troubleshooting

**Hook not working?**
1. Check if hook is enabled: `openclaw hooks list`
2. Verify `handler.js` syntax: `node -c handler.js`
3. Restart gateway: `openclaw gateway restart`

**Model selection not optimal?**
1. Check your model list in `openclaw.json`
2. Ensure models have proper IDs and cost info
3. Adjust scoring in `handler.js` if needed

---

## 中文

🚀 **OpenClaw 智能模型路由器** - 自动检测任务类型，优先使用免费、低消耗、快速响应的模型。

### ✨ 核心特性

1. **自动注册 Hook** - 安装即激活，无需手动配置
2. **智能任务检测** - 分析消息内容识别：代码/推理/创作/快速问答
3. **智能模型选择** - 扫描用户模型列表，优先级：
   - ✅ 免费模型（最高优先级）
   - ✅ 低 Token 消耗模型
   - ✅ 快速响应模型（flash/mini/turbo）
   - ✅ 专用模型（代码任务调用 code 模型）
4. **切换提示** - 模型切换时提示，恢复默认时提示
5. **通用兼容** - 适用于任何 OpenClaw 安装，任何用户的模型列表

### 🎯 工作原理

```
用户发送消息
    ↓
检测任务类型（代码/推理/创作/快速）
    ↓
扫描用户模型列表
    ↓
模型打分（免费 +100，任务匹配 +50，低耗 +30，快速 +20）
    ↓
选择最优模型
    ↓
执行任务 + 通知用户
```

### 📋 任务类型检测

| 类型 | 关键词（中文/英文） | 示例模型 |
|-----|-------------------|---------|
| **代码** | 代码，编程，debug, code, python | qwen3-coder-plus, deepseek-coder |
| **推理** | 分析，推理，复杂，analyze, why | qwen3.5-plus, glm-4.7 |
| **创作** | 写，创作，故事，write, create | step-3.5-flash, gpt-4o-mini |
| **快速问答** | 是什么，简单，quick, what is | step-3.5-flash, mini 模型 |

### 💬 使用示例

**无标签（自动路由）：**
```
帮我写个 Python 脚本
→ [model-router] 为您智能匹配 step-3.5-flash 模型为您执行该需求

分析一下这个复杂问题
→ [model-router] 为您智能匹配 glm-4.7 模型为您执行该需求
```

**手动指定：**
```
[model: bailian/qwen3-coder-plus] 帮我重构这段代码
→ 使用指定模型
```

**模型切换提示：**
```
（上一个任务使用 step-3.5-flash）
现在需要处理复杂推理
→ [model-router] 为您智能匹配 qwen3.5-plus 模型为您执行该需求

（下一个任务变简单）
今天天气怎么样
→ [model-router] 已恢复默认模型 step-3.5-flash，请放心使用
```

### 🔧 配置

无需配置！Hook 自动：
- 读取 `openclaw.json` 中的模型列表
- 根据成本、速度、任务匹配度打分
- 为每个任务选择最优模型

### 📊 模型打分系统

| 因素 | 分数 | 说明 |
|-----|------|------|
| 免费模型 | +100 | ID 含"free"或零成本 |
| 任务匹配 | +50 | 模型关键词匹配任务类型（code/plus/flash） |
| 零成本 | +30 | 输入输出成本均为 0 |
| 低成本 | +20 | 成本 < $0.001/M tokens |
| 快速响应 | +20 | 含"flash/fast/mini/turbo"的模型 |
| 适中上下文 | +10 | 上下文窗口 32K-128K |

### 🌍 通用兼容性

适用于任何 OpenClaw 配置：
- ✅ 任何模型提供商（OpenRouter、百炼、智谱等）
- ✅ 任意数量模型
- ✅ 任意模型命名规范
- ✅ 自动适应用户模型列表

### 📦 安装

```bash
# 从 ClawHub 安装
npx clawhub@latest install model-router

# 或本地安装
openclaw hooks install /path/to/model-router
```

安装后 Hook 自动：
1. 注册到 `openclaw.json`
2. 立即激活
3. 显示安装提示

### 📝 日志

查看路由日志：
```bash
# 查看控制台输出
tail -f ~/.openclaw/logs/gateway.log | grep model-router
```

### 🛠️ 故障排除

**Hook 不工作？**
1. 检查是否启用：`openclaw hooks list`
2. 验证语法：`node -c handler.js`
3. 重启网关：`openclaw gateway restart`

**模型选择不理想？**
1. 检查 `openclaw.json` 中的模型列表
2. 确保模型有正确的 ID 和成本信息
3. 如需可调整 `handler.js` 中的打分逻辑

---

## 📚 Resources | 资源

- **GitHub**: https://github.com/ra1nzzz/model-router
- **Issues**: https://github.com/ra1nzzz/model-router/issues
- **ClawHub**: Coming soon

---

*Last updated: 2026-03-08 | Version: 1.0.0*
