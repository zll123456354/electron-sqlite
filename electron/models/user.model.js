const { query, run, getTableInfo, mapRows, mapRow } = require("../db");

// 表名
const TABLE_NAME = "users";

// 创建用户表
function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      nickname TEXT,       -- 姓名/昵称
      age INTEGER,         -- 年龄
      birthday DATE,       -- 生日
      gender TEXT,         -- 性别（'male'/'female'）
      avatar TEXT          -- 头像路径或base64
    )
  `;
  run(sql);

  // 兼容旧数据库：检查是否需要添加字段
  const tableInfo = getTableInfo(TABLE_NAME);
  if (tableInfo.length > 0) {
    const columns = tableInfo[0].values.map((row) => row[1]);
    
    const alterColumns = [
      { name: "status", type: "TEXT DEFAULT 'active'" },
      { name: "nickname", type: "TEXT" },
      { name: "age", type: "INTEGER" },
      { name: "birthday", type: "DATE" },
      { name: "gender", type: "TEXT" },
      { name: "avatar", type: "TEXT" }
    ];

    alterColumns.forEach(col => {
      if (!columns.includes(col.name)) {
        run(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${col.name} ${col.type}`);
        console.log(`已添加 ${col.name} 字段`);
      }
    });
  }
}

// 查询所有用户
function findAll() {
  const result = query(`
    SELECT id, username, status, created_at, last_login, nickname, age, birthday, gender, avatar 
    FROM ${TABLE_NAME} 
    ORDER BY created_at DESC
  `);

  return mapRows(result);
}

// 根据 ID 查询用户
function findById(id) {
  const result = query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  return mapRow(result[0].values[0], result[0].columns);
}

// 根据用户名查询用户
function findByUsername(username) {
  const result = query(`SELECT * FROM ${TABLE_NAME} WHERE username = ?`, [
    username,
  ]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  return mapRow(result[0].values[0], result[0].columns);
}

// 创建用户
function create(data) {
  const sql = `INSERT INTO ${TABLE_NAME} (username, password) VALUES (?, ?)`;
  run(sql, [data.username, data.password]);

  // 获取插入的 ID
  const result = query("SELECT last_insert_rowid() as id");
  return result[0].values[0][0];
}

// 更新用户个人信息
function updateProfile(data) {
  const sql = `
    UPDATE ${TABLE_NAME}
    SET username = ?, nickname = ?, age = ?, birthday = ?, gender = ?, avatar = ?
    WHERE id = ?
  `;
  run(sql, [
    data.username,
    data.nickname,
    data.age,
    data.birthday,
    data.gender,
    data.avatar,
    data.id,
  ]);
}

// 更新用户头像
function updateAvatar(id, avatar) {
  run(`UPDATE ${TABLE_NAME} SET avatar = ? WHERE id = ?`, [avatar, id]);
}

// 更新用户状态
function updateStatus(id, status) {
  run(`UPDATE ${TABLE_NAME} SET status = ? WHERE id = ?`, [status, id]);
}

// 更新最后登录时间
function updateLastLogin(id) {
  run(`UPDATE ${TABLE_NAME} SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [
    id,
  ]);
}

// 更新密码
function updatePassword(id, password) {
  run(`UPDATE ${TABLE_NAME} SET password = ? WHERE id = ?`, [password, id]);
}

// 删除用户
function remove(id) {
  run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
}

module.exports = {
  createTable,
  findAll,
  findById,
  findByUsername,
  create,
  updateStatus,
  updateLastLogin,
  updatePassword,
  remove,
  updateProfile,
  updateAvatar,
};
