/**
 * 运维事件处置功能
 * 实现运维告警分析和处置的Function Call功能
 * 功能包括：
 * 1、告警内容理解。根据输入的告警信息，结合第三方接口数据，判断当前的异常情况（告警对象、异常模式）；
 * 2、分析方法建议。根据当前告警内容，结合应急预案、运维文档和大语言模型自有知识，形成分析方法的建议；
 * 3、分析内容自动提取。根据用户输入的分析内容需求，调用多种第三方接口获取分析数据，并进行总结；
 * 4、处置方法推荐和执行。根据当前上下文的故障场景理解，结合应急预案和第三方接口，形成推荐处置方案，待用户确认后调用第三方接口进行执行。
 */

import { initOpenAI } from './initOpenAI.js';

/**
 * 通过第三方接口获取数据库服务器状态
 * @returns {string} 服务器状态信息的JSON字符串
 */
function getCurrentStatus() {
  return JSON.stringify({
    "连接数": Math.floor(Math.random() * 91) + 10,
    "CPU使用率": `${(Math.random() * 99 + 1).toFixed(1)}%`,
    "内存使用率": `${(Math.random() * 90 + 10).toFixed(1)}%`
  });
}

const obj = { getCurrentStatus }

/**
 * 定义工具
 */
const tools = [
  {
    type: "function",
    function: {
      name: "getCurrentStatus",
      description: "调用监控系统接口，获取当前数据库服务器性能指标，包括：连接数、CPU使用率、内存使用率",
      parameters: {
        type: "object",
        properties: {},
      },
      required: []
    }
  }
]

/**
 * 获取模型响应
 * @param {Array} messages - 消息数组
 * @param {Array} tools - 工具定义数组
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
 * 运维事件处置主函数
 */
async function main() {
  

  // 告警信息
  const query = `告警：数据库连接数超过设定阈值时间：2024-08-03 15:30:00`;
  const messages = [
    {
      role: "system",
      content: "我是运维分析师，用户会告诉我们告警内容。我会基于告警内容，判断当前的异常情况（告警对象、异常模式）"
    },
    {
      role: "user",
      content: query
    }
  ];

  console.log("开始运维事件处置...");
  console.log("告警信息:", query);
  console.log("------------------------");

  // 循环处理对话，直到完成
  while (true) {
    const response = await getResponse(messages, tools);
    const message = response.choices[0].message;
    messages.push(message);

    console.log("AI响应:", JSON.stringify(message, null, 2));
    console.log("------------------------");

    // 如果响应完成，退出循环
    if (response.choices[0].finish_reason === 'stop') {
      break;
    }

    // 检查是否需要调用函数
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`调用函数: ${functionName}, 参数:`, functionArgs);
      const toolResponse = obj[functionName](functionArgs);

      const toolInfo = {
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResponse
      };

      console.log("函数返回结果:", toolResponse);
      console.log("------------------------");

      messages.push(toolInfo);
    }
  }

  return messages;
}

/**
 * 主函数
 * 运行运维事件处置示例
 */
main();