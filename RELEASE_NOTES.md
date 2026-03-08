# model-router 发布说明

## 版本：v1.0.1-hotfix

**发布日期：** 2026-03-08 19:23  
**状态：** ✅ 待发布  
**优先级：** 🔥 紧急修复

---

## 🔥 修复内容

### 问题描述

用户在代码任务中发现 model-router 没有切换到 code 类型模型，而是继续使用免费模型。

**根本原因：**
- 代码任务中，免费模型 +100 分
- code 模型只有 +50 分
- 导致 step-3.5-flash 分数高于 qwen3-coder-plus

### 修复方案

**修改文件：** `handler.js`

**核心改动：**
```javascript
// 代码任务强制优先 code 模型
if (taskType === 'code') {
  // 含 "code/coder" 特征的模型 +200 分（最高优先级）
  if (features.includes('code')) {
    score += 200;
  }
  // 免费但不是 code 模型，只 +50 分
  else if (features.includes('free')) {
    score += 50;
  }
}
```

### 修复效果

**修复前：**
```
用户：帮我写个 Python 脚本
[model-router] → 使用 step-3.5-flash
```

**修复后：**
```
用户：帮我写个 Python 脚本
[model-router] 检测到代码任务，已切换到 qwen3-coder-plus 模型
```

---

## ✨ 新增功能

### 优化的提示信息

**修复前：**
```
→ 使用 step-3.5-flash
```

**修复后：**
```
[model-router] 检测到代码任务，已切换到 qwen3-coder-plus 模型
[model-router] 使用免费模型 step-3.5-flash 为您执行
[model-router] 为您智能匹配 qwen3.5-plus 模型执行该需求
```

---

## 📊 模型打分系统（修复后）

| 任务类型 | 模型特征 | 分数 | 优先级 |
|---------|---------|------|-------|
| **代码任务** | code/coder | +200 | 🔥 最高 |
| **代码任务** | free（非 code） | +50 | ⚠️ 低 |
| **所有任务** | 免费模型 | +100 | ✅ 高（非代码任务） |
| **所有任务** | 任务匹配 | +50 | ✅ 中 |
| **所有任务** | 零成本 | +30 | ✅ 中 |
| **非代码任务** | 快速响应 | +20 | ✅ 低 |

---

## 🧪 测试验证

### 测试用例

1. **代码任务**
   ```
   帮我写个 Python 脚本
   ✅ 应切换到 qwen3-coder-plus
   ```

2. **简单问答**
   ```
   今天天气怎么样
   ✅ 应使用 step-3.5-flash（免费）
   ```

3. **复杂推理**
   ```
   分析一下这个复杂问题
   ✅ 应使用 qwen3.5-plus
   ```

4. **创作任务**
   ```
   写一个故事
   ✅ 应使用 step-3.5-flash（免费）
   ```

### 测试结果

| 测试项 | 预期 | 实际 | 状态 |
|-------|------|------|------|
| 代码任务 | qwen3-coder-plus | ✅ | 通过 |
| 简单问答 | step-3.5-flash | ✅ | 通过 |
| 复杂推理 | qwen3.5-plus | ✅ | 通过 |
| 创作任务 | step-3.5-flash | ✅ | 通过 |
| 提示信息 | 清晰明确 | ✅ | 通过 |
| 切换通知 | 切换时提示 | ✅ | 通过 |

---

## 📦 发布计划

### 1. 本地测试
- [x] 语法验证
- [x] 功能测试
- [x] 日志验证

### 2. 发布到 ClawHub
```bash
cd /Users/yitao/.openclaw/workspace/skills/model-router
npx clawhub@latest publish
```

### 3. 发布到 GitHub
```bash
git add .
git commit -m "v1.0.1-hotfix: Fix code task model routing priority"
git tag v1.0.1
git push origin main --tags
```

### 4. 通知用户
- 更新 ClawHub 版本
- 更新 GitHub Release
- 发送更新通知

---

## 🔄 升级指南

### 已安装用户

自动更新（ClawHub）：
```bash
npx clawhub@latest update model-router
```

手动更新：
```bash
openclaw hooks uninstall model-router
openclaw hooks install model-router
```

### 新用户

```bash
npx clawhub@latest install model-router
```

---

## 📝 变更日志

### v1.0.1-hotfix (2026-03-08)
- 🔥 修复：代码任务强制优先 code 模型（+200 分）
- ✨ 优化：模型切换提示更清晰（显示任务类型）
- 🐛 修复：免费模型不会覆盖 code 模型优先级

### v1.0.0 (2026-03-08)
- ✨ 首次发布
- ✨ 智能任务类型检测
- ✨ 模型打分系统
- ✨ 模型切换通知
- ✨ 通用兼容性

---

## 👤 作者

**韬哥**  
**优化者：** Lucy (AI Assistant)

---

## 📄 许可证

MIT License

---

*发布准备完成！可以随时发布到 ClawHub 和 GitHub。* 🎉
