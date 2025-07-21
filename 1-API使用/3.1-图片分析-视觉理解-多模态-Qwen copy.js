/**
 * 图片分析功能 - 多模态对话
 * 使用通义千问API分析图片内容
 * 支持图片URL和文本输入，输出图片分析结果
 */

import { initOpenAI } from './initOpenAI.js'; // 初始化通义千问兼容OpenAI风格的客户端实例

async function main() {
  // 定义图像URL（可以是任意公网可访问的图片）
  const imageUrl = "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg";

  // 调用通义千问 qwen-vl-plus 模型进行多模态对话（支持图像+文字）
  const response = await initOpenAI().chat.completions.create({
    model: "qwen-vl-plus", // 多模态模型，支持图像与文字联合理解
    messages: [
      {
        role: "user",
        content: [
          // 输入的图片内容，类型为 image_url
          { type: "image_url", image_url: { url: imageUrl } },

          // 对图片提出的问题（图文混合输入）
          { type: "text", text: "图中描绘的是什么景象?" }
        ]
      }
    ],
  });

  // 输出模型对图像及问题的分析结果
  console.log("API响应:", response.choices[0].message.content);
}

main(); // 执行主函数
