<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur" @click.self="$emit('cancel')">
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
      <h3 class="text-lg font-semibold text-slate-800">{{ title }}</h3>
      <div class="mt-4 rounded-lg border px-3 py-2 text-sm"
        :class="type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'">
        {{ content }}
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" @click="$emit('cancel')">取消</button>
        <button class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600" @click="$emit('confirm')">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ show: Boolean, title: String, content: String, type: { type: String, default: 'neutral' } })
defineEmits(['confirm', 'cancel'])
</script>
