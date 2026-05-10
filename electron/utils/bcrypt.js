const bcrypt = require('bcryptjs');

// 加密密码
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

// 验证密码
function comparePassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};
