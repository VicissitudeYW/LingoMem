require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const CARDS_PATH = process.env.CARDS_STORAGE_PATH || './cards';

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 确保卡片存储目录存在
async function ensureCardsDirectory() {
  try {
    await fs.access(CARDS_PATH);
  } catch {
    await fs.mkdir(CARDS_PATH, { recursive: true });
  }
}

// AI服务配置
const AI_CONFIG = {
  endpoint: process.env.AI_API_ENDPOINT,
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
  temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000
};

// API路由
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// 启动服务器
ensureCardsDirectory().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 LingoMem 单词背诵系统已启动`);
    console.log(`📍 访问地址: http://localhost:${PORT}`);
    console.log(`💾 卡片存储路径: ${CARDS_PATH}`);
  });
}).catch(err => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});