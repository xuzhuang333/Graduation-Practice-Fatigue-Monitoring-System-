// src/views/userInfoView.js
// 用户个人信息视图模块 - 显示用户的详细信息

import apiService from '../services/api.js';

// 全局变量，用于存储事件监听器引用和用户数据
let eventHandlers = {};
let userData = null;
let loadingState = false;
// 保存初始传入的用户信息，确保即使API调用失败也能返回主页
let originalUserInfo = null;
// 是否处于编辑模式
let isEditMode = false;

/**
 * 初始化用户信息视图
 * @param {Object} user - 用户基本信息
 * @param {string} user.username - 用户名
 * @param {string} user.role - 用户角色
 */
async function init(user) {
  console.log('[userInfoView] 初始化用户信息视图', user);
  
  if (!user || !user.username) {
    console.error('[userInfoView] 初始化错误: 未提供有效的用户信息');
    return;
  }
  
  // 保存原始用户信息，用于返回主页
  originalUserInfo = {
    username: user.username,
    role: user.role
  };
  
  // 重置编辑模式
  isEditMode = false;
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 隐藏其他视图，显示用户信息视图
  hideOtherViews();
  
  // 添加响应式样式
  addResponsiveStyles();
  
  // 如果用户信息视图容器不存在，则创建
  const viewElement = document.getElementById('view-user-info');
  if (!viewElement) {
    const main = document.querySelector('main');
    const userInfoViewElement = document.createElement('div');
    userInfoViewElement.id = 'view-user-info';
    main.appendChild(userInfoViewElement);
  } else {
    viewElement.style.display = 'flex';
  }
  
  // 创建加载中的界面
  renderLoadingState(viewElement, user.username);
  
  try {
    // 获取用户详细信息
    const userInfoResponse = await apiService.user.getUserInfo(user.username);
    
    if (userInfoResponse.code === 200 && userInfoResponse.data) {
      // 保存用户数据
      userData = {
        ...userInfoResponse.data,
        role: user.role
      };
      
      // 渲染用户信息
      renderUserInfo(viewElement);
    } else {
      throw new Error(userInfoResponse.message || '获取用户信息失败');
    }
  } catch (error) {
    console.error('[userInfoView] 获取用户信息失败:', error);
    renderErrorState(viewElement, error.message);
    
    // 即使获取失败，也创建空的用户数据用于编辑
    userData = {
      username: user.username,
      role: user.role,
      gender: '',
      age: '',
      folk: '',
      work: '',
      location: ''
    };
  }
}

/**
 * 添加响应式样式
 */
function addResponsiveStyles() {
  // 检查是否已经添加了样式
  if (document.getElementById('user-info-responsive-styles')) {
    return;
  }
  
  // 创建样式元素
  const styleElement = document.createElement('style');
  styleElement.id = 'user-info-responsive-styles';
  styleElement.textContent = `
    #view-user-info {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
      box-sizing: border-box;
    }
    
    .user-info-container {
      width: 100%;
      max-width: 900px;
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin: 0 auto;
    }
    
    .user-info-header {
      padding: 20px;
      background-color: #4361ee;
      color: white;
      display: flex;
      align-items: center;
      position: relative;
    }
    
    .user-info-header h1 {
      flex-grow: 1;
      text-align: center;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    
    .back-button {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }
    
    .back-button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .back-button i {
      margin-right: 8px;
    }
    
    .user-info-content {
      padding: 30px;
      min-height: 400px;
    }
    
    .user-info-card {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    }
    
    .user-info-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background-color: #eef2ff;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      border: 5px solid #dbeafe;
    }
    
    .user-info-avatar i {
      font-size: 60px;
      color: #4361ee;
    }
    
    .user-info-name {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .user-info-role {
      font-size: 16px;
      color: #64748b;
      padding: 4px 12px;
      background-color: #f1f5f9;
      border-radius: 15px;
      margin-bottom: 25px;
    }
    
    .user-info-details {
      width: 100%;
      max-width: 700px;
      margin: 20px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    
    .info-item {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 15px 20px;
      display: flex;
      flex-direction: column;
      border-left: 3px solid #4361ee;
    }
    
    .info-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    
    .info-label i {
      margin-right: 8px;
      color: #4361ee;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: #1e293b;
    }
    
    .edit-button {
      padding: 10px 24px;
      background-color: #4361ee;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: background-color 0.2s;
      margin-top: 20px;
    }
    
    .edit-button i {
      margin-right: 8px;
    }
    
    .edit-button:hover {
      background-color: #3651d4;
    }
    
    .user-edit-form {
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
    }
    
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 20px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
    }
    
    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    
    .form-group label i {
      margin-right: 8px;
      color: #4361ee;
    }
    
    .form-group input[type="text"] {
      padding: 12px 15px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    .form-group input[type="text"]:focus {
      border-color: #4361ee;
      outline: none;
      box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
    }
    
    .radio-group {
      display: flex;
      gap: 20px;
    }
    
    .radio-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    
    .radio-label input {
      margin-right: 8px;
    }
    
    .cancel-button,
    .save-button {
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: background-color 0.2s;
    }
    
    .cancel-button {
      background-color: #e2e8f0;
      color: #475569;
      border: none;
    }
    
    .save-button {
      background-color: #4361ee;
      color: white;
      border: none;
    }
    
    .cancel-button i,
    .save-button i {
      margin-right: 8px;
    }
    
    .cancel-button:hover {
      background-color: #cbd5e1;
    }
    
    .save-button:hover {
      background-color: #3651d4;
    }
    
    @media (max-width: 768px) {
      .user-info-card {
        padding: 10px;
      }
      
      .user-info-details {
        grid-template-columns: 1fr;
      }
      
      .user-edit-form {
        grid-template-columns: 1fr;
        padding: 10px;
      }
      
      .user-info-content {
        padding: 15px;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

/**
 * 隐藏其他视图，只显示用户信息视图
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
      document.getElementById('view-change-password'),
      document.getElementById('view-user-management'),
      document.getElementById('view-user-edit')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
}

/**
 * 渲染加载状态
 * @param {Element} viewElement - 用户信息视图元素
 * @param {string} username - 用户名
 */
function renderLoadingState(viewElement, username) {
  if (!viewElement) return;
  loadingState = true;
  
  viewElement.innerHTML = `
    <div class="user-info-container">
      <div class="user-info-header">
        <div class="back-button" id="back-to-home-btn">
          <i class="ri-arrow-left-line"></i>
          <span>返回主页</span>
        </div>
        <h1>个人信息</h1>
      </div>
      <div class="user-info-content loading">
        <div class="loading-spinner"></div>
        <p>正在加载 ${username} 的个人信息...</p>
      </div>
    </div>
  `;
  
  const backButton = viewElement.querySelector('#back-to-home-btn');
  if (backButton) {
    eventHandlers.backButton = handleBackToHome;
    backButton.addEventListener('click', eventHandlers.backButton);
    console.log('[DEBUG] userInfoView: Back button event listener attached.');
  }
}

/**
 * 渲染错误状态
 * @param {Element} viewElement - 用户信息视图元素
 * @param {string} errorMessage - 错误信息
 */
function renderErrorState(viewElement, errorMessage) {
  if (!viewElement) return;
  loadingState = false;
  
  const userInfoContent = viewElement.querySelector('.user-info-content');
  if (userInfoContent) {
    userInfoContent.classList.remove('loading');
    userInfoContent.classList.add('error');
    userInfoContent.innerHTML = `
      <i class="ri-error-warning-line"></i>
      <p>获取个人信息失败</p>
      <p class="error-message">${errorMessage || '请稍后再试'}</p>
      <button id="retry-btn" class="retry-button">重试</button>
      <button id="edit-anyway-btn" class="edit-anyway-button">创建个人信息</button>
    `;
    
    const retryButton = viewElement.querySelector('#retry-btn');
    if (retryButton) {
      eventHandlers.retryButton = (e) => handleRetry(e, viewElement);
      retryButton.addEventListener('click', eventHandlers.retryButton);
    }
    
    const editAnywayButton = viewElement.querySelector('#edit-anyway-btn');
    if (editAnywayButton) {
      eventHandlers.editAnywayButton = () => {
        switchToEditMode(viewElement);
      };
      editAnywayButton.addEventListener('click', eventHandlers.editAnywayButton);
    }
  }
}

/**
 * 渲染用户信息
 * @param {Element} viewElement - 用户信息视图元素
 */
function renderUserInfo(viewElement) {
  if (!userData || !viewElement) return;
  const userInfoContent = viewElement.querySelector('.user-info-content');
  if (isEditMode) {
    renderEditMode(viewElement);
  } else {
    renderViewMode(viewElement);
  }
}

/**
 * 渲染查看模式
 * @param {Element} viewElement - 用户信息视图元素
 */
function renderViewMode(viewElement) {
  if (!viewElement) return;
  const userInfoContent = viewElement.querySelector('.user-info-content');
  if (!userInfoContent) return;
  
  userInfoContent.innerHTML = `
    <div class="user-info-card">
      <div class="user-info-avatar">
        <i class="ri-user-${userData.gender === '男' ? 'fill' : 'heart-line'}"></i>
      </div>
      <div class="user-info-name">${userData.username || '未知用户'}</div>
      <div class="user-info-role">${userData.role || '用户'}</div>
      
      <div class="user-info-details">
        <div class="info-item">
          <div class="info-label"><i class="ri-men-line"></i> 性别</div>
          <div class="info-value">${userData.gender || '未知'}</div>
        </div>
        <div class="info-item">
          <div class="info-label"><i class="ri-calendar-line"></i> 年龄</div>
          <div class="info-value">${userData.age || '未知'}</div>
        </div>
        <div class="info-item">
          <div class="info-label"><i class="ri-user-star-line"></i> 民族</div>
          <div class="info-value">${userData.folk || '未知'}</div>
        </div>
        <div class="info-item">
          <div class="info-label"><i class="ri-briefcase-line"></i> 职业</div>
          <div class="info-value">${userData.work || '未知'}</div>
        </div>
        <div class="info-item">
          <div class="info-label"><i class="ri-map-pin-line"></i> 地区</div>
          <div class="info-value">${userData.location || '未知'}</div>
        </div>
      </div>
      
      <button id="edit-info-btn" class="edit-button">
        <i class="ri-edit-line"></i>
        <span>修改信息</span>
      </button>
    </div>
  `;
  
  const editButton = userInfoContent.querySelector('#edit-info-btn');
  if (editButton) {
    eventHandlers.editButton = () => switchToEditMode(viewElement);
    editButton.addEventListener('click', eventHandlers.editButton);
  }
}

/**
 * 渲染编辑模式
 * @param {Element} viewElement - 用户信息视图元素
 */
function renderEditMode(viewElement) {
  if (!viewElement) return;
  const userInfoContent = viewElement.querySelector('.user-info-content');
  if (!userInfoContent) return;
  
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
        <button type="button" id="cancel-edit-btn" class="cancel-button">
          <i class="ri-close-line"></i>
          <span>取消</span>
        </button>
        <button type="submit" id="save-info-btn" class="save-button">
          <i class="ri-save-line"></i>
          <span>保存</span>
        </button>
      </div>
    </form>
  `;
  
  const form = viewElement.querySelector('#user-edit-form');
  if (form) {
    eventHandlers.formSubmit = (e) => handleFormSubmit(e, viewElement);
    form.addEventListener('submit', eventHandlers.formSubmit);
  }
  
  const cancelButton = viewElement.querySelector('#cancel-edit-btn');
  if (cancelButton) {
    eventHandlers.cancelButton = () => switchToViewMode(viewElement);
    cancelButton.addEventListener('click', eventHandlers.cancelButton);
  }
}

/**
 * 切换到编辑模式
 * @param {Element} viewElement - 用户信息视图元素
 */
function switchToEditMode(viewElement) {
  if (!viewElement) return;
  isEditMode = true;
  renderUserInfo(viewElement);
}

/**
 * 切换到查看模式
 * @param {Element} viewElement - 用户信息视图元素
 */
function switchToViewMode(viewElement) {
  if (!viewElement) return;
  isEditMode = false;
  renderUserInfo(viewElement);
}

/**
 * 处理表单提交
 * @param {Event} event - 提交事件
 * @param {Element} viewElement - 用户信息视图元素
 */
async function handleFormSubmit(event, viewElement) {
  event.preventDefault();
  console.log('[userInfoView] 提交个人信息表单');
  
  // 获取表单数据
  const form = event.target;
  const formData = new FormData(form);
  
  // 构建用户信息对象
  const updatedUserInfo = {
    username: userData.username,
    gender: formData.get('gender') || '',
    age: formData.get('age') || '',
    folk: formData.get('folk') || '',
    work: formData.get('work') || '',
    location: formData.get('location') || ''
  };
  
  // 显示加载状态
  const saveButton = viewElement.querySelector('#save-info-btn');
  const cancelButton = viewElement.querySelector('#cancel-edit-btn');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner"></span><span>保存中...</span>';
  }
  if (cancelButton) {
    cancelButton.disabled = true;
  }
  
  try {
    // 调用API更新用户信息
    const response = await apiService.user.updateUserInfo(updatedUserInfo);
    
    if (response.code === 200) {
      console.log('[userInfoView] 更新个人信息成功:', response);
      
      // 更新本地用户数据
      userData = {
        ...userData,
        ...updatedUserInfo
      };
      
      // 显示成功消息
      showToast('个人信息更新成功!', 'success');
      
      // 切换回查看模式
      switchToViewMode(viewElement);
    } else {
      throw new Error(response.message || '更新个人信息失败');
    }
  } catch (error) {
    console.error('[userInfoView] 更新个人信息失败:', error);
    showToast('更新失败: ' + error.message, 'error');
    
    // 恢复按钮状态
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="ri-save-line"></i><span>保存</span>';
    }
    if (cancelButton) {
      cancelButton.disabled = false;
    }
  }
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型
 */
function showToast(message, type = 'info') {
  // 先移除现有的toast
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 创建新的toast
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.innerHTML = `
    <i class="ri-${type === 'success' ? 'check-line' : 'error-warning-line'}"></i>
    <span>${message}</span>
  `;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 添加显示类
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 3秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

/**
 * 处理返回主页
 * @param {Event} event - 点击事件
 * @param {Element} viewElement - 用户信息视图元素
 */
function handleBackToHome(event, viewElement) {
  console.log('--- [DEBUG] Back To Home Triggered (userInfoView) ---');
  if (event) {
    console.log('[DEBUG] Event Type:', event.type);
    console.log('[DEBUG] Click Target:', event.target.outerHTML);
    console.log('[DEBUG] Current Target:', event.currentTarget);
  } else {
    console.log('[DEBUG] Called programmatically (no event).');
  }
  console.log('[DEBUG] Original User Info:', JSON.stringify(originalUserInfo, null, 2));
  console.log('[DEBUG] Proceeding to hide view and import homeView...');
  console.log('-------------------------------------------------------');
  // 如果是事件触发的，阻止默认行为和冒泡
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('[userInfoView] 返回主页按钮被点击');
  
  // 使用保存的原始用户信息返回主页
  const userToReturn = originalUserInfo || {
    username: userData?.username || '',
    role: userData?.role || ''
  };
  
  // 隐藏用户信息视图
  if (viewElement) {
    viewElement.style.display = 'none';
  }
  
  // 清除事件监听器
  removeAllEventListeners();
  
  // 使用动态导入加载主页视图模块
  import('./homeView.js').then(module => {
    const homeView = module.default || module;
    if (homeView && typeof homeView.init === 'function') {
      homeView.init(userToReturn);
      console.log('[userInfoView] 成功返回主页');
    } else {
      throw new Error('主页视图模块未正确导出init方法');
    }
  }).catch(error => {
    console.error('[userInfoView] 返回主页失败:', error);
    
    // 如果无法返回主页，退回到登录页
    const loginView = document.getElementById('view-login');
    if (loginView) {
      loginView.style.display = '';
      if (window.loginView && window.loginView.init) {
        window.loginView.init();
      }
    }
  });
}

/**
 * 处理重试获取信息
 * @param {Event} event - 点击事件
 * @param {Element} viewElement - 用户信息视图元素
 */
async function handleRetry(event, viewElement) {
  event.preventDefault();
  console.log('[userInfoView] 重试获取用户信息');
  
  // 显示加载状态
  const userInfoContent = viewElement.querySelector('.user-info-content');
  if (userInfoContent) {
    userInfoContent.classList.remove('error');
    userInfoContent.classList.add('loading');
    userInfoContent.innerHTML = `
      <div class="loading-spinner"></div>
      <p>重新获取个人信息...</p>
    `;
  }
  
  try {
    // 重新获取用户信息
    const username = originalUserInfo?.username;
    if (!username) {
      throw new Error('没有有效的用户名');
    }
    
    const userInfoResponse = await apiService.user.getUserInfo(username);
    
    if (userInfoResponse.code === 200 && userInfoResponse.data) {
      // 更新用户数据
      userData = {
        ...userInfoResponse.data,
        role: originalUserInfo?.role
      };
      
      // 重新渲染用户信息
      renderUserInfo(viewElement);
    } else {
      throw new Error(userInfoResponse.message || '获取用户信息失败');
    }
  } catch (error) {
    console.error('[userInfoView] 重试获取用户信息失败:', error);
    renderErrorState(viewElement, error.message);
  }
}

/**
 * 清除所有事件监听器
 */
function removeAllEventListeners() {
  console.log('[userInfoView] 清理事件监听器，不再操作DOM，仅清空句柄对象');
  eventHandlers = {};
  console.log('[userInfoView] 所有事件监听器句柄已清理');
}

// 导出模块方法
export default {
  init,
  removeAllEventListeners
}; 