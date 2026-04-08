const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 认证相关
  register: (username, password) =>
    ipcRenderer.invoke("auth:register", username, password),
  login: (username, password) =>
    ipcRenderer.invoke("auth:login", username, password),

  // 用户管理相关
  getAllUsers: () => ipcRenderer.invoke("users:getAll"),
  deleteUser: (userId) => ipcRenderer.invoke("users:delete", userId),
  toggleUserStatus: (userId, status) =>
    ipcRenderer.invoke("users:toggleStatus", userId, status),
  changePassword: (userId, oldPassword, newPassword) =>
    ipcRenderer.invoke(
      "users:changePassword",
      userId,
      oldPassword,
      newPassword,
    ),
  resetPassword: (userId, newPassword) =>
    ipcRenderer.invoke("users:resetPassword", userId, newPassword),
});
