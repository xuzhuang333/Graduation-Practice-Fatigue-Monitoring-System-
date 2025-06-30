const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 在这里可以添加与主进程通信的方法
  // 例如: setUserRole: (role) => ipcRenderer.send('set-user-role', role),
});

// 设置版本号
contextBridge.exposeInMainWorld('APP_VERSION', '1.0.0');

contextBridge.exposeInMainWorld('api', {
  // 渲染进程到主进程（单向）
  setUserRole: role => ipcRenderer.send('set-user-role', role),
  showView: viewName => ipcRenderer.send('show-view', viewName),
  logAction: entry => ipcRenderer.send('log-action', entry),

  // 渲染进程到主进程（双向）
  getUserRole: () => ipcRenderer.invoke('get-user-role'),

  // 主进程到渲染进程
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  }
});