const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 用户认证相关
  login: (username, password) =>
    ipcRenderer.invoke('user:login', username, password),
  register: (username, password) =>
    ipcRenderer.invoke('user:register', username, password),

  // 用户管理相关
  getAllUsers: () => ipcRenderer.invoke('user:getAll'),
  getUserById: (userId) => ipcRenderer.invoke('user:getById', userId),
  deleteUser: (userId) => ipcRenderer.invoke('user:delete', userId),
  toggleUserStatus: (userId, status) =>
    ipcRenderer.invoke('user:toggleStatus', userId, status),
  changePassword: (userId, oldPassword, newPassword) =>
    ipcRenderer.invoke('user:changePassword', userId, oldPassword, newPassword),
  resetPassword: (userId, newPassword) =>
    ipcRenderer.invoke('user:resetPassword', userId, newPassword),
  // 更新用户个人信息
  updateProfile: (userId, profile) =>
    ipcRenderer.invoke('user:updateProfile', userId, profile),
  // 更新用户头像
  updateAvatar: (userId, avatar) =>
    ipcRenderer.invoke('user:updateAvatar', userId, avatar),

  // 商品相关（预留）
  getAllProducts: () => ipcRenderer.invoke('product:getAll'),
  getProductById: (id) => ipcRenderer.invoke('product:getById', id),
  createProduct: (data) => ipcRenderer.invoke('product:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('product:update', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('product:delete', id),

  // 订单相关（预留）
  getAllOrders: () => ipcRenderer.invoke('order:getAll'),
  getOrderById: (id) => ipcRenderer.invoke('order:getById', id),
  createOrder: (data) => ipcRenderer.invoke('order:create', data),
  updateOrderStatus: (id, status) => ipcRenderer.invoke('order:updateStatus', id, status),

  // 更新检查
  checkForUpdates: () => ipcRenderer.send('update:checkNow'),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (_e, msg) => cb(msg)),
});
