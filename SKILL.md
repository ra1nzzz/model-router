---
name: model-router
model: standard
category: utility
description: Smart model router - Auto-detects task type and routes to optimal model (free/low-cost/fast first) | 智能模型路由器 - 自动检测任务类型，优先使用免费/低耗/快速模型
version: 1.0.0
---

# model-router | 智能模型路由器

**English** | [中文](#中文)

---

## English

🚀 **Smart Model Router for OpenClaw**

Automatically routes messages to the optimal model based on:
- Task type (code/reasoning/creative/fast Q&A)
- Model cost (free models prioritized)
- Response speed (flash/mini/turbo models preferred)
- User's model list (automatic scanning and scoring)

### Installation

```bash
npx clawhub@latest install model-router
```

**Post-install:** Hook auto-registers and activates immediately.

### Features

✅ Auto-register hook on install  
✅ Smart task type detection  
✅ Prioritizes free/low-cost models  
✅ Model switch notifications  
✅ Universal compatibility  
✅ No configuration needed  

### Usage

**Auto-routing:**
```
帮我写个 Python 脚本
→ [model-router] 为您智能匹配 step-3.5-flash 模型为您执行该需求
```

**Manual override:**
```
[model: bailian/qwen3-coder-plus] 帮我重构代码
```

---

## 中文

🚀 **OpenClaw 智能模型路由器**

自动路由消息到最优模型，基于：
- 任务类型（代码/推理/创作/快速问答）
- 模型成本（免费模型优先）
- 响应速度（flash/mini/turbo 模型优先）
- 用户模型列表（自动扫描和打分）

### 安装

```bash
npx clawhub@latest install model-router
```

**安装后：** Hook 自动注册并立即激活。

### 特性

✅ 安装后自动注册 Hook  
✅ 智能任务类型检测  
✅ 优先使用免费/低消耗模型  
✅ 模型切换提示  
✅ 通用兼容性  
✅ 无需配置  

### 使用

**自动路由：**
```
帮我写个 Python 脚本
→ [model-router] 为您智能匹配 step-3.5-flash 模型为您执行该需求
```

**手动指定：**
```
[model: bailian/qwen3-coder-plus] 帮我重构代码
```

---

## Technical Details | 技术细节

### Model Scoring | 模型打分

| Factor | 因素 | Score | 分数 |
|--------|------|-------|------|
| Free model | 免费模型 | +100 | ✅ |
| Task match | 任务匹配 | +50 | ✅ |
| Zero cost | 零成本 | +30 | ✅ |
| Low cost | 低成本 | +20 | ✅ |
| Fast response | 快速响应 | +20 | ✅ |

### Task Types | 任务类型

- **code**: Code generation, debugging, refactoring
- **reasoning**: Analysis, logic, complex problems
- **creative**: Writing, creation, translation
- **fast**: Simple Q&A, quick answers

---

## Repository | 仓库

- **GitHub**: https://github.com/ra1nzzz/model-router
- **ClawHub**: Coming soon

---

*Version: 1.0.0 | Last updated: 2026-03-08*
