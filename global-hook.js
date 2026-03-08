/**
 * model-router-global-hook - 全局消息拦截器
 * 自动拦截所有消息，根据任务类型路由到合适模型
 * 默认免费模型优先，失败自动降级
 */

const path = require('path');
const fs = require('fs');

// 模型映射配置
const DEFAULT_MODELS = {
  code: {
    primary: 'deepseek/deepseek-coder',
    fallbacks: ['bailian/qwen3-coder-plus', 'stepfun/step-3.5-flash:free']
  },
  reasoning: {
    primary: 'deepseek/deepseek-r1:free',
    fallbacks: ['stepfun/step-3.5-flash:free', 'bailian/qwen3.5-plus']
  },
  fast: {
    primary: 'stepfun/step-3.5-flash:free',
    fallbacks: ['deepseek/deepseek-r1:free']
  },
  creative: {
    primary: 'stepfun/step-3.5-flash:free',
    fallbacks: ['deepseek/deepseek-r1:free', 'bailian/qwen3.5-plus']
  },
  auto: {
    primary: 'stepfun/step-3.5-flash:free',
    fallbacks: ['deepseek/deepseek-r1:free', 'bailian/qwen3.5-plus']
  }
};

// 任务类型关键词
const TASK_KEYWORDS = {
  code: [
    '代码', '编程', 'script', 'function', 'debug', 'bug', '重构', 'refactor',
    'python', 'javascript', 'react', 'vue', 'api', '接口', '函数', '类',
    '写个', '写一个', '帮我写', '生成代码', '实现', 'encode', 'decode'
  ],
  reasoning: [
    '分析', '推理', '逻辑', '为什么', '原因', 'compare', 'analyze', '复杂',
    '深度', '解释', '说明', '原理', '机制', '如何工作', '怎么实现',
    '优缺点', '对比', '区别', '关系', '影响', '评估', '判断'
  ],
  creative: [
    '写', '创作', '故事', '文案', '文章', '邮件', '报告', 'summary',
    '总结', '摘要', '描述', '创意', '策划', '方案', '建议', '推荐',
    '翻译', '润色', '改写', '扩写', '缩写', '生成'
  ],
  fast: [
    '简单', '快速', 'brief', 'quick', '是什么', 'what', 'how to',
    '多少', '何时', '哪里', 'who', 'when', 'where', '定义', '意思'
  ]
};

/**
 * 检测任务类型
 */
function detectTaskType(task) {
  const lowerTask = task.toLowerCase();
  const scores = { code: 0, reasoning: 0, creative: 0, fast: 0 };

  for (const [type, keywords] of Object.entries(TASK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTask.includes(keyword.toLowerCase())) {
        scores[type]++;
      }
    }
  }

  // 返回得分最高的类型
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const bestType = sorted[0][0];
  const bestScore = sorted[0][1];

  // 如果没有明显特征，返回 auto
  return bestScore > 0 ? bestType : 'auto';
}

/**
 * 提取消息中的模型标签（如果有的话）
 */
function extractModelTag(message) {
  const match = message.match(/\[model:\s*([^\]]+)\]/i);
  if (match) {
    return {
      model: match[1].trim(),
      cleanMessage: message.replace(match[0], '').trim()
    };
  }
  return null;
}

/**
 * 获取模型配置
 */
function getModelConfig(taskType) {
  return DEFAULT_MODELS[taskType] || DEFAULT_MODELS.auto;
}

/**
 * 主入口 - 处理消息
 * 返回：{ intercepted: true, model: string, taskType: string } 或 null
 */
function handleMessage(message) {
  // 检查是否有显式模型标签
  const manualModel = extractModelTag(message);
  
  if (manualModel) {
    // 用户指定了模型
    return {
      intercepted: true,
      model: manualModel.model.includes('/') ? manualModel.model : resolveModelAlias(manualModel.model),
      taskType: 'manual',
      cleanMessage: manualModel.cleanMessage
    };
  }
  
  // 自动检测任务类型
  const taskType = detectTaskType(message);
  const config = getModelConfig(taskType);
  const model = config.primary;
  
  return {
    intercepted: true,
    model: model,
    taskType: taskType,
    cleanMessage: message,
    fallbacks: config.fallbacks
  };
}

/**
 * 解析模型别名
 */
function resolveModelAlias(alias) {
  const aliases = {
    'step-3.5': 'stepfun/step-3.5-flash:free',
    'qwen-plus': 'bailian/qwen3.5-plus',
    'qwen-coder': 'bailian/qwen3-coder-plus',
    'deepseek': 'deepseek/deepseek-r1:free',
    'code': 'bailian/qwen3-coder-plus',
    'fast': 'stepfun/step-3.5-flash:free',
    'auto': 'stepfun/step-3.5-flash:free'
  };
  return aliases[alias.toLowerCase()] || alias;
}

/**
 * 生成简约的模型使用提示
 */
function generateModelHint(model, taskType) {
  const modelNames = {
    'stepfun/step-3.5-flash:free': 'Step-3.5 (免费)',
    'deepseek/deepseek-r1:free': 'DeepSeek-R1 (免费)',
    'deepseek/deepseek-coder': 'DeepSeek-Coder (免费)',
    'bailian/qwen3.5-plus': 'Qwen3.5-Plus',
    'bailian/qwen3-coder-plus': 'Qwen3-Coder'
  };
  
  const displayName = modelNames[model] || model.split('/').pop();
  return `→ 使用 ${displayName}`;
}

// 导出
module.exports = {
  handleMessage,
  detectTaskType,
  extractModelTag,
  getModelConfig,
  resolveModelAlias,
  generateModelHint,
  DEFAULT_MODELS,
  TASK_KEYWORDS
};

// CLI 测试
if (require.main === module) {
  const message = process.argv.slice(2).join(' ');
  if (message) {
    const result = handleMessage(message);
    console.log('消息:', message);
    console.log('路由结果:', JSON.stringify(result, null, 2));
    console.log('提示:', generateModelHint(result.model, result.taskType));
  } else {
    console.log('用法：node global-hook.js "你的消息"');
  }
}
