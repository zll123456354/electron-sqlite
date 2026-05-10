const { ipcMain } = require('electron');
const productService = require('../services/product.service');

// 注册 IPC 处理器
function registerProductHandlers() {
  // 获取所有商品
  ipcMain.handle('product:getAll', async () => {
    try {
      const products = await productService.getAllProducts();
      return { success: true, data: products };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 获取商品详情
  ipcMain.handle('product:getById', async (event, data) => {
    try {
      const product = await productService.getProductById(data.id);
      return { success: true, data: product };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 创建商品
  ipcMain.handle('product:create', async (event, data) => {
    try {
      const result = await productService.createProduct(data);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 更新商品
  ipcMain.handle('product:update', async (event, data) => {
    try {
      const result = await productService.updateProduct(data.id, data);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 更新商品状态
  ipcMain.handle('product:updateStatus', async (event, data) => {
    try {
      const result = await productService.updateProductStatus(data.id, data.status);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // 删除商品
  ipcMain.handle('product:delete', async (event, data) => {
    try {
      const result = await productService.deleteProduct(data.id);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = { registerProductHandlers };
