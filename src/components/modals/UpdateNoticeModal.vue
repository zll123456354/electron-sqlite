<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
    <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-white/80">版本更新</p>
            <h2 class="mt-1 text-2xl font-semibold">已更新到 v{{ notes.version }}</h2>
          </div>
          <button
            class="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            type="button"
            @click="$emit('close')"
            aria-label="关闭更新说明"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="px-6 py-5">
        <div class="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span v-if="notes.from">更新范围：{{ notes.from }} → {{ notes.to }}</span>
          <span v-else>以下是本次版本包含的更新内容</span>
        </div>

        <ul class="space-y-3">
          <li v-for="(item, index) in displayItems" :key="index" class="flex gap-3 text-sm text-slate-700">
            <span class="mt-1 h-2 w-2 flex-none rounded-full bg-indigo-500"></span>
            <span class="leading-6">{{ item }}</span>
          </li>
        </ul>

        <button
          class="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-600"
          type="button"
          @click="$emit('close')"
        >
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  notes: {
    type: Object,
    required: true,
  },
})

defineEmits(['close'])

const displayItems = computed(() => {
  return props.notes.items?.length ? props.notes.items : ['本次更新优化了应用体验']
})
</script>
