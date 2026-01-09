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
    
    const cardLanguage = card.language || this.currentLanguage;
    if (cardLanguage) {
      cardEl.classList.add(`lang-${cardLanguage}`);
    }
    
    // 处理发音 - 日语只保留假名和音调
    let phoneticDisplay = card.phonetic || '';
    if (cardLanguage === 'japanese' && phoneticDisplay) {
      phoneticDisplay = phoneticDisplay.replace(/\/.*?\//g, '').trim();
    }
    
    // 生成预览内容 - 只显示第一个释义
    let previewText = '';
    if (card.definitions && card.definitions.length > 0) {
      const firstDef = card.definitions[0];
      previewText = `<span class="pill-badge pill-pos" style="font-size: 0.7rem; padding: 0.25rem 0.6rem; margin-right: 0.5rem;">${firstDef.pos || ''}</span>${firstDef.meaning}`;
    }
    
    // 构建释义HTML
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
            <span class="pill-badge pill-pos"><i class="bi bi-tag-fill"></i>${MarkdownRenderer.render(def.pos)}</span>
            <div class="definition-meaning">${MarkdownRenderer.render(def.meaning)}</div>
            ${exampleHTML}
          </div>
        `;
      }).join('');
    }
    
    cardEl.innerHTML = `
      <div class="card-header-new">
        <h3 class="card-word">${card.word}</h3>
        ${phoneticDisplay ? `<span class="card-phonetic-new">${phoneticDisplay}</span>` : ''}
      </div>
      
      ${previewText ? `<div class="card-preview">${previewText}</div>` : ''}
      
      <div class="card-body">
        <div class="card-meta">
          ${card.level ? `<span class="pill-badge pill-level"><i class="bi bi-award-fill"></i>${card.level}</span>` : ''}
          ${card.conjugation ? `<span class="pill-badge pill-level"><i class="bi bi-diagram-3"></i>动词</span>` : ''}
          ${card.inflection ? `<span class="pill-badge pill-level"><i class="bi bi-diagram-2"></i>形容词</span>` : ''}
          ${card.declension ? `<span class="pill-badge pill-level"><i class="bi bi-table"></i>变格</span>` : ''}
          ${card.conjugation || card.inflection || card.declension ? `<button class="pill-badge pill-expand" data-expand="grammar"><i class="bi bi-arrows-angle-expand"></i>语法</button>` : ''}
        </div>
        
        ${definitionsHTML ? `<div class="card-definitions">${definitionsHTML}</div>` : ''}
        
        <div class="card-actions-row">
          ${card.examples && card.examples.length > 0 ? `<button class="pill-badge pill-action" data-modal="examples"><i class="bi bi-chat-square-text"></i>更多例句</button>` : ''}
          ${card.etymology ? `<button class="pill-badge pill-action" data-modal="etymology"><i class="bi bi-book"></i>词源</button>` : ''}
          ${card.tips ? `<button class="pill-badge pill-action" data-modal="tips"><i class="bi bi-lightbulb-fill"></i>学习提示</button>` : ''}
        </div>
        
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
      
      <!-- 模态框 -->
      ${card.examples && card.examples.length > 0 ? `
        <div class="card-modal" data-modal-id="examples">
          <div class="card-modal-content">
            <div class="card-modal-header">
              <h4>更多例句</h4>
              <button class="card-modal-close">&times;</button>
            </div>
            <div class="card-modal-body">
              ${card.examples.map(ex => `
                <div class="example-item">
                  <div class="example-sentence">${MarkdownRenderer.render(ex.sentence)}</div>
                  <div class="example-translation">${MarkdownRenderer.render(ex.translation)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}
      
      ${card.etymology ? `
        <div class="card-modal" data-modal-id="etymology">
          <div class="card-modal-content">
            <div class="card-modal-header">
              <h4>词源</h4>
              <button class="card-modal-close">&times;</button>
            </div>
            <div class="card-modal-body">
              <p>${MarkdownRenderer.render(card.etymology)}</p>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${card.tips ? `
        <div class="card-modal" data-modal-id="tips">
          <div class="card-modal-content">
            <div class="card-modal-header">
              <h4>学习提示</h4>
              <button class="card-modal-close">&times;</button>
            </div>
            <div class="card-modal-body">
              <p>${MarkdownRenderer.render(card.tips)}</p>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${card.conjugation || card.inflection || card.declension ? `
        <div class="card-modal" data-modal-id="grammar">
          <div class="card-modal-content">
            <div class="card-modal-header">
              <h4>语法扩展</h4>
              <button class="card-modal-close">&times;</button>
            </div>
            <div class="card-modal-body">
              ${card.conjugation || ''}
              ${card.inflection || ''}
              ${card.declension || ''}
            </div>
          </div>
        </div>
      ` : ''}
    `;
    
    // 直接在整个卡片上添加点击监听器实现展开/折叠
    cardEl.addEventListener('click', (e) => {
      // 检查是否点击了按钮或其他交互元素（检查实际点击的元素）
      let target = e.target;
      while (target && target !== cardEl) {
        if (target.tagName === 'BUTTON' || target.hasAttribute('data-modal') || target.hasAttribute('data-expand')) {
          return; // 让按钮的事件处理器处理
        }
        target = target.parentElement;
      }
      
      // 检查是否点击了音标
      if (e.target.classList.contains('card-phonetic-new')) {
        return;
      }
      
      // 检查是否点击了卡片主体（已展开状态）
      // 只允许点击头部或预览区域来折叠卡片
      if (cardEl.classList.contains('expanded')) {
        const clickedHeader = e.target.closest('.card-header-new');
        const clickedPreview = e.target.closest('.card-preview');
        if (!clickedHeader && !clickedPreview) {
          return; // 点击的不是头部或预览区域，不折叠
        }
      }
      
      // 关闭其他展开的卡片
      document.querySelectorAll('.word-card.expanded').forEach(c => {
        if (c !== cardEl) c.classList.remove('expanded');
      });
      
      // 切换当前卡片
      cardEl.classList.toggle('expanded');
      
      // 显示/隐藏背景遮罩
      const isExpanding = cardEl.classList.contains('expanded');
      
      // 确保卡片展开后可以滚动
      if (isExpanding) {
        setTimeout(() => {
          const cardBody = cardEl.querySelector('.card-body');
          if (cardBody) {
            // 添加点击事件，但不阻止按钮的点击
            cardBody.addEventListener('click', (e) => {
              // 检查是否点击了按钮
              let target = e.target;
              while (target && target !== cardBody) {
                if (target.tagName === 'BUTTON' || target.hasAttribute('data-modal') || target.hasAttribute('data-expand')) {
                  return; // 让按钮的事件处理器处理
                }
                target = target.parentElement;
              }
              // 只有非按钮点击才阻止冒泡
              e.stopPropagation();
            }, true);
            
            // 强制设置样式，确保可以滚动
            cardBody.style.overflowY = 'auto';
            cardBody.style.pointerEvents = 'auto';
            cardBody.style.position = 'relative';
            cardBody.style.zIndex = '1';
          }
        }, 100);
      }
      let backdrop = document.getElementById('cardBackdrop');
      if (isExpanding) {
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.id = 'cardBackdrop';
          backdrop.className = 'card-backdrop';
          document.body.appendChild(backdrop);
          
          backdrop.addEventListener('click', () => {
            document.querySelectorAll('.word-card.expanded').forEach(c => {
              c.classList.remove('expanded');
            });
            backdrop.classList.remove('active');
          });
        }
        backdrop.classList.add('active');
      } else {
        if (backdrop) {
          backdrop.classList.remove('active');
        }
      }
    });
    
    // 添加模态框事件监听 - 将模态框移到body避免定位问题
    const openModal = (modalId) => {
        // 关闭所有已打开的模态框
        document.querySelectorAll('.card-modal.active').forEach(m => {
          m.classList.remove('active');
          setTimeout(() => {
            if (m.parentElement === document.body) {
              document.body.removeChild(m);
            }
          }, 300);
        });
        
        // 获取模态框并克隆到body
        const modal = cardEl.querySelector(`[data-modal-id="${modalId}"]`);
        
        if (modal) {
          const modalClone = modal.cloneNode(true);
          document.body.appendChild(modalClone);
          setTimeout(() => {
            modalClone.classList.add('active');
          }, 10);
          
          // 关闭按钮事件
          const closeBtn = modalClone.querySelector('.card-modal-close');
          if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              modalClone.classList.remove('active');
              setTimeout(() => {
                if (modalClone.parentElement === document.body) {
                  document.body.removeChild(modalClone);
                }
              }, 300);
            });
          }
          
          // 点击背景关闭
          modalClone.addEventListener('click', (e) => {
            if (e.target === modalClone) {
              modalClone.classList.remove('active');
              setTimeout(() => {
                if (modalClone.parentElement === document.body) {
                  document.body.removeChild(modalClone);
                }
              }, 300);
            }
          });
        }
      };
      
      // 添加按钮事件监听器
      const modalButtons = cardEl.querySelectorAll('[data-modal]');
      const expandButtons = cardEl.querySelectorAll('[data-expand]');
      
      // 合并所有按钮处理
      [...modalButtons, ...expandButtons].forEach((btn) => {
        btn.style.pointerEvents = 'auto';
        btn.style.position = 'relative';
        btn.style.zIndex = '10';
        
        btn.onclick = function(e) {
          e.stopPropagation();
          const modalId = btn.dataset.modal || btn.dataset.expand;
          if (modalId) {
            openModal(modalId);
          }
        };
      });
    
    return cardEl;
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
          if (collection.cards && Array.isArray(collection.cards)) {
            collection.cards.forEach(card => {
            allCards.push({
              ...card,
              collectionId: collection.id
            });
            });
          }
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