# Model Router 使用指南

## 快速使用

在飞书直接发送带标签的消息：

```
[model: code] 帮我写个 Python 脚本
[model: reasoning] 分析这个复杂问题
[model: fast] 简单问答
[model: stepfun/step-3.5-flash:free] 使用特定模型
```

## 模型别名

| 别名 | 完整模型名 |
|-----|-----------|
| `step-3.5` | `stepfun/step-3.5-flash:free` |
| `qwen-plus` | `bailian/qwen3.5-plus` |
| `qwen-coder` | `bailian/qwen3-coder-plus` |
| `deepseek` | `deepseek/deepseek-r1:free` |
| `code` | `bailian/qwen3-coder-plus` |
| `fast` | `stepfun/step-3.5-flash:free` |
| `auto` | `bailian/qwen3.5-plus` (自动检测) |

## 工作原理

1. **消息拦截** - 检测 `[model: xxx]` 标签
2. **模型路由** - 映射到完整模型名
3. **子代理执行** - 使用 `sessions_spawn` 创建临时会话
4. **结果返回** - 将结果发送回飞书

## 手动测试

```bash
cd /Users/yitao/.openclaw/workspace/skills/model-router
node hook.js "[model: code] 写个 hello world"
```

## 集成到 OpenClaw

当前版本需要手动调用。完整集成需要：

1. 在 `openclaw.json` 添加全局 hook
2. 或修改飞书插件拦截消息

---

**状态:** ✅ 技能核心完成，待完全集成到消息流
