/**
 * 疫情数据查看器
 * 查看香港各区疫情数据Excel文件的字段和前20行数据
 * 并以Markdown表格形式输出到文件
 */

import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

// 获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 将数据转换为Markdown表格格式
 * @param {Array} headers - 表头数组
 * @param {Array} rows - 数据行数组
 * @returns {string} - Markdown表格文本
 */
function convertToMarkdownTable(headers, rows) {
  // 创建表头
  let markdownTable = '# 香港各区疫情数据前20行\n\n';
  
  // 添加表格头部
  markdownTable += '| ' + headers.join(' | ') + ' |\n';
  
  // 添加表格分隔行
  markdownTable += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  // 添加数据行
  rows.forEach(row => {
    // 确保所有单元格值都是字符串，并处理可能包含 | 符号的内容
    const formattedRow = row.map(cell => {
      // 处理空值和零值
      if (cell === '' || cell === null || cell === undefined) {
        return '-';
      } else if (cell === 0) {
        return '0';
      }
      
      const cellStr = String(cell);
      // 转义 | 符号并限制长度
      return cellStr.replace(/\|/g, '\\|').substring(0, 50);
    });
    
    markdownTable += '| ' + formattedRow.join(' | ') + ' |\n';
  });
  
  // 添加统计信息
  markdownTable += '\n## 统计信息\n\n';
  markdownTable += `- **总字段数**: ${headers.length}\n`;
  markdownTable += `- **总数据行数**: ${rows.length}\n`;
  markdownTable += `- **显示行数**: ${Math.min(20, rows.length)}\n`;
  markdownTable += `- **生成时间**: ${new Date().toLocaleString()}\n`;
  
  return markdownTable;
}

/**
 * 读取并显示Excel文件的字段和前20行数据
 * @param {string} filePath - Excel文件路径
 * @param {string} outputPath - 输出Markdown文件路径
 */
function viewExcelData(filePath, outputPath) {
  try {
    console.log('📊 正在读取Excel文件...');
    console.log('文件路径:', filePath);
    console.log('='.repeat(80));
    
    // 读取Excel文件
    const workbook = xlsx.readFile(filePath);
    
    // 获取第一个工作表名称
    const sheetName = workbook.SheetNames[0];
    console.log(`📋 工作表名称: ${sheetName}`);
    
    // 获取工作表
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON数据
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
      defval: '', // 空值默认为空字符串
      header: 1   // 返回数组格式，第一行作为表头
    });
    
    if (jsonData.length === 0) {
      console.log('❌ 文件为空或无法读取数据');
      return;
    }
    
    // 获取字段名（第一行）
    const headers = jsonData[0];
    console.log(`\n📝 字段信息 (共 ${headers.length} 个字段):`);
    console.log('-'.repeat(60));
    headers.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });
    
    // 显示数据行数
    const dataRows = jsonData.slice(1); // 除去表头的数据行
    console.log(`\n📈 数据行数: ${dataRows.length} 行`);
    console.log(`\n📄 前20行数据:`);
    console.log('='.repeat(80));
    
    // 显示前20行数据
    const displayRows = Math.min(20, dataRows.length);
    
    // 打印表头
    console.log('\n表头:');
    console.log(headers.map((h, i) => `[${i}] ${h}`).join(' | '));
    console.log('-'.repeat(120));
    
    // 打印前20行数据
    for (let i = 0; i < displayRows; i++) {
      const row = dataRows[i];
      console.log(`行 ${i + 1}:`);
      
      // 逐字段显示，避免输出过长
      headers.forEach((header, index) => {
        const value = row[index];
        // 处理空值和零值
        let displayValue;
        if (value === '' || value === null || value === undefined) {
          displayValue = '-';
        } else if (value === 0) {
          displayValue = '0';
        } else {
          displayValue = String(value).length > 20 
            ? String(value).substring(0, 20) + '...' 
            : value;
        }
        console.log(`  ${header}: ${displayValue}`);
      });
      console.log('-'.repeat(60));
    }
    
    // 统计信息
    console.log('\n📊 统计信息:');
    console.log(`- 总字段数: ${headers.length}`);
    console.log(`- 总数据行数: ${dataRows.length}`);
    console.log(`- 显示行数: ${displayRows}`);
    
    // 检查是否有空值
    let emptyCount = 0;
    dataRows.slice(0, displayRows).forEach(row => {
      row.forEach(cell => {
        if (!cell || cell === '') emptyCount++;
      });
    });
    console.log(`- 前${displayRows}行中空值数量: ${emptyCount}`);
    
    // 生成Markdown表格并写入文件
    const markdownContent = convertToMarkdownTable(
      headers, 
      dataRows.slice(0, displayRows)
    );
    
    fs.writeFileSync(outputPath, markdownContent);
    console.log(`\n✅ Markdown表格已生成: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 读取文件时发生错误:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('💡 请确认文件路径是否正确');
    } else if (error.message.includes('Unsupported file')) {
      console.log('💡 请确认文件格式是否为Excel(.xlsx)文件');
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 疫情数据查看器启动');
  console.log('='.repeat(80));
  
  // Excel文件路径
  const excelFile = path.join(__dirname, '香港各区疫情数据_20250322.xlsx');
  
  // Markdown输出文件路径
  const markdownFile = path.join(__dirname, '前20行数据.md');
  
  // 检查文件是否存在
  if (!fs.existsSync(excelFile)) {
    console.error('❌ 文件不存在:', excelFile);
    console.log('💡 请确认文件是否在正确的位置');
    return;
  }
  
  // 查看数据并输出Markdown
  viewExcelData(excelFile, markdownFile);
}

// 运行主函数
main(); 