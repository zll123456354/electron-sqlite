const { ipcMain } = require('electron');
const userService = require('../services/user.service');

// 注册 IPC 处理器
function registerUserHandlers() {
  // 辅助函数：统一打印日志
  const logIpc = (channel, args, result) => {
    console.log(`[IPC] ${channel} \n  -> Args:`, args, `\n  <- Result:`, result);
  };

  // 注册用户
  ipcMain.handle('user:register', async (event, username, password) => {
    try {
      const result = await userService.register(username, password);
      const res = { success: true, ...result };
      logIpc('user:register', { username }, res);
      return res;
    } catch (err) {
      const res = { success: false, message: err.message };
      logIpc('user:register', { username }, res);
      return res;
    }
  });

  // 用户登录
  ipcMain.handle('user:login', async (event, username, password) => {
    try {
      const result = await userService.login(username, password);
      const res = { success: true, ...result };
      logIpc('user:login', { username }, res);
      return res;
    } catch (err) {
      const res = { success: false, message: err.message };
      logIpc('user:login', { username }, res);
      return res;
    }
  });

  // 获取所有用户
  ipcMain.handle('user:getAll', async () => {
    try {
      const users = await userService.getAllUsers();
      const res = { success: true, data: users };
      logIpc('user:getAll', {}, res);
      return res;
    } catch (err) {
      const res = { success: false, message: err.message };
      logIpc('user:getAll', {}, res);
      return res;
    }
  });

  // 根据 ID 获取用户
  ipcMain.handle('user:getById', async (event, userId) => {
    try {
      const user = await userService.getUserById(userId);
      const res = { success: true, user };
      logIpc('user:getById', { userId }, res);
      return res;
    } catch (err) {
      const res = { success: false, message: err.message };
      logIpc('user:getById', { userId }, res);
      return res;
    }
  });

  // 删除用户
  ipcMain.handle('user:delete', async (event, userId) => {
    try {
      const result = await userService.deleteUser(userId);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 切换用户状态
  ipcMain.handle('user:toggleStatus', async (event, userId, status) => {
    try {
      const result = await userService.toggleStatus(userId, status);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 修改密码
  ipcMain.handle('user:changePassword', async (event, userId, oldPassword, newPassword) => {
    try {
      const result = await userService.changePassword(userId, oldPassword, newPassword);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 重置密码（管理员）
  ipcMain.handle('user:resetPassword', async (event, userId, newPassword) => {
    try {
      const result = await userService.resetPassword(userId, newPassword);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 更新用户个人信息
  ipcMain.handle('user:updateProfile', async (event, userId, profile) => {
    try {
      const result = await userService.updateProfile(userId, profile);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 更新用户头像
  ipcMain.handle('user:updateAvatar', async (event, userId, avatar) => {
    try {
      const result = await userService.updateAvatar(userId, avatar);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = { registerUserHandlers };
