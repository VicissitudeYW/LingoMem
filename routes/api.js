const express = require('express');
const router = express.Router();
const cardService = require('../services/cardService');
const aiService = require('../services/aiService');
const progressService = require('../services/progressService');

// 智能推荐单词
router.post('/recommend-words', async (req, res) => {
  try {
    const { language = 'english', count = 10 } = req.body;

    // 获取推荐的单词
    const words = await aiService.recommendWords(language, count);

    res.json({
      success: true,
      words,
      count: words.length
    });

  } catch (error) {
    console.error('推荐单词错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '推荐单词失败'
    });
  }
});

// 生成卡片预览(支持自定义Prompt)
router.post('/generate-preview', async (req, res) => {
  try {
    const { customPrompt, language = 'english', count = 10 } = req.body;

    let wordsToGenerate = [];

    if (customPrompt && customPrompt.trim()) {
      // 使用自定义Prompt生成单词
      wordsToGenerate = await aiService.recommendWordsWithPrompt(language, customPrompt, count);
    } else {
      // 使用智能推荐
      wordsToGenerate = await aiService.recommendWords(language, count);
    }

    // 为每个单词生成卡片
    const cards = await Promise.all(
      wordsToGenerate.map(word => aiService.generateCard(word, language))
    );

    res.json({
      success: true,
      cards,
      count: cards.length
    });

  } catch (error) {
    console.error('生成预览错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成预览失败'
    });
  }
});

// 保存选中的卡片
router.post('/save-selected-cards', async (req, res) => {
  try {
    const { cards, language = 'english' } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有选中的卡片'
      });
    }

    // 保存卡片集合
    const collection = await cardService.saveCollection(cards, language);

    // 更新学习进度
    const words = cards.map(card => card.word);
    await progressService.updateProgress(language, words);

    res.json({
      success: true,
      collection,
      savedCount: cards.length
    });

  } catch (error) {
    console.error('保存卡片错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '保存卡片失败'
    });
  }
});

// 保存单张卡片
router.post('/save-single-card', async (req, res) => {
  try {
    const { card, language = 'english' } = req.body;

    if (!card || !card.word) {
      return res.status(400).json({
        success: false,
        error: '无效的卡片数据'
      });
    }

    // 获取或创建该语言的集合
    const collection = await cardService.getOrCreateCollection(language);

    // 添加卡片到集合
    const updatedCollection = await cardService.addCardToCollection(collection.id, card);

    // 更新学习进度
    await progressService.updateProgress(language, [card.word]);

    res.json({
      success: true,
      collection: updatedCollection,
      message: `已保存: ${card.word}`
    });

  } catch (error) {
    console.error('保存单张卡片错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '保存卡片失败'
    });
  }
});

// 重新生成单张卡片
router.post('/regenerate-card', async (req, res) => {
  try {
    const { cardId, word, language = 'english', collectionId } = req.body;

    if (!cardId || !word || !collectionId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 使用AI重新生成卡片
    const newCard = await aiService.generateCard(word, language);

    // 获取集合
    const collection = await cardService.getCollection(collectionId);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    // 找到并更新卡片
    const cardIndex = collection.cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '卡片不存在'
      });
    }

    // 保留原有的ID和状态
    collection.cards[cardIndex] = {
      ...newCard,
      id: cardId,
      status: collection.cards[cardIndex].status,
      language: language
    };

    // 更新集合
    const updatedCollection = await cardService.updateCollection(collectionId, collection);

    res.json({
      success: true,
      collection: updatedCollection,
      message: `已重新生成: ${word}`
    });

  } catch (error) {
    console.error('重新生成卡片错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '重新生成卡片失败'
    });
  }
});

// 生成单词卡片（支持智能推荐）
router.post('/generate-cards', async (req, res) => {
  try {
    const { words, language = 'english', count = 10, autoRecommend = false } = req.body;

    let wordsToGenerate = [];

    if (autoRecommend) {
      // 使用智能推荐
      wordsToGenerate = await aiService.recommendWords(language, count);
    } else {
      // 使用用户提供的单词
      if (!words || !Array.isArray(words) || words.length === 0) {
        return res.status(400).json({
          success: false,
          error: '请提供要学习的单词列表或启用智能推荐'
        });
      }
      wordsToGenerate = words.slice(0, Math.min(count, 20));
    }

    // 为每个单词生成卡片
    const cards = await Promise.all(
      wordsToGenerate.map(word => aiService.generateCard(word, language))
    );

    // 保存卡片集合
    const collection = await cardService.saveCollection(cards, language);

    // 更新学习进度
    await progressService.updateProgress(language, wordsToGenerate);

    res.json({
      success: true,
      collection,
      autoRecommended: autoRecommend
    });

  } catch (error) {
    console.error('生成卡片错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成卡片失败'
    });
  }
});

// 获取所有卡片集合
router.get('/collections', async (req, res) => {
  try {
    const collections = await cardService.getCollections();
    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('获取集合错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取集合失败'
    });
  }
});

// 获取特定集合的卡片
router.get('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await cardService.getCollection(id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    res.json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('获取集合错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取集合失败'
    });
  }
});

// 更新卡片学习状态
router.patch('/cards/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, collectionId } = req.body;

    if (!['learning', 'reviewing', 'mastered'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
    }

    const collection = await cardService.updateCardStatus(collectionId, id, status);

    res.json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '更新状态失败'
    });
  }
});

// 获取学习进度
router.get('/progress/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const stats = await progressService.getStats(language);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取进度错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取进度失败'
    });
  }
});

// 获取所有语言的学习进度
router.get('/progress', async (req, res) => {
  try {
    const progress = await progressService.getProgress();

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('获取进度错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取进度失败'
    });
  }
});

// 删除集合
router.delete('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await cardService.deleteCollection(id);

    res.json({
      success: true,
      message: '集合删除成功'
    });
  } catch (error) {
    console.error('删除集合错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除集合失败'
    });
  }
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LingoMem API 运行正常',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;