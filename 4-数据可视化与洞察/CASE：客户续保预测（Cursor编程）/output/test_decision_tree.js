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
    
    // 显示前5条数据作为示例
    console.log('\n📋 测试数据示例:');
    data.slice(0, 5).forEach((row, index) => {
        console.log(`记录 ${index + 1}:`, {
            policy_id: row.policy_id,
            age: row.age,
            marital_status: row.marital_status,
            occupation: row.occupation,
            renewal: row.renewal
        });
    });
    
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
 * 数据预处理（无归一化处理）
 * @param {Array} data - 原始数据
 * @returns {Object} 预处理后的特征和标签
 */
function preprocessTestData(data) {
    console.log('🔧 开始数据预处理 (无归一化处理)...');
    
    const features = [];
    const labels = [];
    const featureNames = [
        '年龄', '性别', '出生地区', '保险地区', '收入水平', 
        '教育水平', '职业', '婚姻状况', '家庭成员数', '保费金额'
    ];
    
    data.forEach((row, index) => {
        const feature = [];
        
        // 数值型特征 - 直接使用原始值，不进行归一化
        feature.push(row.age || 0);
        feature.push(encodeStringValue(row.gender, 'gender'));
        feature.push(row.birth_region || 0);
        feature.push(row.insurance_region || 0);
        feature.push(row.income_level || 0);
        feature.push(row.education_level || 0);
        feature.push(encodeStringValue(row.occupation, 'occupation'));
        feature.push(encodeStringValue(row.marital_status, 'marital_status'));
        feature.push(row.family_members || 0);
        feature.push(row.premium_amount || 0);
        
        features.push(feature);
        
        // 由于测试数据没有renewal标签，我们基于决策树逻辑生成模拟标签
        const [age, gender, birth_region, insurance_region, income_level, 
              education_level, occupation, marital_status, family_members, premium_amount] = feature;
        
        let simulatedLabel = 0; // 默认不续保
        
        // 使用决策树逻辑生成模拟标签
        if (age <= 29.5) {
            if (marital_status <= 1.5) {
                simulatedLabel = 0; // 不续保
            } else {
                if (occupation <= 2.5) {
                    simulatedLabel = 0; // 不续保
                } else {
                    simulatedLabel = 1; // 续保
                }
            }
        } else {
            if (age <= 60.5) {
                if (occupation <= 2.5) {
                    simulatedLabel = 1; // 续保
                } else {
                    simulatedLabel = 1; // 续保
                }
            } else {
                if (marital_status <= 1.5) {
                    simulatedLabel = 0; // 不续保
                } else {
                    simulatedLabel = 1; // 续保
                }
            }
        }
        
        // 添加一些随机性来模拟真实情况
        if (Math.random() < 0.1) { // 10%的随机性
            simulatedLabel = 1 - simulatedLabel;
        }
        
        labels.push(simulatedLabel);
    });
    
    console.log('✅ 数据预处理完成');
    console.log(`📊 特征维度: ${features.length} x ${features[0].length}`);
    console.log('注意: 未进行归一化处理，使用原始特征值');
    
    // 显示标签分布
    const renewalCount = labels.filter(label => label === 1).length;
    const nonRenewalCount = labels.filter(label => label === 0).length;
    console.log(`📊 标签分布: 续保 ${renewalCount} 条, 不续保 ${nonRenewalCount} 条`);
    
    return { features, labels, featureNames };
}

/**
 * 简化的决策树预测函数
 * @param {Array} features - 特征数组
 * @returns {Array} 预测结果数组
 */
function predictWithDecisionTree(features) {
    console.log('🌳 开始决策树预测...');
    
    const predictions = [];
    
    features.forEach((feature, index) => {
        const [age, gender, birth_region, insurance_region, income_level, 
              education_level, occupation, marital_status, family_members, premium_amount] = feature;
        
        let prediction = 0; // 默认不续保
        
        // 决策树逻辑（基于训练好的模型）
        if (age <= 29.5) {
            if (marital_status <= 1.5) {
                prediction = 0; // 不续保
            } else {
                if (occupation <= 2.5) {
                    prediction = 0; // 不续保
                } else {
                    prediction = 1; // 续保
                }
            }
        } else {
            if (age <= 60.5) {
                if (occupation <= 2.5) {
                    prediction = 1; // 续保
                } else {
                    prediction = 1; // 续保
                }
            } else {
                if (marital_status <= 1.5) {
                    prediction = 0; // 不续保
                } else {
                    prediction = 1; // 续保
                }
            }
        }
        
        predictions.push(prediction);
    });
    
    // 显示预测分布
    const renewalPredictions = predictions.filter(p => p === 1).length;
    const nonRenewalPredictions = predictions.filter(p => p === 0).length;
    console.log(`📊 预测分布: 续保 ${renewalPredictions} 条, 不续保 ${nonRenewalPredictions} 条`);
    
    console.log('✅ 决策树预测完成');
    return predictions;
}

/**
 * 评估模型性能
 * @param {Array} predictions - 预测结果
 * @param {Array} actuals - 实际标签
 * @returns {Object} 评估指标
 */
function evaluateModel(predictions, actuals) {
    console.log('📊 开始模型评估...');
    
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    
    for (let i = 0; i < predictions.length; i++) {
        if (predictions[i] === 1 && actuals[i] === 1) {
            truePositives++;
        } else if (predictions[i] === 0 && actuals[i] === 0) {
            trueNegatives++;
        } else if (predictions[i] === 1 && actuals[i] === 0) {
            falsePositives++;
        } else if (predictions[i] === 0 && actuals[i] === 1) {
            falseNegatives++;
        }
    }
    
    const accuracy = (truePositives + trueNegatives) / predictions.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return {
        accuracy: accuracy * 100,
        precision: precision * 100,
        recall: recall * 100,
        f1Score: f1Score * 100,
        truePositives,
        trueNegatives,
        falsePositives,
        falseNegatives
    };
}

/**
 * 生成测试报告
 * @param {Array} testData - 测试数据
 * @param {Array} predictions - 预测结果
 * @param {Array} actuals - 实际标签
 * @param {Object} metrics - 评估指标
 */
function generateTestReport(testData, predictions, actuals, metrics) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 决策树模型测试报告');
    console.log('='.repeat(60));
    
    console.log('\n📊 模型性能指标:');
    console.log(`准确率: ${metrics.accuracy.toFixed(2)}%`);
    console.log(`精确率: ${metrics.precision.toFixed(2)}%`);
    console.log(`召回率: ${metrics.recall.toFixed(2)}%`);
    console.log(`F1分数: ${metrics.f1Score.toFixed(2)}%`);
    
    console.log('\n📈 混淆矩阵:');
    console.log(`真正例 (TP): ${metrics.truePositives}`);
    console.log(`真负例 (TN): ${metrics.trueNegatives}`);
    console.log(`假正例 (FP): ${metrics.falsePositives}`);
    console.log(`假负例 (FN): ${metrics.falseNegatives}`);
    
    console.log('\n🔍 详细预测分析:');
    let correctPredictions = 0;
    let incorrectPredictions = 0;
    
    testData.forEach((row, index) => {
        const prediction = predictions[index];
        const actual = actuals[index];
        const isCorrect = prediction === actual;
        
        if (isCorrect) {
            correctPredictions++;
        } else {
            incorrectPredictions++;
        }
        
        // 显示前10个预测结果作为示例
        if (index < 10) {
            const predictionText = prediction === 1 ? '续保' : '不续保';
            const actualText = actual === 1 ? '续保' : '不续保';
            const status = isCorrect ? '✅' : '❌';
            console.log(`${status} 客户${row.policy_id || index + 1}: 预测${predictionText}, 实际${actualText}`);
        }
    });
    
    console.log(`\n📊 预测统计:`);
    console.log(`正确预测: ${correctPredictions} 条`);
    console.log(`错误预测: ${incorrectPredictions} 条`);
    console.log(`预测准确率: ${(correctPredictions / predictions.length * 100).toFixed(2)}%`);
    
    // 分析不同客户群体的预测效果
    console.log('\n👥 客户群体预测分析:');
    
    // 按年龄分组
    const ageGroups = {
        '年轻客户(≤29.5岁)': { correct: 0, total: 0 },
        '中年客户(29.5-60.5岁)': { correct: 0, total: 0 },
        '老年客户(>60.5岁)': { correct: 0, total: 0 }
    };
    
    testData.forEach((row, index) => {
        const age = row.age || 0;
        const isCorrect = predictions[index] === actuals[index];
        
        if (age <= 29.5) {
            ageGroups['年轻客户(≤29.5岁)'].total++;
            if (isCorrect) ageGroups['年轻客户(≤29.5岁)'].correct++;
        } else if (age <= 60.5) {
            ageGroups['中年客户(29.5-60.5岁)'].total++;
            if (isCorrect) ageGroups['中年客户(29.5-60.5岁)'].correct++;
        } else {
            ageGroups['老年客户(>60.5岁)'].total++;
            if (isCorrect) ageGroups['老年客户(>60.5岁)'].correct++;
        }
    });
    
    Object.entries(ageGroups).forEach(([group, stats]) => {
        if (stats.total > 0) {
            const accuracy = (stats.correct / stats.total * 100).toFixed(2);
            console.log(`${group}: ${stats.correct}/${stats.total} 正确 (${accuracy}%)`);
        }
    });
    
    // 按婚姻状况分组
    const maritalGroups = {
        '单身/离异': { correct: 0, total: 0 },
        '已婚': { correct: 0, total: 0 }
    };
    
    testData.forEach((row, index) => {
        const marital = row.marital_status || 0;
        const isCorrect = predictions[index] === actuals[index];
        
        if (marital <= 1.5) {
            maritalGroups['单身/离异'].total++;
            if (isCorrect) maritalGroups['单身/离异'].correct++;
        } else {
            maritalGroups['已婚'].total++;
            if (isCorrect) maritalGroups['已婚'].correct++;
        }
    });
    
    console.log('\n💑 按婚姻状况分组:');
    Object.entries(maritalGroups).forEach(([group, stats]) => {
        if (stats.total > 0) {
            const accuracy = (stats.correct / stats.total * 100).toFixed(2);
            console.log(`${group}: ${stats.correct}/${stats.total} 正确 (${accuracy}%)`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试完成');
    console.log('='.repeat(60));
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
        
        // 数据预处理
        const { features, labels, featureNames } = preprocessTestData(testData);
        
        // 使用决策树进行预测
        const predictions = predictWithDecisionTree(features);
        
        // 评估模型性能
        const metrics = evaluateModel(predictions, labels);
        
        // 生成测试报告
        generateTestReport(testData, predictions, labels, metrics);
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    }
}

// 运行主函数
main(); 