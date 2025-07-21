/**
 * 第一个文本生成对话应用
 * OpenAI文本聊天功能测试应用
 * 集成OpenAI SDK实现简单的文本对话功能,阿里云通义千问API
 */

import { initOpenAI } from './initOpenAI.js';

async function main() {
  const completion = await initOpenAI().chat.completions.create({
    model: "qwen-plus",  //模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages: [
      { role: "system", content: "你是一名舆情分析师，帮我判断产品口碑的正负向，回复请用一个词语：正向 或者 负向" },
      { role: "user", content: "这款音乐软件很棒" }
    ],
  });
  console.log(JSON.stringify(completion.choices[0].message, null, 2))
}

main();


