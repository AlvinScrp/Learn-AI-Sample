/**
 * 逻辑回归模型 - 续保预测
 * @description 使用逻辑回归对客户续保状态进行预测，并可视化系数
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { Matrix } from 'ml-matrix';
import LogisticRegression from 'ml-logistic-regression';

/**
 * 读取Excel数据
 * @param {string} filePath - Excel文件路径
 * @returns {Array} 返回数据数组
 */
function readExcelData(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
        console.error('读取Excel文件时发生错误:', error.message);
        return [];
    }
}

/**
 * 数据预处理
 * @param {Array} data - 原始数据
 * @returns {Object} 返回处理后的特征和目标变量
 */
function preprocessData(data) {
    console.log('开始数据预处理...');
    
    // 特征工程
    const features = [];
    const labels = [];
    const featureNames = [];
    
    data.forEach((row, index) => {
        const feature = [];
        
        // 数值型特征
        feature.push(row.age || 0);
        feature.push(row.family_members || 0);
        feature.push(row.premium_amount || 0);
        
        // 性别编码 (男=1, 女=0)
        feature.push(row.gender === '男' ? 1 : 0);
        
        // 收入水平编码 (高=2, 中=1, 低=0)
        const incomeMap = { '高': 2, '中': 1, '低': 0 };
        feature.push(incomeMap[row.income_level] || 0);
        
        // 教育水平编码 (博士=3, 硕士=2, 本科=1, 高中=0)
        const educationMap = { '博士': 3, '硕士': 2, '本科': 1, '高中': 0 };
        feature.push(educationMap[row.education_level] || 0);
        
        // 婚姻状况编码 (已婚=2, 单身=1, 离异=0)
        const maritalMap = { '已婚': 2, '单身': 1, '离异': 0 };
        feature.push(maritalMap[row.marital_status] || 0);
        
        // 理赔历史编码 (是=1, 否=0)
        feature.push(row.claim_history === '是' ? 1 : 0);
        
        // 保单期限编码 (20年=3, 10年=2, 5年=1, 1年=0)
        const termMap = { '20年': 3, '10年': 2, '5年': 1, '1年': 0 };
        feature.push(termMap[row.policy_term] || 0);
        
        // 职业编码 (医生=5, 律师=4, 工程师=3, 设计师=2, 销售=1, 经理=0)
        const occupationMap = { '医生': 5, '律师': 4, '工程师': 3, '设计师': 2, '销售': 1, '经理': 0 };
        feature.push(occupationMap[row.occupation] || 0);
        
        // 目标变量 (Yes=1, No=0)
        const label = row.renewal === 'Yes' ? 1 : 0;
        
        features.push(feature);
        labels.push(label);
        
        // 记录特征名称
        if (index === 0) {
            featureNames.push('年龄', '家庭成员数', '保费金额', '性别(男=1)', 
                            '收入水平', '教育水平', '婚姻状况', '理赔历史', 
                            '保单期限', '职业');
        }
    });
    
    console.log(`数据预处理完成: ${features.length} 条记录, ${features[0].length} 个特征`);
    console.log('');
    
    return {
        features: features,
        labels: labels,
        featureNames: featureNames
    };
}

/**
 * 训练逻辑回归模型
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 标签
 * @returns {Object} 返回训练好的模型和评估结果
 */
function trainLogisticRegression(features, labels) {
    console.log('开始训练逻辑回归模型...');
    
    // 转换为Matrix格式
    const X = new Matrix(features);
    const y = new Matrix(labels.map(label => [label]));
    
    // 创建并训练模型
    const options = {
        learningRate: 0.1,
        maxIterations: 500,
        tolerance: 1e-4
    };
    
    const model = new LogisticRegression(options);
    model.train(X, y);
    
    console.log('模型训练完成');
    console.log('');
    
    return model;
}

/**
 * 模型评估
 * @param {Object} model - 训练好的模型
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 真实标签
 * @returns {Object} 返回评估指标
 */
function evaluateModel(model, features, labels) {
    console.log('开始模型评估...');
    
    const X = new Matrix(features);
    const predictions = model.predict(X);
    
    let tp = 0, tn = 0, fp = 0, fn = 0;
    
    for (let i = 0; i < labels.length; i++) {
        const actual = labels[i];
        const predicted = predictions[i];
        
        if (actual === 1 && predicted === 1) tp++;
        else if (actual === 0 && predicted === 0) tn++;
        else if (actual === 0 && predicted === 1) fp++;
        else if (actual === 1 && predicted === 0) fn++;
    }
    
    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    const f1Score = 2 * (precision * recall) / (precision + recall);
    
    console.log('模型评估结果:');
    console.log(`准确率 (Accuracy): ${(accuracy * 100).toFixed(2)}%`);
    console.log(`精确率 (Precision): ${(precision * 100).toFixed(2)}%`);
    console.log(`召回率 (Recall): ${(recall * 100).toFixed(2)}%`);
    console.log(`F1分数: ${(f1Score * 100).toFixed(2)}%`);
    console.log('');
    console.log('混淆矩阵:');
    console.log(`真正例 (TP): ${tp}`);
    console.log(`真负例 (TN): ${tn}`);
    console.log(`假正例 (FP): ${fp}`);
    console.log(`假负例 (FN): ${fn}`);
    console.log('');
    
    return {
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix: { tp, tn, fp, fn }
    };
}

/**
 * 生成系数可视化HTML
 * @param {Array} coefficients - 模型系数
 * @param {Array} featureNames - 特征名称
 */
function generateCoefficientVisualization(coefficients, featureNames) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>逻辑回归系数可视化</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
            padding: 20px;
            border-radius: 8px;
            background: #fafafa;
            border-left: 4px solid #667eea;
        }
        .section h2 {
            color: #333;
            margin-top: 0;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .chart-container {
            position: relative;
            height: 600px;
            margin: 20px 0;
        }
        .insights {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .insights h3 {
            color: #2c5aa0;
            margin-top: 0;
        }
        .coefficient-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .coefficient-table th,
        .coefficient-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .coefficient-table th {
            background-color: #667eea;
            color: white;
        }
        .coefficient-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .positive {
            color: #4CAF50;
            font-weight: bold;
        }
        .negative {
            color: #F44336;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>逻辑回归系数分析</h1>
            <p>续保预测模型特征重要性可视化</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 特征系数分析</h2>
                <div class="chart-container">
                    <canvas id="coefficientChart"></canvas>
                </div>
                
                <div class="insights">
                    <h3>系数解释</h3>
                    <ul>
                        <li><strong>正系数</strong>: 该特征增加时，续保概率增加</li>
                        <li><strong>负系数</strong>: 该特征增加时，续保概率减少</li>
                        <li><strong>系数绝对值越大</strong>: 该特征对续保预测的影响越大</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 详细系数表</h2>
                <table class="coefficient-table">
                    <thead>
                        <tr>
                            <th>特征名称</th>
                            <th>系数值</th>
                            <th>影响方向</th>
                            <th>重要性</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${featureNames.map((name, index) => {
                            const coef = coefficients[index];
                            const direction = coef > 0 ? '正影响' : '负影响';
                            const importance = Math.abs(coef).toFixed(4);
                            const className = coef > 0 ? 'positive' : 'negative';
                            return `
                                <tr>
                                    <td>${name}</td>
                                    <td class="${className}">${coef.toFixed(4)}</td>
                                    <td>${direction}</td>
                                    <td>${importance}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>💡 业务洞察</h2>
                <div class="insights">
                    <h3>关键发现</h3>
                    <ul>
                        <li><strong>最重要的正面因素</strong>: ${getTopPositiveFactors(coefficients, featureNames)}</li>
                        <li><strong>最重要的负面因素</strong>: ${getTopNegativeFactors(coefficients, featureNames)}</li>
                        <li><strong>模型可解释性</strong>: 逻辑回归模型提供了清晰的特征重要性排序</li>
                    </ul>
                    
                    <h3>业务建议</h3>
                    <ul>
                        <li><strong>重点关注</strong>: 加强正面影响因素的营销策略</li>
                        <li><strong>风险控制</strong>: 针对负面影响因素制定预防措施</li>
                        <li><strong>产品优化</strong>: 根据特征重要性调整产品设计</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('coefficientChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(featureNames)},
                datasets: [{
                    label: '系数值',
                    data: ${JSON.stringify(coefficients)},
                    backgroundColor: ${JSON.stringify(coefficients.map(coef => coef > 0 ? '#4CAF50' : '#F44336'))},
                    borderColor: ${JSON.stringify(coefficients.map(coef => coef > 0 ? '#388E3C' : '#D32F2F'))},
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#ddd'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '系数: ' + context.parsed.y.toFixed(4);
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    return html;
}

/**
 * 获取最重要的正面因素
 */
function getTopPositiveFactors(coefficients, featureNames) {
    const positiveFactors = coefficients
        .map((coef, index) => ({ coef, name: featureNames[index] }))
        .filter(item => item.coef > 0)
        .sort((a, b) => b.coef - a.coef);
    
    return positiveFactors.length > 0 ? 
        `${positiveFactors[0].name} (${positiveFactors[0].coef.toFixed(4)})` : '无';
}

/**
 * 获取最重要的负面因素
 */
function getTopNegativeFactors(coefficients, featureNames) {
    const negativeFactors = coefficients
        .map((coef, index) => ({ coef, name: featureNames[index] }))
        .filter(item => item.coef < 0)
        .sort((a, b) => a.coef - b.coef);
    
    return negativeFactors.length > 0 ? 
        `${negativeFactors[0].name} (${negativeFactors[0].coef.toFixed(4)})` : '无';
}

/**
 * 主函数
 */
function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('=== 逻辑回归续保预测模型 ===\n');
    
    // 读取数据
    const data = readExcelData(filePath);
    
    if (data.length === 0) {
        console.log('没有读取到数据，请检查文件路径');
        return;
    }
    
    // 数据预处理
    const { features, labels, featureNames } = preprocessData(data);
    
    // 训练模型
    const model = trainLogisticRegression(features, labels);
    
    // 模型评估
    const evaluation = evaluateModel(model, features, labels);
    
    // 获取系数
    let coefficients = [];
    try {
        if (model.weights && model.weights.data) {
            coefficients = model.weights.data[0];
        } else if (model.weights) {
            coefficients = model.weights;
        } else {
            console.log('无法获取模型系数，使用默认值');
            coefficients = new Array(featureNames.length).fill(0);
        }
    } catch (error) {
        console.log('获取系数时出错，使用默认值');
        coefficients = new Array(featureNames.length).fill(0);
    }
    
    console.log('=== 模型系数 ===');
    featureNames.forEach((name, index) => {
        const coef = coefficients[index] || 0;
        const direction = coef > 0 ? '正影响' : '负影响';
        console.log(`${name}: ${coef.toFixed(4)} (${direction})`);
    });
    console.log('');
    
    // 生成可视化HTML
    const html = generateCoefficientVisualization(coefficients, featureNames);
    
    // 写入HTML文件
    const fs = require('fs');
    const htmlPath = path.join(__dirname, 'coefficient_visualization.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`系数可视化已生成: ${htmlPath}`);
    console.log('');
    console.log('=== 模型训练完成 ===');
}

// 执行主函数
main();

export {
    preprocessData,
    trainLogisticRegression,
    evaluateModel,
    generateCoefficientVisualization
}; 