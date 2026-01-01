const fs = require('fs').promises;
const path = require('path');

class ProgressService {
  constructor() {
    this.progressFile = path.join(__dirname, '../cards/learning_progress.json');
  }

  /**
   * 获取学习进度
   */
  async getProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // 如果文件不存在，返回默认进度
      return {
        languages: {
          english: { level: 'beginner', learnedWords: [], totalWords: 0 },
          german: { level: 'beginner', learnedWords: [], totalWords: 0 },
          french: { level: 'beginner', learnedWords: [], totalWords: 0 },
          japanese: { level: 'beginner', learnedWords: [], totalWords: 0 }
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 更新学习进度
   */
  async updateProgress(language, words) {
    const progress = await this.getProgress();
    
    if (!progress.languages[language]) {
      progress.languages[language] = {
        level: 'beginner',
        learnedWords: [],
        totalWords: 0
      };
    }

    // 添加新学习的单词（去重）
    const existingWords = new Set(progress.languages[language].learnedWords);
    words.forEach(word => existingWords.add(word.toLowerCase()));
    
    progress.languages[language].learnedWords = Array.from(existingWords);
    progress.languages[language].totalWords = existingWords.size;
    
    // 根据学习的单词数量更新等级
    progress.languages[language].level = this.calculateLevel(existingWords.size);
    progress.lastUpdated = new Date().toISOString();

    await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
    return progress;
  }

  /**
   * 计算学习等级
   */
  calculateLevel(wordCount) {
    if (wordCount < 50) return 'beginner';
    if (wordCount < 200) return 'elementary';
    if (wordCount < 500) return 'intermediate';
    if (wordCount < 1000) return 'upper-intermediate';
    if (wordCount < 2000) return 'advanced';
    return 'proficient';
  }

  /**
   * 获取已学习的单词列表
   */
  async getLearnedWords(language) {
    const progress = await this.getProgress();
    return progress.languages[language]?.learnedWords || [];
  }

  /**
   * 获取学习统计
   */
  async getStats(language) {
    const progress = await this.getProgress();
    const langProgress = progress.languages[language] || {
      level: 'beginner',
      learnedWords: [],
      totalWords: 0
    };

    return {
      level: langProgress.level,
      totalWords: langProgress.totalWords,
      lastUpdated: progress.lastUpdated
    };
  }
}

module.exports = new ProgressService();