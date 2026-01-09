// LingoMem - 单词背诵系统前端应用 (重构版)
import { ThemeManager } from './modules/ThemeManager.js';
import { UIManager } from './modules/UIManager.js';
import { Router } from './modules/Router.js';
import { CardManager } from './modules/CardManager.js';
import { CollectionManager } from './modules/CollectionManager.js';
import { ProgressManager } from './modules/ProgressManager.js';

class LingoMemApp {
  constructor() {
    this.currentLanguage = 'english';
    
    // 初始化各个管理器
    this.themeManager = new ThemeManager();
    this.uiManager = new UIManager();
    this.cardManager = new CardManager(this.uiManager, this.currentLanguage);
    this.collectionManager = new CollectionManager(this.uiManager);
    this.progressManager = new ProgressManager(this.uiManager);
    this.router = new Router((route) => this.onRouteChange(route));
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateUI();
  }
  
  onRouteChange(route) {
    // 根据路由加载数据
    if (route === 'cards') {
      // 默认显示文件夹视图
      this.cardManager.renderFolderView();
    } else if (route === 'collections') {
      this.collectionManager.loadCollections().then(() => {
        this.collectionManager.renderCollections();
      });
    } else if (route === 'progress') {
      this.progressManager.renderProgressPage();
    }
  }
  
  setupEventListeners() {
    // 导航链接点击
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = e.currentTarget.dataset.route;
        this.router.navigateTo(route);
      });
    });
    
    // Logo点击返回学习卡片页
    document.getElementById('navBrandHome')?.addEventListener('click', () => {
      this.router.navigateTo('cards');
    });
    
    // 语言选择
    const languageSelect = document.getElementById('languageSelect');
    languageSelect?.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      this.cardManager.setLanguage(this.currentLanguage);
      this.updateUI();
      this.progressManager.loadProgress(this.currentLanguage);
      
      // 重新渲染卡片以应用新的语言类
      const collection = this.collectionManager.getCurrentCollection();
      if (collection) {
        this.cardManager.renderCards(collection);
      }
    });
    
    // 滑块数值更新
    this.uiManager.updateSliderValue('recommendCount', 'recommendCountValue');
    
    // 生成卡片预览按钮
    document.getElementById('generatePreviewBtn')?.addEventListener('click', () => {
      this.generatePreview();
    });
    
    // 保存选中的卡片按钮
    document.getElementById('saveSelectedBtn')?.addEventListener('click', () => {
      this.saveSelectedCards();
    });
    
    // 返回首页按钮(从预览页面)
    document.getElementById('backFromPreview')?.addEventListener('click', () => {
      this.router.navigateTo('home');
    });
    
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.cardManager.switchTab(tab);
        const collection = this.collectionManager.getCurrentCollection();
        if (collection) {
          this.cardManager.renderCards(collection);
        }
      });
    });
    
    // 导航按钮
    document.getElementById('showProgressBtn')?.addEventListener('click', () => {
      this.router.navigateTo('progress');
    });
    
    document.getElementById('backFromProgress')?.addEventListener('click', () => {
      this.router.navigateTo('home');
    });
    
    // 学习卡片页面的"生成新卡片"按钮
    document.getElementById('createCardsBtn2')?.addEventListener('click', () => {
      this.router.navigateTo('create');
    });
    
    // 主题切换
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      this.themeManager.toggle();
    });
    
    
    // 卡片操作事件委托
    const setupCardListeners = (containerId) => {
      document.getElementById(containerId)?.addEventListener('click', async (e) => {
        const card = e.target.closest('.word-card');
        if (!card) return;
        
        const cardId = card.dataset.cardId;
        const actionBtn = e.target.closest('.card-action-btn');
        
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.dataset.action;
          
          // 处理重新生成按钮
          if (action === 'regenerate') {
            const collection = this.collectionManager.getCurrentCollection();
            if (!collection) {
              this.uiManager.showToast('无法获取当前集合', 'error');
              return;
            }
            
            // 找到对应的卡片
            const cardData = collection.cards.find(c => c.id === cardId);
            if (!cardData) {
              this.uiManager.showToast('找不到该卡片', 'error');
              return;
            }
            
            this.uiManager.showLoading('正在重新生成卡片...');
            
            try {
              const updatedCollection = await this.cardManager.regenerateCard(
                cardId,
                cardData.word,
                cardData.language || this.currentLanguage,
                collection.id
              );
              
              if (updatedCollection) {
                this.collectionManager.setCurrentCollection(updatedCollection);
                this.uiManager.hideLoading();
                this.uiManager.showToast('卡片已重新生成', 'success');
                this.cardManager.renderCards(updatedCollection);
              }
            } catch (error) {
              this.uiManager.hideLoading();
              this.uiManager.showToast('重新生成失败: ' + error.message, 'error');
            }
            return;
          }
          
          // 处理其他状态按钮
          let newStatus = 'learning';
          
          if (action === 'know') {
            newStatus = 'reviewing';
          } else if (action === 'review' || action === 'forget') {
            newStatus = 'learning';
          }
          
          const collection = this.collectionManager.getCurrentCollection();
          if (collection) {
            const updatedCollection = await this.cardManager.updateCardStatus(
              cardId,
              newStatus,
              collection.id
            );
            
            if (updatedCollection) {
              this.collectionManager.setCurrentCollection(updatedCollection);
              setTimeout(() => {
                this.cardManager.renderCards(updatedCollection);
              }, 300);
            }
          }
        }
        // 注意：卡片展开/折叠功能已在CardManager.createCardElement中通过事件监听器处理
      });
    };
    
    setupCardListeners('learningCards');
    setupCardListeners('reviewingCards');
    
    // 视图切换按钮
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // 切换视图
        const foldersView = document.getElementById('foldersView');
        const listView = document.getElementById('listView');
        const backBtn = document.getElementById('backToFolders');
        const titleEl = document.getElementById('learningTitle');
        
        if (view === 'folders') {
          if (foldersView) foldersView.style.display = 'block';
          if (listView) listView.style.display = 'none';
          if (backBtn) backBtn.style.display = 'none';
          if (titleEl) titleEl.textContent = '学习卡片';
          this.cardManager.renderFolderView();
        } else if (view === 'list') {
          if (foldersView) foldersView.style.display = 'none';
          if (listView) listView.style.display = 'block';
          
          // 加载最近的集合
          const collection = this.collectionManager.getCurrentCollection();
          if (!collection) {
            this.collectionManager.loadRecentCollection().then(col => {
              if (col) {
                this.cardManager.renderCards(col);
              }
            });
          } else {
            this.cardManager.renderCards(collection);
          }
        }
      });
    });
    
    // 返回文件夹按钮
    document.getElementById('backToFolders')?.addEventListener('click', () => {
      this.cardManager.backToFolders();
    });
  }
  
  async generatePreview() {
    const customPrompt = document.getElementById('customPrompt')?.value.trim();
    const slider = document.getElementById('recommendCount');
    const count = parseInt(slider?.value || 10);
    
    if (!customPrompt) {
      this.uiManager.showToast('请输入你想学习的单词类型描述', 'error');
      return;
    }
    
    this.uiManager.showLoading(`AI 正在为你生成 ${count} 张卡片预览...`);
    
    try {
      const cards = await this.cardManager.generatePreview(
        customPrompt,
        this.currentLanguage,
        count
      );
      
      this.uiManager.hideLoading();
      this.uiManager.showToast(`已生成 ${cards.length} 张卡片预览`, 'success');
      
      // 切换到预览页面
      this.router.navigateTo('preview');
      const container = document.getElementById('previewCards');
      // 启用自动保存功能
      this.cardManager.initializeSwipeCards(container, true);
      
    } catch (error) {
      this.uiManager.hideLoading();
      this.uiManager.showToast('生成失败: ' + error.message, 'error');
    }
  }
  
  async saveSelectedCards() {
    this.uiManager.showLoading('正在保存选中的卡片...');
    
    try {
      const data = await this.cardManager.saveSelectedCards(this.currentLanguage);
      
      this.collectionManager.setCurrentCollection(data.collection);
      
      this.uiManager.hideLoading();
      this.uiManager.showToast(`成功保存 ${data.savedCount} 张卡片`, 'success');
      
      // 清空输入框
      const customPrompt = document.getElementById('customPrompt');
      if (customPrompt) {
        customPrompt.value = '';
      }
      
      // 切换到学习区
      this.router.navigateTo('cards');
      
    } catch (error) {
      this.uiManager.hideLoading();
      this.uiManager.showToast(error.message || '保存失败', 'error');
    }
  }
  
  updateUI() {
    // 更新自定义prompt输入框的占位符
    const placeholders = {
      english: '描述你想学习的单词类型,例如:\n• 请给我推荐一些 A1 水平的关于美食的英语词\n• 我想学习商务英语中常用的动词',
      german: '描述你想学习的单词类型,例如:\n• 请给我推荐一些 A1 水平的关于美食的德语词\n• 我想学习商务德语中常用的动词',
      french: '描述你想学习的单词类型,例如:\n• 请给我推荐一些 A1 水平的关于美食的法语词\n• 我想学习商务法语中常用的动词',
      japanese: '描述你想学习的单词类型,例如:\n• 请给我推荐一些 A1 水平的关于美食的日语词\n• 我想学习商务日语中常用的动词'
    };
    
    this.uiManager.updatePlaceholder('customPrompt', placeholders, this.currentLanguage);
  }
}

// 添加卡片移除动画
const style = document.createElement('style');
style.textContent = `
  @keyframes cardSlideOut {
    to {
      opacity: 0;
      transform: translateX(-100px);
    }
  }
`;
document.head.appendChild(style);

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new LingoMemApp();
});