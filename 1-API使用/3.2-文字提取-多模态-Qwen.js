/**
 * 文字提取功能 - 多模态对话
 * 使用通义千问API提取图片中的文字内容
 * 支持图片URL和文本输入，输出JSON格式的文字数据
 */

import { initOpenAI } from './initOpenAI.js'; // 引入通义千问 OpenAI 兼容 SDK 初始化模块

async function main() {
  // 图片地址：此处为一张车票图像，必须是公网可访问的 URL
  const imageUrl = "https://img.alicdn.com/imgextra/i2/O1CN01ktT8451iQutqReELT_!!6000000004408-0-tps-689-487.jpg";

  // 调用多模态 OCR 模型（专用于图像文字识别及结构化抽取）
  const response = await initOpenAI().chat.completions.create({
    model: "qwen-vl-ocr-latest", // 模型名称：通义千问 OCR 多模态模型，适合结构化文档识别
    messages: [
      {
        role: "user",
        content: [
          // 图像输入：用于识别的车票图像
          { type: "image_url", image_url: { url: imageUrl } },

          // 任务指令：使用自然语言明确指定要提取的字段
          {
            type: "text",
            text: `请提取车票图像中的发票号码、车次、起始站、终点站、发车日期和时间点、座位号、席别类型、票价、身份证号码、购票人姓名。
要求准确无误地提取上述关键信息，不要遗漏，也不要捏造虚假信息。
对于模糊或强光遮挡导致无法识别的字符，请用英文问号 ? 替代。
返回格式请使用 JSON，结构如下：
{'发票号码':'xxx','车次':'xxx','起始站':'xxx','终点站':'xxx','发车日期和时间点':'xxx','座位号':'xxx','席别类型':'xxx','票价':'xxx','身份证号码':'xxx','购票人姓名':'xxx'}`
          }
        ]
      }
    ]
  });

  // 输出提取结果（控制台打印 JSON 格式）
  console.log("API响应:", response.choices[0].message.content);
}

main(); // 执行主程序
