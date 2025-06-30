// main.js
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // 允许跨域请求
    }
  });

  // 拦截网络请求设置内容安全策略
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
          "object-src 'none'; " +
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
          "img-src 'self' data:; " +
          "font-src 'self' https://cdn.jsdelivr.net;"
        ]
      }
    });
  });

  // 加载本地HTML文件
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'src', 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );
}

// Electron启动后创建主窗口
app.whenReady().then(createWindow);

// macOS: 激活时如果没有窗口则创建一个
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 除macOS外，所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
