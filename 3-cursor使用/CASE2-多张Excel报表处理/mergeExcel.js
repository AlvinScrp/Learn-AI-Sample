/**
 * 合并input文件夹下的两个Excel表格，并输出到output/merged.xlsx
 * 使用xlsx库实现，ESM语法
 */

import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

// 获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入输出文件夹
const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');
const outputFile = path.join(outputDir, 'merged.xlsx');

// 读取input目录下所有xlsx文件
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.xlsx'));
if (files.length < 2) {
  console.error('input文件夹下需至少有两个xlsx文件');
  process.exit(1);
}

// 读取第一个表格
const wb1 = xlsx.readFile(path.join(inputDir, files[0]));
const ws1 = wb1.Sheets[wb1.SheetNames[0]];
const data1 = xlsx.utils.sheet_to_json(ws1, { defval: '' });

// 读取第二个表格
const wb2 = xlsx.readFile(path.join(inputDir, files[1]));
const ws2 = wb2.Sheets[wb2.SheetNames[0]];
const data2 = xlsx.utils.sheet_to_json(ws2, { defval: '' });

// 合并数据（假设表头一致，直接合并）
const mergedData = [ ...data1, ...data2 ];

// 创建新工作簿和工作表
const newWb = xlsx.utils.book_new();
const newWs = xlsx.utils.json_to_sheet(mergedData);
xlsx.utils.book_append_sheet(newWb, newWs, 'Merged');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// 写入合并后的Excel文件
xlsx.writeFile(newWb, outputFile);

console.log('合并完成，输出文件：', outputFile);
