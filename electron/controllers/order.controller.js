const { ipcMain } = require('electron');
const orderService = require('../services/order.service');

// 注册 IPC 处理器
function registerOrderHandlers() {
  // 获取所有订单
  ipcMain.handle('order:getAll', async () => {
    try {
      const orders = await orderService.getAllOrders();
      return { success: true, data: orders };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 获取用户订单
  ipcMain.handle('order:getByUserId', async (event, data) => {
    try {
      const orders = await orderService.getOrdersByUserId(data.userId);
      return { success: true, data: orders };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 获取订单详情
  ipcMain.handle('order:getById', async (event, data) => {
    try {
      const order = await orderService.getOrderById(data.id);
      return { success: true, data: order };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 创建订单
  ipcMain.handle('order:create', async (event, data) => {
    try {
      const result = await orderService.createOrder(data);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 更新订单状态
  ipcMain.handle('order:updateStatus', async (event, data) => {
    try {
      const result = await orderService.updateOrderStatus(data.id, data.status);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = { registerOrderHandlers };
