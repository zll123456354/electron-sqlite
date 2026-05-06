<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur" @click.self="$emit('close')">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-800">修改密码</h3>
        <span class="cursor-pointer text-2xl text-slate-400 hover:text-slate-700" @click="$emit('close')">&times;</span>
      </div>
      <div class="mt-4 space-y-4">
        <div>
          <label class="text-sm font-medium text-slate-700">原密码</label>
          <input v-model="form.oldPassword" type="password"
            class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="请输入原密码" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">新密码</label>
          <input v-model="form.newPassword" type="password"
            class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="至少6个字符" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">确认新密码</label>
          <input v-model="form.confirmPassword" type="password"
            class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="再次输入新密码" />
        </div>
      </div>
      <div v-if="message.text" class="mt-4 rounded-lg border px-3 py-2 text-sm"
        :class="message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'">
        {{ message.text }}
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" @click="$emit('close')">取消</button>
        <button class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600" @click="submit">确认修改</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({ show: Boolean, userId: Number })
const emit = defineEmits(['close'])

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const message = reactive({ text: '', type: '' })

watch(() => props.show, (val) => {
  if (val) {
    form.oldPassword = form.newPassword = form.confirmPassword = ''
    message.text = ''
  }
})

const submit = async () => {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    return Object.assign(message, { text: '请填写所有字段', type: 'error' })
  }
  if (form.newPassword.length < 6) return Object.assign(message, { text: '新密码至少6个字符', type: 'error' })
  if (form.newPassword !== form.confirmPassword) return Object.assign(message, { text: '两次输入的新密码不一致', type: 'error' })

  const result = await window.electronAPI.changePassword(props.userId, form.oldPassword, form.newPassword)
  Object.assign(message, { text: result.message, type: result.success ? 'success' : 'error' })
  if (result.success) setTimeout(() => emit('close'), 1000)
}
</script>
