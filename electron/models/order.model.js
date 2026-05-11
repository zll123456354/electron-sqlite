const { query, run, mapRows, mapRow } = require('../db');

// 表名
const TABLE_NAME = 'orders';
const ITEMS_TABLE_NAME = 'order_items';

// 创建订单表
function createTable() {
  // 订单主表
  const orderSql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  run(orderSql);

  // 订单明细表
  const itemsSql = `
    CREATE TABLE IF NOT EXISTS ${ITEMS_TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES ${TABLE_NAME}(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `;
  run(itemsSql);
  
  console.log('订单表已就绪');
}

// 查询所有订单
function findAll() {
  const result = query(`
    SELECT o.*, u.username 
    FROM ${TABLE_NAME} o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `);
  
  return mapRows(result);
}

// 根据用户 ID 查询订单
function findByUserId(userId) {
  const result = query(`SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
  return mapRows(result);
}

// 查询订单详情（包含商品明细）
function findById(id) {
  // 查询订单主信息
  const orderResult = query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
  if (orderResult.length === 0 || orderResult[0].values.length === 0) return null;
  
  const order = mapRow(orderResult[0].values[0], orderResult[0].columns);
  
  // 查询订单商品明细
  const itemsResult = query(`
    SELECT oi.*, p.name as product_name 
    FROM ${ITEMS_TABLE_NAME} oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `, [id]);
  
  order.items = mapRows(itemsResult);
  
  return order;
}

// 创建订单
function create(data) {
  // 插入订单主表
  const orderSql = `INSERT INTO ${TABLE_NAME} (user_id, total_amount) VALUES (?, ?)`;
  run(orderSql, [data.user_id, data.total_amount]);
  
  const result = query('SELECT last_insert_rowid() as id');
  const orderId = result[0].values[0][0];
  
  // 插入订单明细
  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      const itemSql = `INSERT INTO ${ITEMS_TABLE_NAME} (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`;
      run(itemSql, [orderId, item.product_id, item.quantity, item.unit_price]);
    });
  }
  
  return orderId;
}

// 更新订单状态
function updateStatus(id, status) {
  run(`UPDATE ${TABLE_NAME} SET status = ? WHERE id = ?`, [status, id]);
}

module.exports = {
  createTable,
  findAll,
  findByUserId,
  findById,
  create,
  updateStatus,
};
