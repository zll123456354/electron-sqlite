<template>
  <div class="h-screen overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 p-6 text-slate-900">
    <div class="flex h-full items-center justify-center">
      <AuthSection v-if="!currentUser" @login="handleLogin" />
      <AdminSection v-else :user="currentUser" @logout="handleLogout" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AuthSection from './components/AuthSection.vue'
import AdminSection from './components/AdminSection.vue'

const currentUser = ref(null)

onMounted(() => {
  const savedUser = localStorage.getItem('currentUser')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  }
})

const handleLogin = (user) => {
  currentUser.value = user
  localStorage.setItem('currentUser', JSON.stringify(user))
}

const handleLogout = () => {
  currentUser.value = null
  localStorage.removeItem('currentUser')
}
</script>
