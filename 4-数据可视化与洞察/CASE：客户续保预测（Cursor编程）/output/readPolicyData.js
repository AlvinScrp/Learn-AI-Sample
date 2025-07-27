/**
 * 读取Excel文件前5行数据
 * @description 使用xlsx库读取policy_data.xlsx文件的前5行数据并输出到控制台
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';


/**
 * 读取Excel文件的前N行数据
 * @param {string} filePath - Excel文件路径
 * @param {number} rows - 要读取的行数，默认为5
 * @returns {Array} 返回指定行数的数据数组
 */
function readExcelFirstRows(filePath, rows = 5) {
    try {
        // 读取Excel文件
        const workbook = XLSX.readFile(filePath);
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 将工作表转换为JSON格式
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 返回前N行数据
        return jsonData.slice(0, rows);
    } catch (error) {
        console.error('读取Excel文件时发生错误:', error.message);
        return [];
    }
}

/**
 * 格式化输出数据
 * @param {Array} data - 要格式化的数据
 */
function formatOutput(data) {
    console.log('=== policy_data.xlsx 前5行数据 ===');
    console.log('');
    
    if (data.length === 0) {
        console.log('没有找到数据');
        return;
    }
    
    data.forEach((row, index) => {
        console.log(`第${index + 1}行:`, row);
    });
    
    console.log('');
    console.log(`总共读取了 ${data.length} 行数据`);
}

// 主函数
function main() {
    // 构建文件路径 - ES6模块中获取__dirname的替代方案
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('开始读取Excel文件...');
    console.log('文件路径:', filePath);
    console.log('');
    
    // 读取前5行数据
    const first5Rows = readExcelFirstRows(filePath, 5);
    
    // 格式化输出
    formatOutput(first5Rows);
}

// 执行主函数
main();

export {
    readExcelFirstRows,
    formatOutput
}; 