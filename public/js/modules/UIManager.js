// UIManager.js - UI管理模块(加载状态、通知等)
export class UIManager {
  constructor() {
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');
    this.toast = document.getElementById('toast');
  }
  
  showLoading(message = '加载中...') {
    if (this.loadingText) {
      this.loadingText.textContent = message;
    }
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
    }
  }
  
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }
  
  showToast(message, type = 'info') {
    if (!this.toast) return;
    
    this.toast.textContent = message;
    this.toast.className = 'toast';
    
    if (type === 'error') {
      this.toast.classList.add('error');
    } else if (type === 'success') {
      this.toast.classList.add('success');
    }
    
    this.toast.classList.remove('hidden');
    
    setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 3000);
  }
  
  updateSliderValue(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (!slider || !valueDisplay) return;
    
    slider.addEventListener('input', (e) => {
      valueDisplay.textContent = e.target.value;
      // 更新滑块进度颜色
      const progress = ((e.target.value - 5) / 15) * 100;
      e.target.style.setProperty('--slider-progress', `${progress}%`);
    });
    
    // 初始化进度
    const initialProgress = ((slider.value - 5) / 15) * 100;
    slider.style.setProperty('--slider-progress', `${initialProgress}%`);
  }
  
  updatePlaceholder(elementId, placeholders, language) {
    const element = document.getElementById(elementId);
    if (element && placeholders[language]) {
      element.placeholder = placeholders[language];
    }
  }
}