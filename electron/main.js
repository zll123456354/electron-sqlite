const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');

// 数据库和模型
const { initDatabase } = require('./db');
const userModel = require('./models/user.model');
const productModel = require('./models/product.model');
const orderModel = require('./models/order.model');

// 控制器（IPC 处理器）
const { registerUserHandlers } = require('./controllers/user.controller');
const { registerProductHandlers } = require('./controllers/product.controller');
const { registerOrderHandlers } = require('./controllers/order.controller');

let mainWindow;

function sendUpdateStatus(msg) {
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.webContents &&
    !mainWindow.webContents.isDestroyed()
  ) {
    mainWindow.webContents.send('update-status', msg);
  }
}

const { autoUpdater } = require('electron-updater');

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdates();

  autoUpdater.on('checking-for-update', () => sendUpdateStatus('正在检查更新...'));
  autoUpdater.on('update-available', () => sendUpdateStatus('发现新版本，正在下载...'));
  autoUpdater.on('update-not-available', () => sendUpdateStatus('当前已是最新版本'));
  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus(`下载进度：${Math.floor(progress.percent)}%`);
  });
  autoUpdater.on('update-downloaded', () => {
    sendUpdateStatus('下载完成，准备安装');
    setTimeout(() => autoUpdater.quitAndInstall(), 3000);
  });
  autoUpdater.on('error', (err) => {
    console.error('更新错误:', err);
    sendUpdateStatus('更新出错');
  });
}

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// 初始化数据库和表
async function initialize() {
  try {
    await initDatabase();
    
    // 创建所有表
    userModel.createTable();
    productModel.createTable();
    orderModel.createTable();
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  }
}

// 注册所有 IPC 处理器
function registerIpcHandlers() {
  registerUserHandlers();
  registerProductHandlers();
  registerOrderHandlers();
  
  console.log('✅ IPC 处理器注册完成');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    console.log('🔧 开发模式已启用');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }

  // 注册快捷键
  globalShortcut.register('F12', () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
}

app.whenReady().then(async () => {
  await initialize();
  registerIpcHandlers();
  createWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 更新检查 IPC
ipcMain.on('update:checkNow', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!app.isPackaged) {
    sendUpdateStatus('当前为开发环境，跳过更新检查');
    return;
  }
  sendUpdateStatus('正在检查更新...');
  autoUpdater.checkForUpdates();
});
