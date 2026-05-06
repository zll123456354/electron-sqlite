const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const {
  initDatabase,
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  changePassword,
  resetUserPassword,
} = require("./database");

let mainWindow;

function sendUpdateStatus(msg) {
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.webContents &&
    !mainWindow.webContents.isDestroyed()
  ) {
    mainWindow.webContents.send("update-status", msg);
  }
}

const { autoUpdater } = require("electron-updater");

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdates();

  autoUpdater.on("checking-for-update", () => sendUpdateStatus("正在检查更新..."));
  autoUpdater.on("update-available", () => sendUpdateStatus("发现新版本，正在下载..."));
  autoUpdater.on("update-not-available", () => sendUpdateStatus("当前已是最新版本"));
  autoUpdater.on("download-progress", (progress) => {
    sendUpdateStatus(`下载进度：${Math.floor(progress.percent)}%`);
  });
  autoUpdater.on("update-downloaded", () => {
    sendUpdateStatus("下载完成，准备安装");
    setTimeout(() => autoUpdater.quitAndInstall(), 3000);
  });
  autoUpdater.on("error", (err) => {
    console.error("更新错误:", err);
    sendUpdateStatus("更新出错");
  });
}

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

async function initialize() {
  try {
    await initDatabase();
    console.log("✅ 数据库初始化完成");
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    // 也可以在创建时直接设置（仅限 Windows/Linux）
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

    // 彻底移除所有菜单
    mainWindow.setMenu(null)

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
    console.log("🔧 开发模式已启用");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
  }

  // 注册快捷键打开 DevTools
  globalShortcut.register("F12", () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
}

app.whenReady().then(async () => {
  await initialize();
  createWindow();
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// IPC 通信
ipcMain.handle("auth:register", async (event, username, password) => {
  try { return await registerUser(username, password); }
  catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle("auth:login", async (event, username, password) => {
  try { return await loginUser(username, password); }
  catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle("users:getAll", async () => {
  try { return await getAllUsers(); }
  catch (error) { return []; }
});

ipcMain.handle("users:delete", async (event, userId) => {
  try { return await deleteUser(userId); }
  catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle("users:toggleStatus", async (event, userId, status) => {
  try { return await toggleUserStatus(userId, status); }
  catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle("users:changePassword", async (event, userId, oldPassword, newPassword) => {
  try { return await changePassword(userId, oldPassword, newPassword); }
  catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle("users:resetPassword", async (event, userId, newPassword) => {
  try { return await resetUserPassword(userId, newPassword); }
  catch (error) { return { success: false, message: error.message }; }
});

ipcMain.on("update:checkNow", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!app.isPackaged) {
    sendUpdateStatus("当前为开发环境，跳过更新检查");
    return;
  }
  sendUpdateStatus("正在检查更新...");
  autoUpdater.checkForUpdates();
});
