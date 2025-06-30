// src/views/userEditView.js
// 用户编辑视图模块 - 管理员编辑用户信息

// 全局变量，用于存储事件监听器引用和用户数据
let eventHandlers = {};
let userData = null;
let currentAdminInfo = null; // 保存当前管理员信息，用于返回用户管理页面

/**
 * 初始化用户编辑视图
 * @param {Object} params - 参数对象
 * @param {string} params.username - 要编辑的用户名
 * @param {Object} params.admin - 当前管理员信息
 */
async function init(params) {
  console.log('[userEditView] 初始化用户编辑视图', params);
  
  if (!params || !params.username) {
    console.error('[userEditView] 初始化错误: 未提供要编辑的用户名');
    return;
  }
  
  if (!params.admin || params.admin.role !== '管理员') {
    console.error('[userEditView] 初始化错误: 非管理员用户无法访问');
    return;
  }
  
  // 保存当前管理员信息，用于返回
  currentAdminInfo = {
    username: params.admin.username,
    role: params.admin.role
  };
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 隐藏其他视图，显示用户编辑视图
  hideOtherViews();
  
  // 如果用户编辑视图容器不存在，则创建
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    const main = document.querySelector('main');
    const userEditViewElement = document.createElement('div');
    userEditViewElement.id = 'view-user-edit';
    main.appendChild(userEditViewElement);
  } else {
    userEditView.style.display = 'flex';
  }
  
  // 创建加载中的界面
  renderLoadingState(params.username);
  
  // 获取用户详细信息
  fetchUserInfo(params.username);
}

/**
 * 获取用户详细信息
 * @param {string} username - 用户名
 */
async function fetchUserInfo(username) {
  try {
    console.log('[userEditView] 开始获取用户信息:', username);
    
    // 调用API获取用户信息
    const response = await fetch('http://192.168.70.167:8000/api/v3/showchangeuser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username
      })
    });
    
    console.log('[userEditView] API响应状态:', response.status);
    const result = await response.json();
    console.log('[userEditView] API响应数据:', result);
    console.log('[userEditView] API响应数据类型:', typeof result);
    console.log('[userEditView] API响应数据结构:', Object.keys(result));
    
    if (result.code === 200 && result.data) {
      console.log('[userEditView] API调用成功，用户数据:', result.data);
      console.log('[userEditView] 用户数据类型:', typeof result.data);
      console.log('[userEditView] 用户数据结构:', Object.keys(result.data));
      
      // 保存用户数据
      userData = result.data;
      
      console.log('[userEditView] 准备渲染编辑表单...');
      // 渲染编辑表单
      renderEditForm();
      console.log('[userEditView] 编辑表单渲染完成');
    } else {
      console.error('[userEditView] API返回错误:', result);
      throw new Error(result.message || '获取用户信息失败');
    }
  } catch (error) {
    console.error('[userEditView] 获取用户信息失败:', error);
    console.error('[userEditView] 错误堆栈:', error.stack);
    renderErrorState(error.message);
  }
}

/**
 * 隐藏其他视图，只显示用户编辑视图
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
      document.getElementById('view-user-management')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
}

/**
 * 渲染加载状态
 * @param {string} username - 用户名
 */
function renderLoadingState(username) {
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    console.error('[userEditView] 找不到用户编辑视图容器');
    return;
  }
  
  console.log('[userEditView] 渲染加载状态');
  userEditView.innerHTML = `
    <div class="user-info-container">
      <div class="user-info-header">
        <div class="back-button" id="back-btn">
          <i class="ri-arrow-left-line"></i>
          <span>返回用户管理</span>
        </div>
        <h1>编辑用户信息</h1>
      </div>
      <div class="user-info-content loading">
        <div class="loading-spinner"></div>
        <p>正在加载 ${username} 的信息...</p>
      </div>
    </div>
  `;
  
  // 添加返回按钮事件监听
  const backButton = userEditView.querySelector('#back-btn');
  if (backButton) {
    // 先移除可能已存在的事件监听器
    if (eventHandlers.backButton) {
      backButton.removeEventListener('click', eventHandlers.backButton);
    }
    
    // 重新绑定事件
    eventHandlers.backButton = handleBack;
    backButton.addEventListener('click', eventHandlers.backButton);
    console.log('[DEBUG] userEditView: Back button event listener attached in renderLoadingState.');
    console.log('[userEditView] 返回按钮事件监听器已绑定');
  } else {
    console.error('[userEditView] 找不到返回按钮');
  }
}

/**
 * 渲染错误状态
 * @param {string} errorMessage - 错误信息
 */
function renderErrorState(errorMessage) {
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    console.error('[userEditView] 找不到用户编辑视图容器');
    return;
  }
  
  const userInfoContent = userEditView.querySelector('.user-info-content');
  if (userInfoContent) {
    userInfoContent.classList.remove('loading');
    userInfoContent.classList.add('error');
    userInfoContent.innerHTML = `
      <i class="ri-error-warning-line"></i>
      <p>获取用户信息失败</p>
      <p class="error-message">${errorMessage || '请稍后再试'}</p>
      <button id="retry-btn" class="retry-button">重试</button>
    `;
    
    // 添加重试按钮事件
    const retryButton = userEditView.querySelector('#retry-btn');
    if (retryButton) {
      eventHandlers.retryButton = handleRetry;
      retryButton.addEventListener('click', eventHandlers.retryButton);
    }
  }
}

/**
 * 渲染编辑表单
 */
function renderEditForm() {
  console.log('[userEditView] 开始渲染编辑表单');
  console.log('[userEditView] 当前用户数据:', userData);
  
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    console.error('[userEditView] 找不到用户编辑视图容器');
    return;
  }
  
  const userInfoContent = userEditView.querySelector('.user-info-content');
  if (!userInfoContent) {
    console.error('[userEditView] 找不到用户信息内容容器');
    return;
  }
  
  console.log('[userEditView] 找到用户信息内容容器，开始渲染表单');
  userInfoContent.classList.remove('loading', 'error');
  
  // 创建表单HTML
  userInfoContent.innerHTML = `
    <form id="user-edit-form" class="user-edit-form">
      <div class="form-group">
        <label for="username">
          <i class="ri-user-line"></i>
          <span>用户名</span>
        </label>
        <input type="text" id="username" name="username" value="${userData.username || ''}" disabled required>
      </div>
      
      <div class="form-group">
        <label for="role">
          <i class="ri-user-settings-line"></i>
          <span>角色</span>
        </label>
        <div class="select-container">
          <select id="role" name="role" class="form-control" required>
            <option value="驾驶员" ${userData.role === '驾驶员' ? 'selected' : ''}>驾驶员</option>
            <option value="监管员" ${userData.role === '监管员' ? 'selected' : ''}>监管员</option>
            <option value="管理员" ${userData.role === '管理员' ? 'selected' : ''}>管理员</option>
          </select>
          <i class="ri-arrow-down-s-line select-arrow"></i>
        </div>
      </div>
      
      <div class="form-group">
        <label for="carnumber">
          <i class="ri-car-line"></i>
          <span>车牌号</span>
        </label>
        <input type="text" id="carnumber" name="carnumber" value="${userData.carnumber || ''}" required>
      </div>
      
      <div class="form-group">
        <label>
          <i class="ri-men-line"></i>
          <span>性别</span>
        </label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="gender" value="男" ${userData.gender === '男' ? 'checked' : ''}>
            <span>男</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="gender" value="女" ${userData.gender === '女' ? 'checked' : ''}>
            <span>女</span>
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label for="age">
          <i class="ri-calendar-line"></i>
          <span>年龄</span>
        </label>
        <input type="text" id="age" name="age" value="${userData.age || ''}" required>
      </div>
      
      <div class="form-group">
        <label for="folk">
          <i class="ri-user-star-line"></i>
          <span>民族</span>
        </label>
        <input type="text" id="folk" name="folk" value="${userData.folk || ''}" required>
      </div>
      
      <div class="form-group">
        <label for="work">
          <i class="ri-briefcase-line"></i>
          <span>职业</span>
        </label>
        <input type="text" id="work" name="work" value="${userData.work || ''}" required>
      </div>
      
      <div class="form-group">
        <label for="location">
          <i class="ri-map-pin-line"></i>
          <span>地区</span>
        </label>
        <input type="text" id="location" name="location" value="${userData.location || ''}" required>
      </div>
      
      <div class="form-actions">
        <button type="button" id="cancel-btn" class="cancel-button">
          <i class="ri-close-line"></i>
          <span>取消</span>
        </button>
        <button type="submit" id="save-btn" class="save-button">
          <i class="ri-save-line"></i>
          <span>保存</span>
          <span class="spinner hidden"></span>
        </button>
      </div>
    </form>
  `;
  
  console.log('[userEditView] 表单HTML已设置，开始绑定事件监听器');
  
  // 添加表单事件监听
  const form = userEditView.querySelector('#user-edit-form');
  const cancelButton = userEditView.querySelector('#cancel-btn');
  
  if (form) {
    eventHandlers.form = handleFormSubmit;
    form.addEventListener('submit', eventHandlers.form);
    console.log('[userEditView] 表单提交事件监听器已绑定');
  } else {
    console.error('[userEditView] 找不到表单元素');
  }
  
  if (cancelButton) {
    eventHandlers.cancelButton = handleBack;
    cancelButton.addEventListener('click', eventHandlers.cancelButton);
    console.log('[DEBUG] userEditView: Cancel button (acting as back) event listener attached in renderEditForm.');
  } else {
    console.error('[userEditView] 找不到取消按钮');
  }
  
  console.log('[userEditView] 编辑表单渲染完成');
}

/**
 * 处理表单提交
 * @param {Event} event - 表单提交事件
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  console.log('[userEditView] 提交表单');
  
  // 设置加载状态
  setLoadingState(true);
  
  // 收集表单数据
  const form = event.target;
  const formData = {
    username: userData.username, // 使用原始用户名，不可修改
    gender: form.gender.value,
    age: form.age.value,
    folk: form.folk.value.trim(),
    work: form.work.value.trim(),
    location: form.location.value.trim(),
    role: form.role.value,
    carnumber: form.carnumber.value.trim()
  };
  
  console.log('[userEditView] 表单数据:', formData);
  
  try {
    // 调用API更新用户信息
    const response = await fetch('http://192.168.70.167:8000/api/v3/changeinfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    console.log('[userEditView] API响应:', result);
    
    if (result.code === 200) {
      showToast('用户信息更新成功', 'success');
      
      // 更新成功后返回
      setTimeout(() => {
        handleBack();
      }, 1000);
    } else {
      throw new Error(result.message || '更新用户信息失败');
    }
  } catch (error) {
    console.error('[userEditView] 更新用户信息失败:', error);
    showToast(`更新失败: ${error.message}`, 'error');
  } finally {
    // 取消加载状态
    setLoadingState(false);
  }
}

/**
 * 设置加载状态
 * @param {boolean} isLoading - 是否处于加载状态
 */
function setLoadingState(isLoading) {
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    console.error('[userEditView] 找不到用户编辑视图容器');
    return;
  }
  
  const saveButton = userEditView.querySelector('#save-btn');
  const spinner = saveButton ? saveButton.querySelector('.spinner') : null;
  
  if (saveButton) {
    if (isLoading) {
      saveButton.disabled = true;
      saveButton.querySelector('span:not(.spinner)').style.opacity = '0';
      if (spinner) spinner.classList.remove('hidden');
    } else {
      saveButton.disabled = false;
      saveButton.querySelector('span:not(.spinner)').style.opacity = '1';
      if (spinner) spinner.classList.add('hidden');
    }
  }
}

/**
 * 处理返回
 */
function handleBack(event) {
  console.log('--- [DEBUG] Back Triggered (userEditView) ---');
  if (event) {
    console.log('[DEBUG] Event Type:', event.type);
    console.log('[DEBUG] Click Target:', event.target.outerHTML);
    console.log('[DEBUG] Current Target:', event.currentTarget);
  } else {
    console.log('[DEBUG] Called programmatically (no event).');
  }
  console.log('[DEBUG] Current Admin Info:', JSON.stringify(currentAdminInfo, null, 2));
  console.log('[DEBUG] Proceeding to hide view and import userManagementView...');
  console.log('---------------------------------------------------------');

  // 如果是事件触发的，阻止默认行为和冒泡
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('[userEditView] 返回用户管理按钮被点击');
  
  // 隐藏用户编辑视图
  const userEditView = document.getElementById('view-user-edit');
  if (userEditView) {
    userEditView.style.display = 'none';
  }
  
  // 清除事件监听器
  removeAllEventListeners();
  
  // 返回用户管理页面
  import('./userManagementView.js').then(module => {
    try {
      const userManagementView = module.default || module;
      if (userManagementView && typeof userManagementView.init === 'function') {
        userManagementView.init(currentAdminInfo);
        console.log('[userEditView] 成功返回用户管理页面');
      } else {
        throw new Error('用户管理视图模块未正确导出init方法');
      }
    } catch (error) {
      console.error('[userEditView] 初始化用户管理视图失败:', error);
      showToast(`返回失败: ${error.message}`, 'error');
    }
  }).catch(error => {
    console.error('[userEditView] 加载用户管理视图失败:', error);
    showToast(`返回失败: ${error.message}`, 'error');
    
    // 如果无法返回用户管理页面，尝试返回主页
    import('./homeView.js').then(module => {
      const homeView = module.default || module;
      if (homeView && typeof homeView.init === 'function') {
        homeView.init(currentAdminInfo);
      }
    }).catch(err => {
      console.error('[userEditView] 返回主页也失败:', err);
    });
  });
}

/**
 * 处理重试
 */
async function handleRetry() {
  console.log('[userEditView] 重试获取用户信息');
  
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    console.error('[userEditView] 找不到用户编辑视图容器');
    return;
  }
  
  // 显示加载状态
  const userInfoContent = userEditView.querySelector('.user-info-content');
  if (userInfoContent) {
    userInfoContent.classList.remove('error');
    userInfoContent.classList.add('loading');
    userInfoContent.innerHTML = `
      <div class="loading-spinner"></div>
      <p>正在加载 ${userData.username} 的信息...</p>
    `;
  }
  
  // 重新获取用户详细信息
  fetchUserInfo(userData.username);
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
  console.log('[userEditView] 清理事件监听器，当前注册的监听器:', Object.keys(eventHandlers));
  
  const userEditView = document.getElementById('view-user-edit');
  if (!userEditView) {
    console.log('[userEditView] 视图容器不存在，直接清理事件处理器对象');
    eventHandlers = {};
    return;
  }
  
  // 清除所有已注册的事件监听器
  Object.entries(eventHandlers).forEach(([key, handler]) => {
    try {
      if (key === 'backButton') {
        const backButton = userEditView.querySelector('#back-btn');
        if (backButton) {
          backButton.removeEventListener('click', handler);
        }
      } else if (key === 'cancelButton') {
        const cancelButton = userEditView.querySelector('#cancel-btn');
        if (cancelButton) {
          cancelButton.removeEventListener('click', handler);
        }
      } else if (key === 'form') {
        const form = userEditView.querySelector('#user-edit-form');
        if (form) {
          form.removeEventListener('submit', handler);
        }
      } else if (key === 'retryButton') {
        const retryButton = userEditView.querySelector('#retry-btn');
        if (retryButton) {
          retryButton.removeEventListener('click', handler);
        }
      } else {
        const element = userEditView.querySelector(`#${key}`);
        if (element) {
          // 尝试移除常见事件类型
          element.removeEventListener('click', handler);
          element.removeEventListener('input', handler);
          element.removeEventListener('change', handler);
          element.removeEventListener('submit', handler);
        }
      }
    } catch (error) {
      console.error(`[userEditView] 移除事件监听器 ${key} 失败:`, error);
    }
  });
  
  // 重置事件处理器对象
  eventHandlers = {};
  console.log('[userEditView] 所有事件监听器已清理');
}

// 导出模块
export { init };
export default { init }; 