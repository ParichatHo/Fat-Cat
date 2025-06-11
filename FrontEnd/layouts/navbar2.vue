<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// ใช้ useSession หรือกลับไปใช้ localStorage
// const session = useSession() // ถ้าต้องการใช้ useSession

// ดึงข้อมูลผู้ใช้จาก localStorage (สำหรับ backward compatibility)
const user = computed(() => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
  return null
})

// ตั้งค่า userName, userRole และ userAvatar
const userName = ref('Guest')
const userRole = ref('N/A')
const userAvatar = ref('https://i.pinimg.com/736x/33/4f/6e/334f6eae058525b81f1a4103f1d720db.jpg')

onMounted(async () => {
  const token = localStorage.getItem('authToken')
  const email = user.value?.email

  if (!token || !email) {
    await logout()
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
    userAvatar.value = response.data.image_url || userAvatar.value
  } catch (error) {
    console.error('Failed to fetch user info:', error)
    await logout()
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

// Dropdown menu items - ใช้โครงสร้างเดียวกับตัวอย่าง
const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: userName.value,
      avatar: {
        src: userAvatar.value,
        alt: userName.value
      }
    }
  ],
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      onSelect() {
        router.push('/profileVet')
      }
    },
    {
      label: 'Settings',
      icon: 'i-lucide-cog',
      onSelect() {
        console.log('Settings clicked')
        // เพิ่ม navigation หรือ action สำหรับ settings
      }
    }
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      onSelect() {
        logout()
      }
    }
  ]
])

// ฟังก์ชัน logout ที่ปรับปรุงแล้ว
async function logout() {
  try {
    console.log('Starting logout process...')

    // ลบข้อมูลจาก localStorage และ sessionStorage
    if (process.client) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      sessionStorage.removeItem('authToken')

      // ลบ cookies
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

      // ลบ cookies อีกรูปแบบ
      document.cookie = 'authToken=; Max-Age=0; path=/;'
    }

    console.log('Storage cleared, navigating to home...')

    // ใช้ navigateTo แทน router.push (Nuxt 3 way)
    await navigateTo('/')

    // รอให้ navigation เสร็จแล้วค่อย reload
    setTimeout(() => {
      if (process.client) {
        window.location.reload()
      }
    }, 100)

  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: บังคับ redirect
    if (process.client) {
      window.location.href = '/'
    }
  }
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

        <UDropdownMenu :items="dropdownItems" :ui="{
          content: 'w-56'
        }">
          <div
            class="relative cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-200">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <img :src="userAvatar" :alt="userName" class="w-8 h-8 rounded-full object-cover" />
                <!-- Online indicator (green dot) -->
                <div
                  class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
                </div>
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ userName }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ userRole }}</span>
              </div>
              <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </UDropdownMenu>
      </div>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
  <slot />
</template>