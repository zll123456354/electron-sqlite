const orderModel = require('../models/order.model');
const productModel = require('../models/product.model');

// 获取所有订单
async function getAllOrders() {
  return await orderModel.findAll();
}

// 获取用户订单
async function getOrdersByUserId(userId) {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }
  return await orderModel.findByUserId(userId);
}

// 获取订单详情
async function getOrderById(id) {
  if (!id) {
    throw new Error('订单ID不能为空');
  }

  const order = await orderModel.findById(id);
  if (!order) {
    throw new Error('订单不存在');
  }

  return order;
}

// 创建订单
async function createOrder(data) {
  // 参数校验
  if (!data.user_id) {
    throw new Error('用户ID不能为空');
  }
  if (!data.items || data.items.length === 0) {
    throw new Error('订单商品不能为空');
  }

  // 计算总金额并验证商品
  let totalAmount = 0;
  for (const item of data.items) {
    const product = await productModel.findById(item.product_id);
    if (!product) {
      throw new Error(`商品ID ${item.product_id} 不存在`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`商品 ${product.name} 库存不足`);
    }
    if (product.status !== 'on_sale') {
      throw new Error(`商品 ${product.name} 已下架`);
    }

    item.unit_price = product.price;
    totalAmount += product.price * item.quantity;
  }

  // 创建订单
  const orderId = await orderModel.create({
    user_id: data.user_id,
    total_amount: totalAmount,
    items: data.items,
  });

  // TODO: 扣减库存（需要事务支持）

  return { orderId, totalAmount, message: '订单创建成功' };
}

// 更新订单状态
async function updateOrderStatus(id, status) {
  if (!id || !status) {
    throw new Error('参数不完整');
  }

  const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error('无效的订单状态');
  }

  const order = await orderModel.findById(id);
  if (!order) {
    throw new Error('订单不存在');
  }

  await orderModel.updateStatus(id, status);
  return { message: `订单状态已更新为${status}` };
}

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  getOrderById,
  createOrder,
  updateOrderStatus,
};
