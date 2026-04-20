// 当前登录用户
let currentUser = null;
let currentResetUserId = null;

const messageClasses = {
  hidden:
    "message-box hidden mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600",
  neutral:
    "message-box mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600",
  success:
    "message-box mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700",
  error:
    "message-box mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700",
};

function hideMessageBox(el) {
  if (!el) return;
  el.textContent = "";
  el.className = messageClasses.hidden;
}

function setMessageBox(el, type, text) {
  if (!el) return;
  if (typeof text === "string") {
    el.textContent = text;
  }
  el.className = messageClasses[type] || messageClasses.neutral;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

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

  document.getElementById("admin-avatar").textContent = currentUser.username
    .charAt(0)
    .toUpperCase();
  document.getElementById("admin-username").textContent = currentUser.username;

  await loadUsers();
}

// 加载用户列表
async function loadUsers() {
  const users = await window.electronAPI.getAllUsers();
  const tbody = document.getElementById("users-table-body");

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
        <td colspan="6" class="px-6 py-10">
          <div class="flex flex-col items-center gap-2 text-slate-400">
            <div class="text-3xl">📭</div>
            <p class="text-sm">暂无用户数据</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const badgeBase =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  const badgeActive = `${badgeBase} bg-emerald-100 text-emerald-700`;
  const badgeDisabled = `${badgeBase} bg-rose-100 text-rose-700`;

  const actionBase =
    "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition";
  const actionPrimary = `${actionBase} bg-indigo-500 text-white hover:bg-indigo-600`;
  const actionDanger = `${actionBase} bg-rose-500 text-white hover:bg-rose-600`;
  const actionWarning = `${actionBase} bg-amber-500 text-white hover:bg-amber-600`;
  const actionSuccess = `${actionBase} bg-emerald-500 text-white hover:bg-emerald-600`;

  tbody.innerHTML = users
    .map((user) => {
      const isDisabled = user.status === "disabled";
      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="px-4 py-3">${user.id}</td>
          <td class="px-4 py-3 font-medium text-slate-800">${user.username}</td>
          <td class="px-4 py-3">
            <span class="${isDisabled ? badgeDisabled : badgeActive}">
              ${isDisabled ? "禁用" : "启用"}
            </span>
          </td>
          <td class="px-4 py-3 text-slate-500">
            ${user.created_at ? new Date(user.created_at).toLocaleString("zh-CN") : "-"}
          </td>
          <td class="px-4 py-3 text-slate-500">
            ${user.last_login ? new Date(user.last_login).toLocaleString("zh-CN") : "从未登录"}
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-2">
              <button class="${isDisabled ? actionSuccess : actionWarning}" onclick="toggleUserStatus(${user.id}, '${isDisabled ? "active" : "disabled"}')">
                ${isDisabled ? "启用" : "禁用"}
              </button>
              <button class="${actionPrimary}" onclick="openResetPasswordModal(${user.id}, '${user.username}')">
                重置密码
              </button>
              <button class="${actionDanger}" onclick="deleteUserAccount(${user.id}, '${user.username}')">
                删除
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// 切换用户状态 - 显示确认
function toggleUserStatus(userId, newStatus) {
  const action = newStatus === "active" ? "启用" : "禁用";
  document.getElementById("message-modal-title").textContent = "确认" + action;
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = `确定要${action}该用户吗？`;
  contentBox.className = messageClasses.neutral;
  document.getElementById("message-modal").dataset.confirmAction = "toggleStatus";
  document.getElementById("message-modal").dataset.userId = userId;
  document.getElementById("message-modal").dataset.newStatus = newStatus;
  openModal("message-modal");
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
  contentBox.textContent = `确定要删除用户“${username}”吗？此操作不可恢复！`;
  contentBox.className = messageClasses.neutral;
  document.getElementById("message-modal").dataset.confirmAction = "deleteUser";
  document.getElementById("message-modal").dataset.userId = userId;
  document.getElementById("message-modal").dataset.username = username;
  openModal("message-modal");
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
  hideMessageBox(document.getElementById("modal-message"));
  openModal("change-password-modal");
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
    setMessageBox(messageBox, "error", "请填写所有字段");
    return;
  }

  if (newPassword.length < 6) {
    setMessageBox(messageBox, "error", "新密码至少6个字符");
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessageBox(messageBox, "error", "两次输入的新密码不一致");
    return;
  }

  const result = await window.electronAPI.changePassword(
    currentUser.id,
    oldPassword,
    newPassword,
  );

  if (result.success) {
    setMessageBox(messageBox, "success", result.message);
    setTimeout(() => {
      closeModal("change-password-modal");
    }, 1000);
  } else {
    setMessageBox(messageBox, "error", result.message);
  }
}

// 打开重置密码模态框
function openResetPasswordModal(userId, username) {
  currentResetUserId = userId;
  document.getElementById("reset-new-password").value = "";
  hideMessageBox(document.getElementById("reset-modal-message"));
  document.querySelector("#reset-password-modal .modal-header h3").textContent =
    `重置密码 - ${username}`;
  openModal("reset-password-modal");
}

// 提交重置密码
async function submitResetPassword() {
  const newPassword = document.getElementById("reset-new-password").value;
  const messageBox = document.getElementById("reset-modal-message");

  if (!newPassword) {
    setMessageBox(messageBox, "error", "请输入新密码");
    return;
  }

  if (newPassword.length < 6) {
    setMessageBox(messageBox, "error", "新密码至少6个字符");
    return;
  }

  const result = await window.electronAPI.resetPassword(
    currentResetUserId,
    newPassword,
  );

  if (result.success) {
    setMessageBox(messageBox, "success", result.message);
    setTimeout(() => {
      closeModal("reset-password-modal");
      loadUsers();
    }, 1000);
  } else {
    setMessageBox(messageBox, "error", result.message);
  }
}

// 显示消息提示
function showMessage(title, message, isError = true) {
  document.getElementById("message-modal-title").textContent = title;
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = message;
  contentBox.className = isError ? messageClasses.error : messageClasses.success;
  openModal("message-modal");
}

// 退出登录
function logout() {
  document.getElementById("message-modal-title").textContent = "退出登录";
  const contentBox = document.getElementById("message-modal-content");
  contentBox.textContent = "确定要退出登录吗？";
  contentBox.className = messageClasses.neutral;
  document.getElementById("message-modal").dataset.confirmAction = "logout";
  openModal("message-modal");
}

function executeConfirmAction() {
  const modal = document.getElementById("message-modal");
  const action = modal.dataset.confirmAction;
  closeModal("message-modal");
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
  const tabButtons = document.querySelectorAll(".tab-btn");
  const setActiveTab = (btn) => {
    tabButtons.forEach((b) => {
      b.classList.remove("bg-indigo-600", "text-white", "shadow");
      b.classList.add("text-slate-600");
    });
    btn.classList.remove("text-slate-600");
    btn.classList.add("bg-indigo-600", "text-white", "shadow");
  };

  // 标签页切换
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      setActiveTab(btn);

      if (tab === "login") {
        document.getElementById("login-form").classList.remove("hidden");
        document.getElementById("register-form").classList.add("hidden");
      } else {
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("register-form").classList.remove("hidden");
      }

      hideMessageBox(document.getElementById("auth-message"));
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
        setMessageBox(messageBox, "error", "请输入用户名和密码");
        return;
      }

      const result = await window.electronAPI.login(username, password);

      if (result.success) {
        currentUser = result.user;
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        setMessageBox(messageBox, "success", result.message);
        setTimeout(() => showAdminSection(), 500);
      } else {
        setMessageBox(messageBox, "error", result.message);
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
        setMessageBox(messageBox, "error", "请填写所有字段");
        return;
      }

      if (username.length < 3) {
        setMessageBox(messageBox, "error", "用户名至少3个字符");
        return;
      }

      if (password.length < 6) {
        setMessageBox(messageBox, "error", "密码至少6个字符");
        return;
      }

      if (password !== confirmPassword) {
        setMessageBox(messageBox, "error", "两次输入的密码不一致");
        return;
      }

      const result = await window.electronAPI.register(username, password);

      if (result.success) {
        setMessageBox(messageBox, "success", result.message);
        setTimeout(() => {
          document.querySelector('[data-tab="login"]').click();
          document.getElementById("login-username").value = username;
        }, 1000);
      } else {
        setMessageBox(messageBox, "error", result.message);
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
        closeModal(modal.id);
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
