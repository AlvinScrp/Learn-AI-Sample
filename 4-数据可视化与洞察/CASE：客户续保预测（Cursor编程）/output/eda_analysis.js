/**
 * EDA探索性数据分析
 * @description 对客户续保预测数据进行全面的探索性分析
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 读取完整的Excel数据
 * @param {string} filePath - Excel文件路径
 * @returns {Array} 返回完整的数据数组
 */
function readExcelData(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON格式，第一行作为列名
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        return jsonData;
    } catch (error) {
        console.error('读取Excel文件时发生错误:', error.message);
        return [];
    }
}

/**
 * 数据概览分析
 * @param {Array} data - 数据数组
 */
function dataOverview(data) {
    console.log('=== 数据概览 ===');
    console.log(`总记录数: ${data.length}`);
    console.log(`字段数量: ${Object.keys(data[0]).length}`);
    console.log('');
    
    console.log('字段列表:');
    Object.keys(data[0]).forEach((field, index) => {
        console.log(`${index + 1}. ${field}`);
    });
    console.log('');
}

/**
 * 数据类型分析
 * @param {Array} data - 数据数组
 */
function dataTypeAnalysis(data) {
    console.log('=== 数据类型分析 ===');
    
    const fieldTypes = {};
    const sample = data[0];
    
    Object.keys(sample).forEach(field => {
        const value = sample[field];
        if (typeof value === 'number') {
            fieldTypes[field] = '数值型';
        } else if (typeof value === 'string') {
            fieldTypes[field] = '字符串型';
        } else {
            fieldTypes[field] = '其他类型';
        }
    });
    
    Object.entries(fieldTypes).forEach(([field, type]) => {
        console.log(`${field}: ${type}`);
    });
    console.log('');
}

/**
 * 数值型字段统计描述
 * @param {Array} data - 数据数组
 */
function numericalStatistics(data) {
    console.log('=== 数值型字段统计描述 ===');
    
    const numericalFields = ['age', 'family_members', 'premium_amount', 'policy_start_date', 'policy_end_date'];
    
    numericalFields.forEach(field => {
        if (data[0][field] !== undefined) {
            const values = data.map(row => row[field]).filter(val => !isNaN(val));
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const mean = sum / values.length;
                const sorted = values.sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                console.log(`${field}:`);
                console.log(`  数量: ${values.length}`);
                console.log(`  平均值: ${mean.toFixed(2)}`);
                console.log(`  中位数: ${median}`);
                console.log(`  最小值: ${min}`);
                console.log(`  最大值: ${max}`);
                console.log('');
            }
        }
    });
}

/**
 * 分类字段分析
 * @param {Array} data - 数据数组
 */
function categoricalAnalysis(data) {
    console.log('=== 分类字段分析 ===');
    
    const categoricalFields = ['gender', 'birth_region', 'insurance_region', 'income_level', 
                              'education_level', 'occupation', 'marital_status', 'policy_type', 
                              'policy_term', 'claim_history', 'renewal'];
    
    categoricalFields.forEach(field => {
        if (data[0][field] !== undefined) {
            const valueCounts = {};
            data.forEach(row => {
                const value = row[field];
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            });
            
            console.log(`${field}:`);
            Object.entries(valueCounts)
                .sort(([,a], [,b]) => b - a)
                .forEach(([value, count]) => {
                    const percentage = ((count / data.length) * 100).toFixed(1);
                    console.log(`  ${value}: ${count} (${percentage}%)`);
                });
            console.log('');
        }
    });
}

/**
 * 续保率分析
 * @param {Array} data - 数据数组
 */
function renewalAnalysis(data) {
    console.log('=== 续保率分析 ===');
    
    const renewalCounts = {};
    data.forEach(row => {
        const renewal = row.renewal;
        renewalCounts[renewal] = (renewalCounts[renewal] || 0) + 1;
    });
    
    console.log('续保情况统计:');
    Object.entries(renewalCounts).forEach(([status, count]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        console.log(`  ${status}: ${count} (${percentage}%)`);
    });
    console.log('');
    
    // 按性别分析续保率
    console.log('按性别分析续保率:');
    const genderRenewal = {};
    data.forEach(row => {
        const gender = row.gender;
        const renewal = row.renewal;
        if (!genderRenewal[gender]) {
            genderRenewal[gender] = { total: 0, renewed: 0 };
        }
        genderRenewal[gender].total++;
        if (renewal === 'Yes') {
            genderRenewal[gender].renewed++;
        }
    });
    
    Object.entries(genderRenewal).forEach(([gender, stats]) => {
        const rate = ((stats.renewed / stats.total) * 100).toFixed(1);
        console.log(`  ${gender}: ${stats.renewed}/${stats.total} (${rate}%)`);
    });
    console.log('');
}

/**
 * 年龄分布分析
 * @param {Array} data - 数据数组
 */
function ageDistributionAnalysis(data) {
    console.log('=== 年龄分布分析 ===');
    
    const ages = data.map(row => row.age).filter(age => !isNaN(age));
    const ageGroups = {
        '20-30岁': 0,
        '31-40岁': 0,
        '41-50岁': 0,
        '51-60岁': 0,
        '61岁以上': 0
    };
    
    ages.forEach(age => {
        if (age <= 30) ageGroups['20-30岁']++;
        else if (age <= 40) ageGroups['31-40岁']++;
        else if (age <= 50) ageGroups['41-50岁']++;
        else if (age <= 60) ageGroups['51-60岁']++;
        else ageGroups['61岁以上']++;
    });
    
    console.log('年龄分布:');
    Object.entries(ageGroups).forEach(([group, count]) => {
        const percentage = ((count / ages.length) * 100).toFixed(1);
        console.log(`  ${group}: ${count} (${percentage}%)`);
    });
    console.log('');
}

/**
 * 保费分析
 * @param {Array} data - 数据数组
 */
function premiumAnalysis(data) {
    console.log('=== 保费分析 ===');
    
    const premiums = data.map(row => row.premium_amount).filter(premium => !isNaN(premium));
    
    if (premiums.length > 0) {
        const avgPremium = premiums.reduce((a, b) => a + b, 0) / premiums.length;
        const sortedPremiums = premiums.sort((a, b) => a - b);
        const medianPremium = sortedPremiums[Math.floor(sortedPremiums.length / 2)];
        
        console.log(`平均保费: ${avgPremium.toFixed(2)}`);
        console.log(`中位数保费: ${medianPremium}`);
        console.log(`最高保费: ${Math.max(...premiums)}`);
        console.log(`最低保费: ${Math.min(...premiums)}`);
        console.log('');
        
        // 保费区间分析
        const premiumRanges = {
            '1万以下': 0,
            '1-2万': 0,
            '2-3万': 0,
            '3-5万': 0,
            '5万以上': 0
        };
        
        premiums.forEach(premium => {
            if (premium < 10000) premiumRanges['1万以下']++;
            else if (premium < 20000) premiumRanges['1-2万']++;
            else if (premium < 30000) premiumRanges['2-3万']++;
            else if (premium < 50000) premiumRanges['3-5万']++;
            else premiumRanges['5万以上']++;
        });
        
        console.log('保费区间分布:');
        Object.entries(premiumRanges).forEach(([range, count]) => {
            const percentage = ((count / premiums.length) * 100).toFixed(1);
            console.log(`  ${range}: ${count} (${percentage}%)`);
        });
        console.log('');
    }
}

/**
 * 地区分析
 * @param {Array} data - 数据数组
 */
function regionAnalysis(data) {
    console.log('=== 地区分析 ===');
    
    const regions = {};
    data.forEach(row => {
        const region = row.insurance_region;
        regions[region] = (regions[region] || 0) + 1;
    });
    
    console.log('投保地区分布 (前10名):');
    Object.entries(regions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([region, count]) => {
            const percentage = ((count / data.length) * 100).toFixed(1);
            console.log(`  ${region}: ${count} (${percentage}%)`);
        });
    console.log('');
}

/**
 * 主函数
 */
function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('开始EDA探索性数据分析...\n');
    
    // 读取数据
    const data = readExcelData(filePath);
    
    if (data.length === 0) {
        console.log('没有读取到数据，请检查文件路径');
        return;
    }
    
    // 执行各项分析
    dataOverview(data);
    dataTypeAnalysis(data);
    numericalStatistics(data);
    categoricalAnalysis(data);
    renewalAnalysis(data);
    ageDistributionAnalysis(data);
    premiumAnalysis(data);
    regionAnalysis(data);
    
    console.log('=== EDA分析完成 ===');
}

// 执行主函数
main();

export {
    readExcelData,
    dataOverview,
    numericalStatistics,
    categoricalAnalysis,
    renewalAnalysis
}; 