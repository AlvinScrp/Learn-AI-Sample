/**
 * 决策树分类模型 - 续保预测 (无归一化)
 * @description 使用决策树对客户续保状态进行预测，深度为3，移除归一化处理，添加文本打印功能
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
 * 数据预处理 (无归一化)
 * @param {Array} data - 原始数据
 * @returns {Object} 返回处理后的特征和目标变量
 */
function preprocessData(data) {
    console.log('开始数据预处理 (无归一化)...');
    
    // 特征工程
    const features = [];
    const labels = [];
    const featureNames = [];
    
    data.forEach((row, index) => {
        const feature = [];
        
        // 数值型特征 - 直接使用原始值，不进行归一化
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
    console.log('注意: 未进行归一化处理，使用原始特征值');
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
 * @param {Array} featureNames - 特征名称
 * @returns {Object} 决策树节点
 */
function buildTreeNode(features, labels, depth, maxDepth, featureNames) {
    const numSamples = features.length;
    const uniqueLabels = [...new Set(labels)];
    
    // 停止条件
    if (depth >= maxDepth || uniqueLabels.length === 1 || numSamples < 10) {
        const prediction = labels.reduce((a, b) => a + b, 0) / labels.length > 0.5 ? 1 : 0;
        const renewalCount = labels.filter(l => l === 1).length;
        const nonRenewalCount = labels.filter(l => l === 0).length;
        
        return {
            isLeaf: true,
            prediction: prediction,
            samples: numSamples,
            renewalCount: renewalCount,
            nonRenewalCount: nonRenewalCount,
            depth: depth
        };
    }
    
    // 找到最佳分割
    const split = findBestSplit(features, labels, maxDepth);
    
    if (split.feature === -1) {
        const prediction = labels.reduce((a, b) => a + b, 0) / labels.length > 0.5 ? 1 : 0;
        const renewalCount = labels.filter(l => l === 1).length;
        const nonRenewalCount = labels.filter(l => l === 0).length;
        
        return {
            isLeaf: true,
            prediction: prediction,
            samples: numSamples,
            renewalCount: renewalCount,
            nonRenewalCount: nonRenewalCount,
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
        featureName: featureNames[split.feature],
        threshold: split.threshold,
        left: buildTreeNode(leftFeatures, leftLabels, depth + 1, maxDepth, featureNames),
        right: buildTreeNode(rightFeatures, rightLabels, depth + 1, maxDepth, featureNames),
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
    const root = buildTreeNode(features, labels, 0, maxDepth, featureNames);
    
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
 * 打印决策树结构
 * @param {Object} node - 决策树节点
 * @param {string} prefix - 前缀字符串
 * @param {boolean} isLeft - 是否为左子节点
 */
function printDecisionTree(node, prefix = '', isLeft = true) {
    if (!node) return;
    
    const connector = isLeft ? '├─' : '└─';
    const nextPrefix = prefix + (isLeft ? '│  ' : '   ');
    
    if (node.isLeaf) {
        const prediction = node.prediction === 1 ? '续保' : '不续保';
        const renewalRate = ((node.renewalCount / node.samples) * 100).toFixed(1);
        console.log(`${prefix}${connector} 预测: ${prediction} (${node.samples}样本, 续保率: ${renewalRate}%)`);
    } else {
        console.log(`${prefix}${connector} ${node.featureName} ≤ ${node.threshold.toFixed(2)} (${node.samples}样本)`);
        printDecisionTree(node.left, nextPrefix, true);
        printDecisionTree(node.right, nextPrefix, false);
    }
}

/**
 * 打印决策路径
 * @param {Object} node - 决策树节点
 * @param {string} path - 当前路径
 * @param {number} depth - 当前深度
 */
function printDecisionPaths(node, path = '', depth = 0) {
    if (!node) return;
    
    if (node.isLeaf) {
        const prediction = node.prediction === 1 ? '续保' : '不续保';
        const renewalRate = ((node.renewalCount / node.samples) * 100).toFixed(1);
        console.log(`路径${depth + 1}: ${path} → ${prediction} (续保率: ${renewalRate}%, 样本数: ${node.samples})`);
    } else {
        const leftPath = path + (path ? ' AND ' : '') + `${node.featureName} ≤ ${node.threshold.toFixed(2)}`;
        const rightPath = path + (path ? ' AND ' : '') + `${node.featureName} > ${node.threshold.toFixed(2)}`;
        
        printDecisionPaths(node.left, leftPath, depth + 1);
        printDecisionPaths(node.right, rightPath, depth + 1);
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
 * 主函数
 */
function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'policy_data.xlsx');
    
    console.log('=== 决策树续保预测模型 (无归一化) ===\n');
    
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
    
    // 打印决策树结构
    console.log('=== 决策树结构 ===');
    printDecisionTree(model.root);
    console.log('');
    
    // 打印决策路径
    console.log('=== 决策路径 ===');
    printDecisionPaths(model.root);
    console.log('');
    
    // 模型评估
    const evaluation = evaluateModel(model, features, labels);
    
    console.log('=== 决策树模型训练完成 ===');
}

// 执行主函数
main();

export {
    preprocessData,
    trainDecisionTree,
    evaluateModel,
    printDecisionTree,
    printDecisionPaths
}; 