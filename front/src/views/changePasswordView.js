// src/views/changePasswordView.js
// 修改密码视图模块 - 提供修改密码界面和功能

import apiService from '../services/api.js';

// 全局变量，用于存储事件监听器引用和用户信息
let eventHandlers = {};
let originalUserInfo = null;
let isSubmitting = false;

/**
 * 初始化修改密码视图
 * @param {Object} user - 用户基本信息
 * @param {string} user.username - 用户名
 * @param {string} user.role - 用户角色
 */
function init(user) {
  console.log('[changePasswordView] 初始化修改密码视图', user);
  
  if (!user || !user.username) {
    console.error('[changePasswordView] 初始化错误: 未提供有效的用户信息');
    return;
  }
  
  // 保存原始用户信息
  originalUserInfo = {
    username: user.username,
    role: user.role
  };
  
  // 重置提交状态
  isSubmitting = false;
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 隐藏其他视图，显示修改密码视图
  hideOtherViews();
  
  const viewElement = document.getElementById('view-change-password');
  if (!viewElement) {
    const main = document.querySelector('main');
    const changePasswordViewElement = document.createElement('div');
    changePasswordViewElement.id = 'view-change-password';
    main.appendChild(changePasswordViewElement);
  } else {
    viewElement.style.display = 'flex';
  }
  
  // 渲染修改密码界面
  renderChangePasswordView(viewElement, user.username);
}

/**
 * 隐藏其他视图，只显示修改密码视图
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
      document.getElementById('view-user-management'),
      document.getElementById('view-user-edit')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
}

/**
 * 渲染修改密码界面
 * @param {Element} viewElement - 视图元素
 * @param {string} username - 用户名
 */
function renderChangePasswordView(viewElement, username) {
  if (!viewElement) return;
  
  viewElement.innerHTML = `
    <div class="change-password-container">
      <div class="change-password-header">
        <div class="back-button" id="back-to-home-btn">
          <i class="ri-arrow-left-line"></i>
          <span>返回主页</span>
        </div>
        <h1>修改密码</h1>
      </div>
      <div class="change-password-content">
        <form id="change-password-form" class="change-password-form">
          <div class="form-info">
            <i class="ri-lock-password-line"></i>
            <p>您正在修改账号 <strong>${username}</strong> 的密码</p>
            <p class="form-hint">请输入您的原密码和新密码</p>
          </div>
          
          <div class="form-group">
            <label for="old-password">
              <i class="ri-lock-line"></i>
              <span>原密码</span>
            </label>
            <div class="password-input-container">
              <input type="password" id="old-password" class="form-control" name="old_password" required placeholder="请输入原密码" />
              <button type="button" class="toggle-password" data-for="old-password">
                <i class="ri-eye-off-line"></i>
              </button>
            </div>
            <div class="error-message"></div>
          </div>
          
          <div class="form-group">
            <label for="new-password">
              <i class="ri-lock-password-line"></i>
              <span>新密码</span>
            </label>
            <div class="password-input-container">
              <input type="password" id="new-password" class="form-control" name="new_password" required placeholder="请输入新密码" />
              <button type="button" class="toggle-password" data-for="new-password">
                <i class="ri-eye-off-line"></i>
              </button>
            </div>
            <div class="password-strength-meter">
              <div class="strength-bar"></div>
            </div>
            <div class="error-message"></div>
          </div>
          
          <div class="form-group">
            <label for="confirm-password">
              <i class="ri-check-line"></i>
              <span>确认密码</span>
            </label>
            <div class="password-input-container">
              <input type="password" id="confirm-password" class="form-control" name="confirm_password" required placeholder="请再次输入新密码" />
              <button type="button" class="toggle-password" data-for="confirm-password">
                <i class="ri-eye-off-line"></i>
              </button>
            </div>
            <div class="error-message"></div>
          </div>
          
          <div class="form-actions">
            <button type="button" id="cancel-btn" class="cancel-button">
              <i class="ri-close-line"></i>
              <span>取消</span>
            </button>
            <button type="submit" id="submit-btn" class="submit-button">
              <i class="ri-save-line"></i>
              <span>确认修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // 使用 viewElement 进行查询
  const form = viewElement.querySelector('#change-password-form');
  if (form) {
    eventHandlers.formSubmit = (e) => handleFormSubmit(e, viewElement);
    form.addEventListener('submit', eventHandlers.formSubmit);
  }
  
  const backButton = viewElement.querySelector('#back-to-home-btn');
  if (backButton) {
    eventHandlers.backButton = handleBackToHome;
    backButton.addEventListener('click', eventHandlers.backButton);
    console.log('[DEBUG] changePasswordView: Back button event listener attached.');
  }
  
  const cancelButton = viewElement.querySelector('#cancel-btn');
  if (cancelButton) {
    eventHandlers.cancelButton = handleBackToHome;
    cancelButton.addEventListener('click', eventHandlers.cancelButton);
    console.log('[DEBUG] changePasswordView: Cancel button event listener attached.');
  }
  
  const toggleButtons = viewElement.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    const buttonId = `toggle_${button.dataset.for}`;
    eventHandlers[buttonId] = (event) => handleTogglePasswordVisibility(event, viewElement);
    button.addEventListener('click', eventHandlers[buttonId]);
  });
  
  const newPasswordInput = viewElement.querySelector('#new-password');
  if (newPasswordInput) {
    eventHandlers.passwordInput = (e) => handlePasswordInput(e, viewElement);
    newPasswordInput.addEventListener('input', eventHandlers.passwordInput);
  }
  
  const confirmPasswordInput = viewElement.querySelector('#confirm-password');
  if (confirmPasswordInput) {
    eventHandlers.confirmPasswordInput = (e) => handleConfirmPasswordInput(e, viewElement);
    confirmPasswordInput.addEventListener('input', eventHandlers.confirmPasswordInput);
  }
}

/**
 * 处理表单提交
 * @param {Event} event - 提交事件
 * @param {Element} viewElement - 视图元素
 */
async function handleFormSubmit(event, viewElement) {
  event.preventDefault();
  
  // 如果正在提交中，不重复处理
  if (isSubmitting) return;
  
  console.log('[changePasswordView] 提交修改密码表单');
  
  // 清除之前的错误消息
  clearErrors(viewElement);
  
  // 获取表单数据
  const oldPassword = viewElement.querySelector('#old-password').value;
  const newPassword = viewElement.querySelector('#new-password').value;
  const confirmPassword = viewElement.querySelector('#confirm-password').value;
  
  // 验证表单
  let hasError = false;
  
  if (!oldPassword) {
    displayError(viewElement, 'old-password', '请输入原密码');
    hasError = true;
  }
  
  if (!newPassword) {
    displayError(viewElement, 'new-password', '请输入新密码');
    hasError = true;
  }
  
  if (!confirmPassword) {
    displayError(viewElement, 'confirm-password', '请确认新密码');
    hasError = true;
  }
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    displayError(viewElement, 'confirm-password', '两次输入的密码不一致');
    hasError = true;
  }
  
  if (hasError) return;
  
  // 显示提交中状态
  isSubmitting = true;
  const submitBtn = viewElement.querySelector('#submit-btn');
  const cancelBtn = viewElement.querySelector('#cancel-btn');
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-line spinning"></i><span>提交中...</span>';
  }
  
  if (cancelBtn) {
    cancelBtn.disabled = true;
  }
  
  try {
    // 构建请求数据
    const passwordData = {
      username: originalUserInfo.username,
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    };
    
    // 调用API修改密码
    const response = await apiService.user.changePassword(passwordData);
    
    if (response && response.code === 200) {
      console.log('[changePasswordView] 密码修改成功:', response);
      
      // 显示成功消息
      showToast('密码修改成功，即将退出登录', 'success');
      
      // 延时后退出登录
      setTimeout(() => {
        // 退出登录，返回登录页
        logout();
      }, 2000);
    } else {
      throw new Error(response?.message || '密码修改失败');
    }
  } catch (error) {
    console.error('[changePasswordView] 修改密码失败:', error);
    
    // 显示错误消息
    displayError(viewElement, 'old-password', '修改密码失败: ' + error.message);
    
    // 恢复按钮状态
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ri-save-line"></i><span>确认修改</span>';
    }
    
    if (cancelBtn) {
      cancelBtn.disabled = false;
    }
    
    // 重置提交状态
    isSubmitting = false;
  }
}

/**
 * 处理密码可见性切换
 * @param {Event} event - 点击事件
 * @param {Element} viewElement - 视图元素
 */
function handleTogglePasswordVisibility(event, viewElement) {
  const button = event.currentTarget;
  const inputId = button.dataset.for;
  const passwordInput = viewElement.querySelector(`#${inputId}`);
  
  if (!passwordInput) return;
  
  const currentType = passwordInput.type;
  passwordInput.type = currentType === 'password' ? 'text' : 'password';
  
  // 切换图标
  const icon = button.querySelector('i');
  if (icon) {
    icon.className = passwordInput.type === 'password' ? 'ri-eye-off-line' : 'ri-eye-line';
  }
  
  // 如果切换为可见，3秒后自动切换回不可见
  if (passwordInput.type === 'text') {
    setTimeout(() => {
      passwordInput.type = 'password';
      if (icon) {
        icon.className = 'ri-eye-off-line';
      }
    }, 3000);
  }
}

/**
 * 处理密码强度检测
 * @param {Event} event - 输入事件
 * @param {Element} viewElement - 视图元素
 */
function handlePasswordInput(event, viewElement) {
  const password = event.target.value;
  const strengthBar = viewElement.querySelector('.strength-bar');
  
  if (!strengthBar) return;
  
  if (!password) {
    strengthBar.style.width = '0%';
    strengthBar.className = 'strength-bar';
    return;
  }
  
  // 简单的密码强度计算
  let strength = 0;
  
  // 长度检查
  if (password.length >= 8) {
    strength += 25;
  }
  
  // 包含数字
  if (/\d/.test(password)) {
    strength += 25;
  }
  
  // 包含小写字母
  if (/[a-z]/.test(password)) {
    strength += 25;
  }
  
  // 包含大写字母或特殊字符
  if (/[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password)) {
    strength += 25;
  }
  
  // 更新强度条
  strengthBar.style.width = `${strength}%`;
  
  // 更新强度颜色类
  strengthBar.className = 'strength-bar';
  if (strength < 50) {
    strengthBar.classList.add('weak');
  } else if (strength < 75) {
    strengthBar.classList.add('medium');
  } else {
    strengthBar.classList.add('strong');
  }
}

/**
 * 处理确认密码一致性检测
 * @param {Event} event - 输入事件
 * @param {Element} viewElement - 视图元素
 */
function handleConfirmPasswordInput(event, viewElement) {
  const confirmPassword = event.target.value;
  const newPassword = viewElement.querySelector('#new-password').value;
  
  if (confirmPassword && newPassword && confirmPassword !== newPassword) {
    displayError(viewElement, 'confirm-password', '两次输入的密码不一致');
  } else {
    clearError(viewElement, 'confirm-password');
  }
}

/**
 * 显示错误消息
 * @param {Element} viewElement - 视图元素
 * @param {string} fieldId - 字段ID
 * @param {string} message - 错误消息
 */
function displayError(viewElement, fieldId, message) {
  const errorElement = viewElement.querySelector(`#${fieldId}`).closest('.form-group').querySelector('.error-message');
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * 清除指定字段的错误消息
 * @param {Element} viewElement - 视图元素
 * @param {string} fieldId - 字段ID
 */
function clearError(viewElement, fieldId) {
  const errorElement = viewElement.querySelector(`#${fieldId}`).closest('.form-group').querySelector('.error-message');
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

/**
 * 清除所有错误消息
 * @param {Element} viewElement - 视图元素
 */
function clearErrors(viewElement) {
  const errorElements = viewElement.querySelectorAll('.error-message');
  
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });
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
 */
function handleBackToHome(event) {
  console.log('--- [DEBUG] Back To Home Triggered (changePasswordView) ---');
  if (event) {
    console.log('[DEBUG] Event Type:', event.type);
    console.log('[DEBUG] Click Target:', event.target.outerHTML);
    console.log('[DEBUG] Current Target:', event.currentTarget);
  } else {
    console.log('[DEBUG] Called programmatically (no event).');
  }
  console.log('[DEBUG] Original User Info:', JSON.stringify(originalUserInfo, null, 2));
  console.log('[DEBUG] Proceeding to hide view and import homeView...');
  console.log('------------------------------------------------------------');
  // 如果是事件触发的，阻止默认行为和冒泡
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('[changePasswordView] 返回主页按钮被点击');
  
  // 隐藏修改密码视图
  const changePasswordView = document.getElementById('view-change-password');
  if (changePasswordView) {
    changePasswordView.style.display = 'none';
  }
  
  // 清除事件监听器
  removeAllEventListeners();
  
  // 使用动态导入加载主页视图模块
  import('./homeView.js').then(module => {
    const homeView = module.default || module;
    if (homeView && typeof homeView.init === 'function' && originalUserInfo) {
      homeView.init(originalUserInfo);
      console.log('[changePasswordView] 成功返回主页');
    } else {
      throw new Error('主页视图模块未正确导出init方法或用户信息缺失');
    }
  }).catch(error => {
    console.error('[changePasswordView] 返回主页失败:', error);
    
    // 如果无法返回主页，至少显示登录页
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
 * 退出登录
 */
function logout() {
  console.log('[changePasswordView] 退出登录');
  
  // 隐藏所有视图
  const views = [
    document.getElementById('view-home'),
    document.getElementById('view-change-password'),
    document.getElementById('view-user-info'),
    document.getElementById('view-register')
  ];
  
  views.forEach(view => {
    if (view) view.style.display = 'none';
  });
  
  // 显示登录视图
  const loginView = document.getElementById('view-login');
  if (loginView) {
    loginView.style.display = '';
    
    // 初始化登录视图
    if (window.loginView && window.loginView.init) {
      setTimeout(() => {
        window.loginView.init();
      }, 100);
    }
  }
}

/**
 * 清除所有事件监听器
 */
function removeAllEventListeners() {
  console.log('[changePasswordView] 清理事件监听器，不再操作DOM，仅清空句柄对象');
  eventHandlers = {};
  console.log('[changePasswordView] 所有事件监听器句柄已清理');
}

// 导出模块方法
export default {
  init,
  removeAllEventListeners
}; 