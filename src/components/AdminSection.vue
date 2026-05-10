<template>
  <div class="admin-container mx-auto w-full max-w-6xl rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
    <!-- 头部 -->
    <div class="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <h1 class="text-xl font-semibold text-slate-800">👩‍💻 用户管理系统</h1>
      <div class="flex flex-wrap items-center gap-3">
        <!-- 更新区域 -->
        <div class="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
          <span class="max-w-[260px] truncate text-xs text-slate-500">{{ updateStatus }}</span>
          <button @click="checkUpdate" :disabled="updateChecking"
            class="inline-flex items-center rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300">
            {{ updateChecking ? '检查中...' : '检查更新' }}
          </button>
        </div>
        <!-- 用户头像下拉菜单 -->
        <div class="relative">
          <button @click="showUserMenu = !showUserMenu" 
            class="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 transition hover:bg-slate-200">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
              {{ user.username.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium text-slate-700">{{ user.username }}</span>
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <!-- 下拉菜单 -->
          <div v-if="showUserMenu" 
            class="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
            @click="showUserMenu = false">
            <button @click="goProfile" 
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              个人中心
            </button>
            <div class="my-1 border-t border-slate-100"></div>
            <button @click="confirmLogout" 
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-5 text-white shadow-lg">
        <h3 class="text-xs uppercase tracking-wide text-white/80">总用户数</h3>
        <div class="mt-3 text-3xl font-semibold">{{ stats.total }}</div>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg">
        <h3 class="text-xs uppercase tracking-wide text-white/80">启用用户</h3>
        <div class="mt-3 text-3xl font-semibold">{{ stats.active }}</div>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-5 text-white shadow-lg">
        <h3 class="text-xs uppercase tracking-wide text-white/80">禁用用户</h3>
        <div class="mt-3 text-3xl font-semibold">{{ stats.disabled }}</div>
      </div>
    </div>

    <!-- 用户表格 -->
    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">用户名</th>
            <th class="px-4 py-3 text-left">状态</th>
            <th class="px-4 py-3 text-left">注册时间</th>
            <th class="px-4 py-3 text-left">最后登录</th>
            <th class="px-4 py-3 text-left">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-if="users.length === 0">
            <td colspan="6" class="px-6 py-10">
              <div class="flex flex-col items-center gap-2 text-slate-400">
                <div class="text-3xl">📭</div>
                <p class="text-sm">暂无用户数据</p>
              </div>
            </td>
          </tr>
          <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50 transition">
            <td class="px-4 py-3">{{ u.id }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ u.username }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="u.status === 'disabled' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">
                {{ u.status === 'disabled' ? '禁用' : '启用' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ u.created_at ? new Date(u.created_at).toLocaleString('zh-CN') : '-' }}</td>
            <td class="px-4 py-3 text-slate-500">{{ u.last_login ? new Date(u.last_login).toLocaleString('zh-CN') : '从未登录' }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <button @click="confirmToggle(u)"
                  class="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition"
                  :class="u.status === 'disabled' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'">
                  {{ u.status === 'disabled' ? '启用' : '禁用' }}
                </button>
                <button @click="openResetPassword(u)"
                  class="inline-flex items-center rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600">
                  重置密码
                </button>
                <button @click="confirmDelete(u)"
                  class="inline-flex items-center rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600">
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 修改密码模态框 -->
  <ChangePasswordModal :show="showChangePassword" :userId="user.id" @close="showChangePassword = false" />

  <!-- 重置密码模态框 -->
  <ResetPasswordModal :show="showResetPassword" :userId="resetTarget.id" :username="resetTarget.username"
    @close="showResetPassword = false" @success="loadUsers" />

  <!-- 确认模态框 -->
  <ConfirmModal :show="confirmModal.show" :title="confirmModal.title" :content="confirmModal.content"
    :type="confirmModal.type" @confirm="confirmModal.action" @cancel="confirmModal.show = false" />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import ChangePasswordModal from './modals/ChangePasswordModal.vue'
import ResetPasswordModal from './modals/ResetPasswordModal.vue'
import ConfirmModal from './modals/ConfirmModal.vue'

const props = defineProps({ user: Object })
const emit = defineEmits(['logout', 'goProfile'])

const users = ref([])
const showUserMenu = ref(false)
const updateStatus = ref('')
const updateChecking = ref(false)
const showChangePassword = ref(false)
const showResetPassword = ref(false)
const resetTarget = reactive({ id: null, username: '' })
const confirmModal = reactive({ show: false, title: '', content: '', type: 'neutral', action: () => {} })

const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter(u => u.status !== 'disabled').length,
  disabled: users.value.filter(u => u.status === 'disabled').length,
}))

const loadUsers = async () => {
  const result = await window.electronAPI.getAllUsers()
  if (result.success) {
    users.value = result.data
  } else {
    users.value = []
  }
}

const checkUpdate = () => {
  updateChecking.value = true
  window.electronAPI.checkForUpdates()
}

const confirmLogout = () => {
  Object.assign(confirmModal, {
    show: true, title: '退出登录', content: '确定要退出登录吗？', type: 'neutral',
    action: () => { confirmModal.show = false; emit('logout') }
  })
}

const confirmToggle = (u) => {
  const newStatus = u.status === 'disabled' ? 'active' : 'disabled'
  const action = newStatus === 'active' ? '启用' : '禁用'
  Object.assign(confirmModal, {
    show: true, title: `确认${action}`, content: `确定要${action}该用户吗？`, type: 'neutral',
    action: async () => {
      confirmModal.show = false
      const result = await window.electronAPI.toggleUserStatus(u.id, newStatus)
      if (result.success) await loadUsers()
    }
  })
}

const confirmDelete = (u) => {
  if (u.id === props.user.id) {
    Object.assign(confirmModal, { show: true, title: '操作失败', content: '不能删除当前登录的账号！', type: 'error', action: () => { confirmModal.show = false } })
    return
  }
  Object.assign(confirmModal, {
    show: true, title: '确认删除', content: `确定要删除用户"${u.username}"吗？此操作不可恢复！`, type: 'neutral',
    action: async () => {
      confirmModal.show = false
      const result = await window.electronAPI.deleteUser(u.id)
      if (result.success) await loadUsers()
    }
  })
}

const openResetPassword = (u) => {
  resetTarget.id = u.id
  resetTarget.username = u.username
  showResetPassword.value = true
}

const goProfile = () => {
  emit('goProfile')
}

onMounted(() => {
  loadUsers()
  window.electronAPI.onUpdateStatus((msg) => {
    updateStatus.value = msg
    updateChecking.value = false
  })
})
</script>
