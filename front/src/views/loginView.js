// src/views/loginView.js
// 登录视图模块 - 提供登录界面的创建和处理逻辑

// 全局变量，用于存储事件监听器引用
let eventHandlers = {
  loginForm: null,
  togglePassword: null,
  gotoRegister: null
};

/**
 * 尝试通过API进行身份验证
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} role - 用户角色
 * @returns {Promise<Object>} 用户对象
 */
async function authenticate(username, password, role) {
  try {
    console.log('[loginView] 尝试身份验证');
    
    // 将role转换为后端需要的格式
    let roleValue = role;
    if (role === "driver") roleValue = "驾驶员";
    if (role === "monitor") roleValue = "监管员";
    if (role === "admin") roleValue = "管理员";
    
    // 直接发送请求到服务器
    console.log('[loginView] 发送登录请求到服务器');
    
    const requestBody = {
      username: username,
      password: password,
      role: roleValue
    };
    
    const response = await fetch('http://192.168.70.167:8000/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('[loginView] 登录API返回数据:', data);
    
    // 检查响应状态
    if (data.code !== 200) {
      throw new Error(data.message || '登录失败');
    }
    
    return {
      id: data.id,
      role: data.role
    };
  } catch (error) {
    console.error('[loginView] 身份验证错误:', error);
    throw error;
  }
}

/**
 * 初始化登录视图，创建界面并设置表单提交逻辑
 */
function init() {
  console.log('[loginView] 初始化登录视图');
  
  // 清除所有之前的事件监听器
  removeAllEventListeners();
  
  // 获取登录视图容器
  const container = document.getElementById('view-login');
  
  // 如果容器已经有内容，则先清空
  if (container.innerHTML.trim()) {
    console.log('[loginView] 登录容器已有内容，清空后重新创建');
    container.innerHTML = '';
  }
  
  // 创建登录界面HTML
  container.innerHTML = `
    <div class="login-container">
      <!-- 左侧装饰区域 -->
      <div class="login-decoration">
        <div class="decoration-circle circle1"></div>
        <div class="decoration-circle circle2"></div>
        <div class="decoration-circle circle3"></div>
        <div class="illustration">
          <i class="ri-eye-line"></i>
          <i class="ri-shield-check-line"></i>
          <i class="ri-alert-line"></i>
        </div>
        <h2 class="welcome-text">疲劳检测系统</h2>
        <p class="slogan">安全驾驶，保障生命</p>
      </div>
      
      <!-- 右侧登录表单 -->
      <div class="login-form-container">
        <form id="login-form" class="login-form">
          <h1>用户登录</h1>
          <p>请输入您的登录信息</p>
          
          <div class="form-group">
            <label for="username">
              <i class="ri-user-line"></i>
              <span>用户名</span>
            </label>
            <input type="text" id="username" class="form-control" name="username" required placeholder="请输入用户名" />
          </div>
          
          <div class="form-group">
            <label for="password">
              <i class="ri-lock-password-line"></i>
              <span>密码</span>
            </label>
            <div class="password-input-container">
              <input type="password" id="password" class="form-control" name="password" required placeholder="请输入密码" />
              <button type="button" id="toggle-password" class="toggle-password">
                <i class="ri-eye-off-line"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="role">
              <i class="ri-user-settings-line"></i>
              <span>角色</span>
            </label>
            <div class="select-container">
              <select id="role" name="role" class="form-control" required>
                <option value="" disabled selected>请选择您的角色</option>
                <option value="driver">驾驶员</option>
                <option value="monitor">监管员</option>
                <option value="admin">管理员</option>
              </select>
              <i class="ri-arrow-down-s-line select-arrow"></i>
            </div>
          </div>
          
          <div class="form-group">
            <button type="submit" id="login-btn" class="login-btn">
              <span class="btn-text">登录</span>
              <i class="ri-login-circle-line"></i>
              <span class="spinner hidden"></span>
            </button>
          </div>
          
          <div class="form-footer">
            <p>没有账号?</p>
            <a href="#" id="goto-register-btn" class="register-btn">
              <span>立即注册</span>
              <i class="ri-arrow-right-line"></i>
            </a>
          </div>
          
          <div id="login-message" class="login-message"></div>
        </form>
      </div>
    </div>
  `;
  
  // 获取表单元素
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const gotoRegisterBtn = document.getElementById('goto-register-btn');
  
  // 处理密码可见性切换
  const handleTogglePasswordVisibility = (event) => {
    const button = event.currentTarget;
    
    if (!passwordInput) {
      console.error('[loginView] 找不到密码输入框');
      return;
    }
    
    console.log('[loginView] 切换密码可见性');
    
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
  };
  
  // 处理表单提交
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // 获取表单数据
    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value;
    const role = document.getElementById('role').value;
    
    // 清除之前的错误消息
    const loginMessage = document.getElementById('login-message');
    loginMessage.className = 'login-message';
    loginMessage.textContent = '';
    
    // 验证表单
    if (!username) {
      showMessage('请输入用户名', 'error');
      document.getElementById('username').focus();
      return;
    }
    
    if (!password) {
      showMessage('请输入密码', 'error');
      passwordInput.focus();
      return;
    }
    
    if (!role) {
      showMessage('请选择用户角色', 'error');
      document.getElementById('role').focus();
      return;
    }
    
    // 显示加载状态
    setLoadingState(true);
    
    try {
      // 尝试认证
      const user = await authenticate(username, password, role);
      
      // 显示登录成功消息
      showMessage('登录成功，正在跳转...', 'success');
      
      // 延迟，让用户看到成功消息
      setTimeout(() => {
        // 登录成功后跳转到主页，并传递用户信息
        console.log('[loginView] 登录成功，用户信息:', user);
        
        // 准备用户数据
        const userData = {
          username: username,
          role: user.role
        };
        
        // 初始化主页视图
        if (window.homeView?.init) {
          try {
            window.homeView.init(userData);
            console.log('[loginView] 主页视图已初始化');
          } catch (error) {
            console.error('[loginView] 初始化主页视图失败:', error);
            showMessage('初始化主页失败，请重试', 'error');
          }
        } else {
          console.error('[loginView] 主页视图模块未找到');
          showMessage('主页模块未加载，请刷新页面', 'error');
        }
      }, 1500);
      
    } catch (error) {
      console.error('[loginView] 登录失败:', error);
      showMessage(error.message || '登录失败，请检查用户名和密码', 'error');
      setLoadingState(false);
    }
  };
  
  // 处理跳转到注册页
  const handleGoToRegister = (event) => {
    event.preventDefault();
    console.log('[loginView] 跳转到注册页');
    
    // 隐藏登录视图
    const loginView = document.getElementById('view-login');
    if (loginView) {
      loginView.style.display = 'none';
    } else {
      console.error('[loginView] 找不到登录视图容器');
    }
    
    // 显示注册视图
    const registerView = document.getElementById('view-register');
    if (registerView) {
      registerView.style.display = '';
      
      // 动态导入注册视图模块
      import('./registerView.js')
        .then(module => {
          console.log('[loginView] 注册视图模块加载成功');
          window.registerView = module.default;
          return window.registerView.init();
        })
        .then(() => {
          console.log('[loginView] 注册视图初始化成功');
        })
        .catch(error => {
          console.error('[loginView] 加载或初始化注册视图失败:', error);
          // 如果加载失败，显示回登录视图
          loginView.style.display = '';
          showMessage('加载注册页面失败，请稍后重试', 'error');
        });
    } else {
      console.error('[loginView] 找不到注册视图容器');
      // 如果找不到注册视图容器，显示回登录视图
      loginView.style.display = '';
      showMessage('加载注册页面失败，请稍后重试', 'error');
    }
  };
  
  // 添加事件监听器
  loginForm.addEventListener('submit', handleSubmit);
  togglePasswordBtn.addEventListener('click', handleTogglePasswordVisibility);
  gotoRegisterBtn.addEventListener('click', handleGoToRegister);
  
  // 存储事件监听器引用
  eventHandlers.loginForm = handleSubmit;
  eventHandlers.togglePassword = handleTogglePasswordVisibility;
  eventHandlers.gotoRegister = handleGoToRegister;
  
  // 聚焦用户名输入框
  document.getElementById('username').focus();
  
  return Promise.resolve();
}

/**
 * 显示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('error' 或 'success')
 */
function showMessage(message, type) {
  const loginMessage = document.getElementById('login-message');
  if (!loginMessage) return;
  
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${type}`;
}

/**
 * 设置加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function setLoadingState(isLoading) {
  const loginBtn = document.getElementById('login-btn');
  const btnText = loginBtn ? loginBtn.querySelector('.btn-text') : null;
  const spinner = loginBtn ? loginBtn.querySelector('.spinner') : null;
  
  if (!loginBtn || !btnText || !spinner) return;
  
  if (isLoading) {
    loginBtn.disabled = true;
    btnText.textContent = '登录中...';
    spinner.classList.remove('hidden');
  } else {
    loginBtn.disabled = false;
    btnText.textContent = '登录';
    spinner.classList.add('hidden');
  }
}

/**
 * 清理所有事件监听器
 */
function removeAllEventListeners() {
  console.log('[loginView] 清理所有事件监听器');
  
  const loginForm = document.getElementById('login-form');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const gotoRegisterBtn = document.getElementById('goto-register-btn');
  
  if (loginForm && eventHandlers.loginForm) {
    loginForm.removeEventListener('submit', eventHandlers.loginForm);
  }
  
  if (togglePasswordBtn && eventHandlers.togglePassword) {
    togglePasswordBtn.removeEventListener('click', eventHandlers.togglePassword);
  }
  
  if (gotoRegisterBtn && eventHandlers.gotoRegister) {
    gotoRegisterBtn.removeEventListener('click', eventHandlers.gotoRegister);
  }
  
  // 重置事件处理器引用
  eventHandlers = {
    loginForm: null,
    togglePassword: null,
    gotoRegister: null
  };
}

// 导出函数
export default {
  init,
  removeAllEventListeners
};
