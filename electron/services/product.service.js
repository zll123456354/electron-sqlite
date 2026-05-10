const productModel = require('../models/product.model');

// 获取所有商品
async function getAllProducts() {
  return await productModel.findAll();
}

// 获取商品详情
async function getProductById(id) {
  const product = await productModel.findById(id);
  if (!product) {
    throw new Error('商品不存在');
  }
  return product;
}

// 创建商品
async function createProduct(data) {
  // 参数校验
  if (!data.name || !data.price) {
    throw new Error('商品名称和价格不能为空');
  }
  if (data.price < 0) {
    throw new Error('价格不能为负数');
  }
  if (data.stock < 0) {
    throw new Error('库存不能为负数');
  }

  const productId = await productModel.create(data);
  return { productId, message: '商品创建成功' };
}

// 更新商品
async function updateProduct(id, data) {
  if (!id) {
    throw new Error('商品ID不能为空');
  }

  // 检查商品是否存在
  const product = await productModel.findById(id);
  if (!product) {
    throw new Error('商品不存在');
  }

  await productModel.update(id, data);
  return { message: '商品更新成功' };
}

// 更新商品状态
async function updateProductStatus(id, status) {
  if (!id || !status) {
    throw new Error('参数不完整');
  }

  const validStatuses = ['on_sale', 'off_shelf'];
  if (!validStatuses.includes(status)) {
    throw new Error('无效的状态值');
  }

  await productModel.updateStatus(id, status);
  return { message: `商品已${status === 'on_sale' ? '上架' : '下架'}` };
}

// 删除商品
async function deleteProduct(id) {
  if (!id) {
    throw new Error('商品ID不能为空');
  }

  const product = await productModel.findById(id);
  if (!product) {
    throw new Error('商品不存在');
  }

  await productModel.remove(id);
  return { message: '商品删除成功' };
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
};
