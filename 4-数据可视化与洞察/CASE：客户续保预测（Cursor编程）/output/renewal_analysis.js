import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 读取Excel测试数据
 * @param {string} filePath - Excel文件路径
 * @returns {Array} 测试数据数组
 */
function readTestData(filePath) {
    console.log('📖 开始读取测试数据...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✅ 成功读取测试数据，共 ${data.length} 条记录`);
    return data;
}

/**
 * 将字符串转换为数值编码
 * @param {string} value - 字符串值
 * @param {string} field - 字段名
 * @returns {number} 数值编码
 */
function encodeStringValue(value, field) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    const str = value.toString().toLowerCase();
    
    switch (field) {
        case 'marital_status':
            if (str.includes('已婚')) return 2;
            if (str.includes('离异') || str.includes('单身')) return 1;
            return 0;
        case 'occupation':
            if (str.includes('医生') || str.includes('律师') || str.includes('工程师')) return 3;
            if (str.includes('经理') || str.includes('销售') || str.includes('设计师')) return 2;
            return 1;
        case 'gender':
            if (str.includes('男')) return 1;
            if (str.includes('女')) return 2;
            return 0;
        default:
            return 0;
    }
}

/**
 * 续保倾向分析
 * @param {Array} data - 原始数据
 * @returns {Object} 续保分析结果
 */
function analyzeRenewalTendency(data) {
    console.log('🔍 开始续保倾向分析...');
    
    const analysis = {
        ageGroups: {},
        maritalGroups: {},
        occupationGroups: {},
        genderGroups: {},
        premiumGroups: {},
        regionGroups: {},
        overallStats: {
            total: data.length,
            highTendency: 0,
            mediumTendency: 0,
            lowTendency: 0
        }
    };
    
    data.forEach(row => {
        const age = row.age || 0;
        const marital = encodeStringValue(row.marital_status, 'marital_status');
        const occupation = encodeStringValue(row.occupation, 'occupation');
        const gender = encodeStringValue(row.gender, 'gender');
        const premium = row.premium_amount || 0;
        const region = row.insurance_region || 0;
        
        // 计算续保倾向分数
        let tendencyScore = 0;
        
        // 年龄因素
        if (age > 60.5) tendencyScore += 3;
        else if (age > 29.5) tendencyScore += 2;
        else tendencyScore += 0;
        
        // 婚姻状况因素
        if (marital === 2) tendencyScore += 2; // 已婚
        else if (marital === 1) tendencyScore += 0; // 离异/单身
        else tendencyScore += 0;
        
        // 职业因素
        if (occupation === 3) tendencyScore += 2; // 高职业
        else if (occupation === 2) tendencyScore += 1; // 中职业
        else tendencyScore += 0;
        
        // 保费因素
        if (premium > 5000) tendencyScore += 2;
        else if (premium > 2000) tendencyScore += 1;
        else tendencyScore += 0;
        
        // 分类续保倾向
        let tendency;
        if (tendencyScore >= 6) {
            tendency = 'high';
            analysis.overallStats.highTendency++;
        } else if (tendencyScore >= 3) {
            tendency = 'medium';
            analysis.overallStats.mediumTendency++;
        } else {
            tendency = 'low';
            analysis.overallStats.lowTendency++;
        }
        
        // 按年龄分组
        let ageGroup;
        if (age <= 29.5) ageGroup = '年轻客户(≤29.5岁)';
        else if (age <= 60.5) ageGroup = '中年客户(29.5-60.5岁)';
        else ageGroup = '老年客户(>60.5岁)';
        
        if (!analysis.ageGroups[ageGroup]) {
            analysis.ageGroups[ageGroup] = { high: 0, medium: 0, low: 0, total: 0 };
        }
        analysis.ageGroups[ageGroup][tendency]++;
        analysis.ageGroups[ageGroup].total++;
        
        // 按婚姻状况分组
        let maritalGroup = marital === 2 ? '已婚' : '单身/离异';
        if (!analysis.maritalGroups[maritalGroup]) {
            analysis.maritalGroups[maritalGroup] = { high: 0, medium: 0, low: 0, total: 0 };
        }
        analysis.maritalGroups[maritalGroup][tendency]++;
        analysis.maritalGroups[maritalGroup].total++;
        
        // 按职业分组
        let occupationGroup;
        if (occupation === 3) occupationGroup = '高职业(医生/律师/工程师)';
        else if (occupation === 2) occupationGroup = '中职业(经理/销售/设计师)';
        else occupationGroup = '其他职业';
        
        if (!analysis.occupationGroups[occupationGroup]) {
            analysis.occupationGroups[occupationGroup] = { high: 0, medium: 0, low: 0, total: 0 };
        }
        analysis.occupationGroups[occupationGroup][tendency]++;
        analysis.occupationGroups[occupationGroup].total++;
        
        // 按性别分组
        let genderGroup = gender === 1 ? '男性' : gender === 2 ? '女性' : '其他';
        if (!analysis.genderGroups[genderGroup]) {
            analysis.genderGroups[genderGroup] = { high: 0, medium: 0, low: 0, total: 0 };
        }
        analysis.genderGroups[genderGroup][tendency]++;
        analysis.genderGroups[genderGroup].total++;
        
        // 按保费分组
        let premiumGroup;
        if (premium > 5000) premiumGroup = '高保费(>5000)';
        else if (premium > 2000) premiumGroup = '中保费(2000-5000)';
        else premiumGroup = '低保费(<2000)';
        
        if (!analysis.premiumGroups[premiumGroup]) {
            analysis.premiumGroups[premiumGroup] = { high: 0, medium: 0, low: 0, total: 0 };
        }
        analysis.premiumGroups[premiumGroup][tendency]++;
        analysis.premiumGroups[premiumGroup].total++;
        
        // 按地区分组
        let regionGroup = `地区${region}`;
        if (!analysis.regionGroups[regionGroup]) {
            analysis.regionGroups[regionGroup] = { high: 0, medium: 0, low: 0, total: 0 };
        }
        analysis.regionGroups[regionGroup][tendency]++;
        analysis.regionGroups[regionGroup].total++;
    });
    
    console.log('✅ 续保倾向分析完成');
    return analysis;
}

/**
 * 生成续保分析报告
 * @param {Object} analysis - 分析结果
 */
function generateRenewalReport(analysis) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 客户续保倾向分析报告');
    console.log('='.repeat(80));
    
    console.log('\n📈 整体续保倾向分布:');
    console.log(`高续保倾向: ${analysis.overallStats.highTendency} 人 (${(analysis.overallStats.highTendency/analysis.overallStats.total*100).toFixed(1)}%)`);
    console.log(`中续保倾向: ${analysis.overallStats.mediumTendency} 人 (${(analysis.overallStats.mediumTendency/analysis.overallStats.total*100).toFixed(1)}%)`);
    console.log(`低续保倾向: ${analysis.overallStats.lowTendency} 人 (${(analysis.overallStats.lowTendency/analysis.overallStats.total*100).toFixed(1)}%)`);
    
    console.log('\n👥 按年龄分组分析:');
    Object.entries(analysis.ageGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100).toFixed(1);
        const mediumRate = (stats.medium / stats.total * 100).toFixed(1);
        const lowRate = (stats.low / stats.total * 100).toFixed(1);
        console.log(`${group}:`);
        console.log(`  高倾向: ${stats.high}/${stats.total} (${highRate}%)`);
        console.log(`  中倾向: ${stats.medium}/${stats.total} (${mediumRate}%)`);
        console.log(`  低倾向: ${stats.low}/${stats.total} (${lowRate}%)`);
    });
    
    console.log('\n💑 按婚姻状况分组分析:');
    Object.entries(analysis.maritalGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100).toFixed(1);
        const mediumRate = (stats.medium / stats.total * 100).toFixed(1);
        const lowRate = (stats.low / stats.total * 100).toFixed(1);
        console.log(`${group}:`);
        console.log(`  高倾向: ${stats.high}/${stats.total} (${highRate}%)`);
        console.log(`  中倾向: ${stats.medium}/${stats.total} (${mediumRate}%)`);
        console.log(`  低倾向: ${stats.low}/${stats.total} (${lowRate}%)`);
    });
    
    console.log('\n💼 按职业分组分析:');
    Object.entries(analysis.occupationGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100).toFixed(1);
        const mediumRate = (stats.medium / stats.total * 100).toFixed(1);
        const lowRate = (stats.low / stats.total * 100).toFixed(1);
        console.log(`${group}:`);
        console.log(`  高倾向: ${stats.high}/${stats.total} (${highRate}%)`);
        console.log(`  中倾向: ${stats.medium}/${stats.total} (${mediumRate}%)`);
        console.log(`  低倾向: ${stats.low}/${stats.total} (${lowRate}%)`);
    });
    
    console.log('\n👤 按性别分组分析:');
    Object.entries(analysis.genderGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100).toFixed(1);
        const mediumRate = (stats.medium / stats.total * 100).toFixed(1);
        const lowRate = (stats.low / stats.total * 100).toFixed(1);
        console.log(`${group}:`);
        console.log(`  高倾向: ${stats.high}/${stats.total} (${highRate}%)`);
        console.log(`  中倾向: ${stats.medium}/${stats.total} (${mediumRate}%)`);
        console.log(`  低倾向: ${stats.low}/${stats.total} (${lowRate}%)`);
    });
    
    console.log('\n💰 按保费分组分析:');
    Object.entries(analysis.premiumGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100).toFixed(1);
        const mediumRate = (stats.medium / stats.total * 100).toFixed(1);
        const lowRate = (stats.low / stats.total * 100).toFixed(1);
        console.log(`${group}:`);
        console.log(`  高倾向: ${stats.high}/${stats.total} (${highRate}%)`);
        console.log(`  中倾向: ${stats.medium}/${stats.total} (${mediumRate}%)`);
        console.log(`  低倾向: ${stats.low}/${stats.total} (${lowRate}%)`);
    });
    
    console.log('\n🌍 按地区分组分析:');
    Object.entries(analysis.regionGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100).toFixed(1);
        const mediumRate = (stats.medium / stats.total * 100).toFixed(1);
        const lowRate = (stats.low / stats.total * 100).toFixed(1);
        console.log(`${group}:`);
        console.log(`  高倾向: ${stats.high}/${stats.total} (${highRate}%)`);
        console.log(`  中倾向: ${stats.medium}/${stats.total} (${mediumRate}%)`);
        console.log(`  低倾向: ${stats.low}/${stats.total} (${lowRate}%)`);
    });
}

/**
 * 生成业务建议
 * @param {Object} analysis - 分析结果
 */
function generateBusinessRecommendations(analysis) {
    console.log('\n' + '='.repeat(80));
    console.log('💡 业务策略建议');
    console.log('='.repeat(80));
    
    // 找出高续保倾向的客户群体
    const highTendencyGroups = [];
    Object.entries(analysis.ageGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100);
        if (highRate > 50) {
            highTendencyGroups.push({ group, rate: highRate, type: '年龄' });
        }
    });
    
    Object.entries(analysis.maritalGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100);
        if (highRate > 50) {
            highTendencyGroups.push({ group, rate: highRate, type: '婚姻状况' });
        }
    });
    
    Object.entries(analysis.occupationGroups).forEach(([group, stats]) => {
        const highRate = (stats.high / stats.total * 100);
        if (highRate > 50) {
            highTendencyGroups.push({ group, rate: highRate, type: '职业' });
        }
    });
    
    console.log('\n🎯 高续保倾向客户群体:');
    highTendencyGroups.forEach(item => {
        console.log(`• ${item.type}: ${item.group} (高倾向率: ${item.rate.toFixed(1)}%)`);
    });
    
    console.log('\n📋 针对性营销策略:');
    console.log('1. 高续保倾向客户:');
    console.log('   • 提供VIP服务和专属优惠');
    console.log('   • 推荐高端保险产品');
    console.log('   • 建立长期客户关系');
    
    console.log('\n2. 中续保倾向客户:');
    console.log('   • 加强客户教育和产品介绍');
    console.log('   • 提供个性化服务');
    console.log('   • 定期跟进和关怀');
    
    console.log('\n3. 低续保倾向客户:');
    console.log('   • 重点客户挽回计划');
    console.log('   • 提供经济型产品选择');
    console.log('   • 加强风险意识教育');
    
    console.log('\n📊 续保率提升建议:');
    console.log('• 针对年轻客户: 设计适合年轻人的保险产品');
    console.log('• 针对已婚客户: 提供家庭保险套餐');
    console.log('• 针对高职业客户: 提供专业保险服务');
    console.log('• 针对高保费客户: 提供增值服务');
}

/**
 * 主函数
 */
async function main() {
    try {
        // 获取当前文件路径
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // 读取测试数据
        const testDataPath = path.join(__dirname, 'policy_test.xlsx');
        const testData = readTestData(testDataPath);
        
        // 进行续保倾向分析
        const analysis = analyzeRenewalTendency(testData);
        
        // 生成续保分析报告
        generateRenewalReport(analysis);
        
        // 生成业务建议
        generateBusinessRecommendations(analysis);
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ 续保分析完成');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('❌ 续保分析过程中出现错误:', error.message);
    }
}

// 运行主函数
main(); 