// CardManager.js - 卡片管理模块
import { SwipeCards } from './SwipeCards.js';
import { MarkdownRenderer } from '../utils/markdown.js';

export class CardManager {
  constructor(uiManager, currentLanguage) {
    this.uiManager = uiManager;
    this.currentLanguage = currentLanguage;
    this.currentTab = 'learning';
    this.expandedCardId = null;
    this.previewCards = [];
    this.swipeCards = null;
  }
  
  setLanguage(language) {
    this.currentLanguage = language;
  }
  
  switchTab(tab) {
    this.currentTab = tab;
    
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // 更新标签页内容
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `${tab}Tab`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }
  
  renderCards(collection) {
    if (!collection) return;
    
    const learningContainer = document.getElementById('learningCards');
    const reviewingContainer = document.getElementById('reviewingCards');
    
    if (!learningContainer || !reviewingContainer) return;
    
    learningContainer.innerHTML = '';
    reviewingContainer.innerHTML = '';
    
    collection.cards.forEach(card => {
      const cardEl = this.createCardElement(card);
      
      if (card.status === 'learning') {
        learningContainer.appendChild(cardEl);
      } else if (card.status === 'reviewing') {
        reviewingContainer.appendChild(cardEl);
      }
    });
    
    this.updateStats(collection);
  }
  
  createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'word-card';
    cardEl.dataset.cardId = card.id;
    
    // 添加语言特定类 - 使用卡片的language属性或当前语言
    const cardLanguage = card.language || this.currentLanguage;
    if (cardLanguage) {
      cardEl.classList.add(`lang-${cardLanguage}`);
    }
    
    // 如果是展开的卡片,添加expanded类
    if (this.expandedCardId === card.id) {
      cardEl.classList.add('expanded');
    }
    
    // 构建释义HTML（包含每个释义的例句）- 支持Markdown渲染
    let definitionsHTML = '';
    if (card.definitions && card.definitions.length > 0) {
      definitionsHTML = card.definitions.map(def => {
        let exampleHTML = '';
        if (def.example && def.example.sentence && def.example.translation) {
          exampleHTML = `
            <div class="definition-example">
              <div class="example-sentence">${MarkdownRenderer.render(def.example.sentence)}</div>
              <div class="example-translation">${MarkdownRenderer.render(def.example.translation)}</div>
            </div>
          `;
        }
        
        return `
          <div class="definition-item">
            <span class="definition-pos">${MarkdownRenderer.render(def.pos)}</span>
            <div class="definition-meaning">${MarkdownRenderer.render(def.meaning)}</div>
            ${exampleHTML}
          </div>
        `;
      }).join('');
    }
    
    // 构建额外例句HTML（如果有独立的examples数组）- 支持Markdown渲染
    let examplesHTML = '';
    if (card.examples && card.examples.length > 0) {
      examplesHTML = card.examples.slice(0, 2).map(ex => `
        <div class="example-item">
          <div class="example-sentence">${MarkdownRenderer.render(ex.sentence)}</div>
          <div class="example-translation">${MarkdownRenderer.render(ex.translation)}</div>
        </div>
      `).join('');
    }
    
    cardEl.innerHTML = `
      <div class="card-header">
        <h3 class="card-word">${card.word}</h3>
      </div>
      
      ${card.phonetic ? `
        <div class="card-phonetics">
          <span class="card-phonetic">${card.phonetic}</span>
        </div>
      ` : ''}
      
      <div class="card-body">
        ${card.level ? `<span class="card-level">${card.level}</span>` : ''}
        
        ${definitionsHTML ? `
          <h4 class="card-title">
            <i class="bi bi-book"></i>
            释义与例句
          </h4>
          <div class="card-definitions">
            ${definitionsHTML}
          </div>
        ` : ''}
        
        ${examplesHTML ? `
          <h4 class="card-title">
            <i class="bi bi-chat-quote"></i>
            更多例句
          </h4>
          <div class="card-examples">
            ${examplesHTML}
          </div>
        ` : ''}
        
        ${card.etymology ? `
          <div class="card-etymology">
            <h4 class="card-title">
              <i class="bi bi-tree"></i>
              词源
            </h4>
            <p>${MarkdownRenderer.render(card.etymology)}</p>
          </div>
        ` : ''}
        
        ${card.tips ? `
          <div class="card-tips">
            <h4 class="card-title">
              <i class="bi bi-lightbulb"></i>
              学习提示
            </h4>
            <p>${MarkdownRenderer.render(card.tips)}</p>
          </div>
        ` : ''}
        
        <div class="card-actions">
          <button class="card-action-btn btn-know" data-action="know">
            ✓ 认识
          </button>
          <button class="card-action-btn btn-review" data-action="review">
            ↻ 再看
          </button>
          <button class="card-action-btn btn-forget" data-action="forget">
            ✗ 不认识
          </button>
        </div>
        
        <div class="card-regenerate" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
          <button class="card-action-btn btn-regenerate" data-action="regenerate" style="width: 100%; background: var(--primary); color: var(--text-primary);">
            <i class="bi bi-arrow-clockwise"></i>
            重新生成此卡片
          </button>
        </div>
      </div>
    `;
    
    return cardEl;
  }
  
  toggleCardExpand(cardId) {
    if (this.expandedCardId === cardId) {
      this.expandedCardId = null;
    } else {
      this.expandedCardId = cardId;
    }
  }
  
  async updateCardStatus(cardId, newStatus, collectionId) {
    try {
      const response = await fetch(`/api/cards/${cardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionId: collectionId,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('更新失败');
      }
      
      const data = await response.json();
      
      // 添加卡片移除动画
      const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
      if (cardEl) {
        cardEl.style.animation = 'cardSlideOut 0.3s ease-out';
      }
      
      this.uiManager.showToast('已更新', 'success');
      
      return data.collection;
      
    } catch (error) {
      this.uiManager.showToast('更新失败: ' + error.message, 'error');
      console.error('Update card status error:', error);
      throw error;
    }
  }
  
  updateStats(collection) {
    if (!collection) {
      document.getElementById('learningCount').textContent = '0';
      document.getElementById('reviewingCount').textContent = '0';
      document.getElementById('masteredCount').textContent = '0';
      return;
    }
    
    const stats = collection.stats || { learning: 0, reviewing: 0, mastered: 0 };
    document.getElementById('learningCount').textContent = stats.learning || 0;
    document.getElementById('reviewingCount').textContent = stats.reviewing || 0;
    document.getElementById('masteredCount').textContent = stats.mastered || 0;
  }
  
  async generatePreview(customPrompt, language, count) {
    try {
      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customPrompt: customPrompt,
          language: language,
          count: count
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成失败');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.cards) {
        throw new Error('返回数据格式错误');
      }
      
      this.previewCards = data.cards;
      return data.cards;
      
    } catch (error) {
      console.error('Generate preview error:', error);
      throw error;
    }
  }
  
  initializeSwipeCards(container, autoSave = false) {
    if (!container) return;
    
    // 创建自动保存回调函数
    const autoSaveCallback = autoSave ? async (cardData) => {
      try {
        const response = await fetch('/api/save-single-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            card: cardData,
            language: this.currentLanguage
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '保存失败');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error('保存失败');
        }
        
        // 显示保存成功提示
        if (this.uiManager) {
          this.uiManager.showToast(`已保存: ${cardData.word}`, 'success');
        }
        
        return data;
      } catch (error) {
        console.error('保存单张卡片失败:', error);
        throw error;
      }
    } : null;
    
    // 初始化SwipeCards组件
    if (!this.swipeCards) {
      this.swipeCards = new SwipeCards(container, this.uiManager, this.currentLanguage, autoSaveCallback);
    }
    
    // 加载卡片
    this.swipeCards.loadCards(this.previewCards);
  }
  
  async saveSelectedCards(language) {
    if (!this.swipeCards) {
      throw new Error('没有可保存的卡片');
    }
    
    const selectedCards = this.swipeCards.getSelectedCards();
    
    if (selectedCards.length === 0) {
      throw new Error('请至少保留一张卡片');
    }
    
    try {
      const response = await fetch('/api/save-selected-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cards: selectedCards,
          language: language
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存失败');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.collection) {
        throw new Error('返回数据格式错误');
      }
      
      // 清空预览数据
      this.previewCards = [];
      this.swipeCards = null;
      
      return data;
      
    } catch (error) {
      console.error('Save selected cards error:', error);
      throw error;
    }
  }
  
  async regenerateCard(cardId, word, language, collectionId) {
    try {
      // 调用AI重新生成卡片
      const response = await fetch('/api/regenerate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardId: cardId,
          word: word,
          language: language,
          collectionId: collectionId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重新生成失败');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.collection) {
        throw new Error('返回数据格式错误');
      }
      
      return data.collection;
      
    } catch (error) {
      console.error('Regenerate card error:', error);
      throw error;
    }
  }
  
  // 渲染文件夹视图
  async renderFolderView() {
    try {
      // 获取所有集合
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('获取集合失败');
      }
      
      const data = await response.json();
      const collections = data.collections || [];
      
      // 按语言分组
      const languageGroups = {};
      collections.forEach(collection => {
        const lang = collection.language || 'unknown';
        if (!languageGroups[lang]) {
          languageGroups[lang] = {
            language: lang,
            collections: [],
            totalCards: 0,
            learning: 0,
            reviewing: 0,
            mastered: 0
          };
        }
        
        languageGroups[lang].collections.push(collection);
        // 安全地访问cards数组
        const cardsCount = (collection.cards && Array.isArray(collection.cards)) ? collection.cards.length : 0;
        languageGroups[lang].totalCards += cardsCount;
        
        if (collection.stats) {
          languageGroups[lang].learning += collection.stats.learning || 0;
          languageGroups[lang].reviewing += collection.stats.reviewing || 0;
          languageGroups[lang].mastered += collection.stats.mastered || 0;
        }
      });
      
      // 渲染文件夹
      const foldersContainer = document.getElementById('languageFolders');
      if (!foldersContainer) return;
      
      if (Object.keys(languageGroups).length === 0) {
        foldersContainer.innerHTML = `
          <div class="empty-folders">
            <i class="bi bi-folder-x"></i>
            <h3>暂无卡片集合</h3>
            <p>点击"生成新卡片"开始创建您的第一个学习集合</p>
          </div>
        `;
        return;
      }
      
      // 语言名称映射
      const languageNames = {
        'english': '英语',
        'german': '德语',
        'japanese': '日语',
        'french': '法语'
      };
      
      // 语言图标映射
      const languageIcons = {
        'english': 'bi-translate',
        'german': 'bi-book',
        'japanese': 'bi-journal-text',
        'french': 'bi-chat-square-text'
      };
      
      foldersContainer.innerHTML = Object.entries(languageGroups).map(([lang, group]) => `
        <div class="folder-card" data-language="${lang}">
          <div class="folder-icon">
            <i class="bi ${languageIcons[lang] || 'bi-folder'}"></i>
          </div>
          <div class="folder-name">${languageNames[lang] || lang}</div>
          <div class="folder-stats">
            <div class="folder-stat">
              <span class="folder-stat-label">
                <i class="bi bi-collection"></i>
                集合数
              </span>
              <span class="folder-stat-value">${group.collections.length}</span>
            </div>
            <div class="folder-stat">
              <span class="folder-stat-label">
                <i class="bi bi-card-text"></i>
                总卡片
              </span>
              <span class="folder-stat-value">${group.totalCards}</span>
            </div>
            <div class="folder-stat">
              <span class="folder-stat-label">
                <i class="bi bi-book"></i>
                学习中
              </span>
              <span class="folder-stat-value">${group.learning}</span>
            </div>
            <div class="folder-stat">
              <span class="folder-stat-label">
                <i class="bi bi-arrow-repeat"></i>
                复习中
              </span>
              <span class="folder-stat-value">${group.reviewing}</span>
            </div>
            <div class="folder-stat">
              <span class="folder-stat-label">
                <i class="bi bi-check-circle"></i>
                已掌握
              </span>
              <span class="folder-stat-value">${group.mastered}</span>
            </div>
          </div>
        </div>
      `).join('');
      
      // 添加点击事件
      foldersContainer.querySelectorAll('.folder-card').forEach(card => {
        card.addEventListener('click', () => {
          const language = card.dataset.language;
          this.showLanguageCards(language);
        });
      });
      
    } catch (error) {
      console.error('渲染文件夹视图失败:', error);
      this.uiManager.showToast('加载失败: ' + error.message, 'error');
    }
  }
  
  // 显示特定语言的卡片列表
  async showLanguageCards(language) {
    try {
      // 隐藏文件夹视图,显示列表视图
      const foldersView = document.getElementById('foldersView');
      const listView = document.getElementById('listView');
      const backBtn = document.getElementById('backToFolders');
      const titleEl = document.getElementById('learningTitle');
      
      if (foldersView) foldersView.style.display = 'none';
      if (listView) listView.style.display = 'block';
      if (backBtn) backBtn.style.display = 'inline-flex';
      
      // 更新标题
      const languageNames = {
        'english': '英语',
        'german': '德语',
        'japanese': '日语',
        'french': '法语'
      };
      if (titleEl) {
        titleEl.textContent = `${languageNames[language] || language} - 学习卡片`;
      }
      
      // 切换视图按钮状态
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === 'list') {
          btn.classList.add('active');
        }
      });
      
      // 获取该语言的集合
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('获取集合失败');
      }
      
      const data = await response.json();
      const collections = data.collections || [];
      
      // 筛选该语言的集合
      const languageCollections = collections.filter(c => c.language === language);
      
      if (languageCollections.length > 0) {
        // 合并所有集合的卡片
        const allCards = [];
        languageCollections.forEach(collection => {
          collection.cards.forEach(card => {
            allCards.push({
              ...card,
              collectionId: collection.id
            });
          });
        });
        
        // 创建一个虚拟集合用于渲染
        const virtualCollection = {
          id: 'virtual',
          language: language,
          cards: allCards,
          stats: {
            learning: allCards.filter(c => c.status === 'learning').length,
            reviewing: allCards.filter(c => c.status === 'reviewing').length,
            mastered: allCards.filter(c => c.status === 'mastered').length
          }
        };
        
        this.renderCards(virtualCollection);
      } else {
        // 清空卡片容器
        const learningContainer = document.getElementById('learningCards');
        const reviewingContainer = document.getElementById('reviewingCards');
        if (learningContainer) learningContainer.innerHTML = '';
        if (reviewingContainer) reviewingContainer.innerHTML = '';
        this.updateStats(null);
      }
      
    } catch (error) {
      console.error('显示语言卡片失败:', error);
      this.uiManager.showToast('加载失败: ' + error.message, 'error');
    }
  }
  
  // 返回文件夹视图
  backToFolders() {
    const foldersView = document.getElementById('foldersView');
    const listView = document.getElementById('listView');
    const backBtn = document.getElementById('backToFolders');
    const titleEl = document.getElementById('learningTitle');
    
    if (foldersView) foldersView.style.display = 'block';
    if (listView) listView.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (titleEl) titleEl.textContent = '学习卡片';
    
    // 切换视图按钮状态
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === 'folders') {
        btn.classList.add('active');
      }
    });
    
    // 重新渲染文件夹视图
    this.renderFolderView();
  }
}