const { query, run, getTableInfo, mapRows, mapRow } = require('../db');

// 表名
const TABLE_NAME = 'products';

// 创建商品表
function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'on_sale',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  run(sql);
  console.log('商品表已就绪');
}

// 查询所有商品
function findAll() {
  const result = query(`SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`);
  return mapRows(result);
}

// 根据 ID 查询商品
function findById(id) {
  const result = query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  return mapRow(result[0].values[0], result[0].columns);
}

// 创建商品
function create(data) {
  const sql = `INSERT INTO ${TABLE_NAME} (name, price, stock, description) VALUES (?, ?, ?, ?)`;
  run(sql, [data.name, data.price, data.stock, data.description]);
  
  const result = query('SELECT last_insert_rowid() as id');
  return result[0].values[0][0];
}

// 更新商品
function update(id, data) {
  const sql = `UPDATE ${TABLE_NAME} SET name = ?, price = ?, stock = ?, description = ? WHERE id = ?`;
  run(sql, [data.name, data.price, data.stock, data.description, id]);
}

// 更新商品状态
function updateStatus(id, status) {
  run(`UPDATE ${TABLE_NAME} SET status = ? WHERE id = ?`, [status, id]);
}

// 删除商品
function remove(id) {
  run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
}

module.exports = {
  createTable,
  findAll,
  findById,
  create,
  update,
  updateStatus,
  remove,
};
