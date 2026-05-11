<template>
  <div class="profile-container mx-auto w-full max-w-2xl rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
    <!-- 头部 -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-4">
      <h1 class="text-xl font-semibold text-slate-800">👤 个人中心</h1>
      <button @click="$emit('back')"
        class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回
      </button>
    </div>

    <!-- 头像区域 -->
    <div class="mt-6 flex flex-col items-center">
      <div class="relative">
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-3xl font-bold text-white shadow-lg overflow-hidden">
          <img v-if="form.avatar" :src="form.avatar" class="h-full w-full object-cover" />
          <span v-else>{{ form.nickname ? form.nickname.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase() }}</span>
        </div>
        <button @click="triggerAvatarUpload"
          class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md transition hover:bg-indigo-600">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
      </div>
      <p class="mt-2 text-sm text-slate-500">点击相机图标更换头像</p>
    </div>

    <!-- 表单 -->
    <form @submit.prevent="saveProfile" class="mt-6 space-y-4">
      <!-- 用户名 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">用户名</label>
        <input v-model="form.username" type="text"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      <!-- 姓名/昵称 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">姓名</label>
        <input v-model="form.nickname" type="text" placeholder="请输入姓名"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      <!-- 性别 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">性别</label>
        <div class="flex gap-4">
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 transition hover:bg-slate-50"
            :class="{ 'border-indigo-500 bg-indigo-50': form.gender === 'male' }">
            <input v-model="form.gender" type="radio" value="male" class="hidden" />
            <span class="text-sm" :class="form.gender === 'male' ? 'text-indigo-700' : 'text-slate-600'">男</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 transition hover:bg-slate-50"
            :class="{ 'border-indigo-500 bg-indigo-50': form.gender === 'female' }">
            <input v-model="form.gender" type="radio" value="female" class="hidden" />
            <span class="text-sm" :class="form.gender === 'female' ? 'text-indigo-700' : 'text-slate-600'">女</span>
          </label>

        </div>
      </div>

      <!-- 年龄 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">年龄</label>
        <input v-model.number="form.age" type="number" min="1" max="150" placeholder="请输入年龄"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      <!-- 生日 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">生日</label>
        <input v-model="form.birthday" type="date"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      <!-- 提示消息 -->
      <div v-if="message.text" :class="['rounded-xl px-4 py-3 text-sm', message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700']">
        {{ message.text }}
      </div>

      <!-- 保存按钮 -->
      <button type="submit" :disabled="saving"
        class="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'

const props = defineProps({ user: Object })
const emit = defineEmits(['back', 'update'])

const avatarInput = ref(null)
const saving = ref(false)
const message = reactive({ text: '', type: '' })

const form = reactive({
  username: '',
  nickname: '',
  gender: '',
  age: null,
  birthday: '',
  avatar: ''
})

onMounted(() => {
  // 初始化表单数据
  form.username = props.user.username
  form.nickname = props.user.nickname || ''
  form.gender = props.user.gender || ''
  form.age = props.user.age || null
  form.birthday = props.user.birthday || ''
  form.avatar = props.user.avatar || ''
})

// 监听年龄变化，自动计算生日
watch(() => form.age, (newAge) => {
  if (newAge && newAge > 0 && newAge < 150) {
    const currentYear = new Date().getFullYear()
    const birthYear = currentYear - newAge
    form.birthday = `${birthYear}-01-01`
  }
})

// 监听生日变化，自动计算年龄
watch(() => form.birthday, (newBirthday) => {
  if (newBirthday) {
    const birthYear = new Date(newBirthday).getFullYear()
    const currentYear = new Date().getFullYear()
    form.age = currentYear - birthYear
  }
})

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  // 转换为 base64
  const reader = new FileReader()
  reader.onload = (event) => {
    form.avatar = event.target.result
    showMsg('头像已选择，点击保存生效', 'success')
  }
  reader.readAsDataURL(file)
}

const showMsg = (text, type) => {
  message.text = text
  message.type = type
  setTimeout(() => { message.text = '' }, 3000)
}

const saveProfile = async () => {
  const username = form.username.trim()
  if (!username) {
    showMsg('用户名不能为空', 'error')
    return
  }

  saving.value = true
  try {
    const result = await window.electronAPI.updateProfile(props.user.id, {
      username,
      nickname: form.nickname,
      gender: form.gender,
      age: form.age,
      birthday: form.birthday,
      avatar: form.avatar
    })

    if (result.success) {
      showMsg('保存成功', 'success')
      emit('update', result.user || { ...props.user, ...form, username })
    } else {
      showMsg(result.message || '保存失败', 'error')
    }
  } catch (err) {
    showMsg('保存出错: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>
