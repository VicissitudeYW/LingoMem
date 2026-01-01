// ThemeManager.js - 主题管理模块
export class ThemeManager {
  constructor() {
    // 主题模式: 'light', 'dark', 'auto'
    this.themeMode = localStorage.getItem('themeMode') || 'auto';
    this.systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 监听系统主题变化
    this.systemDarkMode.addEventListener('change', (e) => {
      if (this.themeMode === 'auto') {
        this.applyTheme();
      }
    });
    
    this.applyTheme();
  }
  
  applyTheme() {
    let isDark = false;
    
    if (this.themeMode === 'dark') {
      isDark = true;
    } else if (this.themeMode === 'light') {
      isDark = false;
    } else { // auto
      isDark = this.systemDarkMode.matches;
    }
    
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    this.updateThemeIcon();
  }
  
  updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    
    // 根据当前模式显示不同图标
    if (this.themeMode === 'light') {
      icon.className = 'bi bi-sun-fill';
      themeToggle.title = '浅色模式';
    } else if (this.themeMode === 'dark') {
      icon.className = 'bi bi-moon-stars-fill';
      themeToggle.title = '深色模式';
    } else { // auto
      icon.className = 'bi bi-circle-half';
      themeToggle.title = '跟随系统';
    }
  }
  
  toggle() {
    // 循环切换: light -> dark -> auto -> light
    if (this.themeMode === 'light') {
      this.themeMode = 'dark';
    } else if (this.themeMode === 'dark') {
      this.themeMode = 'auto';
    } else { // auto
      this.themeMode = 'light';
    }
    
    localStorage.setItem('themeMode', this.themeMode);
    this.applyTheme();
  }
  
  getThemeMode() {
    return this.themeMode;
  }
  
  isDarkMode() {
    if (this.themeMode === 'dark') {
      return true;
    } else if (this.themeMode === 'light') {
      return false;
    } else { // auto
      return this.systemDarkMode.matches;
    }
  }
}