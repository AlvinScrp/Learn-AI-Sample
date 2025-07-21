import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();// 加载环境变量

export const initOpenAI = () => { 
    return new OpenAI({
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: process.env.DASHSCOPE_BASE_URL
    });
}