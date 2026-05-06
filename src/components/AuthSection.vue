<template>
  <div class="login-container mx-auto w-full max-w-md rounded-2xl border border-white/40 bg-white/95 p-8 shadow-2xl backdrop-blur">
    <h1 class="text-center text-2xl font-semibold text-slate-800">离线登录系统</h1>
    <p class="mt-2 text-center text-sm text-slate-500">📌 数据本地存储</p>

    <div class="mt-6 rounded-xl bg-slate-100 p-1">
      <div class="grid grid-cols-2 gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm font-semibold transition"
          :class="activeTab === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-800'"
          @click="activeTab = 'login'"
        >登录</button>
        <button
          class="rounded-lg px-4 py-2 text-sm font-semibold transition"
          :class="activeTab === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-800'"
          @click="activeTab = 'register'"
        >注册</button>
      </div>
    </div>

    <!-- 登录表单 -->
    <div v-if="activeTab === 'login'" class="mt-6 space-y-5">
      <div>
        <label class="text-sm font-medium text-slate-700">用户名</label>
        <div class="relative mt-2">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
          <input v-model="loginForm.username" type="text"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="请输入用户名" @keypress.enter="submitLogin" />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">密码</label>
        <div class="relative mt-2">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
          <input v-model="loginForm.password" type="password"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="请输入密码" @keypress.enter="submitLogin" />
        </div>
      </div>
      <button @click="submitLogin"
        class="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
        登录
      </button>
    </div>

    <!-- 注册表单 -->
    <div v-else class="mt-6 space-y-5">
      <div>
        <label class="text-sm font-medium text-slate-700">用户名</label>
        <div class="relative mt-2">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
          <input v-model="registerForm.username" type="text"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="至少3个字符" />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">密码</label>
        <div class="relative mt-2">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
          <input v-model="registerForm.password" type="password"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="至少6个字符" />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">确认密码</label>
        <div class="relative mt-2">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">✅</span>
          <input v-model="registerForm.confirmPassword" type="password"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="再次输入密码" />
        </div>
      </div>
      <button @click="submitRegister"
        class="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
        注册
      </button>
    </div>

    <!-- 消息提示 -->
    <div v-if="message.text" class="mt-4 rounded-lg border px-3 py-2 text-sm"
      :class="message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const emit = defineEmits(['login'])

const activeTab = ref('login')
const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', confirmPassword: '' })
const message = reactive({ text: '', type: '' })

watch(activeTab, () => {
  message.text = ''
})

const showMsg = (text, type) => {
  message.text = text
  message.type = type
}

const submitLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    return showMsg('请输入用户名和密码', 'error')
  }
  const result = await window.electronAPI.login(loginForm.username, loginForm.password)
  if (result.success) {
    showMsg(result.message, 'success')
    setTimeout(() => emit('login', result.user), 500)
  } else {
    showMsg(result.message, 'error')
  }
}

const submitRegister = async () => {
  if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
    return showMsg('请填写所有字段', 'error')
  }
  if (registerForm.username.length < 3) return showMsg('用户名至少3个字符', 'error')
  if (registerForm.password.length < 6) return showMsg('密码至少6个字符', 'error')
  if (registerForm.password !== registerForm.confirmPassword) return showMsg('两次输入的密码不一致', 'error')

  const result = await window.electronAPI.register(registerForm.username, registerForm.password)
  if (result.success) {
    showMsg(result.message, 'success')
    setTimeout(() => {
      activeTab.value = 'login'
      loginForm.username = registerForm.username
    }, 1000)
  } else {
    showMsg(result.message, 'error')
  }
}
</script>
