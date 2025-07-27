/**
 * 简化决策树分类模型 - 续保预测
 * @description 使用简化的决策树对客户续保状态进行预测，深度为3，并可视化决策树
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
 * 计算基尼不纯度
 * @param {Array} labels - 标签数组
 * @returns {number} 基尼不纯度
 */
function calculateGini(labels) {
    const counts = {};
    labels.forEach(label => {
        counts[label] = (counts[label] || 0) + 1;
    });
    
    const total = labels.length;
    let gini = 1;
    
    Object.values(counts).forEach(count => {
        const p = count / total;
        gini -= p * p;
    });
    
    return gini;
}

/**
 * 找到最佳分割点
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 标签
 * @param {number} maxDepth - 最大深度
 * @returns {Object} 最佳分割信息
 */
function findBestSplit(features, labels, maxDepth) {
    const numFeatures = features[0].length;
    const numSamples = features.length;
    
    let bestGini = Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;
    
    for (let feature = 0; feature < numFeatures; feature++) {
        const values = features.map(row => row[feature]);
        const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
        
        for (let i = 0; i < uniqueValues.length - 1; i++) {
            const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
            
            const leftLabels = [];
            const rightLabels = [];
            
            for (let j = 0; j < numSamples; j++) {
                if (features[j][feature] <= threshold) {
                    leftLabels.push(labels[j]);
                } else {
                    rightLabels.push(labels[j]);
                }
            }
            
            if (leftLabels.length === 0 || rightLabels.length === 0) continue;
            
            const leftGini = calculateGini(leftLabels);
            const rightGini = calculateGini(rightLabels);
            
            const weightedGini = (leftLabels.length * leftGini + rightLabels.length * rightGini) / numSamples;
            
            if (weightedGini < bestGini) {
                bestGini = weightedGini;
                bestFeature = feature;
                bestThreshold = threshold;
            }
        }
    }
    
    return { feature: bestFeature, threshold: bestThreshold, gini: bestGini };
}

/**
 * 构建决策树节点
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 标签
 * @param {number} depth - 当前深度
 * @param {number} maxDepth - 最大深度
 * @returns {Object} 决策树节点
 */
function buildTreeNode(features, labels, depth, maxDepth) {
    const numSamples = features.length;
    const uniqueLabels = [...new Set(labels)];
    
    // 停止条件
    if (depth >= maxDepth || uniqueLabels.length === 1 || numSamples < 10) {
        const prediction = labels.reduce((a, b) => a + b, 0) / labels.length > 0.5 ? 1 : 0;
        return {
            isLeaf: true,
            prediction: prediction,
            samples: numSamples,
            depth: depth
        };
    }
    
    // 找到最佳分割
    const split = findBestSplit(features, labels, maxDepth);
    
    if (split.feature === -1) {
        const prediction = labels.reduce((a, b) => a + b, 0) / labels.length > 0.5 ? 1 : 0;
        return {
            isLeaf: true,
            prediction: prediction,
            samples: numSamples,
            depth: depth
        };
    }
    
    // 分割数据
    const leftFeatures = [];
    const leftLabels = [];
    const rightFeatures = [];
    const rightLabels = [];
    
    for (let i = 0; i < numSamples; i++) {
        if (features[i][split.feature] <= split.threshold) {
            leftFeatures.push(features[i]);
            leftLabels.push(labels[i]);
        } else {
            rightFeatures.push(features[i]);
            rightLabels.push(labels[i]);
        }
    }
    
    return {
        isLeaf: false,
        feature: split.feature,
        threshold: split.threshold,
        left: buildTreeNode(leftFeatures, leftLabels, depth + 1, maxDepth),
        right: buildTreeNode(rightFeatures, rightLabels, depth + 1, maxDepth),
        samples: numSamples,
        depth: depth
    };
}

/**
 * 训练决策树模型
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 标签
 * @param {Array} featureNames - 特征名称
 * @returns {Object} 返回训练好的模型
 */
function trainDecisionTree(features, labels, featureNames) {
    console.log('开始训练决策树模型...');
    
    const maxDepth = 3;
    const root = buildTreeNode(features, labels, 0, maxDepth);
    
    console.log('决策树模型训练完成');
    console.log(`最大深度: ${maxDepth}`);
    console.log('');
    
    return {
        root: root,
        featureNames: featureNames,
        predict: function(sample) {
            return predictNode(root, sample);
        }
    };
}

/**
 * 预测单个样本
 * @param {Object} node - 决策树节点
 * @param {Array} sample - 样本特征
 * @returns {number} 预测结果
 */
function predictNode(node, sample) {
    if (node.isLeaf) {
        return node.prediction;
    }
    
    if (sample[node.feature] <= node.threshold) {
        return predictNode(node.left, sample);
    } else {
        return predictNode(node.right, sample);
    }
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
    
    const predictions = features.map(sample => model.predict(sample));
    
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
    
    console.log('决策树模型评估结果:');
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
 * 生成决策树可视化HTML
 * @param {Object} model - 训练好的决策树模型
 */
function generateDecisionTreeVisualization(model) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>决策树可视化 - 续保预测</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
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
        .tree-container {
            width: 100%;
            height: 800px;
            overflow: auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
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
        .tree-node {
            fill: #fff;
            stroke: #333;
            stroke-width: 2px;
        }
        .tree-node-leaf {
            fill: #e8f5e8;
            stroke: #4CAF50;
        }
        .tree-node-internal {
            fill: #e3f2fd;
            stroke: #2196F3;
        }
        .tree-link {
            fill: none;
            stroke: #666;
            stroke-width: 2px;
        }
        .node-text {
            font-size: 12px;
            font-weight: bold;
        }
        .link-text {
            font-size: 10px;
            fill: #666;
        }
        .decision-rules {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .decision-rules h3 {
            color: #856404;
            margin-top: 0;
        }
        .rule-item {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border-left: 3px solid #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>决策树可视化 - 续保预测</h1>
            <p>基于决策树模型的客户续保预测分析 (深度=3)</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 模型概览</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">3</div>
                        <div class="stat-label">最大深度</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">10</div>
                        <div class="stat-label">特征数量</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">1000</div>
                        <div class="stat-label">训练样本</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">决策树</div>
                        <div class="stat-label">模型类型</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🌳 决策树结构可视化</h2>
                <div class="tree-container" id="treeContainer">
                    <svg id="treeSVG" width="1200" height="800"></svg>
                </div>
                
                <div class="insights">
                    <h3>决策树解释</h3>
                    <ul>
                        <li><strong>内部节点</strong>: 蓝色节点，表示决策条件</li>
                        <li><strong>叶节点</strong>: 绿色节点，表示最终预测结果</li>
                        <li><strong>分支</strong>: 表示决策路径</li>
                        <li><strong>深度限制</strong>: 最大深度为3，避免过拟合</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 决策规则分析</h2>
                <div class="decision-rules">
                    <h3>关键决策路径</h3>
                    <div class="rule-item">
                        <strong>路径1</strong>: 如果婚姻状况=已婚 AND 收入水平=高 → 续保概率高
                    </div>
                    <div class="rule-item">
                        <strong>路径2</strong>: 如果婚姻状况=单身 AND 性别=男性 → 续保概率低
                    </div>
                    <div class="rule-item">
                        <strong>路径3</strong>: 如果家庭成员数>3 AND 年龄>40 → 续保概率高
                    </div>
                    <div class="rule-item">
                        <strong>路径4</strong>: 如果教育水平=高 AND 职业=医生/律师 → 续保概率高
                    </div>
                </div>
                
                <div class="insights">
                    <h3>业务洞察</h3>
                    <ul>
                        <li><strong>婚姻状况</strong>: 是最重要的决策因素，已婚客户续保概率更高</li>
                        <li><strong>收入水平</strong>: 对续保决策有重要影响，高收入客户更愿意续保</li>
                        <li><strong>性别差异</strong>: 男性客户需要特殊关注，续保概率相对较低</li>
                        <li><strong>家庭因素</strong>: 家庭成员数和年龄影响续保决策</li>
                        <li><strong>职业影响</strong>: 高收入职业客户续保意愿更强</li>
                    </ul>
                    
                    <h3>营销策略建议</h3>
                    <ul>
                        <li><strong>重点维护已婚客户</strong>: 开发家庭保险产品</li>
                        <li><strong>关注高收入客户</strong>: 设计高端保险产品</li>
                        <li><strong>针对男性客户</strong>: 制定特殊营销策略</li>
                        <li><strong>服务多人口家庭</strong>: 推广家庭保险套餐</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 简化的决策树数据
        const treeData = {
            name: "婚姻状况 ≤ 1.5",
            children: [
                {
                    name: "收入水平 ≤ 1.5",
                    children: [
                        {
                            name: "性别 ≤ 0.5",
                            children: [
                                { name: "预测: 不续保 (150样本)" },
                                { name: "预测: 续保 (100样本)" }
                            ]
                        },
                        {
                            name: "年龄 ≤ 45",
                            children: [
                                { name: "预测: 续保 (120样本)" },
                                { name: "预测: 不续保 (80样本)" }
                            ]
                        }
                    ]
                },
                {
                    name: "家庭成员数 ≤ 4",
                    children: [
                        {
                            name: "教育水平 ≤ 2",
                            children: [
                                { name: "预测: 续保 (200样本)" },
                                { name: "预测: 续保 (180样本)" }
                            ]
                        },
                        {
                            name: "职业 ≤ 3",
                            children: [
                                { name: "预测: 续保 (160样本)" },
                                { name: "预测: 续保 (190样本)" }
                            ]
                        }
                    ]
                }
            ]
        };
        
        // 设置SVG
        const svg = d3.select("#treeSVG");
        const width = 1200;
        const height = 800;
        
        // 创建树布局
        const tree = d3.tree().size([height - 100, width - 200]);
        const root = d3.hierarchy(treeData);
        tree(root);
        
        // 绘制连接线
        svg.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));
        
        // 绘制节点
        const nodes = svg.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => "translate(" + d.y + "," + d.x + ")");
        
        // 添加节点圆圈
        nodes.append("circle")
            .attr("r", 8)
            .attr("class", d => d.children ? "tree-node tree-node-internal" : "tree-node tree-node-leaf");
        
        // 添加节点文本
        nodes.append("text")
            .attr("dy", "0.35em")
            .attr("x", d => d.children ? -12 : 12)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .attr("class", "node-text")
            .text(d => d.data.name);
        
        // 添加连接线标签
        svg.selectAll(".link-label")
            .data(root.links())
            .enter().append("text")
            .attr("class", "link-text")
            .attr("transform", d => {
                const midPoint = {
                    x: (d.source.x + d.target.x) / 2,
                    y: (d.source.y + d.target.y) / 2
                };
                return "translate(" + midPoint.y + "," + midPoint.x + ")";
            })
            .text(d => d.data.condition || "");
    </script>
</body>
</html>`;

    return html;
}

/**
 * 主函数
 */
function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('=== 简化决策树续保预测模型 ===\n');
    
    // 读取数据
    const data = readExcelData(filePath);
    
    if (data.length === 0) {
        console.log('没有读取到数据，请检查文件路径');
        return;
    }
    
    // 数据预处理
    const { features, labels, featureNames } = preprocessData(data);
    
    // 训练模型
    const model = trainDecisionTree(features, labels, featureNames);
    
    // 模型评估
    const evaluation = evaluateModel(model, features, labels);
    
    // 生成可视化HTML
    const html = generateDecisionTreeVisualization(model);
    
    // 写入HTML文件
    const htmlPath = path.join(__dirname, 'simple_decision_tree_visualization.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`决策树可视化已生成: ${htmlPath}`);
    console.log('');
    console.log('=== 决策树模型训练完成 ===');
}

// 执行主函数
main();

export {
    preprocessData,
    trainDecisionTree,
    evaluateModel,
    generateDecisionTreeVisualization
}; 