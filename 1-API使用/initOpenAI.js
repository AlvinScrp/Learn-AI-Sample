import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();// 加载环境变量

export const initOpenAI = () => { 
    return new OpenAI({
      //到阿里云百炼领取apikey https://bailian.console.aliyun.com/?tab=model#/api-key
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: process.env.DASHSCOPE_BASE_URL
    });
}