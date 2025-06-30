// src/views/fatigueDetectionView.js
// 疲劳检测视图模块 - 提供疲劳检测功能的界面和逻辑

// 全局变量，用于存储事件监听器引用和用户信息
let eventHandlers = {};
let currentUser = {
  username: '',
  role: ''
};

/**
 * 初始化疲劳检测视图
 * @param {Object} user - 用户信息对象
 * @param {string} user.username - 用户名
 * @param {string} user.role - 用户角色
 */
function init(user) {
  console.log('[fatigueDetectionView] 初始化疲劳检测视图', user);
  
  // 保存用户信息
  if (user && user.username && user.role) {
    currentUser = {
      username: user.username,
      role: user.role
    };
  } else {
    console.error('[fatigueDetectionView] 初始化错误: 未提供有效的用户信息');
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
      document.getElementById('view-user-edit')
    ];
    
    views.forEach(view => {
      if (view) view.style.display = 'none';
    });
  }
  
  // 获取疲劳检测视图容器
  const fatigueDetectionView = document.getElementById('view-fatigue-detection');
  if (!fatigueDetectionView) {
    console.error('[fatigueDetectionView] 找不到疲劳检测视图容器');
    return;
  }
  
  // 显示疲劳检测视图
  fatigueDetectionView.style.display = 'flex';
  
  // 创建疲劳检测界面内容
  fatigueDetectionView.innerHTML = `
    <div class="fatigue-detection-container">
      <div class="fatigue-detection-header">
        <h1>疲劳检测系统</h1>
        <button id="fatigue-back-to-home-btn" class="back-button">
          <i class="ri-arrow-left-line"></i>
          <span>返回主页</span>
        </button>
      </div>

      <div class="container">
        <div class="video-container">
          <video id="video" autoplay></video>
          <canvas id="canvas"></canvas>
          <div id="detection-boxes" class="detection-boxes"></div>
        </div>

        <div class="control-panel">
          <h2>控制面板</h2>

          <div class="connection-status" id="connectionStatus">
              WebSocket未连接
          </div>

          <button id="connectBtn">连接服务器</button>
          <button id="startBtn" disabled>开始检测</button>
          <button id="stopBtn" disabled>停止检测</button>
          <button id="resetBtn">重置数据</button>

          <div class="interval-control">
              <label for="intervalInput">检测间隔 (毫秒):</label>
              <input type="number" id="intervalInput" value="500" min="100" max="2000" step="100">
          </div>

          <div class="status-panel" id="statusPanel">
              <h3>当前状态</h3>
              <p id="fatigueStatus">疲劳等级: 等待开始检测...</p>
              <p id="stateDuration">状态持续时间: 0秒</p>

              <div class="warnings">
                  <p id="eyeWarning" class="warning" style="display: none;">⚠️ 检测到长时间闭眼!</p>
                  <p id="yawnWarning" class="warning" style="display: none;">⚠️ 检测到打哈欠!</p>
              </div>

              <div class="stats">
                  <div class="stat-box">
                      <div>请求总数</div>
                      <div id="requestCount">0</div>
                  </div>
                  <div class="stat-box">
                      <div>平均响应时间</div>
                      <div id="avgResponseTime">0 ms</div>
                  </div>
                  <div class="stat-box">
                      <div>最近响应时间</div>
                      <div id="lastResponseTime">0 ms</div>
                  </div>
              </div>
          </div>

          <h3>日志</h3>
          <div id="logs"></div>
        </div>
      </div>
    </div>

    <style>
      .fatigue-detection-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .fatigue-detection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      
      .fatigue-detection-header h1 {
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
      
      .container {
        max-width: 1200px;
        margin: 20px auto;
        display: flex;
      }
      
      .video-container {
        width: 640px;
        position: relative;
      }
      
      #video {
        width: 100%;
        border: 2px solid #333;
        border-radius: 5px;
      }
      
      #canvas {
        display: none;
      }
      
      .control-panel {
        flex: 1;
        margin-left: 20px;
        background: white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .status-panel {
        margin-top: 20px;
        padding: 15px;
        border-radius: 5px;
        transition: background-color: 0.5s ease;
        background-color: #e0e0e0; /* 默认灰色背景 */
      }
      
      .status-low {
        background-color: #c8e6c9;
      }
      
      .status-medium {
        background-color: #fff9c4;
      }
      
      .status-high {
        background-color: #ffcdd2;
      }
      
      .status-initializing {
        background-color: #e0e0e0; /* 初始化状态的颜色 */
      }
      
      .detection-boxes {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      
      button {
        padding: 10px 15px;
        margin: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      
      button:hover {
        background-color: #45a049;
      }
      
      button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      .warning {
        color: red;
        font-weight: bold;
        margin: 10px 0;
      }
      
      h2 {
        margin-top: 0;
        color: #333;
      }
      
      h3 {
        margin-top: 20px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      
      .stats {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
      }
      
      .stat-box {
        background: #f9f9f9;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        flex: 1;
        margin: 0 5px;
        text-align: center;
      }
      
      #logs {
        height: 150px;
        overflow-y: auto;
        border: 1px solid #ddd;
        padding: 10px;
        margin-top: 10px;
        font-family: monospace;
        font-size: 12px;
        background-color: #f9f9f9;
      }
      
      .log-entry {
        margin-bottom: 3px;
        border-bottom: 1px solid #eee;
        padding-bottom: 3px;
      }
      
      .interval-control {
        display: flex;
        align-items: center;
        margin: 15px 0;
      }
      
      .interval-control label {
        margin-right: 10px;
        min-width: 150px;
      }
      
      .interval-control input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .connection-status {
        margin-top: 10px;
        padding: 5px;
        border-radius: 4px;
        text-align: center;
      }
      
      .connected {
        background-color: #c8e6c9;
        color: #2e7d32;
      }
      
      .disconnected {
        background-color: #ffcdd2;
        color: #c62828;
      }
      
      .connecting {
        background-color: #fff9c4;
        color: #f57f17;
      }
    </style>
  `;
  
  // 添加事件监听器(仅在当前视图范围内查询)
  eventHandlers.backToHomeBtn = fatigueDetectionView.querySelector('#fatigue-back-to-home-btn');
  eventHandlers.backToHomeBtn.addEventListener('click', handleBackToHome);
  
  // 初始化摄像头
  initFatigueDetection();
}

/**
 * 初始化疲劳检测功能
 */
function initFatigueDetection() {
  // 获取DOM元素
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  
  // DOM 元素
  const connectBtn = document.getElementById('connectBtn');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const intervalInput = document.getElementById('intervalInput');
  const statusPanel = document.getElementById('statusPanel');
  const fatigueStatus = document.getElementById('fatigueStatus');
  const stateDuration = document.getElementById('stateDuration');
  const eyeWarning = document.getElementById('eyeWarning');
  const yawnWarning = document.getElementById('yawnWarning');
  const requestCountElement = document.getElementById('requestCount');
  const avgResponseTimeElement = document.getElementById('avgResponseTime');
  const lastResponseTimeElement = document.getElementById('lastResponseTime');
  const logsElement = document.getElementById('logs');
  const detectionBoxes = document.getElementById('detection-boxes');
  const connectionStatus = document.getElementById('connectionStatus');
  
  // 定义全局变量
  const API_URL = 'http://192.168.70.167:8000/api/v4detect_fatigue/';
  const WS_URL_BASE = 'ws://192.168.70.167:8000/api/v4/ws'; // 修改为指定IP
  let isRunning = false;
  let detectionInterval;
  let socket = null;
  let requestCount = 0;
  let totalResponseTime = 0;
  let lastResponseTime = 0;
  let lastRequestTime = 0;
  
  // 初始化摄像头
  initCamera();
  
  // 添加事件监听器
  connectBtn.addEventListener('click', connectWebSocket);
  startBtn.addEventListener('click', startDetection);
  stopBtn.addEventListener('click', stopDetection);
  resetBtn.addEventListener('click', resetBuffer);
  
  /**
   * 初始化摄像头
   */
  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        addLog('摄像头初始化成功');
      });
    } catch (err) {
      addLog('错误: 无法访问摄像头 - ' + err.message, 'error');
    }
  }
  
  /**
   * 连接WebSocket
   */
  function connectWebSocket() {
    if (socket) {
      socket.close();
      socket = null;
    }
    updateConnectionStatus('connecting');
    addLog('正在连接WebSocket服务器...');
    
    // 使用当前登录用户名
    const dynamicWsUrl = `${WS_URL_BASE}/${encodeURIComponent(currentUser.username)}`;
    socket = new WebSocket(dynamicWsUrl);
    
    socket.onopen = function() {
      updateConnectionStatus('connected');
      addLog(`WebSocket连接成功，用户: ${currentUser.username}`);
      startBtn.disabled = false;
      connectBtn.disabled = true;
    };
    
    socket.onmessage = function(event) {
      try {
        const endTime = performance.now();
        lastResponseTime = Math.round(endTime - lastRequestTime);
        totalResponseTime += lastResponseTime;
        requestCount++;
        requestCountElement.textContent = requestCount;
        avgResponseTimeElement.textContent = `${Math.round(totalResponseTime / requestCount)} ms`;
        lastResponseTimeElement.textContent = `${lastResponseTime} ms`;
        const result = JSON.parse(event.data);
        if (result.error) {
          addLog(`错误: ${result.error}`, 'error');
        } else {
          updateUI(result);
          if(result.fatigue_level !== "Initializing") {
            addLog(`检测完成: ${result.fatigue_level}`);
          }
        }
      } catch (err) {
        addLog('解析WebSocket响应错误: ' + err.message, 'error');
      }
    };
    
    socket.onclose = function() {
      updateConnectionStatus('disconnected');
      addLog('WebSocket连接已关闭');
      startBtn.disabled = true;
      connectBtn.disabled = false;
      if (isRunning) {
        stopDetection();
      }
    };
    
    socket.onerror = function(error) {
      updateConnectionStatus('disconnected');
      addLog('WebSocket错误: ' + error.message, 'error');
      connectBtn.disabled = false;
    };
  }
  
  /**
   * 更新连接状态
   */
  function updateConnectionStatus(status) {
    connectionStatus.className = 'connection-status ' + status;
    switch (status) {
      case 'connected': connectionStatus.textContent = 'WebSocket已连接'; break;
      case 'disconnected': connectionStatus.textContent = 'WebSocket未连接'; break;
      case 'connecting': connectionStatus.textContent = 'WebSocket连接中...'; break;
    }
  }
  
  /**
   * 开始检测
   */
  function startDetection() {
    if (isRunning || !socket || socket.readyState !== WebSocket.OPEN) return;
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    const interval = parseInt(intervalInput.value);
    addLog(`开始检测，间隔: ${interval}ms`);
    detectionInterval = setInterval(() => {
      captureAndSendFrame();
    }, interval);
  }
  
  /**
   * 停止检测
   */
  function stopDetection() {
    if (!isRunning) return;
    clearInterval(detectionInterval);
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    addLog('停止检测');
  }
  
  /**
   * 重置缓冲区
   */
  async function resetBuffer() {
    try {
      addLog('重置缓冲区...');
      const response = await fetch('http://192.168.70.167:8000/api/v4/reset_buffer', {
        method: 'POST'
      });
      const result = await response.json();
      addLog(`重置结果: ${result.message}`);
    } catch (err) {
      addLog('重置缓冲区失败: ' + err.message, 'error');
    }
  }
  
  /**
   * 捕获并发送帧
   */
  function captureAndSendFrame() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      addLog('WebSocket未连接，无法发送帧', 'error');
      stopDetection();
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      lastRequestTime = performance.now();
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      
      const payload = {
        username: currentUser.username, // 使用当前用户名
        image: imageData
      };
      
      socket.send(JSON.stringify(payload));
    } catch (err) {
      addLog('发送帧失败: ' + err.message, 'error');
    }
  }
  
  /**
   * 更新UI
   */
  function updateUI(result) {
    stateDuration.textContent = `状态持续时间: ${result.current_state_duration.toFixed(1)}秒`;
    
    if (result.fatigue_level === 'Initializing') {
      fatigueStatus.textContent = `疲劳等级: ${getFatigueText(result.fatigue_level)}`;
      statusPanel.className = 'status-panel status-initializing';
      eyeWarning.style.display = 'none';
      yawnWarning.style.display = 'none';
      renderDetectionBoxes(result.detection_boxes);
      return;
    }
    
    fatigueStatus.textContent = `疲劳等级: ${getFatigueText(result.fatigue_level)}`;
    statusPanel.className = 'status-panel';
    statusPanel.classList.add(`status-${result.fatigue_level.toLowerCase()}`);
    eyeWarning.style.display = result.eye_closure ? 'block' : 'none';
    yawnWarning.style.display = result.yawn_detected ? 'block' : 'none';
    renderDetectionBoxes(result.detection_boxes);
  }
  
  /**
   * 获取疲劳文本
   */
  function getFatigueText(level) {
    switch(level) {
      case 'Initializing': return '正在收集数据，请稍候...';
      case 'Low': return '低（精神状态良好）';
      case 'Medium': return '中（出现疲劳迹象）';
      case 'High': return '高（严重疲劳）';
      default: return level;
    }
  }
  
  /**
   * 渲染检测框
   */
  function renderDetectionBoxes(boxes) {
    if (!boxes || boxes.length === 0) {
      detectionBoxes.innerHTML = '';
      return;
    }
    const videoRect = video.getBoundingClientRect();
    const scaleX = videoRect.width / canvas.width;
    const scaleY = videoRect.height / canvas.height;
    detectionBoxes.innerHTML = '';
    
    boxes.forEach(box => {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = `${box.box[0] * scaleX}px`;
      div.style.top = `${box.box[1] * scaleY}px`;
      div.style.width = `${box.box[2] * scaleX}px`;
      div.style.height = `${box.box[3] * scaleY}px`;
      div.style.border = '2px solid';
      switch(box.class) {
        case 'mouth_open': div.style.borderColor = 'blue'; break;
        case 'closed_eye': div.style.borderColor = 'red'; break;
        case 'face': div.style.borderColor = 'green'; break;
        default: div.style.borderColor = 'yellow';
      }
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = '-20px';
      label.style.left = '0';
      label.style.backgroundColor = div.style.borderColor;
      label.style.color = 'white';
      label.style.padding = '2px 5px';
      label.style.fontSize = '12px';
      label.style.borderRadius = '3px';
      label.textContent = `${box.class} (${(box.confidence * 100).toFixed(0)}%)`;
      div.appendChild(label);
      detectionBoxes.appendChild(div);
    });
  }
  
  /**
   * 添加日志
   */
  function addLog(message, type = 'info') {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span style="color: ${type === 'error' ? 'red' : 'green'}">[${timestamp}]</span> ${message}`;
    logsElement.appendChild(entry);
    logsElement.scrollTop = logsElement.scrollHeight;
    while (logsElement.children.length > 100) {
      logsElement.removeChild(logsElement.firstChild);
    }
  }
}

/**
 * 处理返回主页按钮点击事件
 */
function handleBackToHome() {
  console.log('[fatigueDetectionView] 点击返回主页按钮');
  
  // 清理所有资源
  cleanup();
  
  // 返回主页
  if (window.homeView && typeof window.homeView.init === 'function') {
    window.homeView.init({
      username: currentUser.username,
      role: currentUser.role
    });
    console.log('[fatigueDetectionView] 成功返回主页');
  } else {
    console.error('[fatigueDetectionView] 主页视图模块未找到或未正确加载');
    
    // 备用方案：动态导入主页视图模块
    import('./homeView.js').then(module => {
      try {
        const homeView = module.default || module;
        homeView.init({
          username: currentUser.username,
          role: currentUser.role
        });
        console.log('[fatigueDetectionView] 成功返回主页 (动态导入)');
      } catch (error) {
        console.error('[fatigueDetectionView] 返回主页失败:', error);
      }
    }).catch(error => {
      console.error('[fatigueDetectionView] 加载主页视图模块失败:', error);
    });
  }
}

/**
 * 清理资源
 */
function cleanup() {
  console.log('[fatigueDetectionView] 清理资源');
  
  // 关闭摄像头
  const video = document.getElementById('video');
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
  
  // 移除所有事件监听器
  removeAllEventListeners();
}

/**
 * 移除所有事件监听器
 */
function removeAllEventListeners() {
  // 移除返回按钮事件监听器
  if (eventHandlers.backToHomeBtn) {
    eventHandlers.backToHomeBtn.removeEventListener('click', handleBackToHome);
  }
  
  // 重置事件处理器对象
  eventHandlers = {};
}

// 导出模块接口
export {
  init,
  cleanup
}; 