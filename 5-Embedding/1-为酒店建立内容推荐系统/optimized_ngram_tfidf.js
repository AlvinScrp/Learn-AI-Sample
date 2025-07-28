import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 正确解析CSV行，处理包含逗号的字段
 * @param {string} line - CSV行
 * @returns {Array} - 解析后的字段数组
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // 添加最后一个字段
    result.push(current.trim());
    return result;
}

/**
 * 生成N-gram
 * @param {Array} tokens - 词汇列表
 * @param {number} n - N-gram的n值
 * @returns {Array} - N-gram列表
 */
function generateNGrams(tokens, n) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
}

/**
 * 计算TF-IDF特征
 * @param {Array} hotelData - 酒店数据
 * @param {number} maxFeatures - 最大特征数
 * @returns {Object} - TF-IDF特征
 */
function calculateTFIDFFeatures(hotelData, maxFeatures = 100) {
    console.log('🔍 计算TF-IDF特征 (1-3gram)...');
    
    // 1. 文本预处理和N-gram生成
    const allNGrams = {};
    const hotelNGrams = [];
    
    hotelData.forEach((hotel, hotelIndex) => {
        const text = hotel.desc.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const tokens = text.split(' ').filter(token => token.length > 0);
        
        // 生成1-gram, 2-gram, 3-gram
        const hotelNGramData = {
            hotelIndex,
            hotelName: hotel.name,
            unigrams: tokens,
            bigrams: generateNGrams(tokens, 2),
            trigrams: generateNGrams(tokens, 3),
            allNGrams: []
        };
        
        // 合并所有N-gram
        hotelNGramData.allNGrams = [
            ...hotelNGramData.unigrams,
            ...hotelNGramData.bigrams,
            ...hotelNGramData.trigrams
        ];
        
        // 统计N-gram频率
        hotelNGramData.allNGrams.forEach(ngram => {
            allNGrams[ngram] = (allNGrams[ngram] || 0) + 1;
        });
        
        hotelNGrams.push(hotelNGramData);
    });
    
    console.log(`📊 N-gram统计:`);
    console.log(`   - 1-gram数量: ${Object.keys(allNGrams).filter(k => !k.includes(' ')).length}`);
    console.log(`   - 2-gram数量: ${Object.keys(allNGrams).filter(k => k.split(' ').length === 2).length}`);
    console.log(`   - 3-gram数量: ${Object.keys(allNGrams).filter(k => k.split(' ').length === 3).length}`);
    console.log(`   - 总N-gram数量: ${Object.keys(allNGrams).length}`);
    
    // 2. 计算文档频率 (DF)
    const docFreq = {};
    const numHotels = hotelData.length;
    
    console.log('📊 计算文档频率...');
    const allNGramKeys = Object.keys(allNGrams);
    allNGramKeys.forEach((ngram, index) => {
        if (index % 1000 === 0) {
            console.log(`   处理进度: ${index}/${allNGramKeys.length}`);
        }
        let count = 0;
        hotelNGrams.forEach(hotel => {
            if (hotel.allNGrams.includes(ngram)) {
                count++;
            }
        });
        docFreq[ngram] = count;
    });
    
    // 3. 计算TF-IDF重要性分数
    const wordImportance = {};
    const totalNGrams = Object.values(allNGrams).reduce((a, b) => a + b, 0);
    
    console.log('📊 计算TF-IDF重要性分数...');
    allNGramKeys.forEach((ngram, index) => {
        if (index % 1000 === 0) {
            console.log(`   处理进度: ${index}/${allNGramKeys.length}`);
        }
        const tf = allNGrams[ngram] / totalNGrams;
        const idf = Math.log(numHotels / (1 + docFreq[ngram]));
        const tfidf = tf * idf;
        wordImportance[ngram] = tfidf;
    });
    
    // 4. 选择最重要的特征
    const topFeatures = Object.entries(wordImportance)
        .map(([ngram, importance]) => ({ ngram, importance }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, maxFeatures);
    
    console.log(`✅ 选择了 ${topFeatures.length} 个最重要的N-gram特征`);
    
    // 5. 为每个酒店生成TF-IDF向量
    const vocabulary = topFeatures.map(f => f.ngram);
    const tfidfVectors = [];
    const hotelNames = [];
    
    console.log('📊 生成TF-IDF向量...');
    hotelNGrams.forEach((hotel, hotelIndex) => {
        if (hotelIndex % 10 === 0) {
            console.log(`   处理酒店: ${hotelIndex + 1}/${hotelNGrams.length}`);
        }
        
        hotelNames.push(hotel.hotelName);
        
        const vector = new Array(vocabulary.length).fill(0);
        
        // 创建N-gram频率映射以提高效率
        const hotelNGramFreq = {};
        hotel.allNGrams.forEach(ngram => {
            hotelNGramFreq[ngram] = (hotelNGramFreq[ngram] || 0) + 1;
        });
        
        vocabulary.forEach((ngram, index) => {
            // 计算该酒店中该N-gram的TF
            const ngramCount = hotelNGramFreq[ngram] || 0;
            const totalNGrams = hotel.allNGrams.length;
            
            if (ngramCount > 0) {
                const tf = ngramCount / totalNGrams;
                const idf = Math.log(numHotels / (1 + docFreq[ngram]));
                vector[index] = tf * idf;
            }
        });
        
        tfidfVectors.push(vector);
    });
    
    return {
        vocabulary,
        tfidfVectors,
        hotelNames,
        topFeatures,
        docFreq,
        allNGrams: Object.keys(allNGrams).length,
        unigramCount: Object.keys(allNGrams).filter(k => !k.includes(' ')).length,
        bigramCount: Object.keys(allNGrams).filter(k => k.split(' ').length === 2).length,
        trigramCount: Object.keys(allNGrams).filter(k => k.split(' ').length === 3).length
    };
}

/**
 * 计算余弦相似度
 * @param {Array} vectorA - 向量A
 * @param {Array} vectorB - 向量B
 * @returns {number} - 余弦相似度
 */
function cosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 计算相似度矩阵
 * @param {Array} tfidfVectors - TF-IDF向量数组
 * @returns {Array} - 相似度矩阵
 */
function calculateSimilarityMatrix(tfidfVectors) {
    const numHotels = tfidfVectors.length;
    const similarityMatrix = [];
    
    for (let i = 0; i < numHotels; i++) {
        similarityMatrix[i] = [];
        for (let j = 0; j < numHotels; j++) {
            if (i === j) {
                similarityMatrix[i][j] = 1.0;
            } else {
                similarityMatrix[i][j] = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
            }
        }
    }
    
    return similarityMatrix;
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始优化TF-IDF分析 (1-3gram)...\n');
    
    // 读取修复后的CSV文件
    const csvPath = path.join(__dirname, 'input', 'Seattle_Hotels.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 读取CSV文件: ${lines.length - 1} 家酒店`);
    
    // 解析CSV数据
    const hotelData = [];
    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length >= 3) {
            hotelData.push({
                name: fields[0],
                address: fields[1],
                desc: fields[2]
            });
        }
    }
    
    console.log(`✅ 成功解析 ${hotelData.length} 家酒店数据\n`);
    
    // 计算TF-IDF特征 (1-3gram)
    const tfidfFeatures = calculateTFIDFFeatures(hotelData, 100);
    
    console.log('\n📊 TF-IDF特征统计:');
    console.log(`   - 词汇表大小: ${tfidfFeatures.vocabulary.length}`);
    console.log(`   - 1-gram数量: ${tfidfFeatures.unigramCount}`);
    console.log(`   - 2-gram数量: ${tfidfFeatures.bigramCount}`);
    console.log(`   - 3-gram数量: ${tfidfFeatures.trigramCount}`);
    // console.log(`   - 总N-gram数量: ${tfidfFeatures.allNGrams}`);

    console.log("--------------------------------");
    
    // 计算相似度矩阵
    console.log('\n🔍 计算余弦相似度矩阵...');
    const similarityMatrix = calculateSimilarityMatrix(tfidfFeatures.tfidfVectors);
    
    // 统计相似度
    let maxSimilarity = 0;
    let minSimilarity = 1;
    let totalSimilarity = 0;
    let count = 0;
    
    for (let i = 0; i < similarityMatrix.length; i++) {
        for (let j = i + 1; j < similarityMatrix.length; j++) {
            const similarity = similarityMatrix[i][j];
            maxSimilarity = Math.max(maxSimilarity, similarity);
            minSimilarity = Math.min(minSimilarity, similarity);
            totalSimilarity += similarity;
            count++;
        }
    }
    
    const avgSimilarity = totalSimilarity / count;
    
    console.log('\n📈 相似度统计:');
    console.log(`   - 最高相似度: ${maxSimilarity.toFixed(4)}`);
    console.log(`   - 最低相似度: ${minSimilarity.toFixed(4)}`);
    console.log(`   - 平均相似度: ${avgSimilarity.toFixed(4)}`);
    console.log(`   - 矩阵大小: ${similarityMatrix.length} × ${similarityMatrix.length}`);
    
    // 保存结果
    const outputData = {
        tfidfFeatures,
        similarityMatrix,
        statistics: {
            maxSimilarity,
            minSimilarity,
            avgSimilarity,
            matrixSize: similarityMatrix.length
        },
        topFeatures: tfidfFeatures.topFeatures.slice(0, 50), // 保存前50个重要特征
        hotelNames: tfidfFeatures.hotelNames
    };
    
    const outputPath = path.join(__dirname, 'output', 'optimized_ngram_tfidf.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`\n✅ 优化TF-IDF分析完成!`);
    console.log(`📄 结果已保存到: ${outputPath}`);
    
    // 显示前10个重要N-gram特征
    console.log('\n🏆 前10个最重要的N-gram特征:');
    tfidfFeatures.topFeatures.slice(0, 10).forEach((feature, index) => {
        const ngramType = feature.ngram.split(' ').length === 1 ? '1-gram' : 
                          feature.ngram.split(' ').length === 2 ? '2-gram' : '3-gram';
        console.log(`   ${index + 1}. ${feature.ngram} (${ngramType}) - 重要性: ${feature.importance.toFixed(4)}`);
    });
    
    // 显示前5家酒店的TF-IDF向量示例
    console.log('\n🏨 前5家酒店的TF-IDF向量示例:');
    for (let i = 0; i < Math.min(5, tfidfFeatures.hotelNames.length); i++) {
        const hotelName = tfidfFeatures.hotelNames[i];
        const vector = tfidfFeatures.tfidfVectors[i];
        const nonZeroCount = vector.filter(v => v > 0).length;
        const maxValue = Math.max(...vector);
        
        console.log(`   ${i + 1}. ${hotelName}`);
        console.log(`      非零特征: ${nonZeroCount}/${vector.length}`);
        console.log(`      最大TF-IDF值: ${maxValue.toFixed(4)}`);
        console.log(`      平均TF-IDF值: ${(vector.reduce((a, b) => a + b, 0) / vector.length).toFixed(4)}`);
    }
}

// 运行主函数
main(); 