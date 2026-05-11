<template>
  <div class="h-screen overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 p-6 text-slate-900">
    <div class="flex h-full items-center justify-center">
      <AuthSection v-if="!currentUser" @login="handleLogin" />
      <ProfileSection 
        v-else-if="currentPage === 'profile'" 
        :user="currentUser" 
        @back="currentPage = 'admin'"
        @update="handleProfileUpdate"
      />
      <AdminSection 
        v-else 
        :user="currentUser" 
        @logout="handleLogout"
        @goProfile="currentPage = 'profile'"
        @update-user="handleProfileUpdate"
      />
    </div>
    <UpdateNoticeModal :show="showUpdateNotice" :notes="updateNotes" @close="closeUpdateNotice" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AuthSection from './components/AuthSection.vue'
import AdminSection from './components/AdminSection.vue'
import ProfileSection from './components/ProfileSection.vue'
import UpdateNoticeModal from './components/modals/UpdateNoticeModal.vue'
import updateNotes from './generated/update-notes.json'

const CURRENT_USER_ID_KEY = 'currentUserId'
const LEGACY_CURRENT_USER_KEY = 'currentUser'
const LAST_SEEN_UPDATE_VERSION_KEY = 'lastSeenUpdateVersion'

const currentUser = ref(null)
const currentPage = ref('admin') // 'admin' | 'profile'
const showUpdateNotice = ref(false)

const openUpdateNoticeIfNeeded = () => {
  if (!currentUser.value) return

  const lastSeenVersion = localStorage.getItem(LAST_SEEN_UPDATE_VERSION_KEY)
  showUpdateNotice.value = lastSeenVersion !== updateNotes.version
}

const closeUpdateNotice = () => {
  showUpdateNotice.value = false
  localStorage.setItem(LAST_SEEN_UPDATE_VERSION_KEY, updateNotes.version)
}

const loadCurrentUser = async () => {
  const savedUserId = localStorage.getItem(CURRENT_USER_ID_KEY)
  const legacySavedUser = localStorage.getItem(LEGACY_CURRENT_USER_KEY)
  let legacyUserId = null

  if (legacySavedUser) {
    try {
      legacyUserId = JSON.parse(legacySavedUser).id
    } catch {
      legacyUserId = null
    }
  }

  const userId = savedUserId || legacyUserId

  localStorage.removeItem(LEGACY_CURRENT_USER_KEY)

  if (!userId) return

  const result = await window.electronAPI.getUserById(Number(userId))
  if (result.success) {
    currentUser.value = result.user
    localStorage.setItem(CURRENT_USER_ID_KEY, String(result.user.id))
    openUpdateNoticeIfNeeded()
  } else {
    currentUser.value = null
    localStorage.removeItem(CURRENT_USER_ID_KEY)
  }
}

onMounted(() => {
  loadCurrentUser()
})

const handleLogin = (user) => {
  currentUser.value = user
  localStorage.setItem(CURRENT_USER_ID_KEY, String(user.id))
  localStorage.removeItem(LEGACY_CURRENT_USER_KEY)
  openUpdateNoticeIfNeeded()
}

const handleLogout = () => {
  currentUser.value = null
  currentPage.value = 'admin'
  localStorage.removeItem(CURRENT_USER_ID_KEY)
  localStorage.removeItem(LEGACY_CURRENT_USER_KEY)
}

const handleProfileUpdate = (updatedUser) => {
  currentUser.value = updatedUser
  localStorage.setItem(CURRENT_USER_ID_KEY, String(updatedUser.id))
  localStorage.removeItem(LEGACY_CURRENT_USER_KEY)
}
</script>
