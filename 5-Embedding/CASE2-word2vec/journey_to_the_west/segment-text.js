import fs from 'fs';
import path from 'path';
import nodejieba from 'nodejieba';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextSegmenter {
    constructor() {
        this.segmentedTexts = [];
    }

    // 使用nodejieba进行中文分词
    segmentText(text) {
        // 按句号、感叹号、问号分句
        const sentences = text.split(/[。！？]/);
        const segmentedSentences = [];
        
        console.log(`开始分词处理，共 ${sentences.length} 个句子...`);
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            if (sentence.trim()) {
                const words = nodejieba.cut(sentence.trim());
                // 过滤掉长度小于2的词和标点符号
                const filteredWords = words.filter(word => 
                    word.length >= 2 && !/[，、：；""''（）《》【】\s]/.test(word)
                );
                
                if (filteredWords.length > 0) {
                    segmentedSentences.push({
                        original: sentence.trim(),
                        words: filteredWords,
                        wordCount: filteredWords.length
                    });
                }
            }
            
            // 每处理1000个句子显示进度
            if ((i + 1) % 1000 === 0) {
                console.log(`已处理 ${i + 1} 个句子...`);
            }
        }
        
        this.segmentedTexts = segmentedSentences;
        return segmentedSentences;
    }

    // 输出分词结果到文件
    outputSegmentedText(outputPath) {
        if (this.segmentedTexts.length === 0) {
            console.log('没有分词数据可输出');
            return;
        }

        let output = '';
        output += `分词统计信息:\n`;
        output += `总句子数: ${this.segmentedTexts.length}\n`;
        output += `总词数: ${this.segmentedTexts.reduce((sum, item) => sum + item.wordCount, 0)}\n`;
        output += `平均每句词数: ${(this.segmentedTexts.reduce((sum, item) => sum + item.wordCount, 0) / this.segmentedTexts.length).toFixed(2)}\n\n`;
        
        output += `详细分词结果:\n`;
        output += `${'='.repeat(80)}\n\n`;

        this.segmentedTexts.forEach((item, index) => {
            output += `句子 ${index + 1}:\n`;
            output += `原文: ${item.original}\n`;
            output += `分词: ${item.words.join(' / ')}\n`;
            output += `词数: ${item.wordCount}\n`;
            output += `-`.repeat(60) + '\n\n';
        });

        // 统计词频
        const wordFreq = {};
        this.segmentedTexts.forEach(item => {
            item.words.forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });
        });

        // 按词频排序，取前50个高频词
        const sortedWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);

        output += `\n高频词汇 (前50个):\n`;
        output += `${'='.repeat(80)}\n`;
        sortedWords.forEach(([word, freq], index) => {
            output += `${(index + 1).toString().padStart(2)}. ${word.padEnd(8)} : ${freq}次\n`;
        });

        fs.writeFileSync(outputPath, output, 'utf-8');
        console.log(`分词结果已输出到: ${outputPath}`);
        console.log(`总计处理 ${this.segmentedTexts.length} 个句子`);
        console.log(`总词数: ${this.segmentedTexts.reduce((sum, item) => sum + item.wordCount, 0)}`);
        console.log(`唯一词汇数: ${Object.keys(wordFreq).length}`);
    }

    // 输出简化的分词结果（仅分词，用于word2vec训练）
    outputForTraining(outputPath) {
        if (this.segmentedTexts.length === 0) {
            console.log('没有分词数据可输出');
            return;
        }

        const trainingData = this.segmentedTexts.map(item => item.words.join(' ')).join('\n');
        fs.writeFileSync(outputPath, trainingData, 'utf-8');
        console.log(`训练数据已输出到: ${outputPath}`);
    }

    // 运行分词程序
    run() {
        try {
            console.log('开始处理西游记文本分词...');
            
            // 创建output目录
            const outputDir = path.join(__dirname, 'output');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log('创建output目录');
            }
            
            // 读取文件
            const inputFile = path.join(__dirname, 'input', 'journey_to_the_west.txt');
            const text = fs.readFileSync(inputFile, 'utf-8');
            console.log(`文件读取成功，文本长度: ${text.length} 字符`);

            // 进行分词
            this.segmentText(text);

            // 输出详细分词结果到output文件夹
            const outputPath = path.join(outputDir, 'segmented_output.txt');
            this.outputSegmentedText(outputPath);

            // 输出训练数据格式到output文件夹
            const trainingPath = path.join(outputDir, 'training_data.txt');
            this.outputForTraining(trainingPath);

            console.log('\n分词处理完成！');

        } catch (error) {
            console.error('分词处理过程中出现错误:', error);
        }
    }
}

// 运行分词程序
const segmenter = new TextSegmenter();
segmenter.run();