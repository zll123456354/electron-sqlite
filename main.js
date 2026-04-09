const { app, BrowserWindow, ipcMain } = require("electron");
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

const { autoUpdater } = require("electron-updater");

// 在窗口创建后调用更新检测
function createWindow() {
  mainWindow = new BrowserWindow({
    /* 窗口配置 */
  });
  setupAutoUpdater(); // 初始化自动更新
}

// 👇 单独初始化更新（更清晰）
function setupAutoUpdater() {
  // ❗只在生产环境执行
  if (!app.isPackaged) return;

  // 检查更新
  autoUpdater.checkForUpdates();

  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send("update-status", "正在检查更新...");
  });

  autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("update-status", "发现新版本，正在下载...");
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update-status", "当前已是最新版本");
  });

  // 👇 下载进度（很重要）
  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.floor(progress.percent);
    mainWindow.webContents.send("update-status", `下载进度：${percent}%`);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update-status", "下载完成，准备安装");

    // ❗建议延迟一下，避免闪退
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 3000);
  });

  autoUpdater.on("error", (err) => {
    console.error("更新错误:", err);
    mainWindow.webContents.send("update-status", "更新出错");
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater(); // ✅ 放这里才对
});

// 判断是否为开发模式
const isDev =
  process.env.NODE_ENV === "development" || process.argv.includes("--dev");

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
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  mainWindow.loadFile("index.html");

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
    console.log("🔧 开发模式已启用");
  }
}

app.whenReady().then(async () => {
  await initialize();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC 通信
ipcMain.handle("auth:register", async (event, username, password) => {
  try {
    return await registerUser(username, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("auth:login", async (event, username, password) => {
  try {
    return await loginUser(username, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 新增 IPC 处理
ipcMain.handle("users:getAll", async () => {
  try {
    return await getAllUsers();
  } catch (error) {
    return [];
  }
});

ipcMain.handle("users:delete", async (event, userId) => {
  try {
    return await deleteUser(userId);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("users:toggleStatus", async (event, userId, status) => {
  try {
    return await toggleUserStatus(userId, status);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle(
  "users:changePassword",
  async (event, userId, oldPassword, newPassword) => {
    try {
      return await changePassword(userId, oldPassword, newPassword);
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
);

ipcMain.handle("users:resetPassword", async (event, userId, newPassword) => {
  try {
    return await resetUserPassword(userId, newPassword);
  } catch (error) {
    return { success: false, message: error.message };
  }
});
// 监听渲染进程的更新请求
ipcMain.on("trigger-update", (event) => {
  setupAutoUpdater();
});
ipcMain.on("update:checkNow", () => {
  if (!mainWindow) return;
  if (!app.isPackaged) {
    mainWindow.webContents.send("update-status", "当前为开发环境，跳过更新检查");
    return;
  }
  mainWindow.webContents.send("update-status", "正在检查更新...");
  autoUpdater.checkForUpdates();
});
