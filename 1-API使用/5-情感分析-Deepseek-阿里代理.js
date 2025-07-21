/**
 * 情感分析功能 - DeepSeek模型调用
 * 使用DeepSeek-R1模型进行情感分析和对话
 * 通过阿里云代理调用DeepSeek模型
 */

import { initOpenAI } from './initOpenAI.js';

const response = await initOpenAI().chat.completions.create({
  model: "deepseek-r1", // 使用 deepseek-r1 模型
  messages: [
    { role: "system", content: "You are a helpful assistant" }, //系统提示词
    { role: "user", content: "你好，你是什么大模型？" } //用户提问词
  ]
});

console.log("AI回复:", response.choices[0].message.content);
