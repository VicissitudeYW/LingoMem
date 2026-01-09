const fs = require('fs').promises;
const path = require('path');

class CardService {
  constructor() {
    this.cardsPath = process.env.CARDS_STORAGE_PATH || './cards';
  }

  async saveCollection(cards, language) {
    try {
      const collectionId = this.generateCollectionId();
      const collectionData = {
        id: collectionId,
        language,
        cards,
        createdAt: new Date().toISOString(),
        totalCards: cards.length,
        stats: {
          learning: cards.filter(c => c.status === 'learning').length,
          reviewing: 0,
          mastered: 0
        }
      };

      const collectionPath = path.join(this.cardsPath, `${collectionId}.json`);
      await fs.writeFile(
        collectionPath,
        JSON.stringify(collectionData, null, 2),
        'utf-8'
      );

      console.log(`✅ 保存卡片集合: ${collectionId} (${cards.length}张卡片)`);
      return collectionData;

    } catch (error) {
      console.error('保存集合失败:', error);
      throw new Error('保存卡片集合失败');
    }
  }

  async getCollections() {
    try {
      const files = await fs.readdir(this.cardsPath);
      // 只读取以 collection_ 开头的 JSON 文件，排除其他文件如 learning_progress.json
      const jsonFiles = files.filter(f => f.startsWith('collection_') && f.endsWith('.json'));

      const collections = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = path.join(this.cardsPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            // 检查数据结构是否有效
            if (!data.id || !data.cards || !Array.isArray(data.cards)) {
              console.warn(`跳过无效的集合文件: ${file}`);
              return null;
            }
            
            // 返回集合完整信息
            return {
              id: data.id,
              language: data.language,
              createdAt: data.createdAt,
              totalCards: data.totalCards || data.cards.length,
              cards: data.cards,
              stats: {
                learning: data.cards.filter(c => c.status === 'learning').length,
                reviewing: data.cards.filter(c => c.status === 'reviewing').length,
                mastered: data.cards.filter(c => c.status === 'mastered').length
              }
            };
          } catch (error) {
            console.error(`读取文件失败 ${file}:`, error);
            return null;
          }
        })
      );

      return collections.filter(c => c !== null).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

    } catch (error) {
      console.error('获取集合列表失败:', error);
      return [];
    }
  }

  async getCollection(collectionId) {
    try {
      const filePath = path.join(this.cardsPath, `${collectionId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`获取集合失败 ${collectionId}:`, error);
      return null;
    }
  }

  async updateCardStatus(collectionId, cardId, status) {
    try {
      const collection = await this.getCollection(collectionId);
      if (!collection) {
        throw new Error('集合不存在');
      }

      const card = collection.cards.find(c => c.id === cardId);
      if (!card) {
        throw new Error('卡片不存在');
      }

      card.status = status;
      card.lastReviewed = new Date().toISOString();
      card.reviewCount = (card.reviewCount || 0) + 1;

      // 更新统计信息
      collection.stats = {
        learning: collection.cards.filter(c => c.status === 'learning').length,
        reviewing: collection.cards.filter(c => c.status === 'reviewing').length,
        mastered: collection.cards.filter(c => c.status === 'mastered').length
      };

      const filePath = path.join(this.cardsPath, `${collectionId}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(collection, null, 2),
        'utf-8'
      );

      console.log(`✅ 更新卡片状态: ${cardId} -> ${status}`);
      return collection;

    } catch (error) {
      console.error('更新卡片状态失败:', error);
      throw error;
    }
  }

  async updateCollection(collectionId, collectionData) {
    try {
      // 更新统计信息
      collectionData.stats = {
        learning: collectionData.cards.filter(c => c.status === 'learning').length,
        reviewing: collectionData.cards.filter(c => c.status === 'reviewing').length,
        mastered: collectionData.cards.filter(c => c.status === 'mastered').length
      };
      
      collectionData.totalCards = collectionData.cards.length;
      collectionData.updatedAt = new Date().toISOString();

      const filePath = path.join(this.cardsPath, `${collectionId}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(collectionData, null, 2),
        'utf-8'
      );

      console.log(`✅ 更新集合: ${collectionId}`);
      return collectionData;

    } catch (error) {
      console.error('更新集合失败:', error);
      throw error;
    }
  }

  async deleteCollection(collectionId) {
    try {
      const filePath = path.join(this.cardsPath, `${collectionId}.json`);
      await fs.unlink(filePath);
      console.log(`✅ 删除集合: ${collectionId}`);
    } catch (error) {
      console.error(`删除集合失败 ${collectionId}:`, error);
      throw new Error('删除集合失败');
    }
  }

  async getOrCreateCollection(language) {
    try {
      // 获取该语言的所有集合
      const collections = await this.getCollections();
      const languageCollections = collections.filter(c => c.language === language);
      
      // 如果存在集合，返回最新的一个
      if (languageCollections.length > 0) {
        const latestCollection = languageCollections[0]; // 已按时间排序
        return await this.getCollection(latestCollection.id);
      }
      
      // 如果不存在，创建新集合
      const newCollection = await this.saveCollection([], language);
      return newCollection;
      
    } catch (error) {
      console.error('获取或创建集合失败:', error);
      throw error;
    }
  }

  async addCardToCollection(collectionId, card) {
    try {
      const collection = await this.getCollection(collectionId);
      if (!collection) {
        throw new Error('集合不存在');
      }

      // 检查卡片是否已存在（根据单词）
      const existingCardIndex = collection.cards.findIndex(c => c.word === card.word);
      
      if (existingCardIndex !== -1) {
        // 如果存在，更新卡片
        collection.cards[existingCardIndex] = {
          ...card,
          id: collection.cards[existingCardIndex].id, // 保留原ID
          status: 'learning',
          createdAt: collection.cards[existingCardIndex].createdAt, // 保留创建时间
          updatedAt: new Date().toISOString()
        };
        console.log(`✅ 更新卡片: ${card.word}`);
      } else {
        // 如果不存在，添加新卡片
        const newCard = {
          ...card,
          id: this.generateCardId(),
          status: 'learning',
          createdAt: new Date().toISOString(),
          reviewCount: 0
        };
        collection.cards.push(newCard);
        collection.totalCards = collection.cards.length;
        console.log(`✅ 添加新卡片: ${card.word}`);
      }

      // 更新统计信息
      collection.stats = {
        learning: collection.cards.filter(c => c.status === 'learning').length,
        reviewing: collection.cards.filter(c => c.status === 'reviewing').length,
        mastered: collection.cards.filter(c => c.status === 'mastered').length
      };

      // 保存更新后的集合
      const filePath = path.join(this.cardsPath, `${collectionId}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(collection, null, 2),
        'utf-8'
      );

      return collection;

    } catch (error) {
      console.error('添加卡片到集合失败:', error);
      throw error;
    }
  }

  generateCardId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `card_${timestamp}_${random}`;
  }

  generateCollectionId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const random = Math.random().toString(36).substr(2, 6);
    return `collection_${timestamp}_${random}`;
  }
}

module.exports = new CardService();