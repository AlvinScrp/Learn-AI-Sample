/**
 * Function Call使用 - 天气查询功能
 * 实现天气查询Function Call，支持查询城市的天气信息
 * 
 * 关键技术点：
 * 1. 使用阿里云百炼平台的qwen-turbo模型
 * 2. 实现OpenAI兼容的Function Calling功能
 * 3. 完整的两轮对话流程（模型决策->函数执行->结果生成）
 */

import { initOpenAI } from './initOpenAI.js';

/**
 * 获取指定地点的天气信息（模拟函数）
 * @param {string} location - 地点名称
 * @param {string} unit - 温度单位，默认为"摄氏度"
 * @returns {string} 天气信息的JSON字符串
 * 
 * 关键说明：
 * - 实际项目中应替换为真实天气API调用
 * - 返回的JSON字符串将作为后续模型的输入
 */
function getCurrentWeather({ location, unit = "摄氏度" }) {
  // 模拟数据（大连固定返回10度，其他城市36度）
  const weatherInfo = {
    location: location,
    temperature: location.includes('大连') ? 10 : 36,
    unit: unit,
    forecast: ["晴天", "微风"]
  };
  return JSON.stringify(weatherInfo);
}

/**
 * 工具函数映射对象
 * 关键说明：
 * - 用于动态调用工具函数（此处只有getCurrentWeather）
 * - 函数名必须与tools定义中的name严格一致
 */
const toolFunctions = { getCurrentWeather };

/**
 * 工具定义（核心配置）
 * 关键参数解析：
 * - type: "function" - 声明这是一个函数工具
 * - function.name: 必须与实际函数名一致（大小写敏感）
 * - function.description: 决定模型何时调用此函数的关键描述
 * - parameters: 定义参数结构（JSON Schema格式）
 *   - properties: 定义每个参数的名称、类型和描述
 *   - required: 声明必填参数
 */
const tools = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description: "Get the current weather in a given location.",
      parameters: {
        type: "object",
        properties: {
          location: { 
            type: "string", 
            description: "The city and state, e.g. San Francisco, CA" 
          },
          unit: { 
            type: "string", 
            enum: ["celsius", "fahrenheit"] // 限制可选值
          }
        },
        required: ["location"] // 必须提供location参数
      }
    }
  }
];

/**
 * 获取模型响应
 * @param {Array} messages - 消息历史数组
 * @param {Array} tools - 工具定义数组
 * @returns {Promise<Object>} API响应对象
 * 
 * 关键参数说明：
 * - model: "qwen-turbo" - 指定使用的阿里云百炼模型
 * - messages: 包含role为system/user/assistant的对话历史
 * - tools: 传入工具定义数组
 * - tool_choice: "auto" - 让模型自主决定是否调用工具
 */
async function getModelResponse(messages, tools) {
  const openai = initOpenAI();
  return await openai.chat.completions.create({
    model: "qwen-turbo",
    messages: messages,
    tools: tools,
    tool_choice: "auto" // 也可指定为{"type: "function", function: {name: "getCurrentWeather"}}强制调用
  });
}

/**
 * 主对话流程
 * 关键流程说明：
 * 1. 初始化系统提示和用户问题
 * 2. 第一次调用API获取模型响应
 * 3. 检查是否需要调用工具函数
 * 4. 执行工具函数并追加结果到对话历史
 * 5. 第二次调用API获取最终回复
 */
async function main() {
  const userQuery = "大连的天气怎样";
  const messages = [
    {
      role: "system",
      content: "你是一个很有帮助的助手。如果用户提问关于天气的问题，请调用天气查询函数。回答时请使用友好语气。",
    },
    { role: "user", content: userQuery }
  ];

  // 第一轮API调用：模型决策阶段
  console.log('[1] 发送初始请求...');
  const firstResponse = await getModelResponse(messages, tools);
  const assistantMessage = firstResponse.choices[0].message;
  messages.push(assistantMessage);
  console.log('[2] 模型首次响应:', JSON.stringify(assistantMessage, null, 2));

  // 检查工具调用
  if (assistantMessage.tool_calls) {
    const toolCall = assistantMessage.tool_calls[0];
    console.log('[3] 检测到工具调用:', toolCall.function.name);
    
    // 解析参数并执行函数
    const args = JSON.parse(toolCall.function.arguments);
    console.log('[4] 函数参数:', args);
    const functionResult = toolFunctions[toolCall.function.name](args);
    console.log('[5] 函数执行结果:', functionResult);

    // 追加工具执行结果到对话历史
    messages.push({
      role: "tool",
      tool_call_id: toolCall.id, // 必须与调用请求的ID匹配
      content: functionResult
    });

    // 第二轮API调用：生成最终回复
    console.log('[6] 发送工具执行结果给模型...');
    const finalResponse = await getModelResponse(messages, tools);
    console.log('[7] 最终回复:', JSON.stringify(finalResponse.choices[0].message, null, 2));
  } else {
    console.log('模型未触发工具调用，直接返回结果');
  }
}

// 启动对话
console.log("启动天气查询对话系统...");
main().catch(err => console.error('流程执行出错:', err));