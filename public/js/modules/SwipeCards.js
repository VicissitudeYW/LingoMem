/**
 * 卡片滑动组件
 * 实现卡片的拖拽、滑动和筛选功能
 */
import { MarkdownRenderer } from '../utils/markdown.js';

export class SwipeCards {
  constructor(container, uiManager, language = 'english', autoSaveCallback = null) {
    this.container = container;
    this.uiManager = uiManager;
    this.language = language;
    this.autoSaveCallback = autoSaveCallback;
    this.cards = [];
    this.selectedCards = [];
    this.currentCard = null;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.isDragging = false;
    
    this.init();
  }

  init() {
    // 绑定事件监听器
    this.container.addEventListener('mousedown', this.handleStart.bind(this));
    this.container.addEventListener('mousemove', this.handleMove.bind(this));
    this.container.addEventListener('mouseup', this.handleEnd.bind(this));
    this.container.addEventListener('mouseleave', this.handleEnd.bind(this));
    
    // 触摸事件
    this.container.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.handleEnd.bind(this));
  }

  /**
   * 加载卡片数据
   */
  loadCards(cardsData) {
    this.cards = cardsData;
    this.selectedCards = [];
    this.renderCards();
  }

  /**
   * 渲染卡片
   */
  renderCards() {
    this.container.innerHTML = '';
    
    if (this.cards.length === 0) {
      return;
    }

    // 只渲染前4张卡片(堆叠效果)
    const visibleCards = this.cards.slice(0, 4);
    
    visibleCards.forEach((cardData, index) => {
      const cardElement = this.createCardElement(cardData, index);
      this.container.appendChild(cardElement);
    });
  }

  /**
   * 创建卡片元素
   */
  createCardElement(cardData, index) {
    const card = document.createElement('div');
    card.className = `preview-card word-card lang-${this.language}`;
    card.dataset.cardId = cardData.id;
    card.dataset.index = index;
    
    // 添加滑动指示器
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'swipe-indicator swipe-indicator-left';
    leftIndicator.innerHTML = '<i class="bi bi-folder-plus"></i>';
    
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'swipe-indicator swipe-indicator-right';
    rightIndicator.innerHTML = '<i class="bi bi-trash"></i>';
    
    card.appendChild(leftIndicator);
    card.appendChild(rightIndicator);
    
    // 卡片头部
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `<h3 class="card-word">${cardData.word}</h3>`;
    card.appendChild(header);
    
    // 音标部分
    if (cardData.phonetic) {
      const phonetics = document.createElement('div');
      phonetics.className = 'card-phonetics';
      phonetics.innerHTML = `<span class="card-phonetic">${cardData.phonetic}</span>`;
      card.appendChild(phonetics);
    }
    
    // 卡片主体
    const body = document.createElement('div');
    body.className = 'card-body';
    
    // 难度等级
    if (cardData.level) {
      const level = document.createElement('span');
      level.className = 'card-level';
      level.textContent = cardData.level;
      body.appendChild(level);
    }
    
    // 定义（包含嵌入的例句）
    if (cardData.definitions && cardData.definitions.length > 0) {
      const defTitle = document.createElement('h4');
      defTitle.className = 'card-title';
      defTitle.innerHTML = `<i class="bi bi-book"></i> 释义与例句`;
      body.appendChild(defTitle);
      
      const definitions = document.createElement('div');
      definitions.className = 'card-definitions';
      cardData.definitions.forEach(def => {
        const defItem = document.createElement('div');
        defItem.className = 'definition-item';
        
        let exampleHTML = '';
        if (def.example && def.example.sentence && def.example.translation) {
          exampleHTML = `
            <div class="definition-example">
              <div class="example-sentence">${MarkdownRenderer.render(def.example.sentence)}</div>
              <div class="example-translation">${MarkdownRenderer.render(def.example.translation)}</div>
            </div>
          `;
        }
        
        defItem.innerHTML = `
          <span class="definition-pos">${MarkdownRenderer.render(def.pos)}</span>
          <div class="definition-meaning">${MarkdownRenderer.render(def.meaning)}</div>
          ${exampleHTML}
        `;
        definitions.appendChild(defItem);
      });
      body.appendChild(definitions);
    }
    
    // 额外例句（如果有独立的examples数组）
    if (cardData.examples && cardData.examples.length > 0) {
      const exTitle = document.createElement('h4');
      exTitle.className = 'card-title';
      exTitle.innerHTML = `<i class="bi bi-chat-quote"></i> 更多例句`;
      body.appendChild(exTitle);
      
      const examples = document.createElement('div');
      examples.className = 'card-examples';
      cardData.examples.slice(0, 2).forEach(ex => {
        const exDiv = document.createElement('div');
        exDiv.className = 'example-item';
        exDiv.innerHTML = `
          <div class="example-sentence">${MarkdownRenderer.render(ex.sentence)}</div>
          <div class="example-translation">${MarkdownRenderer.render(ex.translation)}</div>
        `;
        examples.appendChild(exDiv);
      });
      body.appendChild(examples);
    }
    
    // 词源
    if (cardData.etymology) {
      const etymologyDiv = document.createElement('div');
      etymologyDiv.className = 'card-etymology';
      etymologyDiv.innerHTML = `
        <h4 class="card-title"><i class="bi bi-tree"></i> 词源</h4>
        <p>${MarkdownRenderer.render(cardData.etymology)}</p>
      `;
      body.appendChild(etymologyDiv);
    }
    
    // 提示
    if (cardData.tips) {
      const tipsDiv = document.createElement('div');
      tipsDiv.className = 'card-tips';
      tipsDiv.innerHTML = `
        <h4 class="card-title"><i class="bi bi-lightbulb"></i> 学习提示</h4>
        <p>${MarkdownRenderer.render(cardData.tips)}</p>
      `;
      body.appendChild(tipsDiv);
    }
    
    card.appendChild(body);
    
    return card;
  }

  /**
   * 处理拖拽开始
   */
  handleStart(e) {
    const card = e.target.closest('.preview-card');
    if (!card || card.dataset.index !== '0') return;
    
    this.currentCard = card;
    this.isDragging = true;
    
    const point = e.type.includes('mouse') ? e : e.touches[0];
    this.startX = point.clientX;
    this.startY = point.clientY;
    
    card.classList.add('dragging');
    e.preventDefault();
  }

  /**
   * 处理拖拽移动
   */
  handleMove(e) {
    if (!this.isDragging || !this.currentCard) return;
    
    const point = e.type.includes('mouse') ? e : e.touches[0];
    this.currentX = point.clientX - this.startX;
    this.currentY = point.clientY - this.startY;
    
    // 更新卡片位置
    const rotation = this.currentX / 20;
    this.currentCard.style.transform = `translate(${this.currentX}px, ${this.currentY}px) rotate(${rotation}deg)`;
    
    // 显示滑动方向指示
    if (Math.abs(this.currentX) > 50) {
      if (this.currentX > 0) {
        this.currentCard.classList.add('swipe-right');
        this.currentCard.classList.remove('swipe-left');
        this.updateHint('right', true);
      } else {
        this.currentCard.classList.add('swipe-left');
        this.currentCard.classList.remove('swipe-right');
        this.updateHint('left', true);
      }
    } else {
      this.currentCard.classList.remove('swipe-left', 'swipe-right');
      this.updateHint('left', false);
      this.updateHint('right', false);
    }
    
    e.preventDefault();
  }

  /**
   * 处理拖拽结束
   */
  handleEnd(e) {
    if (!this.isDragging || !this.currentCard) return;
    
    this.isDragging = false;
    this.currentCard.classList.remove('dragging');
    
    const threshold = 100;
    
    // 判断滑动方向
    if (Math.abs(this.currentX) > threshold) {
      if (this.currentX > 0) {
        // 右滑 - 丢弃
        this.swipeCard('right');
      } else {
        // 左滑 - 保留
        this.swipeCard('left');
      }
    } else {
      // 回弹
      this.currentCard.style.transform = '';
      this.currentCard.classList.remove('swipe-left', 'swipe-right');
      this.updateHint('left', false);
      this.updateHint('right', false);
    }
    
    this.currentCard = null;
    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * 滑动卡片
   */
  async swipeCard(direction) {
    const card = this.currentCard;
    const cardData = this.cards[0];
    
    // 添加滑动动画
    if (direction === 'left') {
      card.classList.add('swiped-left');
      this.selectedCards.push(cardData);
      
      // 左滑自动保存
      if (this.autoSaveCallback) {
        try {
          await this.autoSaveCallback(cardData);
        } catch (error) {
          console.error('自动保存失败:', error);
          if (this.uiManager) {
            this.uiManager.showToast('保存失败: ' + error.message, 'error');
          }
        }
      }
    } else {
      card.classList.add('swiped-right');
    }
    
    // 更新提示
    this.updateHint('left', false);
    this.updateHint('right', false);
    
    // 移除第一张卡片
    setTimeout(() => {
      this.cards.shift();
      this.renderCards();
      this.updateSelectedCount();
      
      // 检查是否还有卡片
      if (this.cards.length === 0) {
        this.onAllCardsProcessed();
      }
    }, 400);
  }

  /**
   * 更新滑动提示高亮
   */
  updateHint(direction, active) {
    const hint = document.querySelector(`.swipe-hint-${direction}`);
    if (hint) {
      if (active) {
        hint.classList.add('active');
      } else {
        hint.classList.remove('active');
      }
    }
  }

  /**
   * 更新已选中数量
   */
  updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
      countElement.textContent = this.selectedCards.length;
    }
  }

  /**
   * 获取已选中的卡片
   */
  getSelectedCards() {
    return this.selectedCards;
  }

  /**
   * 所有卡片处理完成的回调
   */
  onAllCardsProcessed() {
    if (this.selectedCards.length > 0) {
      // 如果启用了自动保存,显示完成提示
      if (this.autoSaveCallback) {
        const message = `已完成! 保存了 ${this.selectedCards.length} 张卡片`;
        if (this.uiManager) {
          this.uiManager.showToast(message, 'success');
        }
      } else {
        // 显示提示
        const message = `已筛选完成! 保留了 ${this.selectedCards.length} 张卡片\n\n⚠️ 请点击"保存选中的卡片"按钮来保存这些卡片!`;
        if (this.uiManager) {
          this.uiManager.showToast(message, 'success');
        }
        
        // 高亮保存按钮
        const saveBtn = document.getElementById('saveSelectedBtn');
        if (saveBtn) {
          saveBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
          saveBtn.style.boxShadow = '0 0 20px rgba(249, 232, 208, 0.8)';
        }
      }
    } else {
      const message = '没有保留任何卡片';
      if (this.uiManager) {
        this.uiManager.showToast(message, 'error');
      }
    }
  }

  /**
   * 重置组件
   */
  reset() {
    this.cards = [];
    this.selectedCards = [];
    this.currentCard = null;
    this.container.innerHTML = '';
    this.updateSelectedCount();
  }
}