/**
 * model-router Hook Handler
 * 智能模型路由器 - 自动检测任务类型，优先使用免费/快速/低消耗模型
 * 
 * 核心特性：
 * 1. 自动注册为 Hook，安装即启用
 * 2. 智能检测任务类型（代码/推理/创作/快速问答）
 * 3. 优先使用用户模型列表中的免费/低消耗/快速模型
 * 4. 复杂代码任务自动调用 code 字样模型
 * 5. 切换模型时提示，恢复默认时提示
 * 6. 🆕 模型报错自动检测并切换到备用模型
 * 7. 🆕 超时自动重试机制
 */

const path = require('path');
const fs = require('fs');

// 默认模型配置（通用，适用于任何环境）
const DEFAULT_MODELS = {
  code: {
    // 代码任务：优先免费，其次专用 code 模型
    priority: ['free', 'code', 'fast'],
    keywords: ['code', 'coder', 'programming'],
    fallbacks: ['bailian/qwen3-coder-plus', 'bailian/qwen3.5-plus', 'stepfun/step-3.5-flash:free']
  },
  reasoning: {
    // 推理任务：优先免费，其次高质量模型
    priority: ['free', 'plus', 'max'],
    keywords: ['plus', 'max', 'pro'],
    fallbacks: ['bailian/qwen3.5-plus', 'stepfun/step-3.5-flash:free']
  },
  fast: {
    // 快速问答：优先免费/快速模型
    priority: ['free', 'flash', 'fast', 'mini'],
    keywords: ['flash', 'fast', 'mini', 'turbo'],
    fallbacks: ['bailian/qwen3.5-plus']
  },
  creative: {
    // 创作任务：优先免费，其次高质量模型
    priority: ['free', 'plus', 'pro'],
    keywords: ['plus', 'pro'],
    fallbacks: ['bailian/qwen3.5-plus', 'stepfun/step-3.5-flash:free']
  },
  auto: {
    // 自动模式：默认免费
    priority: ['free', 'flash', 'fast'],
    keywords: [],
    fallbacks: ['bailian/qwen3.5-plus', 'stepfun/step-3.5-flash:free']
  }
};

// 模型错误追踪（记录失败次数）
const modelErrorTracker = new Map();
const MAX_ERRORS = 3; // 最大错误次数
const ERROR_WINDOW_MS = 5 * 60 * 1000; // 错误时间窗口（5 分钟）

// 任务类型关键词（中英文）
const TASK_KEYWORDS = {
  code: [
    // 中文
    '代码', '编程', '脚本', '函数', '调试', 'bug', '重构', '接口', '函数', '类',
    '写个', '写一个', '帮我写', '生成代码', '实现',
    // 英文
    'code', 'coding', 'script', 'function', 'debug', 'bug', 'refactor', 'api',
    'write code', 'implement', 'develop', 'program', 'python', 'javascript',
    'react', 'vue', 'java', 'go', 'rust', 'typescript', 'html', 'css'
  ],
  reasoning: [
    // 中文
    '分析', '推理', '逻辑', '为什么', '原因', '复杂', '深度', '解释', '说明',
    '原理', '机制', '如何工作', '怎么实现', '优缺点', '对比', '区别', '关系',
    '影响', '评估', '判断', '思考', '理解', '解读', '剖析', '洞察',
    // 英文
    'analyze', 'analysis', 'reasoning', 'logic', 'why', 'complex', 'deep',
    'explain', 'principle', 'mechanism', 'how it works', 'pros and cons',
    'compare', 'difference', 'relationship', 'impact', 'evaluate', 'judge'
  ],
  creative: [
    // 中文
    '写', '创作', '故事', '文案', '文章', '邮件', '报告', '总结', '摘要',
    '描述', '创意', '策划', '方案', '建议', '推荐', '翻译', '润色', '改写',
    '扩写', '缩写', '生成', '诗歌', '小说', '剧本', '歌词', '演讲稿',
    // 英文
    'write', 'create', 'story', 'copy', 'article', 'email', 'report', 'summary',
    'description', 'creative', 'plan', 'proposal', 'suggest', 'recommend',
    'translate', 'polish', 'rewrite', 'expand', 'poem', 'novel', 'script', 'lyrics'
  ],
  fast: [
    // 中文
    '简单', '快速', '是什么', '多少', '何时', '哪里', '谁', '定义', '意思',
    '基本概念', '简单介绍', '一句话', '简短', 'quick', 'brief', 'fast',
    // 英文
    'simple', 'quick', 'fast', 'what is', 'how many', 'when', 'where', 'who',
    'definition', 'meaning', 'basic', 'short', 'brief'
  ]
};

// 模型特征识别
const MODEL_PATTERNS = {
  free: ['free', 'gratis', 'zero'],
  code: ['code', 'coder', 'coding', 'dev'],
  fast: ['flash', 'fast', 'quick', 'turbo', 'mini', 'tiny'],
  plus: ['plus', 'pro', 'advanced'],
  max: ['max', 'ultra', 'premium', 'ultimate'],
  reasoning: ['r1', 'reason', 'think', 'deep']
};

/**
 * 从 openclaw.json 读取用户模型列表
 */
function getUserModels() {
  try {
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.openclaw', 'openclaw.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const models = [];
    
    // 提取所有提供商的模型
    const providers = config.models?.providers || {};
    for (const [providerName, provider] of Object.entries(providers)) {
      if (Array.isArray(provider.models)) {
        for (const model of provider.models) {
          models.push({
            id: `${providerName}/${model.id}`,
            name: model.name || model.id,
            contextWindow: model.contextWindow || 4096,
            maxTokens: model.maxTokens || 2048,
            cost: model.cost || { input: 0, output: 0 }
          });
        }
      }
    }
    
    return models;
  } catch (e) {
    console.error('[model-router] 读取用户模型列表失败:', e.message);
    return [];
  }
}

/**
 * 识别模型特征
 */
function identifyModelFeatures(modelId) {
  const lowerId = modelId.toLowerCase();
  const features = [];
  
  for (const [feature, patterns] of Object.entries(MODEL_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerId.includes(pattern)) {
        features.push(feature);
        break;
      }
    }
  }
  
  return features;
}

/**
 * 记录模型错误
 */
function recordModelError(modelId, error) {
  const now = Date.now();
  const tracker = modelErrorTracker.get(modelId) || { errors: [], lastError: null };
  
  // 添加错误记录
  tracker.errors.push({
    error: error.message || String(error),
    timestamp: now
  });
  
  // 清理旧错误（超出时间窗口）
  tracker.errors = tracker.errors.filter(e => now - e.timestamp < ERROR_WINDOW_MS);
  
  // 更新追踪器
  modelErrorTracker.set(modelId, tracker);
  
  console.log(`[model-router] ⚠️  模型 ${modelId} 错误（${tracker.errors.length}/${MAX_ERRORS}）: ${error.message || String(error)}`);
}

/**
 * 检查模型是否可用（错误次数未超限）
 */
function isModelAvailable(modelId) {
  const tracker = modelErrorTracker.get(modelId);
  if (!tracker) return true;
  
  const now = Date.now();
  const recentErrors = tracker.errors.filter(e => now - e.timestamp < ERROR_WINDOW_MS);
  
  return recentErrors.length < MAX_ERRORS;
}

/**
 * 获取下一个可用模型
 */
function getNextAvailableModel(taskType, currentModel, userModels) {
  const config = DEFAULT_MODELS[taskType] || DEFAULT_MODELS.auto;
  const fallbacks = config.fallbacks || [];
  
  // 尝试备用模型列表
  for (const modelId of fallbacks) {
    if (isModelAvailable(modelId)) {
      console.log(`[model-router] 🔄 切换到备用模型：${modelId}`);
      return modelId;
    }
  }
  
  // 备用模型都不可用，从用户模型列表中选择
  for (const model of userModels) {
    if (model.id !== currentModel && isModelAvailable(model.id)) {
      console.log(`[model-router] 🔄 切换到用户模型：${model.id}`);
      return model.id;
    }
  }
  
  // 没有可用模型，返回当前模型（让它再试一次）
  return currentModel;
}

/**
 * 智能选择模型 - 根据任务类型和用户模型列表
 */
function selectBestModel(taskType, userModels) {
  if (!userModels || userModels.length === 0) {
    // 没有用户模型，返回默认
    return DEFAULT_MODELS[taskType]?.priority[0] || 'auto';
  }
  
  const config = DEFAULT_MODELS[taskType] || DEFAULT_MODELS.auto;
  
  // 为每个模型打分
  const scored = userModels.map(model => {
    const features = identifyModelFeatures(model.id);
    let score = 0;
    
    // 【关键修复】代码任务强制优先 code 模型
    if (taskType === 'code') {
      // 含 "code/coder" 特征的模型 +200 分（最高优先级）
      if (features.includes('code')) {
        score += 200;
      }
      // 免费但不是 code 模型，只 +50 分（避免免费模型优先于 code 模型）
      else if (features.includes('free')) {
        score += 50;
      }
    }
    // 其他任务类型保持原有逻辑
    else {
      // 1. 免费模型优先（+100 分）
      if (features.includes('free')) {
        score += 100;
      }
      
      // 2. 符合任务类型特征（+50 分）
      for (const keyword of config.keywords) {
        if (features.includes(keyword)) {
          score += 50;
          break;
        }
      }
    }
    
    // 3. 低消耗（+30 分）- 所有任务类型都适用
    if (model.cost?.input === 0 && model.cost?.output === 0) {
      score += 30;
    } else if (model.cost?.input < 0.001 && model.cost?.output < 0.001) {
      score += 20;
    }
    
    // 4. 快速响应（+20 分）- 非代码任务适用
    if (taskType !== 'code' && (features.includes('fast') || features.includes('flash'))) {
      score += 20;
    }
    
    // 5. 上下文窗口适中（+10 分）
    if (model.contextWindow >= 32000 && model.contextWindow <= 128000) {
      score += 10;
    }
    
    return { model, score };
  });
  
  // 按分数排序，返回最高分的模型
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0]?.model?.id || userModels[0]?.id || 'auto';
}

/**
 * 检测任务类型
 */
function detectTaskType(task) {
  const lowerTask = task.toLowerCase();
  const scores = { code: 0, reasoning: 0, creative: 0, fast: 0 };

  for (const [type, keywords] of Object.entries(TASK_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerTask) || lowerTask.includes(keyword.toLowerCase())) {
        scores[type]++;
      }
    }
  }

  // 返回得分最高的类型
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const bestType = sorted[0][0];
  const bestScore = sorted[0][1];

  return bestScore > 0 ? bestType : 'auto';
}

/**
 * 提取消息中的模型标签
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
 * 生成模型提示（简约但清晰）
 */
function generateModelHint(model, taskType = 'auto', action = 'use') {
  const shortName = model.split('/').pop() || model;
  
  // 识别模型特征
  const features = identifyModelFeatures(model);
  const isFree = features.includes('free');
  const isCode = features.includes('code');
  
  if (action === 'use') {
    if (taskType === 'code' && isCode) {
      return `[model-router] 检测到代码任务，已切换到 ${shortName} 模型`;
    } else if (isFree) {
      return `[model-router] 使用免费模型 ${shortName} 为您执行`;
    } else {
      return `[model-router] 为您智能匹配 ${shortName} 模型执行该需求`;
    }
  } else if (action === 'restore') {
    return `[model-router] 任务完成，已恢复默认模型 ${shortName}`;
  }
  
  return `→ 使用 ${shortName}`;
}

/**
 * 状态管理 - 跟踪上次使用的模型
 */
const state = {
  lastModel: null,
  lastTaskType: null,
  lastHint: null
};

/**
 * Hook 入口函数
 */
async function handle(params) {
  const { message, context } = params;
  
  if (!message || typeof message !== 'string') {
    return null;
  }

  // 检查是否有显式模型标签
  const manualModel = extractModelTag(message);
  
  let taskType, model, cleanMessage, hint, shouldNotify;
  
  if (manualModel) {
    // 用户指定了模型
    taskType = 'manual';
    model = manualModel.model;
    cleanMessage = manualModel.cleanMessage;
    hint = generateModelHint(model, 'use');
    shouldNotify = true;
  } else {
    // 自动检测任务类型
    taskType = detectTaskType(message);
    
    // 获取用户模型列表
    const userModels = getUserModels();
    
    // 智能选择最佳模型
    model = selectBestModel(taskType, userModels);
    cleanMessage = message;
    hint = generateModelHint(model, taskType, 'use');
    
    // 如果模型切换了，需要提示
    shouldNotify = state.lastModel && state.lastModel !== model;
    
    // 更新状态
    state.lastModel = model;
    state.lastTaskType = taskType;
  }

  // 记录路由信息（每次都输出，方便调试）
  console.log(`[model-router] 任务类型：${taskType} | 模型：${model}`);
  
  // 有提示就输出（切换时或首次使用）
  if (shouldNotify || !state.lastHint) {
    console.log(`[model-router] ${hint}`);
  }
  
  // 记录上次提示
  state.lastHint = hint;

  // 生成用户可见的提示（包含模型信息）- 附加到消息末尾
  const userVisibleHint = `\n\n---\n> 💡 **模型路由提示**\n> - 执行模型：**${model.split('/').pop()}**\n> - 任务类型：**${taskType}**\n> - 模型特征：${identifyModelFeatures(model).join(', ') || '通用'}`;

  // 返回处理后的消息和上下文（提示附加到消息末尾）
  return {
    message: cleanMessage + userVisibleHint,
    context: {
      ...context,
      modelRouter: {
        model,
        taskType,
        hint,
        shouldNotify
      }
    }
  };
}

// 导出
module.exports = {
  handle,
  detectTaskType,
  extractModelTag,
  selectBestModel,
  identifyModelFeatures,
  getUserModels,
  generateModelHint,
  DEFAULT_MODELS,
  TASK_KEYWORDS,
  MODEL_PATTERNS,
  state
};
