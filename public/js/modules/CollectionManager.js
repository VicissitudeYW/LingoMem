// CollectionManager.js - 集合管理模块
export class CollectionManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.collections = [];
    this.currentCollection = null;
  }
  
  async loadCollections() {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('加载失败');
      }
      
      const data = await response.json();
      this.collections = data.collections;
      return this.collections;
      
    } catch (error) {
      this.uiManager.showToast('加载集合失败: ' + error.message, 'error');
      console.error('Load collections error:', error);
      throw error;
    }
  }
  
  renderCollections() {
    const container = document.getElementById('collectionsList');
    if (!container) {
      console.error('Collections container not found');
      return;
    }
    
    container.innerHTML = '';
    
    if (this.collections.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
          <div style="font-size: 1.125rem;">还没有创建任何单词集合</div>
          <div style="font-size: 0.875rem; margin-top: 0.5rem;">去创建你的第一个单词卡片吧!</div>
        </div>
      `;
      return;
    }
    
    this.collections.forEach(collection => {
      const collectionEl = this.createCollectionElement(collection);
      container.appendChild(collectionEl);
    });
  }
  
  createCollectionElement(collection) {
    const el = document.createElement('div');
    el.className = 'collection-card';
    
    const languageNames = {
      english: '🇬🇧 英语',
      german: '🇩🇪 德语',
      french: '🇫🇷 法语',
      japanese: '🇯🇵 日语'
    };
    
    const date = new Date(collection.createdAt);
    const dateStr = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const stats = collection.stats || { learning: 0, reviewing: 0, mastered: 0 };
    
    el.innerHTML = `
      <div class="collection-header">
        <span class="collection-language">${languageNames[collection.language] || collection.language}</span>
        <span class="collection-date">${dateStr}</span>
      </div>
      
      <div class="collection-stats">
        <div class="collection-stat">
          <span class="stat-value">${stats.learning || 0}</span>
          <span class="stat-label">学习中</span>
        </div>
        <div class="collection-stat">
          <span class="stat-value">${stats.reviewing || 0}</span>
          <span class="stat-label">复习中</span>
        </div>
        <div class="collection-stat">
          <span class="stat-value">${stats.mastered || 0}</span>
          <span class="stat-label">已掌握</span>
        </div>
      </div>
      
      <div class="collection-actions">
        <button class="collection-btn btn-open" data-id="${collection.id}">
          📖 打开
        </button>
        <button class="collection-btn btn-delete" data-id="${collection.id}">
          🗑️ 删除
        </button>
      </div>
    `;
    
    return el;
  }
  
  async openCollection(collectionId) {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      if (!response.ok) {
        throw new Error('加载失败');
      }
      
      const data = await response.json();
      this.currentCollection = data.collection;
      
      this.uiManager.showToast('已加载集合', 'success');
      return this.currentCollection;
      
    } catch (error) {
      this.uiManager.showToast('打开集合失败: ' + error.message, 'error');
      console.error('Open collection error:', error);
      throw error;
    }
  }
  
  async deleteCollection(collectionId) {
    if (!confirm('确定要删除这个集合吗?此操作无法撤销。')) {
      return false;
    }
    
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('删除失败');
      }
      
      this.uiManager.showToast('已删除集合', 'success');
      
      // 如果删除的是当前集合,清空当前集合
      if (this.currentCollection && this.currentCollection.id === collectionId) {
        this.currentCollection = null;
      }
      
      return true;
      
    } catch (error) {
      this.uiManager.showToast('删除失败: ' + error.message, 'error');
      console.error('Delete collection error:', error);
      throw error;
    }
  }
  
  async loadRecentCollection() {
    try {
      const collections = await this.loadCollections();
      if (collections && collections.length > 0) {
        // 加载最新的集合
        const latestCollection = collections[0];
        return await this.openCollection(latestCollection.id);
      }
      return null;
    } catch (error) {
      console.error('Load recent collection error:', error);
      return null;
    }
  }
  
  getCurrentCollection() {
    return this.currentCollection;
  }
  
  setCurrentCollection(collection) {
    this.currentCollection = collection;
  }
}