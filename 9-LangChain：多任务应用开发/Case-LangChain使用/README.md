# LangChain Agent 产品查询系统 - JavaScript 版本

这个项目包含两个 JavaScript 实现版本，对应 Python 版本的 LangChain Agent 产品查询系统。

## 文件说明

- `5-product_llm.js` - 现代版本（使用 `createOpenAIFunctionsAgent`）
- `5-product_llm_equivalent.js` - 完全对等版本（使用 `LLMSingleActionAgent` + `CustomOutputParser`）
- `5-product_llm.py` - 原始 Python 版本

## 版本对比

### 现代版本 (`5-product_llm.js`)

- **特点**：使用 `createOpenAIFunctionsAgent`，更现代的实现方式
- **优势**：内置输出解析器，代码更简洁
- **适用**：推荐用于生产环境

### 完全对等版本 (`5-product_llm_equivalent.js`)

- **特点**：使用 `LLMSingleActionAgent` + `CustomOutputParser`，与 Python 版本逻辑完全一致
- **优势**：可以完全理解 Agent 的工作流程，便于学习和调试
- **适用**：适合学习和理解 LangChain Agent 的内部机制

## 功能特性

- 🤖 **智能问答**：基于 LangChain Agent 的智能问答系统
- 🚗 **产品查询**：查询特斯拉各款车型的详细信息
- 🏢 **公司介绍**：了解特斯拉公司的技术特点和产品线
- ⚡ **动态输出**：字符逐个显示，提供更好的用户体验
- 🔧 **工具化设计**：模块化工具，易于扩展和维护

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 运行现代版本

```bash
npm start
# 或者
node 5-product_llm.js
```

### 3. 运行完全对等版本

```bash
npm run start:equivalent
# 或者
node 5-product_llm_equivalent.js
```

### 4. 开发模式（自动重启）

```bash
# 现代版本
npm run dev

# 完全对等版本
npm run dev:equivalent
```

## 使用示例

启动后，你可以输入以下类型的问题：

### 产品查询

- "Model 3 怎么样？"
- "Model Y 的价格是多少？"
- "Model X 有什么特点？"

### 公司相关

- "特斯拉公司怎么样？"
- "特斯拉有什么技术创新？"
- "特斯拉的自动驾驶技术如何？"

## 核心组件说明

### TeslaDataSource 类

- `findProductDescription()` - 产品描述查询工具
- `findCompanyInfo()` - 公司信息查询工具

### CustomPromptTemplate 类（仅对等版本）

- 自定义提示模板，处理中间步骤和工具信息

### CustomOutputParser 类（仅对等版本）

- 解析 LLM 输出，判断是继续执行工具还是返回最终答案

## 技术栈

- **LangChain** - AI 应用开发框架
- **通义千问** - 阿里云大语言模型
- **Node.js** - JavaScript 运行时
- **ES Modules** - 现代 JavaScript 模块系统

## 注意事项

1. **API 密钥**：需要配置有效的通义千问 API 密钥
2. **网络连接**：需要稳定的网络连接访问 AI 服务
3. **依赖版本**：确保使用兼容的 LangChain 版本

## 扩展建议

- 添加更多产品信息
- 集成数据库存储
- 增加用户会话管理
- 添加 Web 界面
- 支持多语言查询
