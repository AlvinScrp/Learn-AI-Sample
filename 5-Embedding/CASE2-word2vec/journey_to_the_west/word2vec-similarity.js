import fs from 'fs';
import path from 'path';
import nodejieba from 'nodejieba';
import word2vec from 'word2vec';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Word2VecSimilarity {
    constructor() {
        this.model = null;
        this.sentences = [];
    }

    // Step1: 使用jieba进行中文分词
    segmentText(text) {
        // 按句号、感叹号、问号分句
        const sentences = text.split(/[。！？]/);
        const segmentedSentences = [];
        
        for (const sentence of sentences) {
            if (sentence.trim()) {
                const words = nodejieba.cut(sentence.trim());
                // 过滤掉长度小于2的词和标点符号
                const filteredWords = words.filter(word => 
                    word.length >= 2 && !/[，、：；""''（）《》【】\s]/.test(word)
                );
                if (filteredWords.length > 0) {
                    segmentedSentences.push(filteredWords);
                }
            }
        }
        
        return segmentedSentences;
    }

    // Step2: 将训练语料转化成sentence的迭代器
    prepareSentences(filePath) {
        const text = fs.readFileSync(filePath, 'utf-8');
        this.sentences = this.segmentText(text);
        console.log(`总共处理了 ${this.sentences.length} 个句子`);
        return this.sentences;
    }

    // Step3: 使用word2vec进行训练
    async trainWord2Vec() {
        return new Promise((resolve, reject) => {
            // 创建output目录
            const outputDir = path.join(__dirname, 'output');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 创建临时文件存储分词结果
            const tempFile = path.join(outputDir, 'temp_sentences.txt');
            const sentencesText = this.sentences.map(sentence => sentence.join(' ')).join('\n');
            fs.writeFileSync(tempFile, sentencesText);

            // 训练word2vec模型，输出到output目录
            const modelPath = path.join(outputDir, 'model.txt');
            word2vec.word2vec(tempFile, modelPath, {
                size: 128,        // 向量维度
                window: 5,        // 窗口大小
                sample: 1e-4,     // 采样阈值
                hs: 1,           // 使用hierarchical softmax
                negative: 5,      // negative sampling
                threads: 4,       // 线程数
                iter: 5,         // 迭代次数
                minCount: 5      // 最小词频
            }, (error) => {
                // 清理临时文件
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }

                if (error) {
                    reject(error);
                } else {
                    this.loadModel();
                    resolve();
                }
            });
        });
    }

    // 加载训练好的模型
    async loadModel() {
        const modelPath = path.join(__dirname, 'output', 'model.txt');
        if (fs.existsSync(modelPath)) {
            return new Promise((resolve, reject) => {
                word2vec.loadModel(modelPath, (error, model) => {
                    if (error) {
                        console.error('加载模型失败:', error);
                        reject(error);
                    } else {
                        this.model = model;
                        console.log('模型加载成功');
                        resolve(model);
                    }
                });
            });
        }
    }

    // Step4: 计算两个单词的相似度
    async calculateSimilarity(word1, word2) {
        if (!this.model) {
            throw new Error('模型未加载');
        }

        try {
            // 读取模型文件并解析
            const modelPath = path.join(__dirname, 'output', 'model.txt');
            const modelContent = fs.readFileSync(modelPath, 'utf-8');
            const lines = modelContent.trim().split('\n');
            
            // 解析词向量
            const vectors = {};
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(' ');
                const word = parts[0];
                const vector = parts.slice(1).map(x => parseFloat(x));
                vectors[word] = vector;
            }

            // 计算余弦相似度
            const vec1 = vectors[word1];
            const vec2 = vectors[word2];
            
            if (!vec1 || !vec2) {
                throw new Error(`词 "${word1}" 或 "${word2}" 不在词汇表中`);
            }

            // 计算余弦相似度
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            
            for (let i = 0; i < vec1.length; i++) {
                if (isNaN(vec1[i]) || isNaN(vec2[i])) {
                    continue;
                }
                dotProduct += vec1[i] * vec2[i];
                norm1 += vec1[i] * vec1[i];
                norm2 += vec2[i] * vec2[i];
            }
            
            if (norm1 === 0 || norm2 === 0) {
                return 0;
            }
            
            const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
            return isNaN(similarity) ? 0 : similarity;
        } catch (error) {
            throw error;
        }
    }

    // 获取与指定词最相似的词
    async getMostSimilar(word, topN = 10) {
        if (!this.model) {
            throw new Error('模型未加载');
        }

        try {
            // 读取模型文件并解析
            const modelPath = path.join(__dirname, 'output', 'model.txt');
            const modelContent = fs.readFileSync(modelPath, 'utf-8');
            const lines = modelContent.trim().split('\n');
            
            // 解析词向量
            const vectors = {};
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(' ');
                const wordName = parts[0];
                const vector = parts.slice(1).map(x => parseFloat(x));
                vectors[wordName] = vector;
            }

            const targetVector = vectors[word];
            if (!targetVector) {
                throw new Error(`词 "${word}" 不在词汇表中`);
            }

            // 计算与所有其他词的相似度
            const similarities = [];
            for (const [otherWord, otherVector] of Object.entries(vectors)) {
                if (otherWord === word) continue;
                
                // 计算余弦相似度
                let dotProduct = 0;
                let norm1 = 0;
                let norm2 = 0;
                
                for (let i = 0; i < targetVector.length; i++) {
                    if (isNaN(targetVector[i]) || isNaN(otherVector[i])) {
                        continue;
                    }
                    dotProduct += targetVector[i] * otherVector[i];
                    norm1 += targetVector[i] * targetVector[i];
                    norm2 += otherVector[i] * otherVector[i];
                }
                
                if (norm1 === 0 || norm2 === 0) {
                    continue;
                }
                
                const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
                if (!isNaN(similarity)) {
                    similarities.push({ word: otherWord, dist: similarity });
                }
            }

            // 按相似度排序并返回前N个
            similarities.sort((a, b) => b.dist - a.dist);
            return similarities.slice(0, topN);
        } catch (error) {
            throw error;
        }
    }

    // 运行完整流程
    async run() {
        try {
            console.log('开始处理西游记文本...');
            
            // 创建output目录
            const outputDir = path.join(__dirname, 'output');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log('创建output目录');
            }

            // 检查模型文件是否已存在
            const modelPath = path.join(outputDir, 'model.txt');
            const trainingDataPath = path.join(outputDir, 'training_data.txt');
            
            if (fs.existsSync(modelPath)) {
                console.log('发现已存在的模型文件，跳过训练步骤');
                // 直接加载现有模型
                await this.loadModel();
            } else {
                // 检查是否已有训练数据
                if (fs.existsSync(trainingDataPath)) {
                    console.log('发现已存在的训练数据，使用现有数据进行训练');
                    // 读取现有训练数据
                    const trainingData = fs.readFileSync(trainingDataPath, 'utf-8');
                    this.sentences = trainingData.split('\n').map(line => line.split(' ').filter(word => word.length > 0));
                    console.log(`从现有数据加载了 ${this.sentences.length} 个句子`);
                } else {
                    console.log('开始分词处理...');
                    // Step1 & Step2: 读取文件并分词
                    const inputFile = path.join(__dirname, 'input', 'journey_to_the_west.txt');
                    this.prepareSentences(inputFile);
                    
                    // 保存训练数据以便下次使用
                    const sentencesText = this.sentences.map(sentence => sentence.join(' ')).join('\n');
                    fs.writeFileSync(trainingDataPath, sentencesText, 'utf-8');
                    console.log(`训练数据已保存到: ${trainingDataPath}`);
                }

                // Step3: 训练word2vec模型
                console.log('开始训练word2vec模型...');
                await this.trainWord2Vec();
                console.log('模型训练完成');

                // 加载模型
                await this.loadModel();
            }

            // Step4: 计算人物相似度
            console.log('\n计算人物相似度:');
            
            try {
                const similarity1 = await this.calculateSimilarity('孙悟空', '猪八戒');
                console.log(`孙悟空 与 猪八戒 的相似度: ${similarity1.toFixed(4)}`);
            } catch (error) {
                console.log('孙悟空与猪八戒的相似度计算失败:', error.message);
            }

            try {
              const similarity1 = await this.calculateSimilarity('呆子', '猪八戒');
              console.log(`呆子 与 猪八戒 的相似度: ${similarity1.toFixed(4)}`);
          } catch (error) {
              console.log('呆子与猪八戒的相似度计算失败:', error.message);
          }
          try {
            const similarity1 = await this.calculateSimilarity('猪悟能', '猪八戒');
            console.log(`猪悟能 与 猪八戒 的相似度: ${similarity1.toFixed(4)}`);
        } catch (error) {
            console.log('猪悟能与猪八戒的相似度计算失败:', error.message);
        }

            try {
                const similarity2 = await this.calculateSimilarity('孙悟空', '孙行者');
                console.log(`孙悟空 与 孙行者 的相似度: ${similarity2.toFixed(4)}`);
            } catch (error) {
                console.log('孙悟空与孙行者的相似度计算失败:', error.message);
            }

            // 查找与孙悟空最相似的词
            try {
                const similar = await this.getMostSimilar('孙悟空', 5);
                console.log('\n与孙悟空最相似的词:');
                similar.forEach((item, index) => {
                    console.log(`${index + 1}. ${item.word} (相似度: ${item.dist.toFixed(4)})`);
                });
            } catch (error) {
                console.log('查找相似词失败:', error.message);
            }

        } catch (error) {
            console.error('处理过程中出现错误:', error);
        }
    }
}

// 运行程序
const word2vecSim = new Word2VecSimilarity();
word2vecSim.run();