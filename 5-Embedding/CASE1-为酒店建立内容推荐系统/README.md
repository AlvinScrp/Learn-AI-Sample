# 西雅图酒店描述N-Gram和TF-IDF分析

## 项目概述

本项目对西雅图156家酒店的详细描述进行了深入的文本分析，包括：
- **N-Gram词频分析**：统计1-gram、2-gram、3-gram的词频
- **TF-IDF特征提取**：计算词频-逆文档频率，识别语义重要性
- **余弦相似度计算**：计算酒店间的文本相似度
- **文本预处理**：小写转换、停用词移除、标点符号清理
- **数据可视化**：生成交互式HTML报告

## 主要功能

### 1. 文本预处理
- ✅ 文本全部转换为小写
- ✅ 移除标点符号和特殊字符
- ✅ 去除停用词（151个常见英文停用词）
- ✅ 分词和标准化

### 2. N-Gram分析
- ✅ 1-Gram（单词）频率统计
- ✅ 2-Gram（双词短语）频率统计
- ✅ 3-Gram（三词短语）频率统计
- ✅ 按频率降序排序

### 3. TF-IDF特征提取
- ✅ 计算词频（TF）
- ✅ 计算逆文档频率（IDF）
- ✅ 生成TF-IDF矩阵
- ✅ 识别语义重要性词汇

### 4. 余弦相似度计算
- ✅ 计算152家酒店的TF-IDF向量
- ✅ 生成152×152余弦相似度矩阵
- ✅ 相似度统计和分析

### 5. 数据可视化
- ✅ 柱状图显示词频分布
- ✅ 饼图显示频率比例
- ✅ TF-IDF重要性图表
- ✅ 词频 vs TF-IDF对比图
- ✅ 相似度矩阵热力图
- ✅ 响应式设计

## 文件结构

```
CASE1-为酒店建立内容推荐系统/
├── input/
│   └── Seattle_Hotels.csv          # 原始酒店数据
├── output/
│   ├── word_frequency_matrix.json   # 词频矩阵
│   ├── 1gram_frequency.json        # 1-Gram分析结果
│   ├── 2gram_frequency.json        # 2-Gram分析结果
│   ├── 3gram_frequency.json        # 3-Gram分析结果
│   ├── tfidf_features.json         # TF-IDF特征提取结果
│   ├── similarity_analysis.json    # 相似度分析数据
│   ├── ngram_analysis_report.html  # 综合可视化报告
│   ├── tfidf_analysis_report.html  # TF-IDF专用报告
│   └── similarity_analysis_report.html # 相似度分析报告
├── ngram_analysis.js               # 主分析程序
├── visualize_results.js            # 综合可视化程序
├── tfidf_analysis.js              # TF-IDF专用可视化程序
├── similarity_analysis.js          # 相似度分析程序
└── README.md                       # 项目文档
```

## 使用方法

### 1. 运行N-Gram和TF-IDF分析
```bash
node ngram_analysis.js
```

### 2. 生成综合可视化报告
```bash
node visualize_results.js
```

### 3. 生成TF-IDF专用报告
```bash
node tfidf_analysis.js
```

### 4. 计算相似度矩阵
```bash
node similarity_analysis.js
```

### 5. 查看结果
- **综合报告**: 打开 `output/ngram_analysis_report.html` 查看完整的N-Gram和TF-IDF分析
- **TF-IDF专用报告**: 打开 `output/tfidf_analysis_report.html` 查看专门的TF-IDF分析
- **相似度分析报告**: 打开 `output/similarity_analysis_report.html` 查看相似度矩阵分析

## 关键统计

### 文本预处理结果
- **原始文本长度**: 145,684 字符
- **清理后文本长度**: 142,491 字符
- **分词数量**: 24,248 个
- **去停用词后**: 15,285 个
- **唯一单词数**: 3,066 个

### N-Gram统计
- **1-Gram总数**: 15,285
- **2-Gram总数**: 15,284
- **3-Gram总数**: 15,283

### TF-IDF统计
- **词汇表大小**: 3,066 个词
- **文档数量**: 156 个
- **特征向量维度**: 3,066 维

### 相似度分析统计
- **分析酒店数**: 152 家
- **特征维度**: 100 个重要词汇
- **相似度矩阵**: 152 × 152
- **最高相似度**: 1.0000
- **最低相似度**: 0.0000
- **平均相似度**: 0.7123

## 主要发现

### 词频分析结果
1. **最常见单词**: "seattle" (523次)
2. **最常见2-Gram**: "pike place" (83次)
3. **最常见3-Gram**: "pike place market" (82次)

### TF-IDF分析结果
1. **最重要词汇**: "inn" (重要性: 1.4301)
2. **第二重要**: "free" (重要性: 1.4064)
3. **第三重要**: "airport" (重要性: 1.3414)

### 相似度分析结果
1. **矩阵大小**: 152 × 152 的余弦相似度矩阵
2. **平均相似度**: 0.7123，表明酒店间有较高的文本相似性
3. **相似度分布**: 从0.0000到1.0000，覆盖了完全不相似到完全相似的范围

### 关键洞察

#### 词频 vs TF-IDF对比
- **"seattle"**: 词频最高但TF-IDF重要性较低，因为几乎所有酒店都提到
- **"inn"**: TF-IDF重要性最高，表明它在区分酒店类型方面很重要
- **"free"**: 高TF-IDF值，说明免费服务是重要的差异化特征
- **"airport"**: 高TF-IDF值，表明机场位置是重要卖点

#### 语义重要性发现
1. **酒店类型词汇** ("inn", "hotel", "motel") 具有高TF-IDF值
2. **位置相关词汇** ("airport", "downtown", "university") 重要性较高
3. **服务特征词汇** ("free", "complimentary", "breakfast") 具有区分性
4. **地标词汇** ("space needle", "pike place") 体现本地特色

#### 相似度分析洞察
1. **高相似度**: 表明酒店描述在服务、位置、设施等方面有共同特征
2. **低相似度**: 反映了不同酒店的特色和差异化定位
3. **推荐应用**: 可用于基于内容的酒店推荐系统

## 报告特色

### 综合报告 (`ngram_analysis_report.html`)
- 📊 N-Gram词频分析图表
- 🔍 TF-IDF重要性分析
- 📈 词频 vs TF-IDF对比
- 🎨 响应式设计，美观界面

### TF-IDF专用报告 (`tfidf_analysis_report.html`)
- 🎯 **专用TF-IDF分析界面**
- ☁️ **语义重要性词汇云**
- 📊 **词频 vs TF-IDF对比分析**
- 📈 **重要性分布图表**
- 🎨 **渐变背景，现代化设计**
- 📋 **详细的重要性排名表格**
- 💡 **关键发现和语义洞察**

### 相似度分析报告 (`similarity_analysis_report.html`)
- 🔍 **152×152相似度矩阵热力图**
- 📋 **完整酒店列表**
- 📊 **相似度矩阵表格**
- 📈 **相似度统计和分析**
- 🎨 **现代化界面设计**

## 技术实现

### 核心算法

#### TF-IDF计算
```javascript
// TF (词频)
const tf = wordCount / totalWords;

// IDF (逆文档频率)
const idf = Math.log(totalDocuments / documentsWithWord);

// TF-IDF值
const tfidf = tf * idf;
```

#### 余弦相似度计算
```javascript
function cosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### 文本预处理
```javascript
function cleanText(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
```

### 数据流程
1. **数据读取** → 解析CSV文件，提取desc列
2. **文本预处理** → 小写转换、分词、去停用词
3. **N-Gram生成** → 生成1-gram、2-gram、3-gram
4. **TF-IDF计算** → 构建词汇表、计算TF-IDF矩阵
5. **相似度计算** → 计算余弦相似度矩阵
6. **结果排序** → 按频率和重要性排序
7. **可视化生成** → 创建交互式HTML报告

## 应用价值

### 1. 酒店推荐系统
- 基于TF-IDF特征进行相似度计算
- 识别酒店的核心特色和卖点
- 支持个性化推荐

### 2. 市场分析
- 了解酒店描述的重点内容
- 分析竞争差异化特征
- 指导营销策略制定

### 3. 文本挖掘
- 提取关键特征词
- 识别语义重要性
- 支持文本分类和聚类

### 4. 相似度分析
- 计算酒店间的文本相似性
- 支持基于内容的推荐
- 发现酒店群组和模式

## 未来扩展

### 1. 高级特征提取
- 词向量（Word2Vec）分析
- 主题建模（LDA）
- 情感分析

### 2. 推荐算法
- 基于内容的推荐
- 协同过滤
- 混合推荐系统

### 3. 实时分析
- 流式数据处理
- 实时特征更新
- 动态推荐

### 4. 相似度优化
- 更精确的相似度算法
- 多维度特征融合
- 个性化权重调整

## 技术栈

- **编程语言**: JavaScript (Node.js)
- **数据处理**: 原生JavaScript
- **可视化**: Chart.js
- **文件格式**: JSON, CSV, HTML
- **模块系统**: ES Modules

## 注意事项

1. **数据质量**: 确保CSV文件格式正确，desc列存在
2. **内存使用**: 大量文档时注意内存消耗
3. **性能优化**: 可考虑使用更高效的数据结构
4. **扩展性**: 代码结构支持添加新的分析功能

---

*本项目展示了如何使用N-Gram、TF-IDF和余弦相似度技术进行文本特征提取和相似度分析，为酒店推荐系统提供数据基础。* 