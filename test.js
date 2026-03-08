/**
 * model-router Test Suite
 */

const {
  detectTaskType,
  extractModelTag,
  identifyModelFeatures,
  selectBestModel,
  generateModelHint,
  TASK_KEYWORDS
} = require('./handler.js');

console.log('=== model-router Test Suite ===\n');

let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (pass) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// Test 1: Task Type Detection - Code
console.log('Test 1: Task Type Detection - Code');
test('Code task (CN)', detectTaskType('帮我写个 Python 脚本'), 'code');
test('Code task (EN)', detectTaskType('Write a Python function'), 'code');
test('Debug task', detectTaskType('调试这段代码'), 'code');
console.log();

// Test 2: Task Type Detection - Reasoning
console.log('Test 2: Task Type Detection - Reasoning');
test('Reasoning task (CN)', detectTaskType('分析一下这个复杂问题'), 'reasoning');
test('Reasoning task (EN)', detectTaskType('Analyze the root cause'), 'reasoning');
console.log();

// Test 3: Task Type Detection - Creative
console.log('Test 3: Task Type Detection - Creative');
test('Creative task (CN)', detectTaskType('写一个故事'), 'creative');
test('Creative task (EN)', detectTaskType('Write a creative story'), 'creative');
console.log();

// Test 4: Task Type Detection - Fast
console.log('Test 4: Task Type Detection - Fast');
test('Fast task (CN)', detectTaskType('简单问答'), 'fast');
test('Fast task (EN)', detectTaskType('What is the meaning of life?'), 'fast');
console.log();

// Test 5: Task Type Detection - Auto
console.log('Test 5: Task Type Detection - Auto');
test('No keywords', detectTaskType('你好'), 'auto');
console.log();

// Test 6: Model Tag Extraction
console.log('Test 6: Model Tag Extraction');
const tagResult1 = extractModelTag('[model: code] test');
test('Extract tag', tagResult1?.model, 'code');
test('Clean message', tagResult1?.cleanMessage, 'test');

const tagResult2 = extractModelTag('[model: bailian/qwen3-coder-plus] 帮我写代码');
test('Extract full model name', tagResult2?.model, 'bailian/qwen3-coder-plus');
console.log();

// Test 7: Model Feature Identification
console.log('Test 7: Model Feature Identification');
test('Free model', identifyModelFeatures('stepfun/step-3.5-flash:free').includes('free'), true);
test('Code model', identifyModelFeatures('bailian/qwen3-coder-plus').includes('code'), true);
test('Flash model', identifyModelFeatures('stepfun/step-3.5-flash:free').includes('fast'), true);
console.log();

// Test 8: Model Selection
console.log('Test 8: Model Selection');
const mockModels = [
  { id: 'stepfun/step-3.5-flash:free', name: 'step-3.5-flash:free', contextWindow: 131072, maxTokens: 32768, cost: { input: 0, output: 0 } },
  { id: 'bailian/qwen3.5-plus', name: 'qwen3.5-plus', contextWindow: 1000000, maxTokens: 65536, cost: { input: 0.002, output: 0.006 } },
  { id: 'bigmodel/glm-4.7', name: 'glm-4.7', contextWindow: 128000, maxTokens: 32768, cost: { input: 0, output: 0 } }
];

const codeModel = selectBestModel('code', mockModels);
console.log(`Code task selection: ${codeModel}`);
test('Select free model for code', codeModel.includes('free') || codeModel.includes('glm'), true);

const reasoningModel = selectBestModel('reasoning', mockModels);
console.log(`Reasoning task selection: ${reasoningModel}`);
test('Select model for reasoning', reasoningModel.includes('free') || reasoningModel.includes('glm'), true);
console.log();

// Test 9: Model Hint Generation
console.log('Test 9: Model Hint Generation');
const hint1 = generateModelHint('stepfun/step-3.5-flash:free', 'auto', 'use');
test('Use hint format', hint1.includes('step-3.5-flash'), true);
test('Use hint format', hint1.includes('免费模型'), true);

const hint2 = generateModelHint('bailian/qwen3.5-plus', 'reasoning', 'restore');
test('Restore hint format', hint2.includes('qwen3.5-plus'), true);
test('Restore hint format', hint2.includes('已恢复默认模型'), true);

const hint3 = generateModelHint('bailian/qwen3-coder-plus', 'code', 'use');
test('Code hint format', hint3.includes('qwen3-coder-plus'), true);
test('Code hint format', hint3.includes('检测到代码任务'), true);
console.log();

// Test 10: Keyword Coverage
console.log('Test 10: Keyword Coverage');
console.log(`Code keywords: ${TASK_KEYWORDS.code.length}`);
console.log(`Reasoning keywords: ${TASK_KEYWORDS.reasoning.length}`);
console.log(`Creative keywords: ${TASK_KEYWORDS.creative.length}`);
console.log(`Fast keywords: ${TASK_KEYWORDS.fast.length}`);
test('Has code keywords', TASK_KEYWORDS.code.length > 10, true);
test('Has reasoning keywords', TASK_KEYWORDS.reasoning.length > 10, true);
console.log();

// Summary
console.log('=== Test Summary ===');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log();

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
