/**
 * 图片分析功能 - 多模态对话
 * 使用通义千问API分析图片内容
 * 支持图片URL和文本输入，输出图片分析结果
 */

import { initOpenAI } from './initOpenAI.js';

async function main() {
const imageUrl = "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg";
const response = await initOpenAI().chat.completions.create({
    model: "qwen-vl-plus",
    messages:  [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: "图中描绘的是什么景象?" }
        ]
      }],
  });

  console.log("API响应:", response.choices[0].message.content);
}

main();
