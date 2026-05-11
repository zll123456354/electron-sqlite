const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 数据库文件路径
const dbPath = path.join(app.getPath('userData'), 'userdata.db');

let db = null;
let SQL = null;

// 初始化数据库连接
async function initDatabase() {
  try {
    SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('数据库加载成功:', dbPath);
    } else {
      db = new SQL.Database();
      console.log('创建新数据库:', dbPath);
    }

    return db;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 获取数据库实例
function getDb() {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  return db;
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// 执行 SQL 查询（返回结果）
function query(sql, params = []) {
  try {
    const result = db.exec(sql, params);
    return result;
  } catch (err) {
    console.error('查询失败:', err);
    throw err;
  }
}

// 执行 SQL 运行（不返回结果）
function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
  } catch (err) {
    console.error('执行失败:', err);
    throw err;
  }
}

// 获取表信息
function getTableInfo(tableName) {
  return query(`PRAGMA table_info(${tableName})`);
}

// 将 sql.js 查询结果的行按列名映射为对象
function mapRow(row, columns) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i] });
  return obj;
}

// 将查询结果的所有行映射为对象数组
function mapRows(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => mapRow(row, columns));
}

module.exports = {
  initDatabase,
  getDb,
  saveDatabase,
  query,
  run,
  getTableInfo,
  mapRow,
  mapRows,
};
