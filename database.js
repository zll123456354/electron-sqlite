const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// 数据库文件路径
const dbPath = path.join(__dirname, "userdata.db");
let db = null;
let SQL = null;

// 初始化数据库
async function initDatabase() {
  try {
    // 初始化 SQL.js
    SQL = await initSqlJs();

    // 检查数据库文件是否存在
    if (fs.existsSync(dbPath)) {
      // 读取现有数据库
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log("数据库加载成功:", dbPath);
    } else {
      // 创建新数据库
      db = new SQL.Database();
      console.log("创建新数据库:", dbPath);
    }

    // 创建用户表
    createTables();

    // 保存数据库到文件
    saveDatabase();
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// 创建用户表
function createTables() {
  const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `;

  try {
    db.run(sql);
    saveDatabase();
    console.log("用户表已就绪");
  } catch (err) {
    console.error("创建表失败:", err);
  }
}

// 注册用户
async function registerUser(username, password) {
  // 验证输入
  if (!username || !password) {
    return { success: false, message: "用户名和密码不能为空" };
  }
  if (username.length < 3) {
    return { success: false, message: "用户名至少3个字符" };
  }
  if (password.length < 6) {
    return { success: false, message: "密码至少6个字符" };
  }

  try {
    // 检查用户名是否已存在
    const checkSql = "SELECT id FROM users WHERE username = ?";
    const checkResult = db.exec(checkSql, [username]);

    if (checkResult.length > 0 && checkResult[0].values.length > 0) {
      return { success: false, message: "用户名已存在" };
    }

    // 密码加密
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 插入新用户
    const insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.run(insertSql, [username, hashedPassword]);

    // 保存到文件
    saveDatabase();

    // 获取插入的 ID
    const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
    const userId = lastIdResult[0].values[0][0];

    return { success: true, message: "注册成功，请登录", userId };
  } catch (err) {
    return { success: false, message: "注册失败: " + err.message };
  }
}

// 关闭数据库
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log("数据库连接已关闭");
  }
}

// ==================== 新增：用户管理功能 ====================

// 获取所有用户列表
async function getAllUsers() {
  try {
    const sql = `
            SELECT id, username, status, created_at, last_login 
            FROM users 
            ORDER BY id DESC
        `;
    const result = db.exec(sql);

    if (result.length === 0) {
      return [];
    }

    const users = result[0].values.map((row) => ({
      id: row[0],
      username: row[1],
      status: row[2],
      created_at: row[3],
      last_login: row[4],
    }));

    return users;
  } catch (err) {
    console.error("获取用户列表失败:", err);
    return [];
  }
}

// 删除用户
async function deleteUser(userId) {
  try {
    const sql = "DELETE FROM users WHERE id = ?";
    db.run(sql, [userId]);
    saveDatabase();
    return { success: true, message: "用户已删除" };
  } catch (err) {
    return { success: false, message: "删除失败: " + err.message };
  }
}

// 切换用户状态（启用/禁用）
async function toggleUserStatus(userId, status) {
  try {
    const sql = "UPDATE users SET status = ? WHERE id = ?";
    db.run(sql, [status, userId]);
    saveDatabase();
    return {
      success: true,
      message: `用户已${status === "active" ? "启用" : "禁用"}`,
    };
  } catch (err) {
    return { success: false, message: "状态更新失败: " + err.message };
  }
}

// 修改密码
async function changePassword(userId, oldPassword, newPassword) {
  try {
    // 验证原密码
    const sql = "SELECT password FROM users WHERE id = ?";
    const result = db.exec(sql, [userId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return { success: false, message: "用户不存在" };
    }

    const hashedPassword = result[0].values[0][0];
    const passwordValid = bcrypt.compareSync(oldPassword, hashedPassword);

    if (!passwordValid) {
      return { success: false, message: "原密码错误" };
    }

    // 更新密码
    const newHashedPassword = bcrypt.hashSync(newPassword, 10);
    const updateSql = "UPDATE users SET password = ? WHERE id = ?";
    db.run(updateSql, [newHashedPassword, userId]);
    saveDatabase();

    return { success: true, message: "密码修改成功" };
  } catch (err) {
    return { success: false, message: "密码修改失败: " + err.message };
  }
}

// 重置用户密码（管理员功能）
async function resetUserPassword(userId, newPassword) {
  try {
    const newHashedPassword = bcrypt.hashSync(newPassword, 10);
    const sql = "UPDATE users SET password = ? WHERE id = ?";
    db.run(sql, [newHashedPassword, userId]);
    saveDatabase();
    return { success: true, message: "密码重置成功" };
  } catch (err) {
    return { success: false, message: "密码重置失败: " + err.message };
  }
}

// 修改 createTables 函数，添加 status 字段
function createTables() {
  const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `;

  try {
    db.run(sql);

    // 检查是否需要添加 status 列（兼容旧数据库）
    const tableInfo = db.exec("PRAGMA table_info(users)");
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map((row) => row[1]);
      if (!columns.includes("status")) {
        db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
        console.log("已添加 status 字段");
      }
    }

    saveDatabase();
    console.log("用户表已就绪");
  } catch (err) {
    console.error("创建表失败:", err);
  }
}

// 更新 loginUser 函数，检查用户状态
async function loginUser(username, password) {
  if (!username || !password) {
    return { success: false, message: "用户名和密码不能为空" };
  }

  try {
    const sql = "SELECT * FROM users WHERE username = ?";
    const result = db.exec(sql, [username]);

    if (result.length === 0 || result[0].values.length === 0) {
      return { success: false, message: "用户名不存在" };
    }

    const userRow = result[0].values[0];
    const user = {
      id: userRow[0],
      username: userRow[1],
      password: userRow[2],
      status: userRow[3] || "active",
      created_at: userRow[4],
      last_login: userRow[5],
    };

    // 检查账号状态
    if (user.status === "disabled") {
      return { success: false, message: "账号已被禁用，请联系管理员" };
    }

    // 验证密码
    const passwordValid = bcrypt.compareSync(password, user.password);
    if (!passwordValid) {
      return { success: false, message: "密码错误" };
    }

    // 更新最后登录时间
    const updateSql =
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(updateSql, [user.id]);
    saveDatabase();

    const { password: _, ...userInfo } = user;
    return {
      success: true,
      message: "登录成功",
      user: userInfo,
    };
  } catch (err) {
    return { success: false, message: "登录失败: " + err.message };
  }
}

module.exports = {
  initDatabase,
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  changePassword,
  resetUserPassword,
  closeDatabase,
};
