// src/views/registerView.js
// 注册视图模块 - 提供注册界面的创建和处理逻辑

// 全局变量，用于存储事件监听器引用
let eventHandlers = {};

/**
 * 尝试通过API进行注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} confirm_password - 确认密码
 * @param {string} carnumber - 车牌号
 * @returns {Promise<Object>} 注册结果
 */
async function register(username, password, confirm_password, carnumber) {
  try {
    console.log('[registerView] 尝试注册');
    
    // 直接发送请求到服务器
    console.log('[registerView] 发送注册请求到服务器');
    
    const requestBody = {
      username: username,
      password: password,
      confirm_password: confirm_password,
      carnumber: carnumber
    };
    
    const response = await fetch('http://192.168.70.167:8000/api/v1/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('[registerView] 注册API返回数据:', data);
    
    return data;
  } catch (error) {
    console.error('[registerView] 注册错误:', error);
    throw error;
  }
}

/**
 * 初始化注册视图，创建界面并设置表单提交逻辑
 */
function init() {
  console.log('[registerView] 初始化注册视图');
  
  // 获取注册视图容器
  const container = document.getElementById('view-register');
  if (!container) {
    console.error('[registerView] 找不到注册视图容器');
    return Promise.reject(new Error('找不到注册视图容器'));
  }
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 如果容器已经有内容，则先清空
  if (container.innerHTML.trim()) {
    console.log('[registerView] 注册容器已有内容，清空后重新创建');
    container.innerHTML = '';
  }
  
  // 创建注册界面HTML
  container.innerHTML = `
    <div class="login-container">
      <!-- 左侧装饰区域 -->
      <div class="login-decoration">
        <div class="decoration-circle circle1"></div>
        <div class="decoration-circle circle2"></div>
        <div class="decoration-circle circle3"></div>
        <div class="illustration">
          <i class="ri-user-add-line"></i>
          <i class="ri-shield-check-line"></i>
          <i class="ri-car-line"></i>
        </div>
        <h2 class="welcome-text">创建您的账号</h2>
        <p class="slogan">加入疲劳检测系统</p>
      </div>
      
      <!-- 右侧注册表单 -->
      <div class="login-form-container">
        <form id="register-form" class="login-form">
          <h1>用户注册</h1>
          <p>请填写以下信息创建您的账号</p>
          
          <div class="form-group">
            <label for="reg-username">
              <i class="ri-user-line"></i>
              <span>用户名</span>
            </label>
            <input type="text" id="reg-username" class="form-control" name="username" required placeholder="请输入用户名" />
          </div>
          
          <div class="form-group">
            <label for="reg-password">
              <i class="ri-lock-password-line"></i>
              <span>密码</span>
            </label>
            <div class="password-input-container">
              <input type="password" id="reg-password" class="form-control" name="password" required placeholder="请输入密码" />
              <button type="button" id="toggle-reg-password" class="toggle-password">
                <i class="ri-eye-off-line"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="reg-confirm-password">
              <i class="ri-lock-password-line"></i>
              <span>确认密码</span>
            </label>
            <div class="password-input-container">
              <input type="password" id="reg-confirm-password" class="form-control" name="confirm_password" required placeholder="请再次输入密码" />
              <button type="button" id="toggle-reg-confirm-password" class="toggle-password">
                <i class="ri-eye-off-line"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="reg-carnumber">
              <i class="ri-car-line"></i>
              <span>车牌号</span>
            </label>
            <input type="text" id="reg-carnumber" class="form-control" name="carnumber" required placeholder="请输入车牌号" />
          </div>
          
          <div class="form-group">
            <button type="submit" id="register-btn" class="login-btn">
              <span class="btn-text">注册</span>
              <i class="ri-user-add-line"></i>
              <span class="spinner hidden"></span>
            </button>
          </div>
          
          <div class="form-footer">
            <p>已有账号?</p>
            <a href="#" id="goto-login-btn" class="register-btn">
              <span>返回登录</span>
              <i class="ri-arrow-right-line"></i>
            </a>
          </div>
          
          <div id="register-message" class="login-message"></div>
        </form>
      </div>
    </div>
  `;
  
  // 获取表单元素
  const registerForm = document.getElementById('register-form');
  const usernameInput = document.getElementById('reg-username');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('reg-confirm-password');
  const carnumberInput = document.getElementById('reg-carnumber');
  const togglePasswordBtn = document.getElementById('toggle-reg-password');
  const toggleConfirmPasswordBtn = document.getElementById('toggle-reg-confirm-password');
  const gotoLoginBtn = document.getElementById('goto-login-btn');
  
  // 检查所有必要元素是否存在
  if (!registerForm || !usernameInput || !passwordInput || !confirmPasswordInput || 
      !carnumberInput || !togglePasswordBtn || !toggleConfirmPasswordBtn || !gotoLoginBtn) {
    console.error('[registerView] 一些必要的表单元素不存在');
    console.log({
      registerForm: !!registerForm,
      usernameInput: !!usernameInput,
      passwordInput: !!passwordInput,
      confirmPasswordInput: !!confirmPasswordInput,
      carnumberInput: !!carnumberInput,
      togglePasswordBtn: !!togglePasswordBtn,
      toggleConfirmPasswordBtn: !!toggleConfirmPasswordBtn,
      gotoLoginBtn: !!gotoLoginBtn
    });
    return Promise.reject(new Error('一些必要的表单元素不存在'));
  }
  
  // 密码可见性切换函数
  function togglePasswordVisibility(inputElement, iconElement) {
    const currentType = inputElement.type;
    inputElement.type = currentType === 'password' ? 'text' : 'password';
    iconElement.className = currentType === 'password' ? 'ri-eye-line' : 'ri-eye-off-line';
    
    // 如果切换为可见，3秒后自动切换回不可见
    if (inputElement.type === 'text') {
      setTimeout(() => {
        inputElement.type = 'password';
        iconElement.className = 'ri-eye-off-line';
      }, 3000);
    }
  }
  
  // 表单提交处理函数
  async function handleSubmit(event) {
    event.preventDefault();
    
    console.log('[registerView] 表单提交开始');
    
    // 获取表单数据
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const carnumber = carnumberInput.value.trim();
    
    console.log('[registerView] 表单数据:', { 
      username, 
      passwordLength: password ? password.length : 0,
      confirmPasswordLength: confirmPassword ? confirmPassword.length : 0,
      carnumber 
    });
    
    // 清除之前的错误消息
    const registerMessage = document.getElementById('register-message');
    registerMessage.className = 'login-message';
    registerMessage.textContent = '';
    
    // 验证表单
    if (!username) {
      showMessage('请输入用户名', 'error');
      usernameInput.focus();
      return;
    }
    
    if (!password) {
      showMessage('请输入密码', 'error');
      passwordInput.focus();
      return;
    }
    
    if (!confirmPassword) {
      showMessage('请确认密码', 'error');
      confirmPasswordInput.focus();
      return;
    }
    
    if (!carnumber) {
      showMessage('请输入车牌号', 'error');
      carnumberInput.focus();
      return;
    }
    
    // 显示加载状态
    setLoadingState(true);
    
    try {
      // 尝试注册
      const result = await register(username, password, confirmPassword, carnumber);
      
      if (result.code === 201) {
        // 注册成功
        showMessage('注册成功，即将返回登录页面...', 'success');
        
        // 延迟，让用户看到成功消息
        setTimeout(() => {
          // 返回登录页面
          goToLogin();
        }, 2000);
      } else if (result.code === 202) {
        // 两次密码不一致
        showMessage('两次密码不一致!', 'error');
        confirmPasswordInput.focus();
        setLoadingState(false);
      } else if (result.code === 203) {
        // 用户已被注册
        showMessage('该用户已被注册！', 'error');
        usernameInput.focus();
        setLoadingState(false);
      } else {
        // 其他错误
        showMessage(result.message || '注册失败，请稍后重试', 'error');
        setLoadingState(false);
      }
    } catch (error) {
      console.error('[registerView] 注册失败:', error);
      showMessage(error.message || '注册失败，请检查网络连接', 'error');
      setLoadingState(false);
    }
  }
  
  // 处理跳转到登录页
  function handleGoToLogin(event) {
    event.preventDefault();
    goToLogin();
  }
  
  // 添加事件监听器
  registerForm.addEventListener('submit', handleSubmit);
  eventHandlers.submitHandler = handleSubmit;
  
  // 密码可见性切换事件
  togglePasswordBtn.addEventListener('click', () => {
    const icon = togglePasswordBtn.querySelector('i');
    togglePasswordVisibility(passwordInput, icon);
  });
  eventHandlers.togglePasswordHandler = togglePasswordBtn.onclick;
  
  toggleConfirmPasswordBtn.addEventListener('click', () => {
    const icon = toggleConfirmPasswordBtn.querySelector('i');
    togglePasswordVisibility(confirmPasswordInput, icon);
  });
  eventHandlers.toggleConfirmPasswordHandler = toggleConfirmPasswordBtn.onclick;
  
  // 返回登录按钮事件
  gotoLoginBtn.addEventListener('click', handleGoToLogin);
  eventHandlers.gotoLoginHandler = handleGoToLogin;
  
  // 聚焦用户名输入框
  usernameInput.focus();
  
  return Promise.resolve();
}

/**
 * 跳转到登录页面
 */
function goToLogin() {
  console.log('[registerView] 跳转到登录页面');
  
  // 隐藏注册视图
  const registerView = document.getElementById('view-register');
  if (registerView) {
    registerView.style.display = 'none';
  }
  
  // 显示登录视图
  const loginView = document.getElementById('view-login');
  if (loginView) {
    loginView.style.display = '';
    
    // 初始化登录视图
    if (window.loginView && window.loginView.init) {
      window.loginView.init();
    }
  }
}

/**
 * 显示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('error' 或 'success')
 */
function showMessage(message, type) {
  const registerMessage = document.getElementById('register-message');
  if (!registerMessage) return;
  
  registerMessage.textContent = message;
  registerMessage.className = `login-message ${type}`;
}

/**
 * 设置加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function setLoadingState(isLoading) {
  const registerBtn = document.getElementById('register-btn');
  const btnText = registerBtn ? registerBtn.querySelector('.btn-text') : null;
  const spinner = registerBtn ? registerBtn.querySelector('.spinner') : null;
  
  if (!registerBtn || !btnText || !spinner) return;
  
  if (isLoading) {
    registerBtn.disabled = true;
    btnText.textContent = '注册中...';
    spinner.classList.remove('hidden');
  } else {
    registerBtn.disabled = false;
    btnText.textContent = '注册';
    spinner.classList.add('hidden');
  }
}

/**
 * 清理所有事件监听器
 */
function removeAllEventListeners() {
  console.log('[registerView] 清理所有事件监听器');
  
  // 清理之前的事件监听器
  if (eventHandlers.submitHandler) {
    const form = document.getElementById('register-form');
    if (form) {
      form.removeEventListener('submit', eventHandlers.submitHandler);
    }
  }
  
  // 重置事件处理器引用
  eventHandlers = {};
}

// 导出函数
export default {
  init,
  removeAllEventListeners
};
