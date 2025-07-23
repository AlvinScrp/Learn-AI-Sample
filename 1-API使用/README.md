# Learn AI Sample -

安装步骤

1. **安装依赖**

   ```bash
   npm install
   ```
2. **配置环境变量

   到阿里云百炼领取apikey https://bailian.console.aliyun.com/?tab=model#/api-key**

   ```bash

   # 编辑.env文件，添加你的OpenAI API密钥
   DASHSCOPE_API_KEY=sk-......
   DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

   ```
3. **运行应用**

   ```bash
   直接运行对应的demojs文件
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
├── .env       # 环境变量示例
└── README.md         # 项目说明
```

## 配置说明

### 环境变量

### 依赖包

- `openai`: OpenAI官方SDK
- `dotenv`: 环境变量管理

## 注意事项

1. 请确保你有有效的OpenAI API密钥
2. 注意API调用频率限制
3. 建议在开发环境中使用测试密钥

## 许可证

MIT License
