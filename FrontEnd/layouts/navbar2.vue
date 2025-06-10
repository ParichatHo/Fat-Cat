<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// ดึงข้อมูลผู้ใช้จาก localStorage
const user = computed(() => {
  const userData = localStorage.getItem('user')
  return userData ? JSON.parse(userData) : null
})

// ตั้งค่า userName, userRole และ userAvatar
const userName = ref('Guest')
const userRole = ref('N/A')
const userAvatar = ref('/default-user.png') // Default fallback avatar

onMounted(async () => {
  const token = localStorage.getItem('authToken')
  const email = user.value?.email

  if (!token || !email) {
    router.push('/')
    return
  }

  try {
    const response = await axios.post(
      'http://localhost:3001/user/info',
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    userName.value = response.data.full_name
    userRole.value = response.data.role
    // ดึง image_url จาก API response ถ้ามี, ถ้าไม่มีใช้ค่า default
    userAvatar.value = response.data.image_url || userAvatar.value
  } catch (error) {
    console.error('Failed to fetch user info:', error)
    router.push('/')
  }
})

// เมนูนำทาง
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Home',
    to: '/getting-started',
    icon: 'i-lucide-home',
  },
  {
    label: 'Medical Record',
    to: '/medicalRecord',
    icon: 'i-lucide-file-text',
  },
])

function logout() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  sessionStorage.removeItem('authToken')
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  router.push('/').then(() => {
    location.reload()
  })
}
</script>

<template>
  <UHeader toggle-side="left">
    <template #title>
      <img src="~/assets/img/logo5.png" alt="Logo" class="w-auto h-23 mt-1" />
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <div class="flex items-center space-x-4">
        <UColorModeButton />
        <UUser
          :name="userName"
          :description="userRole"
          :avatar="{ src: userAvatar }"
          :chip="{ color: 'primary', position: 'top-right' }"
        />
        <UButton size="md" color="neutral" variant="outline" @click="logout">
          Logout
        </UButton>
      </div>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
  <slot />
</template>
