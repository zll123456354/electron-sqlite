// 当前登录用户
let currentUser = null;
let currentResetUserId = null;

// 初始化
function init() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showAdminSection();
  } else {
    showAuthSection();
  }
}

// 显示登录页面
function showAuthSection() {
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("admin-section").style.display = "none";
}

// 显示管理页面
async function showAdminSection() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("admin-section").style.display = "block";

  // 更新用户信息
  document.getElementById("admin-avatar").textContent = currentUser.username
    .charAt(0)
    .toUpperCase();
  document.getElementById("admin-username").textContent = currentUser.username;

  // 加载用户列表
  await loadUsers();
}

// 加载用户列表
async function loadUsers() {
  const users = await window.electronAPI.getAllUsers();
  const tbody = document.getElementById("users-table-body");

  // 更新统计数据
  const totalUsers = users.length;
  const activeUsers = users.filter(
    (u) => u.status === "active" || !u.status,
  ).length;
  const disabledUsers = users.filter((u) => u.status === "disabled").length;

  document.getElementById("stat-total").textContent = totalUsers;
  document.getElementById("stat-active").textContent = activeUsers;
  document.getElementById("stat-disabled").textContent = disabledUsers;

  if (users.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div>📭</div>
                        <p>暂无用户数据</p>
                    </div>
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>
                <span class="status-badge ${user.status === "disabled" ? "status-disabled" : "status-active"}">
                    ${user.status === "disabled" ? "禁用" : "启用"}
                </span>
            </td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleString("zh-CN") : "-"}</td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString("zh-CN") : "从未登录"}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn ${user.status === "disabled" ? "btn-success" : "btn-warning"}" 
                            onclick="toggleUserStatus(${user.id}, '${user.status === "disabled" ? "active" : "disabled"}')">
                        ${user.status === "disabled" ? "启用" : "禁用"}
                    </button>
                    <button class="btn btn-primary" onclick="openResetPasswordModal(${user.id}, '${user.username}')">
                        重置密码
                    </button>
                    <button class="btn btn-danger" onclick="deleteUserAccount(${user.id}, '${user.username}')">
                        删除
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("");
}

// 切换用户状态 - 显示确认
function toggleUserStatus(userId, newStatus) {
  const action = newStatus === "active" ? "启用" : "禁用";
  document.getElementById("message-modal-title").textContent = "确认" + action;
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = `确定要${action}该用户吗？`;
  contentBox.className = "message-box";
  document.getElementById("message-modal").classList.add("active");
  document.getElementById("message-modal").dataset.confirmAction = "toggleStatus";
  document.getElementById("message-modal").dataset.userId = userId;
  document.getElementById("message-modal").dataset.newStatus = newStatus;
}

// 确认切换用户状态
async function confirmToggleUserStatus(userId, newStatus) {
  const result = await window.electronAPI.toggleUserStatus(userId, newStatus);
  if (result.success) {
    showMessage("操作成功", result.message, false);
    await loadUsers();
  } else {
    showMessage("操作失败", result.message, true);
  }
}

// 删除用户 - 显示确认
function deleteUserAccount(userId, username) {
  if (userId === currentUser.id) {
    showMessage("操作失败", "不能删除当前登录的账号！", true);
    return;
  }

  document.getElementById("message-modal-title").textContent = "确认删除";
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = `确定要删除用户 "${username}" 吗？此操作不可恢复！`;
  contentBox.className = "message-box";
  document.getElementById("message-modal").classList.add("active");
  document.getElementById("message-modal").dataset.confirmAction = "deleteUser";
  document.getElementById("message-modal").dataset.userId = userId;
  document.getElementById("message-modal").dataset.username = username;
}

// 确认删除用户
async function confirmDeleteUser(userId, username) {
  const result = await window.electronAPI.deleteUser(userId);
  if (result.success) {
    showMessage("删除成功", result.message, false);
    await loadUsers();
  } else {
    showMessage("删除失败", result.message, true);
  }
}

// 打开修改密码模态框
function openChangePasswordModal() {
  document.getElementById("modal-old-password").value = "";
  document.getElementById("modal-new-password").value = "";
  document.getElementById("modal-confirm-password").value = "";
  document.getElementById("modal-message").className = "message-box";
  document.getElementById("change-password-modal").classList.add("active");
}

// 提交修改密码
async function submitChangePassword() {
  const oldPassword = document.getElementById("modal-old-password").value;
  const newPassword = document.getElementById("modal-new-password").value;
  const confirmPassword = document.getElementById(
    "modal-confirm-password",
  ).value;
  const messageBox = document.getElementById("modal-message");

  if (!oldPassword || !newPassword || !confirmPassword) {
    messageBox.textContent = "请填写所有字段";
    messageBox.className = "message-box error";
    return;
  }

  if (newPassword.length < 6) {
    messageBox.textContent = "新密码至少6个字符";
    messageBox.className = "message-box error";
    return;
  }

  if (newPassword !== confirmPassword) {
    messageBox.textContent = "两次输入的新密码不一致";
    messageBox.className = "message-box error";
    return;
  }

  const result = await window.electronAPI.changePassword(
    currentUser.id,
    oldPassword,
    newPassword,
  );

  if (result.success) {
    messageBox.textContent = result.message;
    messageBox.className = "message-box success";
    setTimeout(() => {
      closeModal("change-password-modal");
    }, 1000);
  } else {
    messageBox.textContent = result.message;
    messageBox.className = "message-box error";
  }
}

// 打开重置密码模态框
function openResetPasswordModal(userId, username) {
  currentResetUserId = userId;
  document.getElementById("reset-new-password").value = "";
  document.getElementById("reset-modal-message").className = "message-box";
  document.querySelector("#reset-password-modal .modal-header h3").textContent =
    `重置密码 - ${username}`;
  document.getElementById("reset-password-modal").classList.add("active");
}

// 提交重置密码
async function submitResetPassword() {
  const newPassword = document.getElementById("reset-new-password").value;
  const messageBox = document.getElementById("reset-modal-message");

  if (!newPassword) {
    messageBox.textContent = "请输入新密码";
    messageBox.className = "message-box error";
    return;
  }

  if (newPassword.length < 6) {
    messageBox.textContent = "新密码至少6个字符";
    messageBox.className = "message-box error";
    return;
  }

  const result = await window.electronAPI.resetPassword(
    currentResetUserId,
    newPassword,
  );

  if (result.success) {
    messageBox.textContent = result.message;
    messageBox.className = "message-box success";
    setTimeout(() => {
      closeModal("reset-password-modal");
      loadUsers();
    }, 1000);
  } else {
    messageBox.textContent = result.message;
    messageBox.className = "message-box error";
  }
}

// 显示消息提示
function showMessage(title, message, isError = true) {
  document.getElementById("message-modal-title").textContent = title;
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = message;
  contentBox.className = isError ? "message-box error" : "message-box success";
  document.getElementById("message-modal").classList.add("active");
}

// 关闭模态框
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// 退出登录
function logout() {
  document.getElementById("message-modal-title").textContent = "退出登录";
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = "确定要退出登录吗？";
  contentBox.className = "message-box";
  document.getElementById("message-modal").classList.add("active");
  document.getElementById("message-modal").dataset.confirmAction = "logout";
}

function executeConfirmAction() {
  const modal = document.getElementById("message-modal");
  const action = modal.dataset.confirmAction;
  closeModal('message-modal');
  if (action === "logout") {
    localStorage.removeItem("currentUser");
    currentUser = null;
    showAuthSection();
  } else if (action === "toggleStatus") {
    const userId = parseInt(modal.dataset.userId);
    const newStatus = modal.dataset.newStatus;
    confirmToggleUserStatus(userId, newStatus);
  } else if (action === "deleteUser") {
    const userId = parseInt(modal.dataset.userId);
    const username = modal.dataset.username;
    confirmDeleteUser(userId, username);
  }
  modal.dataset.confirmAction = "";
  modal.dataset.userId = "";
  modal.dataset.newStatus = "";
  modal.dataset.username = "";
}

// ==================== 登录相关 ====================

document.addEventListener("DOMContentLoaded", () => {
  // 标签页切换
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (tab === "login") {
        document.getElementById("login-form").style.display = "block";
        document.getElementById("register-form").style.display = "none";
      } else {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("register-form").style.display = "block";
      }

      document.getElementById("auth-message").className = "message-box";
    });
  });

  // 登录
  document
    .getElementById("login-submit")
    .addEventListener("click", async () => {
      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;
      const messageBox = document.getElementById("auth-message");

      if (!username || !password) {
        messageBox.textContent = "请输入用户名和密码";
        messageBox.className = "message-box error";
        return;
      }

      const result = await window.electronAPI.login(username, password);

      if (result.success) {
        currentUser = result.user;
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        messageBox.textContent = result.message;
        messageBox.className = "message-box success";
        setTimeout(() => showAdminSection(), 500);
      } else {
        messageBox.textContent = result.message;
        messageBox.className = "message-box error";
      }
    });

  // 注册
  document
    .getElementById("register-submit")
    .addEventListener("click", async () => {
      const username = document
        .getElementById("register-username")
        .value.trim();
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-confirm-password",
      ).value;
      const messageBox = document.getElementById("auth-message");

      if (!username || !password || !confirmPassword) {
        messageBox.textContent = "请填写所有字段";
        messageBox.className = "message-box error";
        return;
      }

      if (username.length < 3) {
        messageBox.textContent = "用户名至少3个字符";
        messageBox.className = "message-box error";
        return;
      }

      if (password.length < 6) {
        messageBox.textContent = "密码至少6个字符";
        messageBox.className = "message-box error";
        return;
      }

      if (password !== confirmPassword) {
        messageBox.textContent = "两次输入的密码不一致";
        messageBox.className = "message-box error";
        return;
      }

      const result = await window.electronAPI.register(username, password);

      if (result.success) {
        messageBox.textContent = result.message;
        messageBox.className = "message-box success";
        setTimeout(() => {
          document.querySelector('[data-tab="login"]').click();
          document.getElementById("login-username").value = username;
        }, 1000);
      } else {
        messageBox.textContent = result.message;
        messageBox.className = "message-box error";
      }
    });

  // 回车登录
  document
    .getElementById("login-password")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") document.getElementById("login-submit").click();
    });

  // 退出登录
  document.getElementById("admin-logout").addEventListener("click", logout);

  document.getElementById("check-update-btn").addEventListener("click", () => {
    const btn = document.getElementById("check-update-btn");
    btn.disabled = true;
    btn.textContent = "检查中...";
    window.electronAPI.checkForUpdates();
  });

  window.electronAPI.onUpdateStatus((msg) => {
    const statusText = document.getElementById("update-status-text");
    statusText.textContent = msg;
    const btn = document.getElementById("check-update-btn");
    btn.disabled = false;
    btn.textContent = "检查更新";
  });

  // 点击模态框背景关闭
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  init();
});

// 导出全局函数
window.toggleUserStatus = toggleUserStatus;
window.deleteUserAccount = deleteUserAccount;
window.openChangePasswordModal = openChangePasswordModal;
window.openResetPasswordModal = openResetPasswordModal;
window.submitChangePassword = submitChangePassword;
window.submitResetPassword = submitResetPassword;
window.closeModal = closeModal;
window.executeModalConfirm = executeConfirmAction;
