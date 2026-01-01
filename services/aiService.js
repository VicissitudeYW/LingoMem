const axios = require('axios');
const progressService = require('./progressService');
const cardService = require('./cardService');
const { getLanguageConfig, isValidLanguage } = require('../config/languages');
const {
  getCardPrompt,
  getRecommendationPrompt,
  getCustomPrompt,
  getCardSystemMessage,
  getRecommendationSystemMessage
} = require('../config/prompts');

class AIService {
  constructor() {
    this.apiEndpoint = process.env.AI_API_ENDPOINT;
    this.apiKey = process.env.AI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-4-turbo-preview';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000;

    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      console.warn('⚠️  警告: 未配置有效的API密钥');
    }
  }

  /**
   * 智能推荐单词
   * 根据用户的学习进度和已学单词，推荐新的单词
   */
  async recommendWords(language = 'english', count = 10) {
    try {
      // 验证语言
      if (!isValidLanguage(language)) {
        console.warn(`⚠️  无效的语言: ${language}，使用默认语言 english`);
        language = 'english';
      }

      const learnedWords = await progressService.getLearnedWords(language);
      const existingWords = await this.getAllExistingWords(language);
      const allKnownWords = [...new Set([...learnedWords, ...existingWords])];
      const stats = await progressService.getStats(language);
      
      console.log(`📝 推荐单词 - 语言: ${language}, 已学: ${allKnownWords.length}, 请求数量: ${count}`);
      
      const prompt = getRecommendationPrompt(language, allKnownWords, stats, count);
      const systemMessage = getRecommendationSystemMessage(language);

      console.log(`🤖 调用AI API - 端点: ${this.apiEndpoint}`);
      
      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      // 增强的响应验证
      if (!response) {
        console.error('❌ API响应对象为null');
        throw new Error('API响应为空,请检查网络连接');
      }

      if (!response.data) {
        console.error('❌ API响应缺少data字段');
        console.error('完整响应:', JSON.stringify(response, null, 2));
        throw new Error('API返回数据为空,可能是服务器错误');
      }

      if (response.status !== 200) {
        console.error(`❌ API返回非200状态码: ${response.status}`);
        console.error('错误响应:', JSON.stringify(response.data, null, 2));
        throw new Error(`API请求失败 (状态码: ${response.status})`);
      }

      if (!response.data.choices || !Array.isArray(response.data.choices)) {
        console.error('❌ API响应缺少choices数组');
        console.error('响应数据结构:', JSON.stringify(response.data, null, 2));
        throw new Error('API返回数据格式不完整: 缺少choices数组');
      }

      if (response.data.choices.length === 0) {
        console.error('❌ API响应choices数组为空');
        throw new Error('API返回数据格式不完整: choices数组为空');
      }

      const firstChoice = response.data.choices[0];
      if (!firstChoice || typeof firstChoice !== 'object') {
        console.error('❌ choices[0]不是有效对象');
        throw new Error('API返回数据格式不完整: choices[0]无效');
      }

      if (!firstChoice.message || typeof firstChoice.message !== 'object') {
        console.error('❌ choices[0].message不是有效对象');
        console.error('choices[0]:', JSON.stringify(firstChoice, null, 2));
        throw new Error('API返回数据格式不完整: 缺少message对象');
      }

      if (!firstChoice.message.content || typeof firstChoice.message.content !== 'string') {
        console.error('❌ message.content不是有效字符串');
        console.error('message:', JSON.stringify(firstChoice.message, null, 2));
        throw new Error('API返回数据格式不完整: message.content无效或为空');
      }

      const content = response.data.choices[0].message.content.trim();
      console.log(`✅ AI返回内容长度: ${content.length} 字符`);
      console.log(`📄 AI返回内容预览:\n${content.substring(0, 200)}...`);
      
      const words = this.parseRecommendedWords(content);
      console.log(`📋 解析出 ${words.length} 个单词:`, words);
      
      // 二次过滤:确保不推荐已存在的单词
      const filteredWords = words.filter(word =>
        !allKnownWords.some(known => known.toLowerCase() === word.toLowerCase())
      );
      
      console.log(`✨ 过滤后剩余 ${filteredWords.length} 个新单词`);
      
      return filteredWords.slice(0, count);

    } catch (error) {
      console.error('❌ 推荐单词失败:', error.message);
      if (error.response) {
        console.error('API错误状态:', error.response.status);
        console.error('API错误数据:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.code === 'ECONNABORTED') {
        console.error('请求超时');
      }
      // 返回默认单词列表
      return this.getDefaultWords(language, count);
    }
  }

  /**
   * 使用自定义Prompt推荐单词
   */
  async recommendWordsWithPrompt(language = 'english', customPrompt, count = 10) {
    try {
      // 验证语言
      if (!isValidLanguage(language)) {
        console.warn(`⚠️  无效的语言: ${language}，使用默认语言 english`);
        language = 'english';
      }

      const learnedWords = await progressService.getLearnedWords(language);
      const existingWords = await this.getAllExistingWords(language);
      const allKnownWords = [...new Set([...learnedWords, ...existingWords])];
      
      console.log(`📝 自定义推荐 - 语言: ${language}, 提示: "${customPrompt}", 已学: ${allKnownWords.length}`);
      
      const prompt = getCustomPrompt(language, customPrompt, allKnownWords, count);
      const systemMessage = getRecommendationSystemMessage(language);

      console.log(`🤖 调用AI API - 端点: ${this.apiEndpoint}`);

      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000,
          validateStatus: function (status) {
            return status >= 200 && status < 500; // 接受所有非5xx错误
          }
        }
      );

      // 增强的响应验证 - 多层防护
      if (!response) {
        console.error('❌ API响应对象为null');
        throw new Error('API响应为空,请检查网络连接');
      }

      if (!response.data) {
        console.error('❌ API响应缺少data字段');
        console.error('完整响应:', JSON.stringify(response, null, 2));
        throw new Error('API返回数据为空,可能是服务器错误');
      }

      // 检查HTTP状态码
      if (response.status !== 200) {
        console.error(`❌ API返回非200状态码: ${response.status}`);
        console.error('错误响应:', JSON.stringify(response.data, null, 2));
        throw new Error(`API请求失败 (状态码: ${response.status})`);
      }

      // 检查choices数组
      if (!response.data.choices || !Array.isArray(response.data.choices)) {
        console.error('❌ API响应缺少choices数组');
        console.error('响应数据结构:', JSON.stringify(response.data, null, 2));
        throw new Error('API返回数据格式不完整: 缺少choices数组');
      }

      if (response.data.choices.length === 0) {
        console.error('❌ API响应choices数组为空');
        console.error('响应数据:', JSON.stringify(response.data, null, 2));
        throw new Error('API返回数据格式不完整: choices数组为空');
      }

      // 检查message对象
      const firstChoice = response.data.choices[0];
      if (!firstChoice || typeof firstChoice !== 'object') {
        console.error('❌ choices[0]不是有效对象');
        console.error('choices[0]:', JSON.stringify(firstChoice, null, 2));
        throw new Error('API返回数据格式不完整: choices[0]无效');
      }

      if (!firstChoice.message || typeof firstChoice.message !== 'object') {
        console.error('❌ choices[0].message不是有效对象');
        console.error('choices[0]:', JSON.stringify(firstChoice, null, 2));
        throw new Error('API返回数据格式不完整: 缺少message对象');
      }

      if (!firstChoice.message.content || typeof firstChoice.message.content !== 'string') {
        console.error('❌ message.content不是有效字符串');
        console.error('message:', JSON.stringify(firstChoice.message, null, 2));
        throw new Error('API返回数据格式不完整: message.content无效或为空');
      }

      const content = response.data.choices[0].message.content.trim();
      console.log(`✅ AI返回内容长度: ${content.length} 字符`);
      console.log(`📄 AI返回内容预览:\n${content.substring(0, 200)}...`);
      
      const words = this.parseRecommendedWords(content);
      console.log(`📋 解析出 ${words.length} 个单词:`, words);
      
      // 过滤已存在的单词
      const filteredWords = words.filter(word =>
        !allKnownWords.some(known => known.toLowerCase() === word.toLowerCase())
      );
      
      console.log(`✨ 过滤后剩余 ${filteredWords.length} 个新单词`);
      
      return filteredWords.slice(0, count);

    } catch (error) {
      console.error('❌ 自定义推荐失败:', error.message);
      if (error.response) {
        console.error('API错误状态:', error.response.status);
        console.error('API错误数据:', JSON.stringify(error.response.data, null, 2));
      }
      return this.getDefaultWords(language, count);
    }
  }

  /**
   * 获取所有已存在的单词(从所有卡片集合中)
   */
  async getAllExistingWords(language) {
    try {
      const collections = await cardService.getCollections();
      const languageCollections = collections.filter(c => c.language === language);
      
      const allWords = [];
      for (const collection of languageCollections) {
        const fullCollection = await cardService.getCollection(collection.id);
        if (fullCollection && fullCollection.cards) {
          fullCollection.cards.forEach(card => {
            if (card.word) {
              allWords.push(card.word.toLowerCase());
            }
          });
        }
      }
      
      return [...new Set(allWords)]; // 去重
    } catch (error) {
      console.error('获取已存在单词失败:', error);
      return [];
    }
  }

  parseRecommendedWords(content) {
    // 提取单词列表
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // 移除序号、标点等
        return line.replace(/^\d+[\.\)]\s*/, '')
                  .replace(/^[-*]\s*/, '')
                  .replace(/[,，。.;；:：]/g, '')
                  .trim()
                  .toLowerCase();
      })
      .filter(word => {
        // 只保留有效的单词（字母、连字符、空格）
        return /^[a-zA-ZäöüßÄÖÜàâäæçéèêëïîôœùûüÿÀÂÄÆÇÉÈÊËÏÎÔŒÙÛÜŸぁ-んァ-ヶー一-龯\s-]+$/.test(word) && word.length > 1;
      });

    return [...new Set(lines)]; // 去重
  }

  getDefaultWords(language, count) {
    const config = getLanguageConfig(language);
    console.log(`⚠️  使用默认单词列表 - 语言: ${language}`);
    return config.defaultWords.slice(0, count);
  }

  async generateCard(word, language = 'english') {
    try {
      // 验证语言
      if (!isValidLanguage(language)) {
        console.warn(`⚠️  无效的语言: ${language}，使用默认语言 english`);
        language = 'english';
      }

      console.log(`🎴 生成卡片 - 单词: "${word}", 语言: ${language}`);
      
      const prompt = getCardPrompt(language, word);
      const systemMessage = getCardSystemMessage(language);

      console.log(`🤖 调用AI API - 端点: ${this.apiEndpoint}`);

      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      // 增强的响应验证
      if (!response) {
        console.error('❌ API响应对象为null');
        throw new Error('API响应为空,请检查网络连接');
      }

      if (!response.data) {
        console.error('❌ API响应缺少data字段');
        console.error('完整响应:', JSON.stringify(response, null, 2));
        throw new Error('API返回数据为空,可能是服务器错误');
      }

      if (response.status !== 200) {
        console.error(`❌ API返回非200状态码: ${response.status}`);
        console.error('错误响应:', JSON.stringify(response.data, null, 2));
        throw new Error(`API请求失败 (状态码: ${response.status})`);
      }

      if (!response.data.choices || !Array.isArray(response.data.choices)) {
        console.error('❌ API响应缺少choices数组');
        console.error('响应数据结构:', JSON.stringify(response.data, null, 2));
        throw new Error('API返回数据格式不完整: 缺少choices数组');
      }

      if (response.data.choices.length === 0) {
        console.error('❌ API响应choices数组为空');
        throw new Error('API返回数据格式不完整: choices数组为空');
      }

      const firstChoice = response.data.choices[0];
      if (!firstChoice || typeof firstChoice !== 'object') {
        console.error('❌ choices[0]不是有效对象');
        throw new Error('API返回数据格式不完整: choices[0]无效');
      }

      if (!firstChoice.message || typeof firstChoice.message !== 'object') {
        console.error('❌ choices[0].message不是有效对象');
        console.error('choices[0]:', JSON.stringify(firstChoice, null, 2));
        throw new Error('API返回数据格式不完整: 缺少message对象');
      }

      if (!firstChoice.message.content || typeof firstChoice.message.content !== 'string') {
        console.error('❌ message.content不是有效字符串');
        console.error('message:', JSON.stringify(firstChoice.message, null, 2));
        throw new Error('API返回数据格式不完整: message.content无效或为空');
      }

      const content = response.data.choices[0].message.content.trim();
      
      if (!content) {
        console.error('❌ API返回的内容为空');
        throw new Error('API返回的内容为空');
      }

      console.log(`✅ AI返回内容长度: ${content.length} 字符`);
      console.log(`📄 AI返回内容预览:\n${content.substring(0, 300)}...`);

      const cardData = this.parseCardContent(content, word, language);
      console.log(`✨ 卡片生成成功 - ID: ${cardData.id}`);

      return cardData;

    } catch (error) {
      console.error(`❌ 生成单词卡片失败 (${word}):`, error.message);
      if (error.response) {
        console.error('API错误状态:', error.response.status);
        console.error('API错误数据:', JSON.stringify(error.response.data, null, 2));
      }
      // 返回基础卡片作为后备
      console.log(`⚠️  使用后备卡片 - 单词: ${word}`);
      return this.createFallbackCard(word, language);
    }
  }

  parseCardContent(content, word, language) {
    try {
      // 清理可能的代码块标记
      const cleanContent = content.replace(/```json\s*|```\s*/g, '').trim();
      const data = JSON.parse(cleanContent);

      // 提取所有例句（从 definitions 中的 example 字段）
      const examples = [];
      if (data.definitions && Array.isArray(data.definitions)) {
        data.definitions.forEach(def => {
          if (def.example && def.example.sentence && def.example.translation) {
            examples.push({
              sentence: def.example.sentence,
              translation: def.example.translation
            });
          }
        });
      }

      // 如果还有独立的 examples 数组，也添加进来
      if (data.examples && Array.isArray(data.examples)) {
        examples.push(...data.examples);
      }

      return {
        id: this.generateId(),
        word: data.word || word,
        language,
        phonetic: data.phonetic || '',
        level: data.level || 'B1',
        definitions: data.definitions || [],
        examples: examples,
        tips: data.tips || '',
        etymology: data.etymology || '',
        status: 'learning',
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        reviewCount: 0
      };
    } catch (error) {
      console.error('解析卡片内容失败:', error);
      return this.createFallbackCard(word, language);
    }
  }

  createFallbackCard(word, language) {
    const config = getLanguageConfig(language);
    
    return {
      id: this.generateId(),
      word,
      language,
      phonetic: '/',
      level: config.levels[2] || 'B1',
      definitions: [
        {
          pos: 'n.',
          meaning: `${word} 的释义（AI生成失败，请重试）`
        },
        {
          pos: 'v.',
          meaning: '暂无更多释义'
        }
      ],
      examples: [
        {
          sentence: `Example with ${word}.`,
          translation: `包含 ${word} 的例句（AI生成失败，请重试）`
        },
        {
          sentence: `Another example with ${word}.`,
          translation: '暂无更多例句'
        }
      ],
      etymology: `${word} 的词源信息暂时无法获取`,
      tips: `学习 ${word} 时请注意：AI服务暂时不可用，建议稍后重试以获取完整的学习内容。`,
      status: 'learning',
      createdAt: new Date().toISOString(),
      lastReviewed: null,
      reviewCount: 0
    };
  }

  generateId() {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new AIService();