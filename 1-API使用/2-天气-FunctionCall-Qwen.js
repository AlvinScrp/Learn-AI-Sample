/**
 * Function Call使用 - 天气查询功能
 * 实现天气查询Function Call，支持查询不同城市的天气信息
 * 当前支持的城市天气：
 * - 北京：35度
 * - 上海：36度  
 * - 深圳：37度
 * 天气均为晴天，微风
 */

import { initOpenAI } from './initOpenAI.js';

/**
 * 获取指定地点的天气信息
 * @param {string} location - 地点名称
 * @param {string} unit - 温度单位，默认为摄氏度
 * @returns {string} 天气信息的JSON字符串
 */
function getCurrentWeather({ location, unit = "摄氏度" }) {
  const weatherInfo = {
    location: location,
    temperature: location.includes('大连') ? 10 : 36,
    unit: unit,
    forecast: ["晴天", "微风"]
  };

  return JSON.stringify(weatherInfo);
}
/**
 * 定义对象，方便后续通过字面量调用函数
 */
const obj = { getCurrentWeather }

/**
 * 定义工具
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
          location: { type: "string", description: "The city and state, e.g. San Francisco, CA" },
          unit: { type: "string", enum: ["celsius", "fahrenheit"] }
        },
      },
      required: ["location"]
    }
  }
]

/**
 * 获取模型响应
 * @param {Array} messages - 消息数组
 * @param {Array} tools - 函数定义数组
 * @returns {Promise<Object>} API响应
 */
async function getResponse(messages, tools) {
  const openai = initOpenAI();
  const response = await openai.chat.completions.create({
    model: "qwen-turbo",
    messages: messages,
    tools: tools,
    tool_choice: "auto"
  });
  return response;
}

/**
 * 运行天气查询对话
 * @returns {Promise<Object|null>} 对话结果
 */
async function main() {
  const query = "大连的天气怎样";
  const messages = [
    {
      role: "system",
      content: "你是一个很有帮助的助手。如果用户提问关于天气的问题，请调用 ‘get_current_weather’ 函数。请以友好的语气回答问题。",
    },
    { role: "user", content: query }];

  // 第一次调用API
  const response = await getResponse(messages, tools);

  const message = response.choices[0].message;
  messages.push(message);
  console.log('第一次调用API,返回消息', JSON.stringify(message, null, 2));

  // 检查是否需要调用函数
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    const toolName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);

    console.log('需要调用函数参数:', toolName, " 参数:", functionArgs);
    const toolResponse = obj[toolName](functionArgs);
    console.log('调用函数返回结果:', toolResponse);
    console.log('------------------------');

    const toolMessage = {
      role: "tool",
      tool_call_id: toolCall.id,
      content: toolResponse
    };
    console.log('将上述工具响应toolMessage：', JSON.stringify(toolMessage, null, 2), "\n添加到Messages中,继续调用API");
    console.log('------------------------');
    messages.push(toolMessage);

    // 第二次调用API
    const secondResponse = await getResponse(messages, tools);
    console.log('第二次调用API,返回消息：', JSON.stringify(secondResponse.choices[0].message, null, 2));
  } else {
    console.log('不需要调用函数,直接返回消息');
  }
}

console.log("开始天气查询对话...");
main();


