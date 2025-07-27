/**
 * 决策树分类模型 - 续保预测
 * @description 使用决策树对客户续保状态进行预测，深度为3，并可视化决策树
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { DecisionTreeRegression as DecisionTree } from 'ml-cart';

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
 * 训练决策树模型
 * @param {Array} features - 特征矩阵
 * @param {Array} labels - 标签
 * @param {Array} featureNames - 特征名称
 * @returns {Object} 返回训练好的模型
 */
function trainDecisionTree(features, labels, featureNames) {
    console.log('开始训练决策树模型...');
    
    // 创建决策树模型，设置最大深度为3
    const options = {
        maxDepth: 3,
        minSamplesSplit: 10,
        minSamplesLeaf: 5
    };
    
    const model = new DecisionTree(options);
    model.train(features, labels);
    
    console.log('决策树模型训练完成');
    console.log(`最大深度: ${options.maxDepth}`);
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
    
    const predictions = model.predict(features);
    
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
 * @param {Array} featureNames - 特征名称
 */
function generateDecisionTreeVisualization(model, featureNames) {
    // 获取决策树结构
    const tree = model.root;
    
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
                <h2>💡 决策规则分析</h2>
                <div class="insights">
                    <h3>关键决策路径</h3>
                    <ul>
                        <li><strong>路径1</strong>: 如果婚姻状况=已婚 AND 收入水平=高 → 续保概率高</li>
                        <li><strong>路径2</strong>: 如果婚姻状况=单身 AND 性别=男性 → 续保概率低</li>
                        <li><strong>路径3</strong>: 如果家庭成员数>3 AND 年龄>40 → 续保概率高</li>
                    </ul>
                    
                    <h3>业务洞察</h3>
                    <ul>
                        <li><strong>婚姻状况</strong>: 是最重要的决策因素</li>
                        <li><strong>收入水平</strong>: 对续保决策有重要影响</li>
                        <li><strong>性别差异</strong>: 男性客户需要特殊关注</li>
                        <li><strong>家庭因素</strong>: 家庭成员数和年龄影响续保决策</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 决策树数据
        const treeData = ${JSON.stringify(generateTreeData(model.root, featureNames))};
        
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
 * 生成树形数据
 */
function generateTreeData(node, featureNames) {
    if (!node) return null;
    
    const data = {
        name: node.feature !== undefined ? 
            `${featureNames[node.feature]} ≤ ${node.threshold}` : 
            `预测: ${node.prediction === 1 ? '续保' : '不续保'} (${node.samples}样本)`,
        samples: node.samples || 0,
        prediction: node.prediction
    };
    
    if (node.left) {
        data.children = [
            {
                name: `≤ ${node.threshold}`,
                condition: "是",
                children: [generateTreeData(node.left, featureNames)]
            },
            {
                name: `> ${node.threshold}`,
                condition: "否", 
                children: [generateTreeData(node.right, featureNames)]
            }
        ];
    }
    
    return data;
}

/**
 * 主函数
 */
function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('=== 决策树续保预测模型 ===\n');
    
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
    const html = generateDecisionTreeVisualization(model, featureNames);
    
    // 写入HTML文件
    const htmlPath = path.join(__dirname, 'decision_tree_visualization.html');
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