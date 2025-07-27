/**
 * 逻辑回归系数可视化 - Top20
 * @description 展示逻辑回归系数的Top20，区分正负值
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
        
        // 数值型特征 - 标准化
        const age = (row.age - 43.82) / 12.5; // 标准化年龄
        const familyMembers = (row.family_members - 3.42) / 1.5; // 标准化家庭成员
        const premium = (row.premium_amount - 17755) / 10000; // 标准化保费
        
        feature.push(age);
        feature.push(familyMembers);
        feature.push(premium);
        
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
            featureNames.push('年龄(标准化)', '家庭成员数(标准化)', '保费金额(标准化)', '性别(男=1)', 
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
 * 简化的逻辑回归训练
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 标签
 * @returns {Object} 返回训练好的模型
 */
function trainSimpleLogisticRegression(features, labels) {
    console.log('开始训练简化逻辑回归模型...');
    
    const numFeatures = features[0].length;
    const numSamples = features.length;
    
    // 初始化权重
    let weights = new Array(numFeatures).fill(0);
    const learningRate = 0.01;
    const maxIterations = 1000;
    
    // 梯度下降训练
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let gradients = new Array(numFeatures).fill(0);
        
        for (let i = 0; i < numSamples; i++) {
            const x = features[i];
            const y = labels[i];
            
            // 计算预测概率
            let z = 0;
            for (let j = 0; j < numFeatures; j++) {
                z += weights[j] * x[j];
            }
            
            const prediction = 1 / (1 + Math.exp(-z));
            
            // 计算梯度
            const error = prediction - y;
            for (let j = 0; j < numFeatures; j++) {
                gradients[j] += error * x[j];
            }
        }
        
        // 更新权重
        for (let j = 0; j < numFeatures; j++) {
            weights[j] -= learningRate * gradients[j] / numSamples;
        }
        
        // 每100次迭代打印一次进度
        if ((iteration + 1) % 100 === 0) {
            console.log(`训练进度: ${iteration + 1}/${maxIterations}`);
        }
    }
    
    console.log('模型训练完成');
    console.log('');
    
    return { weights };
}

/**
 * 生成Top20系数可视化HTML
 * @param {Array} coefficients - 模型系数
 * @param {Array} featureNames - 特征名称
 */
function generateTop20CoefficientVisualization(coefficients, featureNames) {
    // 创建系数和特征名称的配对
    const coefficientPairs = coefficients.map((coef, index) => ({
        name: featureNames[index],
        coefficient: coef,
        absoluteValue: Math.abs(coef)
    }));
    
    // 按绝对值排序，取Top20
    const sortedCoefficients = coefficientPairs
        .sort((a, b) => b.absoluteValue - a.absoluteValue)
        .slice(0, 20);
    
    // 分离正负系数
    const positiveCoefficients = sortedCoefficients.filter(item => item.coefficient > 0);
    const negativeCoefficients = sortedCoefficients.filter(item => item.coefficient < 0);
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>逻辑回归系数可视化 - Top20</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
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
            height: 700px;
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
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>逻辑回归系数可视化 - Top20</h1>
            <p>续保预测模型特征重要性分析</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 系数统计概览</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${sortedCoefficients.length}</div>
                        <div class="stat-label">Top系数数量</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${positiveCoefficients.length}</div>
                        <div class="stat-label">正面影响因素</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${negativeCoefficients.length}</div>
                        <div class="stat-label">负面影响因素</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${(Math.max(...sortedCoefficients.map(c => Math.abs(c.coefficient)))).toFixed(4)}</div>
                        <div class="stat-label">最大系数绝对值</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📈 Top20系数可视化</h2>
                <div class="chart-container">
                    <canvas id="coefficientChart"></canvas>
                </div>
                
                <div class="insights">
                    <h3>系数解释</h3>
                    <ul>
                        <li><strong>正系数 (绿色)</strong>: 该特征增加时，续保概率增加</li>
                        <li><strong>负系数 (红色)</strong>: 该特征增加时，续保概率减少</li>
                        <li><strong>系数绝对值越大</strong>: 该特征对续保预测的影响越大</li>
                        <li><strong>Top20选择</strong>: 按系数绝对值排序，展示最重要的20个特征</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Top20详细系数表</h2>
                <table class="coefficient-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>特征名称</th>
                            <th>系数值</th>
                            <th>影响方向</th>
                            <th>重要性</th>
                            <th>业务解释</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedCoefficients.map((item, index) => {
                            const direction = item.coefficient > 0 ? '正影响' : '负影响';
                            const importance = item.absoluteValue.toFixed(4);
                            const className = item.coefficient > 0 ? 'positive' : 'negative';
                            const businessExplanation = getBusinessExplanation(item.name, item.coefficient);
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.name}</td>
                                    <td class="${className}">${item.coefficient.toFixed(4)}</td>
                                    <td>${direction}</td>
                                    <td>${importance}</td>
                                    <td>${businessExplanation}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>💡 业务洞察</h2>
                <div class="insights">
                    <h3>最重要的正面因素</h3>
                    <ul>
                        ${positiveCoefficients.slice(0, 5).map(item => 
                            `<li><strong>${item.name}</strong> (${item.coefficient.toFixed(4)}): ${getBusinessExplanation(item.name, item.coefficient)}</li>`
                        ).join('')}
                    </ul>
                    
                    <h3>最重要的负面因素</h3>
                    <ul>
                        ${negativeCoefficients.slice(0, 3).map(item => 
                            `<li><strong>${item.name}</strong> (${item.coefficient.toFixed(4)}): ${getBusinessExplanation(item.name, item.coefficient)}</li>`
                        ).join('')}
                    </ul>
                    
                    <h3>业务建议</h3>
                    <ul>
                        <li><strong>重点关注</strong>: 加强正面影响因素的营销策略</li>
                        <li><strong>风险控制</strong>: 针对负面影响因素制定预防措施</li>
                        <li><strong>产品优化</strong>: 根据特征重要性调整产品设计</li>
                        <li><strong>客户服务</strong>: 针对不同客户群体提供差异化服务</li>
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
                labels: ${JSON.stringify(sortedCoefficients.map(item => item.name))},
                datasets: [{
                    label: '系数值',
                    data: ${JSON.stringify(sortedCoefficients.map(item => item.coefficient))},
                    backgroundColor: ${JSON.stringify(sortedCoefficients.map(item => item.coefficient > 0 ? '#4CAF50' : '#F44336'))},
                    borderColor: ${JSON.stringify(sortedCoefficients.map(item => item.coefficient > 0 ? '#388E3C' : '#D32F2F'))},
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: '#ddd'
                        }
                    },
                    y: {
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
                                return '系数: ' + context.parsed.x.toFixed(4);
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
 * 获取业务解释
 */
function getBusinessExplanation(featureName, coefficient) {
    const explanations = {
        '年龄(标准化)': coefficient > 0 ? '年龄越大，续保概率越高，风险意识更强' : '年龄越大，续保概率越低',
        '家庭成员数(标准化)': coefficient > 0 ? '家庭成员越多，续保概率越高，家庭保障需求大' : '家庭成员越多，续保概率越低',
        '保费金额(标准化)': coefficient > 0 ? '保费越高，续保概率越高，支付能力强' : '保费越高，续保概率越低，价格敏感',
        '性别(男=1)': coefficient > 0 ? '男性客户续保概率更高' : '男性客户续保概率较低，风险意识相对较低',
        '收入水平': coefficient > 0 ? '收入越高，续保概率越高，支付能力强' : '收入越高，续保概率越低',
        '教育水平': coefficient > 0 ? '教育水平越高，续保概率越高，风险意识强' : '教育水平越高，续保概率越低',
        '婚姻状况': coefficient > 0 ? '已婚客户续保概率更高，家庭责任感强' : '已婚客户续保概率较低',
        '理赔历史': coefficient > 0 ? '有理赔历史的客户续保概率更高，信任保险公司' : '有理赔历史的客户续保概率较低',
        '保单期限': coefficient > 0 ? '长期保单客户续保概率更高' : '长期保单客户续保概率较低',
        '职业': coefficient > 0 ? '职业等级越高，续保概率越高，收入稳定' : '职业等级越高，续保概率越低'
    };
    
    return explanations[featureName] || '该特征对续保有一定影响';
}

/**
 * 主函数
 */
function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('=== 逻辑回归系数可视化 - Top20 ===\n');
    
    // 读取数据
    const data = readExcelData(filePath);
    
    if (data.length === 0) {
        console.log('没有读取到数据，请检查文件路径');
        return;
    }
    
    // 数据预处理
    const { features, labels, featureNames } = preprocessData(data);
    
    // 训练模型
    const model = trainSimpleLogisticRegression(features, labels);
    
    // 获取系数
    const coefficients = model.weights;
    
    console.log('=== 模型系数 (Top20) ===');
    const coefficientPairs = coefficients.map((coef, index) => ({
        name: featureNames[index],
        coefficient: coef,
        absoluteValue: Math.abs(coef)
    }));
    
    const sortedCoefficients = coefficientPairs
        .sort((a, b) => b.absoluteValue - a.absoluteValue)
        .slice(0, 20);
    
    sortedCoefficients.forEach((item, index) => {
        const direction = item.coefficient > 0 ? '正影响' : '负影响';
        console.log(`${index + 1}. ${item.name}: ${item.coefficient.toFixed(4)} (${direction})`);
    });
    console.log('');
    
    // 生成可视化HTML
    const html = generateTop20CoefficientVisualization(coefficients, featureNames);
    
    // 写入HTML文件
    const htmlPath = path.join(__dirname, 'coefficient_visualization_top20.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`Top20系数可视化已生成: ${htmlPath}`);
    console.log('');
    console.log('=== 可视化生成完成 ===');
}

// 执行主函数
main();

export {
    preprocessData,
    trainSimpleLogisticRegression,
    generateTop20CoefficientVisualization
}; 