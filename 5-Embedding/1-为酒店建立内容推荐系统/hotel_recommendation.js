import fs from 'fs';
import csv from 'csv-parser';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

class HotelRecommendationSystem {
    constructor() {
        this.hotels = [];
        this.tfidfData = null;
    }

    async loadData() {
        await this.loadHotels();
        await this.loadTFIDFData();
    }

    loadHotels() {
        return new Promise((resolve, reject) => {
            this.hotels = [];
            fs.createReadStream('/Users/canglong/Documents/vscode_project/Learn-AI-Sample/5-Embedding/CASE1-为酒店建立内容推荐系统/input/Seattle_Hotels.csv')
                .pipe(csv())
                .on('data', (row) => {
                    this.hotels.push({
                        name: row.name,
                        address: row.address,
                        desc: row.desc
                    });
                })
                .on('end', () => {
                    console.log(`已加载 ${this.hotels.length} 家酒店数据`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    async loadTFIDFData() {
        try {
            const data = fs.readFileSync('/Users/canglong/Documents/vscode_project/Learn-AI-Sample/5-Embedding/CASE1-为酒店建立内容推荐系统/output/optimized_ngram_tfidf.json', 'utf8');
            this.tfidfData = JSON.parse(data);
            console.log(`已加载TF-IDF数据，词汇表大小: ${this.tfidfData.tfidfFeatures.vocabulary.length}`);
            console.log(`TF-IDF向量数量: ${this.tfidfData.tfidfFeatures.tfidfVectors.length}`);
        } catch (error) {
            console.error('加载TF-IDF数据失败:', error);
        }
    }

    cosineSimilarity(vectorA, vectorB) {
        if (vectorA.length !== vectorB.length) {
            throw new Error('向量长度不匹配');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    findHotelIndex(hotelName) {
        const normalizedName = hotelName.toLowerCase().trim();
        
        for (let i = 0; i < this.tfidfData.hotelNames.length; i++) {
            const tfidfHotelName = this.tfidfData.hotelNames[i].toLowerCase().trim();
            if (tfidfHotelName.includes(normalizedName) || normalizedName.includes(tfidfHotelName)) {
                return i;
            }
        }
        
        console.log(`未找到酒店: ${hotelName}`);
        console.log('可用的酒店列表:');
        this.tfidfData.hotelNames.forEach((name, index) => {
            console.log(`${index + 1}. ${name}`);
        });
        return -1;
    }

    recommendHotels(inputHotelName, topK = 10) {
        const targetIndex = this.findHotelIndex(inputHotelName);
        
        if (targetIndex === -1) {
            return [];
        }

        const targetVector = this.tfidfData.tfidfFeatures.tfidfVectors[targetIndex];
        const similarities = [];

        for (let i = 0; i < this.tfidfData.tfidfFeatures.tfidfVectors.length; i++) {
            if (i !== targetIndex) {
                const similarity = this.cosineSimilarity(targetVector, this.tfidfData.tfidfFeatures.tfidfVectors[i]);
                similarities.push({
                    index: i,
                    hotelName: this.tfidfData.hotelNames[i],
                    similarity: similarity
                });
            }
        }

        similarities.sort((a, b) => b.similarity - a.similarity);
        
        return similarities.slice(0, topK);
    }

    async searchAndRecommend(hotelName) {
        console.log(`\n正在为酒店 "${hotelName}" 查找最相似的10家酒店...\n`);
        
        const recommendations = this.recommendHotels(hotelName, 10);
        
        if (recommendations.length === 0) {
            console.log('未找到推荐结果');
            return;
        }

        console.log('推荐结果 (按相似度排序):');
        console.log('='.repeat(80));
        
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.hotelName}`);
            console.log(`   相似度: ${rec.similarity.toFixed(4)}`);
            
            const hotelDetails = this.hotels.find(h => 
                h.name.toLowerCase().includes(rec.hotelName.toLowerCase()) ||
                rec.hotelName.toLowerCase().includes(h.name.toLowerCase())
            );
            
            if (hotelDetails) {
                console.log(`   地址: ${hotelDetails.address}`);
                console.log(`   描述: ${hotelDetails.desc.substring(0, 150)}...`);
            }
            console.log('-'.repeat(80));
        });
    }
}

async function main() {
    const system = new HotelRecommendationSystem();
    
    console.log('正在加载数据...');
    await system.loadData();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function askForHotel() {
        rl.question('\n请输入酒店名称 (输入 "quit" 退出): ', async (hotelName) => {
            if (hotelName.toLowerCase() === 'quit') {
                rl.close();
                return;
            }
            
            if (hotelName.trim() === '') {
                console.log('请输入有效的酒店名称');
                askForHotel();
                return;
            }
            
            await system.searchAndRecommend(hotelName);
            askForHotel();
        });
    }
    
    console.log('\n酒店推荐系统已就绪!');
    console.log(`共加载了 ${system.tfidfData.hotelNames.length} 家酒店的数据`);
    askForHotel();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
    main().catch(console.error);
}

export default HotelRecommendationSystem;