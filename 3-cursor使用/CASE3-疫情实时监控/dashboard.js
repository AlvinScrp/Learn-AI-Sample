/**
 * 疫情数据可视化处理脚本
 * 读取Excel文件，处理数据，并生成适用于ECharts的数据格式
 */

import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

// 获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 读取Excel文件并转换为JSON数据
 * @param {string} filePath - Excel文件路径
 * @returns {Object} 解析后的JSON数据
 */
function readExcelData(filePath) {
  try {
    console.log('📊 正在读取Excel文件...');
    console.log('文件路径:', filePath);
    
    // 读取Excel文件
    const workbook = xlsx.readFile(filePath);
    
    // 获取第一个工作表名称
    const sheetName = workbook.SheetNames[0];
    console.log(`📋 工作表名称: ${sheetName}`);
    
    // 获取工作表
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON数据
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log(`✅ 成功读取数据，共 ${jsonData.length} 行`);
    return jsonData;
  } catch (error) {
    console.error('❌ 读取文件时发生错误:', error.message);
    return [];
  }
}

/**
 * 处理日期数据，提取日期并格式化
 * @param {Array} data - 原始数据数组
 * @param {string} dateField - 日期字段名
 * @returns {Array} 格式化的日期数组
 */
function processDates(data, dateField) {
  const dates = [];
  data.forEach(item => {
    if (item[dateField] && !dates.includes(item[dateField])) {
      dates.push(item[dateField]);
    }
  });
  
  // 排序日期
  dates.sort((a, b) => new Date(a) - new Date(b));
  
  // 格式化日期为 MM/DD 格式
  return dates.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
}

/**
 * 计算每日新增和累计确诊数据
 * @param {Array} data - 原始数据数组
 * @param {string} dateField - 日期字段名
 * @param {string} confirmedField - 确诊数字段名
 * @returns {Object} 包含日期、新增和累计数据的对象
 */
function calculateDailyData(data, dateField, confirmedField) {
  // 按日期分组数据
  const dateGroups = {};
  data.forEach(item => {
    const date = item[dateField];
    if (!dateGroups[date]) {
      dateGroups[date] = [];
    }
    dateGroups[date].push(item);
  });
  
  // 获取排序后的日期
  const dates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
  
  // 计算每日总确诊数
  const totalCases = [];
  dates.forEach(date => {
    const dailyTotal = dateGroups[date].reduce((sum, item) => {
      return sum + (parseInt(item[confirmedField]) || 0);
    }, 0);
    totalCases.push(dailyTotal);
  });
  
  // 计算每日新增确诊数
  const newCases = [];
  totalCases.forEach((total, index) => {
    if (index === 0) {
      newCases.push(total);
    } else {
      newCases.push(total - totalCases[index - 1]);
    }
  });
  
  // 格式化日期
  const formattedDates = dates.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  return {
    dates: formattedDates,
    newCases: newCases,
    totalCases: totalCases
  };
}

/**
 * 计算区域分布数据
 * @param {Array} data - 原始数据数组
 * @param {string} districtField - 区域字段名
 * @param {string} confirmedField - 确诊数字段名
 * @returns {Object} 包含区域名称和确诊数的对象
 */
function calculateDistrictData(data, districtField, confirmedField) {
  // 按区域分组数据
  const districtGroups = {};
  data.forEach(item => {
    const district = item[districtField];
    if (!district) return;
    
    if (!districtGroups[district]) {
      districtGroups[district] = 0;
    }
    districtGroups[district] += parseInt(item[confirmedField]) || 0;
  });
  
  // 转换为数组格式
  const districts = Object.keys(districtGroups);
  const districtData = districts.map(district => districtGroups[district]);
  
  return {
    districts: districts,
    districtData: districtData
  };
}

/**
 * 计算增长率数据
 * @param {Array} totalCases - 每日累计确诊数据
 * @returns {Array} 每日增长率数据
 */
function calculateGrowthRates(totalCases) {
  const growthRates = [];
  totalCases.forEach((total, index) => {
    if (index === 0 || totalCases[index - 1] === 0) {
      growthRates.push(0);
    } else {
      const growthRate = ((total - totalCases[index - 1]) / totalCases[index - 1] * 100).toFixed(1);
      growthRates.push(parseFloat(growthRate));
    }
  });
  return growthRates;
}

/**
 * 计算年龄分布数据
 * @param {Array} data - 原始数据数组
 * @param {string} ageField - 年龄字段名
 * @param {string} confirmedField - 确诊数字段名
 * @returns {Object} 包含年龄组和确诊数的对象
 */
function calculateAgeDistribution(data, ageField, confirmedField) {
  // 定义年龄组
  const ageGroups = ['0-9岁', '10-19岁', '20-29岁', '30-39岁', '40-49岁', '50-59岁', '60-69岁', '70岁以上'];
  const ageDistribution = Array(ageGroups.length).fill(0);
  
  // 分组数据
  data.forEach(item => {
    const age = parseInt(item[ageField]);
    if (isNaN(age)) return;
    
    const confirmedCount = parseInt(item[confirmedField]) || 0;
    
    // 根据年龄分配到对应组
    if (age < 10) {
      ageDistribution[0] += confirmedCount;
    } else if (age < 20) {
      ageDistribution[1] += confirmedCount;
    } else if (age < 30) {
      ageDistribution[2] += confirmedCount;
    } else if (age < 40) {
      ageDistribution[3] += confirmedCount;
    } else if (age < 50) {
      ageDistribution[4] += confirmedCount;
    } else if (age < 60) {
      ageDistribution[5] += confirmedCount;
    } else if (age < 70) {
      ageDistribution[6] += confirmedCount;
    } else {
      ageDistribution[7] += confirmedCount;
    }
  });
  
  return {
    ageGroups: ageGroups,
    ageDistribution: ageDistribution
  };
}

/**
 * 生成医疗资源数据（模拟数据）
 * @returns {Object} 医疗资源使用情况数据
 */
function generateMedicalResourcesData() {
  return {
    categories: ['普通病床', '隔离病床', 'ICU病床', '呼吸机', '医护人员'],
    usage: [
      Math.floor(Math.random() * 20) + 70, // 70-90%
      Math.floor(Math.random() * 15) + 80, // 80-95%
      Math.floor(Math.random() * 30) + 60, // 60-90%
      Math.floor(Math.random() * 40) + 50, // 50-90%
      Math.floor(Math.random() * 25) + 70  // 70-95%
    ]
  };
}

/**
 * 计算总体统计数据
 * @param {Array} data - 原始数据数组
 * @param {string} confirmedField - 确诊数字段名
 * @param {string} curedField - 治愈数字段名
 * @param {string} deathField - 死亡数字段名
 * @returns {Object} 总体统计数据
 */
function calculateOverviewStats(data, confirmedField, curedField, deathField) {
  let totalConfirmed = 0;
  let totalCured = 0;
  let totalDeath = 0;
  
  data.forEach(item => {
    totalConfirmed += parseInt(item[confirmedField]) || 0;
    totalCured += parseInt(item[curedField]) || 0;
    totalDeath += parseInt(item[deathField]) || 0;
  });
  
  // 计算现有确诊
  const activeConfirmed = totalConfirmed - totalCured - totalDeath;
  
  // 计算新增确诊（假设数据按日期排序，取最后一天的数据）
  const latestData = data.slice(-20); // 取最后20条记录
  let newConfirmed = 0;
  latestData.forEach(item => {
    newConfirmed += parseInt(item[confirmedField]) || 0;
  });
  
  return {
    totalConfirmed,
    newConfirmed,
    activeConfirmed,
    totalCured,
    totalDeath
  };
}

/**
 * 生成完整的可视化数据
 * @param {string} filePath - Excel文件路径
 * @returns {Object} 可视化所需的完整数据
 */
function generateVisualizationData(filePath) {
  // 读取Excel数据
  const data = readExcelData(filePath);
  if (data.length === 0) {
    return null;
  }
  
  // 获取第一条数据，用于确定字段名
  const firstRecord = data[0];
  const fields = Object.keys(firstRecord);
  
  // 根据字段名猜测相关字段
  // 这里假设字段名中包含特定关键词
  const dateField = fields.find(f => f.includes('日期') || f.includes('time') || f.includes('date')) || fields[0];
  const districtField = fields.find(f => f.includes('区域') || f.includes('地区') || f.includes('district')) || fields[1];
  const confirmedField = fields.find(f => f.includes('确诊') || f.includes('confirmed')) || fields[2];
  const curedField = fields.find(f => f.includes('治愈') || f.includes('康复') || f.includes('cured')) || confirmedField;
  const deathField = fields.find(f => f.includes('死亡') || f.includes('death')) || confirmedField;
  const ageField = fields.find(f => f.includes('年龄') || f.includes('age')) || fields[3];
  
  console.log('📊 识别到的字段:');
  console.log(`- 日期字段: ${dateField}`);
  console.log(`- 区域字段: ${districtField}`);
  console.log(`- 确诊字段: ${confirmedField}`);
  console.log(`- 治愈字段: ${curedField}`);
  console.log(`- 死亡字段: ${deathField}`);
  console.log(`- 年龄字段: ${ageField}`);
  
  // 计算各类数据
  const dailyData = calculateDailyData(data, dateField, confirmedField);
  const districtData = calculateDistrictData(data, districtField, confirmedField);
  const growthRates = calculateGrowthRates(dailyData.totalCases);
  const ageData = calculateAgeDistribution(data, ageField, confirmedField);
  const medicalResources = generateMedicalResourcesData();
  const overviewStats = calculateOverviewStats(data, confirmedField, curedField, deathField);
  
  // 组合所有数据
  return {
    dailyData,
    districts: districtData.districts,
    districtData: districtData.districtData,
    growthRates,
    ageGroups: ageData.ageGroups,
    ageDistribution: ageData.ageDistribution,
    medicalResources,
    overviewStats
  };
}

/**
 * 将可视化数据保存为JSON文件
 * @param {Object} data - 可视化数据
 * @param {string} outputPath - 输出文件路径
 */
function saveVisualizationData(data, outputPath) {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ 可视化数据已保存至: ${outputPath}`);
  } catch (error) {
    console.error('❌ 保存数据时发生错误:', error.message);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 疫情数据可视化处理开始');
  console.log('='.repeat(80));
  
  // Excel文件路径
  const excelFile = path.join(__dirname, '香港各区疫情数据_20250322.xlsx');
  
  // JSON输出文件路径
  const jsonFile = path.join(__dirname, 'visualization-data.json');
  
  // 检查文件是否存在
  if (!fs.existsSync(excelFile)) {
    console.error('❌ 文件不存在:', excelFile);
    console.log('💡 请确认文件是否在正确的位置');
    return;
  }
  
  // 生成可视化数据
  const visualizationData = generateVisualizationData(excelFile);
  
  if (visualizationData) {
    // 保存数据
    saveVisualizationData(visualizationData, jsonFile);
    console.log('='.repeat(80));
    console.log('🎉 数据处理完成，可以在dashboard.html中查看可视化结果');
  } else {
    console.error('❌ 无法生成可视化数据');
  }
}

// 运行主函数
main(); 