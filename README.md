# Learn AI Sample - OpenAI聊天应用

这是一个集成了OpenAI SDK的Node.js应用示例，用于测试OpenAI的文本聊天功能。

## 功能特性

- ✅ 集成OpenAI SDK
- ✅ 文本聊天功能
- ✅ 环境变量配置
- ✅ 错误处理
- ✅ 中文对话支持

## 安装步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   ```bash
   # 复制环境变量示例文件
   cp env.example .env
   
   # 编辑.env文件，添加你的OpenAI API密钥
   # OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **运行应用**
   ```bash
   npm start
   ```

## 使用方法

应用启动后会自动执行以下测试：

1. 初始化OpenAI客户端
2. 发送预设的测试消息
3. 显示AI助手的回复

## 项目结构

```
Learn-AI-Sample/
├── index.js          # 主应用文件
├── package.json      # 项目配置
├── env.example       # 环境变量示例
└── README.md         # 项目说明
```

## 配置说明

### 环境变量

- `OPENAI_API_KEY`: OpenAI API密钥（必需）
- `OPENAI_MODEL`: 使用的模型名称（可选，默认为gpt-3.5-turbo）

### 依赖包

- `openai`: OpenAI官方SDK
- `dotenv`: 环境变量管理

## 开发说明

- 所有函数都添加了详细的JSDoc注释
- 包含完整的错误处理机制
- 支持模块化导入，便于扩展

## 注意事项

1. 请确保你有有效的OpenAI API密钥
2. 注意API调用频率限制
3. 建议在开发环境中使用测试密钥

## 许可证

MIT License
