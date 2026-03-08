/**
 * model-router - 智能模型路由器
 * 自动检测模型报错/无响应/超时，按任务复杂度动态切换模型
 */

const fs = require('fs');
const path = require('path');

// 默认模型映射配置
const DEFAULT_MODELS = {
  code: {
    primary: 'bailian/qwen3-coder-plus',
    fallbacks: ['deepseek/deepseek-coder', 'bailian/qwen3.5-plus']
  },
  reasoning: {
    primary: 'bailian/qwen3.5-plus',
    fallbacks: ['deepseek/deepseek-r1:free', 'stepfun/step-3.5-flash:free']
  },
  fast: {
    primary: 'stepfun/step-3.5-flash:free',
    fallbacks: ['deepseek/deepseek-r1:free', 'bailian/qwen3.5-plus']
  },
  creative: {
    primary: 'bailian/qwen3.5-plus',
    fallbacks: ['openai/gpt-4o-mini:free', 'deepseek/deepseek-r1:free']
  },
  auto: {
    // 自动检测任务类型
    primary: 'bailian/qwen3.5-plus',
    fallbacks: ['stepfun/step-3.5-flash:free']
  }
};

// 任务类型关键词
const TASK_KEYWORDS = {
  code: ['代码', '编程', 'script', 'function', 'debug', 'bug', '重构', 'refactor', 'python', 'javascript', 'react', 'vue', 'api', '接口'],
  reasoning: ['分析', '推理', '逻辑', '为什么', '原因', 'compare', 'analyze', '复杂', '深度'],
  creative: ['写', '创作', '故事', '文案', '文章', '邮件', '报告', 'summary', 'write'],
  fast: ['简单', '快速', 'brief', 'quick', '是什么', 'what', 'how to']
};

class ModelRouter {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, 'models.json');
    this.models = this.loadConfig();
    this.logPath = path.join(__dirname, 'router.log');
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const custom = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        return { ...DEFAULT_MODELS, ...custom };
      }
    } catch (e) {
      this.log('WARN', `加载配置失败，使用默认配置：${e.message}`);
    }
    return DEFAULT_MODELS;
  }

  /**
   * 检测任务类型
   */
  detectTaskType(task) {
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
    const bestType = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0];

    return bestType[0] === 'code' || bestType[1] > 0 ? bestType[0] : 'auto';
  }

  /**
   * 提取任务中的模型标签
   */
  extractModelTag(task) {
    const match = task.match(/\[model:\s*([^\]]+)\]/i);
    if (match) {
      return {
        model: match[1].trim(),
        cleanTask: task.replace(match[0], '').trim()
      };
    }
    return null;
  }

  /**
   * 路由任务到合适的模型
   */
  async route(options) {
    const { task, type = 'auto', timeoutMs = 30000, maxRetries = 2 } = options;

    // 检查是否有手动指定的模型
    const manualModel = this.extractModelTag(task);
    if (manualModel) {
      this.log('INFO', `手动指定模型：${manualModel.model}`);
      return this.executeWithModel(manualModel.model, manualModel.cleanTask, timeoutMs, maxRetries);
    }

    // 自动检测任务类型
    const taskType = type === 'auto' ? this.detectTaskType(task) : type;
    this.log('INFO', `检测到任务类型：${taskType}`);

    const modelConfig = this.models[taskType] || this.models.auto;
    const modelsToTry = [modelConfig.primary, ...modelConfig.fallbacks];

    // 依次尝试模型
    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const isLast = i === modelsToTry.length - 1;

      try {
        this.log('INFO', `尝试模型 ${i + 1}/${modelsToTry.length}: ${model}`);
        const result = await this.executeWithModel(model, task, timeoutMs, isLast ? 0 : 1);
        this.log('SUCCESS', `模型 ${model} 执行成功`);
        return {
          success: true,
          model: model,
          taskType: taskType,
          result: result,
          attempts: i + 1
        };
      } catch (error) {
        this.log('ERROR', `模型 ${model} 失败：${error.message}`);
        if (isLast) {
          throw new Error(`所有模型尝试失败：${error.message}`);
        }
      }
    }
  }

  /**
   * 使用指定模型执行任务（通过 sessions_spawn）
   */
  async executeWithModel(model, task, timeoutMs, retries) {
    // 这里需要调用 OpenClaw 的 sessions_spawn API
    // 由于这是在技能内部，需要通过 gateway 或 exec 调用
    const command = `openclaw sessions spawn --model "${model}" --task "${task.replace(/"/g, '\\"')}" --timeout ${timeoutMs / 1000}`;

    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
        if (error) {
          if (retries > 0) {
            // 重试逻辑
            setTimeout(() => {
              this.executeWithModel(model, task, timeoutMs, retries - 1)
                .then(resolve)
                .catch(reject);
            }, 1000);
          } else {
            reject(new Error(stderr || error.message));
          }
        } else {
          resolve(stdout);
        }
      });
    });
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logLine.trim());
    fs.appendFileSync(this.logPath, logLine);
  }
}

// 导出实例
module.exports = new ModelRouter();
module.exports.ModelRouter = ModelRouter;
