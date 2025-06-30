// src/views/userManagementView.js
// 用户管理视图模块 - 管理员用来管理所有用户

// 全局变量，用于存储事件监听器引用和用户数据
let eventHandlers = {};
let usersData = [];
let filteredUsers = [];
let currentUserInfo = null; // 保存当前用户信息

/**
 * 初始化用户管理视图
 * @param {Object} admin - 管理员用户信息
 */
function init(admin) {
  console.log('[userManagementView] 初始化用户管理视图', admin);
  
  if (!admin || admin.role !== '管理员') {
    console.error('[userManagementView] 初始化错误: 非管理员用户无法访问');
    return;
  }
  
  // 保存当前用户信息，用于返回主页
  currentUserInfo = {
    username: admin.username,
    role: admin.role
  };
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 隐藏其他视图，显示用户管理视图
  hideOtherViews();
  
  // 如果用户管理视图容器不存在，则创建
  const userManagementView = document.getElementById('view-user-management');
  if (!userManagementView) {
    console.log('[userManagementView] 创建用户管理视图容器');
    const main = document.querySelector('main');
    if (!main) {
      console.error('[userManagementView] 找不到main元素');
      // 如果找不到main元素，尝试在body中创建
      const body = document.body;
      const userManagementViewElement = document.createElement('div');
      userManagementViewElement.id = 'view-user-management';
      userManagementViewElement.style.display = 'flex';
      body.appendChild(userManagementViewElement);
    } else {
      const userManagementViewElement = document.createElement('div');
      userManagementViewElement.id = 'view-user-management';
      main.appendChild(userManagementViewElement);
    }
  }
  
  // 确保视图可见
  const viewElement = document.getElementById('view-user-management');
  if (viewElement) {
    console.log('[userManagementView] 设置视图为可见');
    viewElement.style.display = 'flex';
  } else {
    console.error('[userManagementView] 无法找到或创建视图容器');
    return;
  }
  
  // 创建加载中的界面，并传入视图容器引用
  renderLoadingState(viewElement);
  
  // 获取用户列表，并传入视图容器引用
  fetchUsersList(admin, viewElement);
}

/**
 * 获取用户列表
 * @param {Object} admin - 管理员用户信息
 * @param {HTMLElement} viewElement - 视图的根元素
 */
async function fetchUsersList(admin, viewElement) {
  try {
    console.log('[userManagementView] 开始获取用户列表', admin);
    
    // 添加一些测试数据，以防API不可用
    const testData = [
      { username: "测试用户1", role: "驾驶员" },
      { username: "测试用户2", role: "监管员" },
      { username: "测试用户3", role: "管理员" },
      { username: "测试用户4", role: "驾驶员" }
    ];
    
    try {
      // 调用API获取用户列表
      const response = await fetch('http://192.168.70.167:8000/api/v3/showuserinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: admin.username,
          role: admin.role
        })
      });
      
      console.log('[userManagementView] API响应状态:', response.status);
      const result = await response.json();
      console.log('[userManagementView] API响应数据:', result);
      
      if (result.code === 200 && result.data) {
        // 保存用户数据
        usersData = result.data;
        filteredUsers = [...usersData];
        
        // 渲染用户管理界面
        renderUserManagement(viewElement);
      } else {
        console.warn('[userManagementView] API返回错误，使用测试数据');
        usersData = testData;
        filteredUsers = [...usersData];
        renderUserManagement(viewElement);
      }
    } catch (error) {
      console.error('[userManagementView] API请求失败，使用测试数据:', error);
      usersData = testData;
      filteredUsers = [...usersData];
      renderUserManagement(viewElement);
    }
  } catch (error) {
    console.error('[userManagementView] 获取用户列表失败:', error);
    renderErrorState(viewElement, error.message);
  }
}

/**
 * 隐藏其他视图，只显示用户管理视图
 */
function hideOtherViews() {
  // 使用全局视图管理函数
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
      document.getElementById('view-user-edit')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
}

/**
 * 渲染加载状态
 * @param {HTMLElement} viewElement - 视图的根元素
 */
function renderLoadingState(viewElement) {
  if (!viewElement) {
    console.error('[userManagementView] 渲染加载状态错误: 未提供视图元素');
    return;
  }
  
  console.log('[userManagementView] 渲染加载状态');
  viewElement.innerHTML = `
    <div class="user-management-container">
      <div class="user-management-header">
        <div class="back-button" id="back-to-home-btn">
          <i class="ri-arrow-left-line"></i>
          <span>返回主页</span>
        </div>
        <h1>用户管理</h1>
      </div>
      <div class="user-management-content loading">
        <div class="loading-spinner"></div>
        <p>正在加载用户列表...</p>
      </div>
    </div>
  `;
  
  // 在视图容器内查找返回按钮并添加事件监听
  const backButton = viewElement.querySelector('#back-to-home-btn');
  if (backButton) {
    // 先移除可能已存在的事件监听器
    if (eventHandlers.backButton) {
      backButton.removeEventListener('click', eventHandlers.backButton);
    }
    
    // 重新绑定事件
    eventHandlers.backButton = handleBackToHome;
    backButton.addEventListener('click', eventHandlers.backButton);
    
    // 添加调试日志
    console.log('[DEBUG] userManagementView: Back button event listener attached in renderLoadingState.');
    console.log('[userManagementView] 返回按钮事件监听器已绑定');
  } else {
    console.error('[userManagementView] 找不到返回按钮');
  }
}

/**
 * 渲染错误状态
 * @param {HTMLElement} viewElement - 视图的根元素
 * @param {string} errorMessage - 错误信息
 */
function renderErrorState(viewElement, errorMessage) {
  if (!viewElement) return;
  const userManagementContent = viewElement.querySelector('.user-management-content');
  if (userManagementContent) {
    userManagementContent.classList.remove('loading');
    userManagementContent.classList.add('error');
    userManagementContent.innerHTML = `
      <i class="ri-error-warning-line"></i>
      <p>获取用户列表失败</p>
      <p class="error-message">${errorMessage || '请稍后再试'}</p>
      <button id="retry-btn" class="retry-button">重试</button>
    `;
    
    // 添加重试按钮事件
    const retryButton = viewElement.querySelector('#retry-btn');
    if (retryButton) {
      eventHandlers.retryButton = handleRetry;
      retryButton.addEventListener('click', eventHandlers.retryButton);
    }
  }
  
  // 确保返回按钮仍然有效
  const backButton = viewElement.querySelector('#back-to-home-btn');
  if (backButton) {
    if (eventHandlers.backButton) backButton.removeEventListener('click', eventHandlers.backButton);
    eventHandlers.backButton = handleBackToHome;
    backButton.addEventListener('click', eventHandlers.backButton);
    console.log('[DEBUG] userManagementView: Back button event listener attached in renderErrorState.');
  }
}

/**
 * 渲染用户管理界面
 * @param {HTMLElement} viewElement - 视图的根元素
 */
function renderUserManagement(viewElement) {
  if (!viewElement) {
    console.error('[userManagementView] 渲染错误: 找不到视图容器');
    return;
  }
  
  // 重新渲染整个视图
  viewElement.innerHTML = `
    <div class="user-management-container">
      <div class="user-management-header">
        <div class="back-button" id="back-to-home-btn">
          <i class="ri-arrow-left-line"></i>
          <span>返回主页</span>
        </div>
        <h1>用户管理</h1>
      </div>
      <div class="user-management-content">
        <div class="search-container">
          <div class="search-input-container">
            <i class="ri-search-line"></i>
            <input type="text" id="user-search" placeholder="搜索用户名..." class="search-input">
            <button id="clear-search" class="clear-search-button" style="display: none;">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>
        
        <div class="users-list-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <!-- 用户列表将被动态填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
    
  // *** 关键修复：在视图容器内查找并重新绑定返回按钮的事件监听器 ***
  const backButton = viewElement.querySelector('#back-to-home-btn');
  if (backButton) {
    if (eventHandlers.backButton) {
      backButton.removeEventListener('click', eventHandlers.backButton);
    }
    eventHandlers.backButton = handleBackToHome;
    backButton.addEventListener('click', eventHandlers.backButton);
    console.log('[DEBUG] userManagementView: Back button event listener RE-ATTACHED in renderUserManagement.');
  }

  // 渲染用户列表
  renderUsersList(viewElement);
  
  // 添加搜索框事件监听
  const searchInput = viewElement.querySelector('#user-search');
  const clearSearchButton = viewElement.querySelector('#clear-search');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  if (clearSearchButton) {
    clearSearchButton.addEventListener('click', handleClearSearch);
  }
}

/**
 * 渲染用户列表
 * @param {HTMLElement} viewElement - 视图的根元素
 */
function renderUsersList(viewElement) {
  if (!viewElement) {
    console.error('[userManagementView] renderUsersList: viewElement参数为空');
    return;
  }
  
  const usersTableBody = viewElement.querySelector('#users-table-body');
  
  if (!usersTableBody) {
    console.error('[userManagementView] renderUsersList: 找不到users-table-body元素');
    return;
  }
  
  // 清空表格
  usersTableBody.innerHTML = '';
  
  if (filteredUsers.length === 0) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="no-users-message">没有找到匹配的用户</td>
      </tr>
    `;
  } else {
    // 填充用户数据
    filteredUsers.forEach(user => {
      const row = document.createElement('tr');
      
      // 设置用户角色的图标
      let roleIcon = 'ri-user-line';
      if (user.role === '管理员') roleIcon = 'ri-admin-line';
      else if (user.role === '监管员') roleIcon = 'ri-user-search-line';
      else if (user.role === '驾驶员') roleIcon = 'ri-steering-2-line';
      
      row.innerHTML = `
        <td>
          <div class="user-info">
            <i class="${roleIcon}"></i>
            <span>${user.username}</span>
          </div>
        </td>
        <td>${user.role || '普通用户'}</td>
        <td class="action-buttons">
          <button class="edit-user-btn" data-username="${user.username}" title="编辑用户">
            <i class="ri-edit-line"></i>
            <span>编辑</span>
          </button>
          <button class="delete-user-btn" data-username="${user.username}" title="删除用户">
            <i class="ri-delete-bin-line"></i>
            <span>删除</span>
          </button>
        </td>
      `;
      
      usersTableBody.appendChild(row);
    });
    
    // 添加编辑和删除按钮的事件监听
    const editButtons = viewElement.querySelectorAll('.edit-user-btn');
    const deleteButtons = viewElement.querySelectorAll('.delete-user-btn');
    
    editButtons.forEach(button => {
      const username = button.getAttribute('data-username');
      button.addEventListener('click', () => handleEditUser(username));
    });
    
    deleteButtons.forEach(button => {
      const username = button.getAttribute('data-username');
      button.addEventListener('click', () => handleDeleteUser(username));
    });
  }
}

/**
 * 处理搜索
 * @param {Event} event - 输入事件
 */
function handleSearch(event) {
  const searchTerm = event.target.value.trim().toLowerCase();
  const viewElement = document.getElementById('view-user-management');
  const clearButton = viewElement ? viewElement.querySelector('#clear-search') : null;
  
  if (clearButton) {
    clearButton.style.display = searchTerm ? 'flex' : 'none';
  }
  
  // 过滤用户
  filteredUsers = usersData.filter(user => 
    user.username.toLowerCase().includes(searchTerm)
  );
  
  // 重新渲染用户列表
  renderUsersList(viewElement);
}

/**
 * 处理清除搜索
 */
function handleClearSearch() {
  const viewElement = document.getElementById('view-user-management');
  if (!viewElement) return;
  
  const searchInput = viewElement.querySelector('#user-search');
  const clearButton = viewElement.querySelector('#clear-search');
  
  if (searchInput) {
    searchInput.value = '';
    filteredUsers = [...usersData];
    renderUsersList(viewElement);
  }
  
  if (clearButton) {
    clearButton.style.display = 'none';
  }
}

/**
 * 处理返回主页
 */
function handleBackToHome(event) {
  // 添加调试信息
  console.log('--- [DEBUG] Back To Home Triggered (userManagementView) ---');
  if (event) {
    console.log('[DEBUG] Event Type:', event.type);
    console.log('[DEBUG] Click Target:', event.target.outerHTML);
    console.log('[DEBUG] Current Target:', event.currentTarget);
  } else {
    console.log('[DEBUG] Called programmatically (no event).');
  }
  console.log('[DEBUG] Current User Info:', JSON.stringify(currentUserInfo, null, 2));
  console.log('[DEBUG] Proceeding to hide view and import homeView...');
  console.log('---------------------------------------------------------');

  // 如果是事件触发的，阻止默认行为和冒泡
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('[userManagementView] 返回主页按钮被点击');
  
  // 隐藏用户管理视图
  const userManagementView = document.getElementById('view-user-management');
  if (userManagementView) {
    userManagementView.style.display = 'none';
  }
  
  // 确保有用户信息
  const userInfo = currentUserInfo || {
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('role') || '管理员'
  };
  
  console.log('[userManagementView] 返回主页，用户信息:', userInfo);
  
  if (!userInfo.username || !userInfo.role) {
    console.error('[userManagementView] 无法返回主页：缺少用户信息');
    showToast('返回主页失败：无法获取用户信息', 'error');
    return;
  }
  
  // 清除事件监听器 - 移到这里，确保在处理完成前不会移除事件监听器
  removeAllEventListeners();
  
  // 导入并初始化主页视图
  import('./homeView.js').then(module => {
    try {
      const homeView = module.default || module;
      if (typeof homeView.init === 'function') {
        homeView.init(userInfo);
        console.log('[userManagementView] 成功返回主页');
      } else {
        throw new Error('主页视图模块未正确导出init方法');
      }
    } catch (error) {
      console.error('[userManagementView] 初始化主页视图失败:', error);
      showToast('返回主页失败: ' + error.message, 'error');
    }
  }).catch(error => {
    console.error('[userManagementView] 加载主页视图失败:', error);
    showToast('返回主页失败: ' + error.message, 'error');
  });
}

/**
 * 处理重试
 */
async function handleRetry() {
  console.log('[userManagementView] 重试获取用户列表');
  const viewElement = document.getElementById('view-user-management');
  if (!viewElement) {
    console.error('[userManagementView] 重试失败: 找不到视图容器。');
    return;
  }

  const userManagementContent = viewElement.querySelector('.user-management-content');
  if (userManagementContent) {
    userManagementContent.classList.remove('error');
    userManagementContent.classList.add('loading');
    userManagementContent.innerHTML = `
      <div class="loading-spinner"></div>
      <p>正在加载用户列表...</p>
    `;
  }
  
  // 确保有用户信息
  const userInfo = currentUserInfo || {
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('role') || '管理员'
  };
  
  if (!userInfo.username || !userInfo.role) {
    console.error('[userManagementView] 重试失败：缺少用户信息');
    renderErrorState(viewElement, '无法获取用户信息');
    return;
  }
  
  // 重新获取用户列表
  fetchUsersList(userInfo, viewElement);
}

/**
 * 处理编辑用户
 * @param {string} username - 要编辑的用户名
 */
async function handleEditUser(username) {
  console.log(`[userManagementView] 编辑用户: ${username}`);
  
  try {
    // 导入用户编辑视图模块
    const userEditView = await import('./userEditView.js');
    
    // 调用用户编辑视图的初始化方法
    userEditView.init({
      username: username,
      admin: currentUserInfo
    });
  } catch (error) {
    console.error(`[userManagementView] 加载用户编辑视图失败:`, error);
    showToast(`无法编辑用户: ${error.message}`, 'error');
  }
}

/**
 * 处理删除用户
 * @param {string} username - 要删除的用户名
 */
function handleDeleteUser(username) {
  console.log(`[userManagementView] 删除用户: ${username}`);
  
  // 创建确认对话框
  showConfirmDialog(
    '确认删除',
    `确定要删除用户 "${username}" 吗？此操作无法撤销。`,
    async () => {
      try {
        await deleteUser(username);
      } catch (error) {
        console.error(`[userManagementView] 删除用户失败:`, error);
        showToast(`删除用户失败: ${error.message}`, 'error');
      }
    }
  );
}

/**
 * 调用API删除用户
 * @param {string} username - 要删除的用户名
 */
async function deleteUser(username) {
  console.log(`[userManagementView] 开始删除用户: ${username}`);
  
  try {
    // 显示加载中状态
    showToast('正在删除用户...', 'info');
    
    // 调用API删除用户
    const response = await fetch('http://192.168.70.167:8000/api/v3/deleteuser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username
      })
    });
    
    const result = await response.json();
    console.log(`[userManagementView] 删除用户API响应:`, result);
    
    if (result.code === 200) {
      // 删除成功，显示成功提示
      showToast('用户删除成功!', 'success');
      
      // **关键修复**: 获取视图元素并传递给刷新函数
      const viewElement = document.getElementById('view-user-management');
      // 重新获取用户列表以刷新界面
      await fetchUsersList(currentUserInfo, viewElement);
    } else {
      throw new Error(result.message || '删除用户失败');
    }
  } catch (error) {
    console.error(`[userManagementView] 删除用户API错误:`, error);
    throw error;
  }
}

/**
 * 显示确认对话框
 * @param {string} title - 对话框标题
 * @param {string} message - 对话框消息
 * @param {Function} onConfirm - 确认回调函数
 */
function showConfirmDialog(title, message, onConfirm) {
  // 检查是否已存在对话框，如果存在则移除
  const existingDialog = document.querySelector('.confirm-dialog-container');
  if (existingDialog) {
    document.body.removeChild(existingDialog);
  }
  
  // 创建对话框容器
  const dialogContainer = document.createElement('div');
  dialogContainer.className = 'confirm-dialog-container';
  
  // 创建对话框内容
  dialogContainer.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-dialog-header">
        <h3>${title}</h3>
        <button class="close-dialog-btn">
          <i class="ri-close-line"></i>
        </button>
      </div>
      <div class="confirm-dialog-body">
        <i class="ri-error-warning-line warning-icon"></i>
        <p>${message}</p>
      </div>
      <div class="confirm-dialog-footer">
        <button class="cancel-dialog-btn">取消</button>
        <button class="confirm-dialog-btn">确认删除</button>
      </div>
    </div>
  `;
  
  // 添加到文档
  document.body.appendChild(dialogContainer);
  
  // 显示动画
  setTimeout(() => {
    dialogContainer.classList.add('show');
  }, 10);
  
  // 添加事件监听
  const closeBtn = dialogContainer.querySelector('.close-dialog-btn');
  const cancelBtn = dialogContainer.querySelector('.cancel-dialog-btn');
  const confirmBtn = dialogContainer.querySelector('.confirm-dialog-btn');
  
  // 关闭对话框函数
  const closeDialog = () => {
    dialogContainer.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(dialogContainer);
    }, 300);
  };
  
  // 添加事件监听
  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);
  confirmBtn.addEventListener('click', () => {
    closeDialog();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  });
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // 设置图标
  let icon = 'ri-information-line';
  if (type === 'success') icon = 'ri-check-line';
  else if (type === 'error') icon = 'ri-error-warning-line';
  else if (type === 'warning') icon = 'ri-alert-line';
  
  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;
  
  // 添加到文档
  document.body.appendChild(toast);
  
  // 显示动画
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 3秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

/**
 * 清除所有事件监听器
 */
function removeAllEventListeners() {
  console.log('[userManagementView] 清理事件监听器，不再操作DOM，仅清空句柄对象');
  // 重置事件处理器对象
  eventHandlers = {};
  console.log('[userManagementView] 所有事件监听器句柄已清理');
}

// 导出模块
export { init };
export default { init }; 