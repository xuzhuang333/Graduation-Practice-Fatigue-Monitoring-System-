// src/renderer.js
// 渲染进程入口文件

// 全局视图管理函数
window.hideAllViews = function() {
  const allViews = [
    'view-login',
    'view-register', 
    'view-home',
    'view-user-info',
    'view-change-password',
    'view-user-management',
    'view-user-edit',
    'view-fatigue-detection',
    'view-fatigue-monitor'
  ];
  
  allViews.forEach(viewId => {
    const view = document.getElementById(viewId);
    if (view) {
      view.style.display = 'none';
    }
  });
};

// 全局视图显示函数
window.showView = function(viewId) {
  // 先隐藏所有视图
  window.hideAllViews();
  
  // 显示指定视图
  const view = document.getElementById(viewId);
  if (view) {
    view.style.display = 'flex';
  }
};

// 添加错误处理
try {
  // 导入视图模块
  import('./views/loginView.js').then(module => {
    window.loginView = module.default || module;
    console.log('[renderer] 登录视图模块已加载');
    
    // 页面加载完成后的初始化
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }).catch(error => {
    console.error('[renderer] 加载登录视图模块失败:', error);
    showError(`加载登录视图模块失败: ${error.message}`);
  });
  
  // 预加载注册视图模块
  import('./views/registerView.js').then(module => {
    window.registerView = module.default || module;
    console.log('[renderer] 注册视图模块已加载');
  }).catch(error => {
    console.error('[renderer] 加载注册视图模块失败:', error);
    showError(`加载注册视图模块失败: ${error.message}`);
  });
  
  // 预加载主页视图模块
  import('./views/homeView.js').then(module => {
    window.homeView = module.default || module;
    console.log('[renderer] 主页视图模块已加载');
  }).catch(error => {
    console.error('[renderer] 加载主页视图模块失败:', error);
    showError(`加载主页视图模块失败: ${error.message}`);
  });
  
  // 预加载用户信息视图模块
  import('./views/userInfoView.js').then(module => {
    window.userInfoView = module.default || module;
    console.log('[renderer] 用户信息视图模块已加载');
  }).catch(error => {
    console.error('[renderer] 加载用户信息视图模块失败:', error);
    showError(`加载用户信息视图模块失败: ${error.message}`);
  });
  
  // 预加载修改密码视图模块
  import('./views/changePasswordView.js').then(module => {
    window.changePasswordView = module.default || module;
    console.log('[renderer] 修改密码视图模块已加载');
  }).catch(error => {
    console.error('[renderer] 加载修改密码视图模块失败:', error);
    showError(`加载修改密码视图模块失败: ${error.message}`);
  });
  
  // 预加载用户管理视图模块
  import('./views/userManagementView.js').then(module => {
    console.log('[renderer] 用户管理视图模块加载成功，模块内容:', Object.keys(module));
    window.userManagementView = module.default || module;
    console.log('[renderer] 用户管理视图模块已加载到全局对象');
  }).catch(error => {
    console.error('[renderer] 加载用户管理视图模块失败:', error);
    // 非关键模块，不显示错误
    console.log('[renderer] 这是非关键模块，将在需要时动态加载');
  });
  
  // 预加载用户编辑视图模块
  import('./views/userEditView.js').then(module => {
    window.userEditView = module.default || module;
    console.log('[renderer] 用户编辑视图模块已加载到全局对象');
  }).catch(error => {
    console.error('[renderer] 加载用户编辑视图模块失败:', error);
    // 非关键模块，不显示错误
    console.log('[renderer] 这是非关键模块，将在需要时动态加载');
  });
  
  // 预加载疲劳检测视图模块
  import('./views/fatigueDetectionView.js').then(module => {
    window.fatigueDetectionView = module.default || module;
    console.log('[renderer] 疲劳检测视图模块已加载到全局对象');
  }).catch(error => {
    console.error('[renderer] 加载疲劳检测视图模块失败:', error);
    // 非关键模块，不显示错误
    console.log('[renderer] 这是非关键模块，将在需要时动态加载');
  });
  
  // 预加载疲劳监测视图模块
  import('./views/fatigueMonitorView.js').then(module => {
    window.fatigueMonitorView = module.default || module;
    console.log('[renderer] 疲劳监测视图模块已加载到全局对象');
  }).catch(error => {
    console.error('[renderer] 加载疲劳监测视图模块失败:', error);
    // 非关键模块，不显示错误
    console.log('[renderer] 这是非关键模块，将在需要时动态加载');
  });
} catch (error) {
  console.error('[renderer] 初始化失败:', error);
  showError(`初始化失败: ${error.message}`);
}

// 初始化应用
function initApp() {
  console.log('[renderer] 页面加载完成，开始初始化');
  
  try {
    // 初始化登录视图
    setTimeout(() => {
      if (window.loginView?.init) {
        window.loginView.init();
        console.log('[renderer] 登录视图已初始化');
      } else {
        console.error('[renderer] 登录视图未找到或未正确加载');
        showError('登录视图未找到或未正确加载');
      }
    }, 100);
  } catch (error) {
    console.error('[renderer] 初始化登录视图失败:', error);
    showError(`初始化登录视图失败: ${error.message}`);
  }
}

// 显示错误信息
function showError(message) {
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.style.display = 'block';
    errorDisplay.innerHTML += `<p>${message}</p>`;
  }
}
