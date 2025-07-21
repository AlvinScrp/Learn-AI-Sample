/**
 * 文字提取功能 - 多模态对话
 * 使用通义千问API提取图片中的文字内容
 * 支持图片URL和文本输入，输出JSON格式的文字数据
 */

import { initOpenAI } from './initOpenAI.js';

async function main() {
const imageUrl = "https://img.alicdn.com/imgextra/i2/O1CN01ktT8451iQutqReELT_!!6000000004408-0-tps-689-487.jpg";
const response = await initOpenAI().chat.completions.create({
    model: "qwen-vl-ocr-latest",
    messages:  [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: "请提取车票图像中的发票号码、车次、起始站、终点站、发车日期和时间点、座位号、席别类型、票价、身份证号码、购票人姓名。要求准确无误的提取上述关键信息、不要遗漏和捏造虚假信息，模糊或者强光遮挡的单个文字可以用英文问号?代替。返回数据格式以json方式输出，格式为：{'发票号码'：'xxx', '车次'：'xxx', '起始站'：'xxx', '终点站'：'xxx', '发车日期和时间点'：'xxx', '座位号'：'xxx', '席别类型'：'xxx','票价':'xxx', '身份证号码'：'xxx', '购票人姓名'：'xxx'" }
        ]
      }],
  });

  console.log("API响应:", response.choices[0].message.content);
}

main();
