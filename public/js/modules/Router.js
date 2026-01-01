// Router.js - 路由管理模块
export class Router {
  constructor(onRouteChange) {
    this.currentRoute = 'cards';
    this.onRouteChange = onRouteChange;
    this.init();
  }
  
  init() {
    // 监听浏览器后退/前进按钮
    window.addEventListener('popstate', (e) => {
      const route = e.state?.route || 'cards';
      this.navigateTo(route, false);
    });
    
    // 初始化路由 - 默认为学习卡片页
    const hash = window.location.hash.slice(1) || 'cards';
    this.navigateTo(hash, true);
  }
  
  navigateTo(route, pushState = true) {
    this.currentRoute = route;
    
    // 更新浏览器历史
    if (pushState) {
      window.history.pushState({ route }, '', `#${route}`);
    }
    
    // 显示对应的section
    this.showSection(route);
    
    // 更新导航链接高亮
    this.updateNavLinks(route);
    
    // 触发路由变化回调
    if (this.onRouteChange) {
      this.onRouteChange(route);
    }
  }
  
  updateNavLinks(currentRoute) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkRoute = link.dataset.route;
      if (linkRoute === currentRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  showSection(sectionName) {
    // 路由映射到section
    const routeToSection = {
      'cards': 'learning',      // 学习卡片页（默认）
      'create': 'create',       // 生成卡片页
      'progress': 'progress',   // 学习进度页
      'preview': 'preview'      // 卡片预览页
    };
    
    const targetSection = routeToSection[sectionName] || 'learning';
    
    document.querySelectorAll('.section').forEach(section => {
      if (section.id === `${targetSection}Section`) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });
  }
  
  getCurrentRoute() {
    return this.currentRoute;
  }
}