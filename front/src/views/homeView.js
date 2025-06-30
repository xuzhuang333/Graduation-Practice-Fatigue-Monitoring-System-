// src/views/homeView.js
// 主页视图模块 - 根据用户角色提供不同的功能按钮和界面布局

// 导入API服务
import apiService from '../services/api.js';

// 全局变量，用于存储事件监听器引用和用户信息
let eventHandlers = {};
let currentUser = {
  username: '',
  role: ''
};
// 系统状态数据
let systemStats = {
  systemStatus: '100%',
  activeDrivers: 0,
  totalUsers: 0,
  totalVehicles: 0,
  driverCount: 0,
  monitorCount: 0,
  adminCount: 0,
  fatigueEventCount: 0
};

// 图表实例引用
let userChartInstance = null;
let fatigueChartInstance = null;

/**
 * 根据角色返回对应的功能按钮配置
 * @param {string} role - 用户角色
 * @returns {Array} 功能按钮配置数组
 */
function getFunctionsByRole(role) {
  // 基础功能 - 所有角色都有
  const baseFunctions = [
    {
      id: 'personal-info',
      name: '个人信息',
      icon: 'ri-user-line',
      color: '#4361ee'
    },
    {
      id: 'change-password',
      name: '修改密码',
      icon: 'ri-lock-password-line',
      color: '#FF9F1C'
    }
  ];
  
  // 根据角色添加特定功能
  switch(role) {
    case '驾驶员':
      return [
        ...baseFunctions,
        {
          id: 'fatigue-detection',
          name: '疲劳检测',
          icon: 'ri-eye-line',
          color: '#f72585'
        }
      ];
    case '监管员':
      return [
        ...baseFunctions,
        {
          id: 'fatigue-monitor',
          name: '疲劳监控',
          icon: 'ri-eye-line',
          color: '#f72585'
        }
      ];
    case '管理员':
      return [
        ...baseFunctions,
        {
          id: 'fatigue-monitor',
          name: '疲劳监控',
          icon: 'ri-eye-line',
          color: '#f72585'
        },
        {
          id: 'user-management',
          name: '用户管理',
          icon: 'ri-user-settings-line',
          color: '#3f37c9'
        }
      ];
    default:
      return baseFunctions;
  }
}

/**
 * 创建欢迎部分
 * @param {string} username - 用户名
 * @param {string} role - 用户角色
 * @returns {string} HTML字符串
 */
function createWelcomeSection(username, role) {
  return `
    <div class="welcome-section">
      <h1>欢迎回来，${username}</h1>
      <p class="user-role">您的身份：${role}</p>
      <button class="logout-btn">
        <i class="ri-logout-box-line"></i>
        退出登录
      </button>
    </div>
  `;
}

/**
 * 创建功能按钮部分
 * @param {Array} functions - 功能配置数组
 * @returns {string} HTML字符串
 */
function createFunctionButtons(functions) {
  const functionButtons = functions.map(func => {
    return `
      <div class="function-card" data-function-id="${func.id}">
        <div class="function-icon" style="background-color: ${func.color}">
          <i class="${func.icon}"></i>
        </div>
        <div class="function-name">${func.name}</div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="functions-section">
      <h2>功能菜单</h2>
      <div class="functions-grid">
        ${functionButtons}
      </div>
    </div>
  `;
}

/**
 * 创建快速状态面板
 * @param {string} role - 用户角色
 * @returns {string} HTML字符串
 */
function createDashboardSection(role) {
  // 根据角色显示不同的状态面板
  const isAdmin = role === '管理员';
  const isMonitor = role === '监管员' || role === '管理员';
  
  return `
    <div class="dashboard-section">
      <h2>系统状态</h2>
      <div class="dashboard-grid">
        <div class="dashboard-card system-status">
          <div class="dashboard-value">${systemStats.systemStatus}</div>
          <div class="dashboard-label">系统运行状态</div>
        </div>
        ${isMonitor ? `
        <div class="dashboard-card active-drivers">
          <div class="dashboard-value">${systemStats.activeDrivers}</div>
          <div class="dashboard-label">当前监控驾驶员</div>
        </div>
        ` : ''}
        ${isAdmin ? `
        <div class="charts-container">
          <div class="chart-card">
            <h3>用户统计</h3>
            <div class="chart-wrapper">
              <canvas id="userStatChart" width="400" height="300"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3>疲劳检测统计</h3>
            <div class="chart-wrapper">
              <canvas id="fatigueStatChart" width="400" height="300"></canvas>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * 初始化图表
 */
function initCharts() {
  // 确保Chart.js已加载
  if (!window.Chart) {
    console.error('[homeView] Chart.js未加载');
    loadChartJSScript();
    return;
  }
  
  // 初始化用户统计图表
  initUserChart();
  
  // 初始化疲劳事件图表
  initFatigueChart();
}

/**
 * 动态加载Chart.js
 */
function loadChartJSScript() {
  console.log('[homeView] 正在动态加载Chart.js...');
  
  // 创建script元素加载Chart.js
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
  script.integrity = 'sha256-+8RZJua0aEWg+QVVKg4LEzEEm/8RFez5Tb4JBNiV5xA=';
  script.crossOrigin = 'anonymous';
  
  script.onload = function() {
    console.log('[homeView] Chart.js加载成功');
    initCharts();
  };
  
  script.onerror = function() {
    console.error('[homeView] 无法加载Chart.js');
  };
  
  document.head.appendChild(script);
  
  // 添加CSS
  const style = document.createElement('style');
  style.textContent = `
    .home-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .main-content {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    
    .dashboard-section {
      width: 100%;
      margin-top: 20px;
    }
    
    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }
    
    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      width: 100%;
    }
    
    .chart-card {
      width: 100%;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      padding: 15px;
      margin-bottom: 10px;
    }
    
    .chart-card h3 {
      margin-top: 0;
      color: #333;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .chart-wrapper {
      height: 250px;
      position: relative;
    }
    
    .system-status, .active-drivers {
      background: linear-gradient(135deg, #4b6cb7, #182848);
      color: white;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .system-status .dashboard-value, .active-drivers .dashboard-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .system-status .dashboard-label, .active-drivers .dashboard-label {
      font-size: 14px;
      opacity: 0.9;
    }
    
    @media (min-width: 768px) {
      .charts-container {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .dashboard-grid {
        flex-direction: row;
        flex-wrap: wrap;
      }
      
      .system-status, .active-drivers {
        flex: 1;
        min-width: 200px;
        max-width: 300px;
      }
    }
    
    @media (max-width: 767px) {
      .charts-container {
        grid-template-columns: 1fr;
      }
      
      .chart-wrapper {
        height: 220px;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 初始化用户统计图表
 */
function initUserChart() {
  const ctx = document.getElementById('userStatChart');
  if (!ctx) return;
  
  // 销毁现有图表
  if (userChartInstance) {
    userChartInstance.destroy();
  }
  
  userChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['驾驶员', '监管员', '管理员'],
      datasets: [{
        label: '用户数量',
        data: [
          systemStats.driverCount, 
          systemStats.monitorCount, 
          systemStats.adminCount
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 15,
            padding: 10,
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: `总用户数: ${systemStats.totalUsers}`,
          font: {
            size: 14
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
              return `${label}: ${value} (${percentage})`;
            }
          }
        }
      }
    }
  });
}

/**
 * 初始化疲劳事件图表
 */
function initFatigueChart() {
  const ctx = document.getElementById('fatigueStatChart');
  if (!ctx) return;
  
  // 销毁现有图表
  if (fatigueChartInstance) {
    fatigueChartInstance.destroy();
  }
  
  // 准备图表数据
  const labels = ['监控驾驶员', '疲劳事件', '车辆总数'];
  const data = [systemStats.activeDrivers, systemStats.fatigueEventCount, systemStats.totalVehicles];
  const colors = [
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 205, 86, 0.7)'
  ];
  const borderColors = [
    'rgba(75, 192, 192, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 205, 86, 1)'
  ];
  
  fatigueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '数量',
        data: data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: '系统实时监控数据',
          font: {
            size: 16
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * 加载系统状态统计数据
 */
async function loadSystemStats() {
  try {
    console.log('[homeView] 开始加载系统状态数据');
    
    // 设置默认值，以防API调用失败
    systemStats = {
      systemStatus: '100%',
      activeDrivers: 0,
      totalUsers: 0,
      totalVehicles: 0,
      driverCount: 0,
      monitorCount: 0,
      adminCount: 0,
      fatigueEventCount: 0
    };
    
    // 获取系统状态数据
    try {
      const statsResponse = await apiService.system.getSystemStats();
      if (statsResponse.code === 200 && statsResponse.data) {
        systemStats.systemStatus = statsResponse.data.systemStatus || '100%';
        systemStats.totalVehicles = statsResponse.data.totalVehicles || 0;
      }
    } catch (error) {
      console.error('[homeView] 获取系统状态数据失败:', error);
    }
    
    // 获取用户统计数据 - 必须传递当前用户信息
    try {
      const userStatsResponse = await apiService.system.getUserStats(currentUser);
      if (userStatsResponse.code === 200 && userStatsResponse.data) {
        systemStats.totalUsers = userStatsResponse.data.totalUsers || 0;
        systemStats.driverCount = userStatsResponse.data.driverCount || 0;
        systemStats.monitorCount = userStatsResponse.data.monitorCount || 0;
        systemStats.adminCount = userStatsResponse.data.adminCount || 0;
      }
    } catch (error) {
      console.error('[homeView] 获取用户统计数据失败:', error);
    }
    
    // 获取疲劳事件统计数据
    try {
      const fatigueStatsResponse = await apiService.system.getFatigueStats();
      if (fatigueStatsResponse.code === 200 && fatigueStatsResponse.data) {
        systemStats.activeDrivers = fatigueStatsResponse.data.activeFatigueCount || 0;
        systemStats.fatigueEventCount = fatigueStatsResponse.data.fatigueEventCount || 0;
      }
    } catch (error) {
      console.error('[homeView] 获取疲劳事件统计数据失败:', error);
    }
    
    // 更新仪表板显示
    const homeView = document.getElementById('view-home');
    if (homeView) {
      const dashboardSection = homeView.querySelector('.dashboard-section');
      if (dashboardSection && currentUser.role) {
        dashboardSection.outerHTML = createDashboardSection(currentUser.role);
        
        // 如果是管理员，初始化图表
        if (currentUser.role === '管理员' || currentUser.role === '监管员') {
          initCharts();
        }
      }
    }
    
    console.log('[homeView] 系统状态数据加载完成:', systemStats);
  } catch (error) {
    console.error('[homeView] 加载系统状态数据异常:', error);
  }
}

/**
 * 事件处理：功能按钮点击
 * @param {Event} event - 点击事件
 */
function handleFunctionClick(event) {
  const card = event.target.closest('.function-card');
  if (!card) return;
  
  const functionId = card.dataset.functionId;
  console.log(`[homeView] 功能按钮点击: ${functionId}`);
  
  // 处理不同功能按钮点击
  switch (functionId) {
    case 'personal-info':
      // 跳转到个人信息页面
      if (window.userInfoView && window.userInfoView.init) {
        try {
          window.userInfoView.init({
            username: currentUser.username,
            role: currentUser.role
          });
        } catch (error) {
          console.error('[homeView] 跳转到个人信息页面失败:', error);
        }
      } else {
        console.error('[homeView] 用户信息视图模块未找到');
      }
      break;
    case 'change-password':
      // 跳转到修改密码页面
      if (window.changePasswordView && window.changePasswordView.init) {
        try {
          window.changePasswordView.init({
            username: currentUser.username,
            role: currentUser.role
          });
        } catch (error) {
          console.error('[homeView] 跳转到修改密码页面失败:', error);
        }
      } else {
        console.error('[homeView] 修改密码视图模块未找到');
      }
      break;
    case 'fatigue-detection':
      // 跳转到疲劳检测页面
      console.log('[homeView] 点击疲劳检测按钮，正在加载疲劳检测视图...');
      
      // 先检查是否已经加载了疲劳检测视图模块
      if (window.fatigueDetectionView) {
        console.log('[homeView] 使用预加载的疲劳检测视图模块');
        try {
          window.fatigueDetectionView.init({
            username: currentUser.username,
            role: currentUser.role
          });
        } catch (error) {
          console.error('[homeView] 使用预加载模块初始化疲劳检测视图失败:', error);
        }
      } else {
        // 动态导入疲劳检测视图模块
        console.log('[homeView] 动态导入疲劳检测视图模块');
        import('./fatigueDetectionView.js').then(module => {
          try {
            console.log('[homeView] 疲劳检测视图模块加载成功，初始化中...');
            const fatigueDetectionView = module.default || module;
            fatigueDetectionView.init({
              username: currentUser.username,
              role: currentUser.role
            });
          } catch (error) {
            console.error('[homeView] 跳转到疲劳检测页面失败:', error);
          }
        }).catch(error => {
          console.error('[homeView] 加载疲劳检测视图模块失败:', error);
        });
      }
      break;
    case 'fatigue-monitor':
      // 跳转到疲劳监测页面
      console.log('[homeView] 点击疲劳监测按钮，正在加载疲劳监测视图...');
      
      // 先检查是否已经加载了疲劳监测视图模块
      if (window.fatigueMonitorView) {
        console.log('[homeView] 使用预加载的疲劳监测视图模块');
        try {
          window.fatigueMonitorView.init({
            username: currentUser.username,
            role: currentUser.role
          });
        } catch (error) {
          console.error('[homeView] 使用预加载模块初始化疲劳监测视图失败:', error);
        }
      } else {
        // 动态导入疲劳监测视图模块
        console.log('[homeView] 动态导入疲劳监测视图模块');
        import('./fatigueMonitorView.js').then(module => {
          try {
            console.log('[homeView] 疲劳监测视图模块加载成功，初始化中...');
            const fatigueMonitorView = module.default || module;
            fatigueMonitorView.init({
              username: currentUser.username,
              role: currentUser.role
            });
          } catch (error) {
            console.error('[homeView] 跳转到疲劳监测页面失败:', error);
          }
        }).catch(error => {
          console.error('[homeView] 加载疲劳监测视图模块失败:', error);
        });
      }
      break;
    case 'user-management':
      // 跳转到用户管理页面
      console.log('[homeView] 点击用户管理按钮，正在加载用户管理视图...');
      
      // 先检查是否已经加载了用户管理视图模块
      if (window.userManagementView) {
        console.log('[homeView] 使用预加载的用户管理视图模块');
        try {
          window.userManagementView.init({
            username: currentUser.username,
            role: currentUser.role
          });
        } catch (error) {
          console.error('[homeView] 使用预加载模块初始化用户管理视图失败:', error);
        }
      } else {
        // 动态导入用户管理视图模块
        console.log('[homeView] 动态导入用户管理视图模块');
        import('./userManagementView.js').then(module => {
          try {
            console.log('[homeView] 用户管理视图模块加载成功，初始化中...');
            const userManagementView = module.default || module;
            userManagementView.init({
              username: currentUser.username,
              role: currentUser.role
            });
          } catch (error) {
            console.error('[homeView] 跳转到用户管理页面失败:', error);
          }
        }).catch(error => {
          console.error('[homeView] 加载用户管理视图模块失败:', error);
        });
      }
      break;
    case 'vehicle-management':
      console.log('[homeView] 功能尚未实现: 车辆管理');
      break;
    default:
      console.log('[homeView] 未知功能按钮');
  }
}

/**
 * 事件处理：退出登录
 * @param {Event} event - 点击事件
 */
function handleLogout(event) {
  event.preventDefault();
  console.log('[homeView] 用户点击退出登录');
  
  // 清除用户数据
  currentUser = {
    username: '',
    role: ''
  };
  
  // 隐藏主页视图
  const homeView = document.getElementById('view-home');
  if (homeView) {
    homeView.style.display = 'none';
  }
  
  // 显示登录视图
  const loginView = document.getElementById('view-login');
  if (loginView) {
    loginView.style.display = '';
    
    // 延迟一段时间再初始化登录视图，确保DOM已更新
    setTimeout(() => {
      // 重新初始化登录视图
      if (window.loginView && window.loginView.init) {
        console.log('[homeView] 重新初始化登录视图');
        try {
          window.loginView.init();
        } catch (error) {
          console.error('[homeView] 重新初始化登录视图失败:', error);
        }
      }
    }, 100);
  }
}

/**
 * 添加事件监听器
 */
function addEventListeners() {
  // 功能按钮点击事件
  const functionsGrid = document.querySelector('.functions-grid');
  if (functionsGrid) {
    functionsGrid.addEventListener('click', handleFunctionClick);
    eventHandlers.functionsGrid = handleFunctionClick;
  }
  
  // 退出登录按钮点击事件
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    eventHandlers.logout = handleLogout;
  }
}

/**
 * 移除所有事件监听器
 */
function removeAllEventListeners() {
  // 移除功能按钮的事件监听器
  if (eventHandlers.functionsGrid) {
    const functionsGrid = document.querySelector('.functions-grid');
    if (functionsGrid) {
      functionsGrid.removeEventListener('click', eventHandlers.functionsGrid);
    }
  }
  
  // 移除退出登录按钮的事件监听器
  if (eventHandlers.logout) {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.removeEventListener('click', eventHandlers.logout);
    }
  }
  
  // 重置事件处理器对象
  eventHandlers = {};
  
  // 销毁图表实例
  if (userChartInstance) {
    userChartInstance.destroy();
    userChartInstance = null;
  }
  
  if (fatigueChartInstance) {
    fatigueChartInstance.destroy();
    fatigueChartInstance = null;
  }
}

/**
 * 初始化主页视图
 * @param {Object} user - 用户信息
 * @param {string} user.username - 用户名
 * @param {string} user.role - 用户角色
 */
function init(user) {
  console.log('[homeView] 初始化主页视图', user);
  
  // 保存用户信息
  if (user && user.username && user.role) {
    currentUser = {
      username: user.username,
      role: user.role
    };
  } else {
    console.error('[homeView] 初始化错误: 未提供有效的用户信息');
    return;
  }
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 使用全局视图管理函数隐藏所有其他视图
  if (window.hideAllViews) {
    window.hideAllViews();
  } else {
    // 备用方案：手动隐藏所有视图
    const views = [
      document.getElementById('view-login'),
      document.getElementById('view-register'),
      document.getElementById('view-user-info'),
      document.getElementById('view-change-password'),
      document.getElementById('view-user-management'),
      document.getElementById('view-user-edit')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
  
  // 如果主页视图容器不存在，则创建
  const homeView = document.getElementById('view-home');
  if (!homeView) {
    const main = document.querySelector('main');
    const homeViewElement = document.createElement('div');
    homeViewElement.id = 'view-home';
    main.appendChild(homeViewElement);
  } else {
    homeView.style.display = 'flex';
  }
  
  // 获取功能按钮配置
  const functions = getFunctionsByRole(currentUser.role);
  
  // 创建主页内容
  const homeView2 = document.getElementById('view-home');
  homeView2.innerHTML = `
    <div class="home-container">
      ${createWelcomeSection(currentUser.username, currentUser.role)}
      <div class="main-content">
        ${createFunctionButtons(functions)}
        ${createDashboardSection(currentUser.role)}
      </div>
    </div>
  `;
  
  // 添加事件监听器
  addEventListeners();
  
  // 如果是管理员或监管员，加载系统状态数据
  if (currentUser.role === '管理员' || currentUser.role === '监管员') {
    loadSystemStats();
  }
}

// 导出视图模块的初始化方法
export default {
  init
}; 