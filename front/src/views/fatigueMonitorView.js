// src/views/fatigueMonitorView.js
// 疲劳监测视图模块 - 提供疲劳监测日志查看和筛选功能

// 全局变量，用于存储事件监听器引用和用户信息
let eventHandlers = {};
let currentUser = {
  username: '',
  role: ''
};
let fatigueData = []; // 保存原始疲劳日志数据
let filteredData = []; // 保存筛选后的数据

/**
 * 初始化疲劳监测视图
 * @param {Object} user - 用户信息对象
 * @param {string} user.username - 用户名
 * @param {string} user.role - 用户角色
 */
function init(user) {
  console.log('[fatigueMonitorView] 初始化疲劳监测视图', user);
  
  // 保存用户信息
  if (user && user.username && user.role) {
    currentUser = {
      username: user.username,
      role: user.role
    };
  } else {
    console.error('[fatigueMonitorView] 初始化错误: 未提供有效的用户信息');
    return;
  }
  
  // 移除所有已有的事件监听器
  removeAllEventListeners();
  
  // 使用全局视图管理函数隐藏所有其他视图
  if (window.hideAllViews) {
    window.hideAllViews();
  } else {
    // 备用方案：手动隐藏所有视图
    const views = [
      document.getElementById('view-login'),
      document.getElementById('view-register'),
      document.getElementById('view-home'),
      document.getElementById('view-user-info'),
      document.getElementById('view-change-password'),
      document.getElementById('view-user-management'),
      document.getElementById('view-user-edit'),
      document.getElementById('view-fatigue-detection')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
  
  // 获取疲劳监测视图容器
  const fatigueMonitorView = document.getElementById('view-fatigue-monitor');
  if (!fatigueMonitorView) {
    console.error('[fatigueMonitorView] 找不到疲劳监测视图容器');
    return;
  }
  
  // 显示疲劳监测视图
  fatigueMonitorView.style.display = 'flex';
  
  // 创建疲劳监测界面内容
  fatigueMonitorView.innerHTML = `
    <div class="fatigue-monitor-container">
      <div class="fatigue-monitor-header">
        <h1>疲劳监测系统</h1>
        <button id="monitor-back-to-home-btn" class="back-button">
          <i class="ri-arrow-left-line"></i>
          <span>返回主页</span>
        </button>
      </div>

      <div class="fatigue-monitor-content">
        <div class="filter-section">
          <h2>筛选条件</h2>
          <div class="filter-form">
            <div class="form-group">
              <label for="username-filter">用户名</label>
              <input type="text" id="username-filter" placeholder="输入用户名筛选">
            </div>
            <div class="form-group">
              <label for="start-date">开始时间</label>
              <input type="datetime-local" id="start-date">
            </div>
            <div class="form-group">
              <label for="end-date">结束时间</label>
              <input type="datetime-local" id="end-date">
            </div>
            <div class="form-actions">
              <button id="apply-filter-btn" class="primary-btn">应用筛选</button>
              <button id="reset-filter-btn" class="secondary-btn">重置</button>
            </div>
          </div>
        </div>

        <div class="logs-section">
          <h2>疲劳日志</h2>
          <div class="loading-indicator" id="loading-indicator">
            <div class="spinner"></div>
            <p>正在加载数据...</p>
          </div>
          <div class="error-display" id="error-display" style="display:none;">
            <i class="ri-error-warning-line"></i>
            <p class="error-message" id="error-message"></p>
            <button id="reload-btn" class="primary-btn">重新加载</button>
          </div>
          <div class="fatigue-logs" id="fatigue-logs">
            <!-- 这里将动态添加日志条目 -->
          </div>
          <div class="no-data-message" id="no-data-message" style="display:none;">
            <i class="ri-file-search-line"></i>
            <p>没有找到匹配的疲劳日志</p>
          </div>
        </div>
      </div>
    </div>

    <style>
      .fatigue-monitor-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .fatigue-monitor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      
      .fatigue-monitor-header h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      
      .back-button {
        display: flex;
        align-items: center;
        padding: 8px 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      
      .back-button i {
        margin-right: 5px;
      }
      
      .back-button:hover {
        background-color: #45a049;
      }
      
      .fatigue-monitor-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 20px;
        overflow-y: auto;
      }
      
      .filter-section {
        background: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      .filter-section h2 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
        font-size: 1.2rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      .filter-form {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        align-items: flex-end;
      }
      
      .form-group {
        flex: 1;
        min-width: 200px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #555;
      }
      
      .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .form-actions {
        display: flex;
        gap: 10px;
      }
      
      .primary-btn {
        padding: 10px 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .secondary-btn {
        padding: 10px 15px;
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .primary-btn:hover {
        background-color: #45a049;
      }
      
      .secondary-btn:hover {
        background-color: #e9e9e9;
      }
      
      .logs-section {
        background: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        flex: 1;
        position: relative;
      }
      
      .logs-section h2 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
        font-size: 1.2rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      .fatigue-logs {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .fatigue-log-item {
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid;
        background-color: #f9f9f9;
        transition: transform 0.2s;
      }
      
      .fatigue-log-item:hover {
        transform: translateX(5px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      .fatigue-log-status-High {
        border-left-color: #f44336;
      }
      
      .fatigue-log-status-Medium {
        border-left-color: #ff9800;
      }
      
      .fatigue-log-status-Low {
        border-left-color: #4caf50;
      }
      
      .fatigue-log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      
      .fatigue-log-username {
        font-weight: 600;
        color: #333;
      }
      
      .fatigue-log-time {
        color: #666;
        font-size: 0.9rem;
      }
      
      .fatigue-log-status {
        margin-top: 5px;
        font-weight: 600;
      }
      
      .status-High {
        color: #f44336;
      }
      
      .status-Medium {
        color: #ff9800;
      }
      
      .status-Low {
        color: #4caf50;
      }
      
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #4CAF50;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .error-display {
        text-align: center;
        padding: 30px;
      }
      
      .error-display i {
        font-size: 2rem;
        color: #f44336;
        margin-bottom: 15px;
      }
      
      .error-message {
        margin-bottom: 15px;
        color: #666;
      }
      
      .no-data-message {
        text-align: center;
        padding: 30px;
        color: #666;
      }
      
      .no-data-message i {
        font-size: 2rem;
        margin-bottom: 15px;
        color: #999;
      }
    </style>
  `;
  
  // 添加事件监听器
  addEventListeners(fatigueMonitorView);
  
  // 加载疲劳监测数据
  loadFatigueMonitorData();
}

/**
 * 添加事件监听器
 * @param {HTMLElement} viewElement - 视图元素
 */
function addEventListeners(viewElement) {
  // 返回主页按钮
  eventHandlers.backToHomeBtn = viewElement.querySelector('#monitor-back-to-home-btn');
  eventHandlers.backToHomeBtn.addEventListener('click', handleBackToHome);
  
  // 筛选按钮
  eventHandlers.applyFilterBtn = viewElement.querySelector('#apply-filter-btn');
  eventHandlers.applyFilterBtn.addEventListener('click', handleApplyFilter);
  
  // 重置筛选按钮
  eventHandlers.resetFilterBtn = viewElement.querySelector('#reset-filter-btn');
  eventHandlers.resetFilterBtn.addEventListener('click', handleResetFilter);
  
  // 重新加载按钮
  eventHandlers.reloadBtn = viewElement.querySelector('#reload-btn');
  eventHandlers.reloadBtn.addEventListener('click', loadFatigueMonitorData);
}

/**
 * 处理应用筛选按钮点击事件
 */
function handleApplyFilter() {
  const usernameFilter = document.getElementById('username-filter').value.trim().toLowerCase();
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  console.log(`[fatigueMonitorView] 应用筛选: 用户名=${usernameFilter}, 开始时间=${startDate}, 结束时间=${endDate}`);
  
  // 筛选数据
  filteredData = fatigueData.filter(item => {
    // 用户名筛选
    if (usernameFilter && !item.username.toLowerCase().includes(usernameFilter)) {
      return false;
    }
    
    // 时间段筛选
    const itemTime = new Date(item.time);
    
    if (startDate && new Date(startDate) > itemTime) {
      return false;
    }
    
    if (endDate && new Date(endDate) < itemTime) {
      return false;
    }
    
    return true;
  });
  
  // 更新界面
  renderFatigueData(filteredData);
}

/**
 * 处理重置筛选按钮点击事件
 */
function handleResetFilter() {
  document.getElementById('username-filter').value = '';
  document.getElementById('start-date').value = '';
  document.getElementById('end-date').value = '';
  
  filteredData = [...fatigueData];
  renderFatigueData(filteredData);
  
  console.log('[fatigueMonitorView] 筛选条件已重置');
}

/**
 * 加载疲劳监测数据
 */
async function loadFatigueMonitorData() {
  // 显示加载中状态
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorDisplay = document.getElementById('error-display');
  const noDataMessage = document.getElementById('no-data-message');
  const fatigueLogs = document.getElementById('fatigue-logs');
  
  loadingIndicator.style.display = 'flex';
  errorDisplay.style.display = 'none';
  noDataMessage.style.display = 'none';
  fatigueLogs.innerHTML = '';
  
  try {
    console.log('[fatigueMonitorView] 开始加载疲劳监测数据');
    
    // 调用API获取疲劳监测数据
    const response = await fetch('http://192.168.70.167:8000/api/v2/showfatigue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // 无需传递参数
    });
    
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[fatigueMonitorView] API响应数据:', result);
    
    if (result.code !== 200 || !result.data) {
      throw new Error(result.message || '获取数据失败');
    }
    
    // 保存数据
    fatigueData = result.data;
    filteredData = [...fatigueData];
    
    // 渲染数据
    renderFatigueData(filteredData);
    
  } catch (error) {
    console.error('[fatigueMonitorView] 加载疲劳监测数据失败:', error);
    showError(error.message);
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

/**
 * 渲染疲劳数据
 * @param {Array} data - 疲劳数据数组
 */
function renderFatigueData(data) {
  const fatigueLogs = document.getElementById('fatigue-logs');
  const noDataMessage = document.getElementById('no-data-message');
  
  // 清空日志区域
  fatigueLogs.innerHTML = '';
  
  if (!data || data.length === 0) {
    noDataMessage.style.display = 'flex';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  // 对数据按时间降序排序
  const sortedData = [...data].sort((a, b) => 
    new Date(b.time).getTime() - new Date(a.time).getTime()
  );
  
  // 创建日志条目
  sortedData.forEach(log => {
    const logTime = new Date(log.time);
    const formattedTime = `${logTime.toLocaleDateString()} ${logTime.toLocaleTimeString()}`;
    
    const logItem = document.createElement('div');
    logItem.className = `fatigue-log-item fatigue-log-status-${log.status}`;
    logItem.innerHTML = `
      <div class="fatigue-log-header">
        <div class="fatigue-log-username">${log.username}</div>
        <div class="fatigue-log-time">${formattedTime}</div>
      </div>
      <div class="fatigue-log-status status-${log.status}">
        疲劳等级: ${getStatusText(log.status)}
      </div>
    `;
    
    fatigueLogs.appendChild(logItem);
  });
  
  console.log(`[fatigueMonitorView] 渲染了 ${sortedData.length} 条疲劳日志`);
}

/**
 * 获取疲劳状态文本
 * @param {string} status - 疲劳状态
 * @returns {string} 疲劳状态的中文文本
 */
function getStatusText(status) {
  switch(status) {
    case 'Low': return '低（精神状态良好）';
    case 'Medium': return '中（出现疲劳迹象）';
    case 'High': return '高（严重疲劳）';
    default: return status;
  }
}

/**
 * 显示错误信息
 * @param {string} message - 错误消息
 */
function showError(message) {
  const errorDisplay = document.getElementById('error-display');
  const errorMessage = document.getElementById('error-message');
  
  errorDisplay.style.display = 'flex';
  errorMessage.textContent = message || '加载数据时发生错误';
}

/**
 * 处理返回主页按钮点击事件
 */
function handleBackToHome() {
  console.log('[fatigueMonitorView] 点击返回主页按钮');
  
  // 清理所有资源
  cleanup();
  
  // 返回主页
  if (window.homeView && typeof window.homeView.init === 'function') {
    window.homeView.init({
      username: currentUser.username,
      role: currentUser.role
    });
    console.log('[fatigueMonitorView] 成功返回主页');
  } else {
    console.error('[fatigueMonitorView] 主页视图模块未找到或未正确加载');
    
    // 备用方案：动态导入主页视图模块
    import('./homeView.js').then(module => {
      try {
        const homeView = module.default || module;
        homeView.init({
          username: currentUser.username,
          role: currentUser.role
        });
        console.log('[fatigueMonitorView] 成功返回主页 (动态导入)');
      } catch (error) {
        console.error('[fatigueMonitorView] 返回主页失败:', error);
      }
    }).catch(error => {
      console.error('[fatigueMonitorView] 加载主页视图模块失败:', error);
    });
  }
}

/**
 * 清理资源
 */
function cleanup() {
  console.log('[fatigueMonitorView] 清理资源');
  
  // 移除所有事件监听器
  removeAllEventListeners();
}

/**
 * 移除所有事件监听器
 */
function removeAllEventListeners() {
  // 移除按钮的事件监听器
  if (eventHandlers.backToHomeBtn) {
    eventHandlers.backToHomeBtn.removeEventListener('click', handleBackToHome);
  }
  
  if (eventHandlers.applyFilterBtn) {
    eventHandlers.applyFilterBtn.removeEventListener('click', handleApplyFilter);
  }
  
  if (eventHandlers.resetFilterBtn) {
    eventHandlers.resetFilterBtn.removeEventListener('click', handleResetFilter);
  }
  
  if (eventHandlers.reloadBtn) {
    eventHandlers.reloadBtn.removeEventListener('click', loadFatigueMonitorData);
  }
  
  // 重置事件处理器对象
  eventHandlers = {};
}

// 导出模块接口
export {
  init,
  cleanup
}; 