import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 读取JSON文件
 * @param {string} filePath - 文件路径
 * @returns {Object} - 解析后的JSON对象
 */
function readJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`读取文件 ${filePath} 时出错:`, error);
        return null;
    }
}

/**
 * 生成HTML报告
 * @param {Object} data - 分析数据
 */
function generateHTMLReport(data) {
    const { tfidfFeatures, similarityMatrix, statistics, topFeatures, hotelNames } = data;
    
    // 准备图表数据
    const ngramTypeData = {
        labels: ['1-gram', '2-gram', '3-gram'],
        datasets: [{
            label: 'N-gram数量',
            data: [tfidfFeatures.unigramCount, tfidfFeatures.bigramCount, tfidfFeatures.trigramCount],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            borderWidth: 1
        }]
    };
    
    // 准备前20个重要特征数据
    const top20Features = topFeatures.slice(0, 20);
    const featureData = {
        labels: top20Features.map(f => f.ngram),
        datasets: [{
            label: 'TF-IDF重要性',
            data: top20Features.map(f => f.importance),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
    
    // 准备相似度分布数据
    const similarityValues = [];
    for (let i = 0; i < similarityMatrix.length; i++) {
        for (let j = i + 1; j < similarityMatrix.length; j++) {
            similarityValues.push(similarityMatrix[i][j]);
        }
    }
    
    const similarityRanges = {
        '0.0-0.2': similarityValues.filter(v => v >= 0 && v < 0.2).length,
        '0.2-0.4': similarityValues.filter(v => v >= 0.2 && v < 0.4).length,
        '0.4-0.6': similarityValues.filter(v => v >= 0.4 && v < 0.6).length,
        '0.6-0.8': similarityValues.filter(v => v >= 0.6 && v < 0.8).length,
        '0.8-1.0': similarityValues.filter(v => v >= 0.8 && v <= 1.0).length
    };
    
    const similarityData = {
        labels: Object.keys(similarityRanges),
        datasets: [{
            label: '酒店对数量',
            data: Object.values(similarityRanges),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };
    
    // 准备前10家酒店的TF-IDF向量热力图数据
    const top10Hotels = hotelNames.slice(0, 10);
    const top10Vectors = tfidfFeatures.tfidfVectors.slice(0, 10);
    const top10Features = tfidfFeatures.vocabulary.slice(0, 20); // 前20个特征
    
    const heatmapData = {
        labels: top10Hotels,
        datasets: top10Features.map((feature, featureIndex) => ({
            label: feature,
            data: top10Vectors.map(vector => vector[featureIndex] || 0),
            backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
        }))
    };
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>优化N-gram TF-IDF分析报告</title>
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
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .section {
            margin-bottom: 40px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #fafafa;
        }
        .section h2 {
            color: #34495e;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature-item {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .feature-name {
            font-weight: bold;
            color: #2c3e50;
        }
        .feature-importance {
            color: #e74c3c;
            font-weight: bold;
        }
        .ngram-type {
            background-color: #3498db;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .hotel-analysis {
            margin: 20px 0;
        }
        .hotel-item {
            background-color: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #27ae60;
        }
        .hotel-name {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .hotel-stats {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .similarity-matrix {
            overflow-x: auto;
            margin: 20px 0;
        }
        .similarity-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8em;
        }
        .similarity-table th,
        .similarity-table td {
            border: 1px solid #ddd;
            padding: 4px;
            text-align: center;
        }
        .similarity-table th {
            background-color: #34495e;
            color: white;
        }
        .similarity-value {
            font-weight: bold;
        }
        .high-similarity { background-color: #d5f4e6; }
        .medium-similarity { background-color: #fef9e7; }
        .low-similarity { background-color: #fadbd8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏨 优化N-gram TF-IDF分析报告</h1>
        
        <div class="section">
            <h2>📊 分析概览</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${tfidfFeatures.vocabulary.length}</div>
                    <div class="stat-label">特征维度</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${hotelNames.length}</div>
                    <div class="stat-label">酒店数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${statistics.avgSimilarity.toFixed(4)}</div>
                    <div class="stat-label">平均相似度</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${statistics.maxSimilarity.toFixed(4)}</div>
                    <div class="stat-label">最高相似度</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📈 N-gram分布</h2>
            <div class="chart-container">
                <canvas id="ngramChart"></canvas>
            </div>
        </div>
        
        <div class="section">
            <h2>🏆 重要N-gram特征 (前20个)</h2>
            <div class="chart-container">
                <canvas id="featureChart"></canvas>
            </div>
            <div class="feature-list">
                ${top20Features.map((feature, index) => {
                    const ngramType = feature.ngram.split(' ').length === 1 ? '1-gram' : 
                                      feature.ngram.split(' ').length === 2 ? '2-gram' : '3-gram';
                    return `
                        <div class="feature-item">
                            <span class="feature-name">${index + 1}. ${feature.ngram}</span>
                            <span class="ngram-type">${ngramType}</span>
                            <div class="feature-importance">重要性: ${feature.importance.toFixed(4)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>📊 相似度分布</h2>
            <div class="chart-container">
                <canvas id="similarityChart"></canvas>
            </div>
        </div>
        
        <div class="section">
            <h2>🏨 前10家酒店分析</h2>
            <div class="hotel-analysis">
                ${top10Hotels.map((hotelName, index) => {
                    const vector = top10Vectors[index];
                    const nonZeroCount = vector.filter(v => v > 0).length;
                    const maxValue = Math.max(...vector);
                    const avgValue = vector.reduce((a, b) => a + b, 0) / vector.length;
                    return `
                        <div class="hotel-item">
                            <div class="hotel-name">${index + 1}. ${hotelName}</div>
                            <div class="hotel-stats">
                                非零特征: ${nonZeroCount}/${vector.length} | 
                                最大TF-IDF值: ${maxValue.toFixed(4)} | 
                                平均TF-IDF值: ${avgValue.toFixed(4)}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>🔍 前10家酒店相似度矩阵</h2>
            <div class="similarity-matrix">
                <table class="similarity-table">
                    <thead>
                        <tr>
                            <th>酒店</th>
                            ${top10Hotels.map((hotel, i) => `<th>${i + 1}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${top10Hotels.map((hotel, i) => `
                            <tr>
                                <td><strong>${i + 1}. ${hotel}</strong></td>
                                ${top10Hotels.map((_, j) => {
                                    const similarity = similarityMatrix[i][j];
                                    let className = '';
                                    if (similarity >= 0.8) className = 'high-similarity';
                                    else if (similarity >= 0.4) className = 'medium-similarity';
                                    else className = 'low-similarity';
                                    return `<td class="${className}"><span class="similarity-value">${similarity.toFixed(3)}</span></td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        // N-gram分布图表
        const ngramCtx = document.getElementById('ngramChart').getContext('2d');
        new Chart(ngramCtx, {
            type: 'doughnut',
            data: ${JSON.stringify(ngramTypeData)},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'N-gram类型分布'
                    }
                }
            }
        });
        
        // 重要特征图表
        const featureCtx = document.getElementById('featureChart').getContext('2d');
        new Chart(featureCtx, {
            type: 'bar',
            data: ${JSON.stringify(featureData)},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '前20个重要N-gram特征'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // 相似度分布图表
        const similarityCtx = document.getElementById('similarityChart').getContext('2d');
        new Chart(similarityCtx, {
            type: 'bar',
            data: ${JSON.stringify(similarityData)},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '相似度分布'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>
    `;
    
    const outputPath = path.join(__dirname, 'output', 'optimized_ngram_tfidf_report.html');
    fs.writeFileSync(outputPath, html);
    console.log(`✅ HTML报告已生成: ${outputPath}`);
}

/**
 * 主函数
 */
function main() {
    console.log('🔍 读取优化N-gram TF-IDF分析数据...');
    
    const dataPath = path.join(__dirname, 'output', 'optimized_ngram_tfidf.json');
    const data = readJSON(dataPath);
    
    if (!data) {
        console.error('❌ 无法读取分析数据');
        return;
    }
    
    console.log('📊 生成HTML可视化报告...');
    generateHTMLReport(data);
    
    console.log('✅ 可视化完成!');
}

// 运行主函数
main(); 