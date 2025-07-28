import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 停用词列表
const STOP_WORDS = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your',
    'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it',
    "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
    'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while',
    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
    "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn',
    "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn',
    "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"];

/**
 * 清理文本
 * @param {string} text - 输入文本
 * @returns {string} - 清理后的文本
 */
function cleanText(text) {
    return text.toLowerCase() // 转换为小写
        .replace(/[^\w\s]/g, ' ') // 移除标点符号
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim();
}

/**
 * 分词
 * @param {string} text - 输入文本
 * @returns {Array} - 分词结果
 */
function tokenize(text) {
    return text.split(/\s+/).filter(word => word.length > 0);
}

/**
 * 移除停用词
 * @param {Array} tokens - 分词结果
 * @returns {Array} - 移除停用词后的结果
 */
function removeStopWords(tokens) {
    return tokens.filter(token => !STOP_WORDS.includes(token.toLowerCase()));
}

/**
 * 生成N-Gram
 * @param {Array} tokens - 分词结果
 * @param {number} n - N-Gram的N值
 * @returns {Array} - N-Gram结果
 */
function generateNGrams(tokens, n) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
}

/**
 * 计算词频
 * @param {Array} items - 项目列表
 * @returns {Object} - 词频统计
 */
function countFrequency(items) {
    const frequency = {};
    items.forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
    });
    return frequency;
}

/**
 * 按频率排序
 * @param {Object} frequency - 词频对象
 * @returns {Array} - 排序后的结果
 */
function sortByFrequency(frequency) {
    return Object.entries(frequency)
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * 解析CSV行
 * @param {string} line - CSV行
 * @returns {Array} - 解析后的字段
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
    result.push(current.trim());
    return result;
}

/**
 * 读取CSV文件
 * @param {string} filePath - 文件路径
 * @returns {Array} - 解析后的数据
 */
function readCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            console.error('CSV文件格式错误或为空');
            return [];
        }
        
        const headers = parseCSVLine(lines[0]);
        const descIndex = headers.findIndex(header => header.trim().toLowerCase() === 'desc');
        
        if (descIndex === -1) {
            console.error('未找到desc列');
            return [];
        }
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values[descIndex]) {
                data.push({ desc: values[descIndex].trim() });
            }
        }
        
        return data;
    } catch (error) {
        console.error('读取CSV文件时出错:', error);
        return [];
    }
}

/**
 * 计算TF-IDF
 * @param {Array} documents - 文档列表
 * @returns {Object} - TF-IDF结果
 */
function calculateTFIDF(documents) {
    const tfidf = {
        documents: [],
        vocabulary: new Set(),
        word_doc_freq: {}, // 每个词出现在多少个文档中
        tfidf_matrix: []
    };
    
    // 第一步：预处理所有文档，构建词汇表
    documents.forEach((doc, docIndex) => {
        const cleanedText = cleanText(doc.desc);
        const tokens = tokenize(cleanedText);
        const filteredTokens = removeStopWords(tokens);
        
        // 添加到词汇表
        filteredTokens.forEach(token => {
            tfidf.vocabulary.add(token);
        });
        
        // 计算词频
        const wordFreq = {};
        filteredTokens.forEach(token => {
            wordFreq[token] = (wordFreq[token] || 0) + 1;
        });
        
        tfidf.documents.push({
            original: doc.desc,
            processed: filteredTokens,
            wordFreq: wordFreq,
            totalWords: filteredTokens.length
        });
    });
    
    // 第二步：计算每个词出现在多少个文档中
    tfidf.vocabulary.forEach(word => {
        let docCount = 0;
        tfidf.documents.forEach(doc => {
            if (doc.wordFreq[word]) {
                docCount++;
            }
        });
        tfidf.word_doc_freq[word] = docCount;
    });
    
    // 第三步：计算TF-IDF值
    const N = tfidf.documents.length; // 总文档数
    
    tfidf.documents.forEach((doc, docIndex) => {
        const docTFIDF = {};
        
        tfidf.vocabulary.forEach(word => {
            if (doc.wordFreq[word]) {
                // TF: 词在文档中的频率
                const tf = doc.wordFreq[word] / doc.totalWords;
                
                // IDF: 逆文档频率
                const idf = Math.log(N / tfidf.word_doc_freq[word]);
                
                // TF-IDF值
                docTFIDF[word] = tf * idf;
            } else {
                docTFIDF[word] = 0;
            }
        });
        
        tfidf.tfidf_matrix.push(docTFIDF);
    });
    
    return tfidf;
}

/**
 * 获取TF-IDF特征向量
 * @param {Object} tfidf - TF-IDF对象
 * @returns {Object} - 特征向量结果
 */
function getTFIDFFeatures(tfidf) {
    const features = {
        vocabulary: Array.from(tfidf.vocabulary),
        top_words_by_tfidf: [],
        document_features: []
    };
    
    // 计算每个词的总体TF-IDF重要性
    const wordImportance = {};
    tfidf.vocabulary.forEach(word => {
        let totalTFIDF = 0;
        tfidf.tfidf_matrix.forEach(docTFIDF => {
            totalTFIDF += docTFIDF[word];
        });
        wordImportance[word] = totalTFIDF;
    });
    
    // 按TF-IDF重要性排序
            features.top_words_by_tfidf = Object.entries(wordImportance)
            .map(([word, importance]) => ({ word, importance }))
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 100); // 取前100个最重要的词
    
    // 为每个文档生成特征向量
    tfidf.documents.forEach((doc, docIndex) => {
        const featureVector = features.vocabulary.map(word => 
            tfidf.tfidf_matrix[docIndex][word]
        );
        
        features.document_features.push({
            docIndex: docIndex,
            originalText: doc.original,
            featureVector: featureVector,
            topWords: Object.entries(doc.wordFreq)
                .map(([word, freq]) => ({ word, freq }))
                .sort((a, b) => b.freq - a.freq)
                .slice(0, 10) // 每个文档的前10个词
        });
    });
    
    return features;
}

/**
 * 分析N-Gram和TF-IDF
 */
function analyzeNGrams() {
    console.log('开始N-Gram和TF-IDF分析...\n');
    
    // 读取修复后的CSV文件
    const csvPath = path.join(__dirname, 'input', 'Seattle_Hotels.csv');
    const data = readCSV(csvPath);
    
    if (data.length === 0) {
        console.error('无法读取数据文件');
        return;
    }
    
    console.log(`📊 读取了 ${data.length} 条酒店描述数据`);
    
    // 合并所有文本用于N-Gram分析
    const allText = data.map(item => item.desc).join(' ');
    const cleanedText = cleanText(allText);
    const tokens = tokenize(cleanedText);
    const filteredTokens = removeStopWords(tokens);
    
    console.log(`📝 文本预处理完成:`);
    console.log(`   - 原始文本长度: ${allText.length} 字符`);
    console.log(`   - 清理后文本长度: ${cleanedText.length} 字符`);
    console.log(`   - 分词数量: ${tokens.length} 个`);
    console.log(`   - 去停用词后: ${filteredTokens.length} 个`);
    
    // 生成N-Gram
    const unigrams = generateNGrams(filteredTokens, 1);
    const bigrams = generateNGrams(filteredTokens, 2);
    const trigrams = generateNGrams(filteredTokens, 3);
    
    // 计算词频
    const unigramFreq = countFrequency(unigrams);
    const bigramFreq = countFrequency(bigrams);
    const trigramFreq = countFrequency(trigrams);
    
    // 排序
    const sortedUnigrams = sortByFrequency(unigramFreq);
    const sortedBigrams = sortByFrequency(bigramFreq);
    const sortedTrigrams = sortByFrequency(trigramFreq);
    
    // 计算TF-IDF
    console.log('\n🔍 开始TF-IDF特征提取...');
    const tfidf = calculateTFIDF(data);
    const features = getTFIDFFeatures(tfidf);
    
    console.log(`📈 TF-IDF分析完成:`);
    console.log(`   - 词汇表大小: ${tfidf.vocabulary.size} 个词`);
    console.log(`   - 文档数量: ${tfidf.documents.length} 个`);
    console.log(`   - 特征向量维度: ${features.vocabulary.length} 维`);
    
    // 创建输出目录
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存N-Gram结果
    const wordMatrix = {
        total_words: filteredTokens.length,
        unique_words: Object.keys(unigramFreq).length,
        top_50: sortedUnigrams.slice(0, 50),
        top_15: sortedUnigrams.slice(0, 15)
    };
    
    const gram1Result = {
        total_ngrams: unigrams.length,
        top_20: sortedUnigrams.slice(0, 20)
    };
    
    const gram2Result = {
        total_ngrams: bigrams.length,
        top_20: sortedBigrams.slice(0, 20)
    };
    
    const gram3Result = {
        total_ngrams: trigrams.length,
        top_20: sortedTrigrams.slice(0, 20)
    };
    
    // 保存TF-IDF结果
    const tfidfResult = {
        vocabulary_size: tfidf.vocabulary.size,
        document_count: tfidf.documents.length,
        top_words_by_tfidf: features.top_words_by_tfidf,
        document_features: features.document_features.map(doc => ({
            docIndex: doc.docIndex,
            topWords: doc.topWords,
            featureVectorLength: doc.featureVector.length
        })),
        sample_document_features: features.document_features.slice(0, 5).map(doc => ({
            docIndex: doc.docIndex,
            originalText: doc.originalText.substring(0, 100) + '...',
            topWords: doc.topWords,
            featureVectorSample: doc.featureVector.slice(0, 10)
        }))
    };
    
    // 写入文件
    fs.writeFileSync(path.join(outputDir, 'word_frequency_matrix.json'), JSON.stringify(wordMatrix, null, 2));
    fs.writeFileSync(path.join(outputDir, '1gram_frequency.json'), JSON.stringify(gram1Result, null, 2));
    fs.writeFileSync(path.join(outputDir, '2gram_frequency.json'), JSON.stringify(gram2Result, null, 2));
    fs.writeFileSync(path.join(outputDir, '3gram_frequency.json'), JSON.stringify(gram3Result, null, 2));
    fs.writeFileSync(path.join(outputDir, 'tfidf_features.json'), JSON.stringify(tfidfResult, null, 2));
    
    console.log('\n✅ 分析完成！结果已保存到output目录:');
    console.log(`   📄 word_frequency_matrix.json - 词频矩阵`);
    console.log(`   📄 1gram_frequency.json - 1-Gram分析`);
    console.log(`   📄 2gram_frequency.json - 2-Gram分析`);
    console.log(`   📄 3gram_frequency.json - 3-Gram分析`);
    console.log(`   📄 tfidf_features.json - TF-IDF特征提取`);
    
    console.log('\n📊 关键统计:');
    console.log(`   - 总单词数: ${wordMatrix.total_words}`);
    console.log(`   - 唯一单词数: ${wordMatrix.unique_words}`);
    console.log(`   - 1-Gram总数: ${gram1Result.total_ngrams}`);
    console.log(`   - 2-Gram总数: ${gram2Result.total_ngrams}`);
    console.log(`   - 3-Gram总数: ${gram3Result.total_ngrams}`);
    console.log(`   - TF-IDF词汇表大小: ${tfidfResult.vocabulary_size}`);
    
    console.log('\n🔍 主要发现:');
    console.log(`   - 最常见单词: "${wordMatrix.top_50[0].item}" (${wordMatrix.top_50[0].count}次)`);
    console.log(`   - 最常见2-Gram: "${gram2Result.top_20[0].item}" (${gram2Result.top_20[0].count}次)`);
    console.log(`   - 最常见3-Gram: "${gram3Result.top_20[0].item}" (${gram3Result.top_20[0].count}次)`);
    console.log(`   - TF-IDF最重要词: "${features.top_words_by_tfidf[0].word}" (重要性: ${features.top_words_by_tfidf[0].importance.toFixed(4)})`);
}

// 运行分析
analyzeNGrams();

export { cleanText, tokenize, removeStopWords, generateNGrams, countFrequency, sortByFrequency, calculateTFIDF, getTFIDFFeatures }; 