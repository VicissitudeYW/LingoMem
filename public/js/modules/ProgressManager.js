// ProgressManager.js - 进度管理模块
export class ProgressManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
  }
  
  async loadProgress(language) {
    try {
      const response = await fetch(`/api/progress/${language}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      console.log('Learning progress:', data.stats);
      return data.stats;
      
    } catch (error) {
      console.error('Load progress error:', error);
      return null;
    }
  }
  
  async renderProgressPage() {
    try {
      const response = await fetch('/api/progress');
      if (!response.ok) {
        throw new Error('获取进度失败');
      }
      
      const data = await response.json();
      const progress = data.progress;
      
      const container = document.getElementById('progressContent');
      if (!container) return;
      
      const levelNames = {
        beginner: '初学者 (A1-A2)',
        elementary: '基础 (A2-B1)',
        intermediate: '中级 (B1-B2)',
        'upper-intermediate': '中高级 (B2-C1)',
        advanced: '高级 (C1-C2)',
        proficient: '精通 (C2)'
      };
      
      const languageNames = {
        english: '🇬🇧 英语',
        german: '🇩🇪 德语',
        french: '🇫🇷 法语',
        japanese: '🇯🇵 日语'
      };
      
      // 计算总体统计
      let totalWords = 0;
      let totalLanguages = 0;
      Object.keys(progress.languages).forEach(lang => {
        totalWords += progress.languages[lang].totalWords || 0;
        totalLanguages++;
      });
      
      // 生成概览卡片
      let html = '<div class="progress-overview">';
      html += `
        <div class="progress-card">
          <div class="progress-card-header">
            <span class="progress-card-icon">📚</span>
            <span class="progress-card-title">学习语言</span>
          </div>
          <div class="progress-card-value">${totalLanguages}</div>
          <div class="progress-card-label">种语言</div>
        </div>
        
        <div class="progress-card">
          <div class="progress-card-header">
            <span class="progress-card-icon">✍️</span>
            <span class="progress-card-title">累计单词</span>
          </div>
          <div class="progress-card-value">${totalWords}</div>
          <div class="progress-card-label">个单词</div>
        </div>
      `;
      html += '</div>';
      
      // 生成各语言详细进度
      Object.keys(progress.languages).forEach(lang => {
        const stats = progress.languages[lang];
        
        html += `
          <div class="language-progress">
            <div class="language-progress-header">
              <div class="language-name">${languageNames[lang] || lang}</div>
              <div class="language-level">${levelNames[stats.level] || stats.level}</div>
            </div>
            
            <div class="language-stats">
              <div class="language-stat">
                <span class="language-stat-value">${stats.totalWords || 0}</span>
                <span class="language-stat-label">已学单词</span>
              </div>
              <div class="language-stat">
                <span class="language-stat-value">${stats.level || 'A1'}</span>
                <span class="language-stat-label">当前等级</span>
              </div>
            </div>
          </div>
        `;
      });
      
      // 添加柱状图
      html += `
        <div class="chart-container">
          <div class="chart-title">📊 各语言学习对比</div>
          <div class="chart-wrapper">
            <div class="bar-chart">
      `;
      
      Object.keys(progress.languages).forEach(lang => {
        const stats = progress.languages[lang];
        const height = Math.max(20, (stats.totalWords / Math.max(totalWords, 100)) * 100);
        html += `
          <div class="bar-item">
            <div class="bar" style="height: ${height}%">
              <span class="bar-value">${stats.totalWords || 0}</span>
            </div>
            <div class="bar-label">${languageNames[lang] || lang}</div>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
      
      html += `
        <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
          <div style="color: var(--text-tertiary); font-size: 0.875rem;">
            最后更新: ${new Date(progress.lastUpdated).toLocaleString('zh-CN')}
          </div>
        </div>
      `;
      
      container.innerHTML = html;
      
    } catch (error) {
      const container = document.getElementById('progressContent');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
            <div style="font-size: 1.125rem;">暂无学习数据</div>
            <div style="font-size: 0.875rem; margin-top: 0.5rem;">开始创建单词卡片来记录你的学习进度吧!</div>
          </div>
        `;
      }
      console.error('Render progress error:', error);
    }
  }
}