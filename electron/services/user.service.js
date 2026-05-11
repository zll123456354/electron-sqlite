const userModel = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

// 注册用户
async function register(username, password) {
  // 参数校验
  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }
  if (username.length < 3) {
    throw new Error('用户名至少3个字符');
  }
  if (password.length < 6) {
    throw new Error('密码至少6个字符');
  }

  // 检查用户名是否已存在
  const existingUser = await userModel.findByUsername(username);
  if (existingUser) {
    throw new Error('用户名已存在');
  }

  // 密码加密
  const hashedPassword = hashPassword(password);

  // 创建用户
  const userId = await userModel.create({
    username,
    password: hashedPassword,
  });

  return { userId, message: '注册成功，请登录' };
}

// 用户登录
async function login(username, password) {
  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }

  // 查询用户
  const user = await userModel.findByUsername(username);
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  // 检查状态
  if (user.status === 'disabled') {
    throw new Error('账号已被禁用，请联系管理员');
  }

  // 验证密码
  const isValid = comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  // 更新最后登录时间
  await userModel.updateLastLogin(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      nickname: user.nickname,
      age: user.age,
      birthday: user.birthday,
      gender: user.gender,
      avatar: user.avatar,
    },
    message: '登录成功',
  };
}

// 获取用户列表
async function getAllUsers() {
  return await userModel.findAll();
}

// 根据 ID 获取当前用户信息
async function getUserById(userId) {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const { password, ...userInfo } = user;
  return userInfo;
}

// 删除用户
async function deleteUser(userId) {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }
  await userModel.remove(userId);
  return { message: '删除成功' };
}

// 切换用户状态
async function toggleStatus(userId, status) {
  if (!userId || !status) {
    throw new Error('参数不完整');
  }
  await userModel.updateStatus(userId, status);
  return { message: `用户已${status === 'active' ? '启用' : '禁用'}` };
}

// 修改密码
async function changePassword(userId, oldPassword, newPassword) {
  if (!userId || !oldPassword || !newPassword) {
    throw new Error('参数不完整');
  }
  if (newPassword.length < 6) {
    throw new Error('新密码至少6个字符');
  }

  // 查询用户
  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  // 验证旧密码
  const isValid = comparePassword(oldPassword, user.password);
  if (!isValid) {
    throw new Error('原密码错误');
  }

  // 更新密码
  const hashedPassword = hashPassword(newPassword);
  await userModel.updatePassword(userId, hashedPassword);

  return { message: '密码修改成功' };
}

// 重置密码（管理员功能）
async function resetPassword(userId, newPassword) {
  if (!userId || !newPassword) {
    throw new Error('参数不完整');
  }
  if (newPassword.length < 6) {
    throw new Error('密码至少6个字符');
  }

  const hashedPassword = hashPassword(newPassword);
  await userModel.updatePassword(userId, hashedPassword);

  return { message: '密码重置成功' };
}

// 更新用户个人信息
async function updateProfile(userId, profile) {
  if (!userId || !profile) {
    throw new Error('参数不完整');
  }

  const username = (profile.username || '').trim();
  if (!username) {
    throw new Error('用户名不能为空');
  }

  const existingUser = await userModel.findByUsername(username);
  if (existingUser && existingUser.id !== userId) {
    throw new Error('用户名已存在');
  }

  await userModel.updateProfile({
    id: userId,
    ...profile,
    username,
  });

  const user = await userModel.findById(userId);
  const { password, ...userInfo } = user;
  return { message: '个人信息更新成功', user: userInfo };
}

// 更新用户头像
async function updateAvatar(userId, avatar) {
  if (!userId || !avatar) {
    throw new Error('参数不完整');
  }
  await userModel.updateAvatar(userId, avatar);
  return { message: '头像更新成功' };
}



module.exports = {
  register,
  login,
  getAllUsers,
  getUserById,
  deleteUser,
  toggleStatus,
  changePassword,
  resetPassword,
  updateProfile,
  updateAvatar,
};
