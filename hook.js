/**
 * model-router-hook - 消息拦截器
 * 拦截包含 [model: xxx] 标签的消息，自动路由到对应模型
 */

const { exec } = require('child_process');
const path = require('path');

// 模型映射
const MODEL_ALIASES = {
  'step-3.5': 'stepfun/step-3.5-flash:free',
  'qwen-plus': 'bailian/qwen3.5-plus',
  'qwen-coder': 'bailian/qwen3-coder-plus',
  'deepseek': 'deepseek/deepseek-r1:free',
  'code': 'bailian/qwen3-coder-plus',
  'fast': 'stepfun/step-3.5-flash:free',
  'auto': 'bailian/qwen3.5-plus'
};

/**
 * 解析消息中的模型标签
 */
function parseModelTag(message) {
  const match = message.match(/\[model:\s*([^\]]+)\]/i);
  if (!match) return null;
  
  const modelSpec = match[1].trim();
  
  // 检查是否是完整模型名（包含 /）
  if (modelSpec.includes('/')) {
    return {
      model: modelSpec,
      cleanMessage: message.replace(match[0], '').trim()
    };
  }
  
  // 使用别名映射
  const model = MODEL_ALIASES[modelSpec.toLowerCase()];
  if (model) {
    return {
      model: model,
      cleanMessage: message.replace(match[0], '').trim()
    };
  }
  
  return null;
}

/**
 * 使用指定模型执行任务
 */
async function executeWithModel(model, task, timeoutSeconds = 60) {
  return new Promise((resolve, reject) => {
    const cmd = `openclaw sessions spawn --model "${model}" --task "${task.replace(/"/g, '\\"')}" --timeout ${timeoutSeconds}`;
    
    exec(cmd, { 
      timeout: timeoutSeconds * 1000 + 5000,
      cwd: '/Users/yitao/.openclaw/workspace'
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * 主入口 - 处理消息
 */
async function handleMessage(message) {
  const tag = parseModelTag(message);
  
  if (!tag) {
    // 没有模型标签，返回 null 表示不拦截
    return null;
  }
  
  console.log(`[model-router] 拦截消息，路由到模型：${tag.model}`);
  console.log(`[model-router] 清理后任务：${tag.cleanMessage}`);
  
  try {
    const result = await executeWithModel(tag.model, tag.cleanMessage);
    return {
      intercepted: true,
      model: tag.model,
      result: result
    };
  } catch (error) {
    console.error(`[model-router] 执行失败：${error.message}`);
    return {
      intercepted: true,
      error: error.message,
      fallback: true
    };
  }
}

// CLI 模式
if (require.main === module) {
  const message = process.argv.slice(2).join(' ');
  if (message) {
    handleMessage(message).then(result => {
      console.log('结果:', JSON.stringify(result, null, 2));
    });
  } else {
    console.log('用法：node hook.js [model: xxx] 你的消息');
  }
}

module.exports = {
  parseModelTag,
  handleMessage,
  MODEL_ALIASES
};
