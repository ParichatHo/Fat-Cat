<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

import { ref, onMounted } from 'vue'
import axios from 'axios'

const userName = ref('')   
const userAvatar = ref('https://i.pravatar.cc/150?u=default') // รูป default

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3001/auth/login', { withCredentials: true })
    
    // สมมติ API คืนข้อมูล user แบบนี้:
    // { first_name: "John", last_name: "Doe", avatarUrl: "https://..." }
    const data = response.data
    userName.value = `${data.first_name} ${data.last_name}`
    userAvatar.value = data.avatarUrl || 'https://i.pravatar.cc/150?u=default'
  } catch (error) {
    console.error('Failed to fetch user info:', error)
  }
})

const router = useRouter()

const items = computed<NavigationMenuItem[]>(() => [{
    label: 'Home',
    to: '/getting-started',
    icon: 'i-lucide-home',
},
{
    label: 'Appointment',
    to: '/getting-started',
    icon: 'i-lucide-calendar-clock',
},
{
    label: 'Customer',
    to: '/customer',
    icon: 'i-lucide-users',
},
{
    label: 'Pet',
    to: '/pet',
    icon: 'i-lucide-paw-print',
},
{
    label: 'User',
    to: '/users',
    icon: 'i-lucide-user-pen',
}])

function logout() {
    // ลบ token จาก storage
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')

    // ลบ cookie ถ้ามี
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // ถ้าใช้ store เคลียร์ state ด้วย เช่น
    // const store = useAuthStore()
    // store.logout()

    // ไปหน้า login แล้วรีเฟรชหน้าให้แน่ใจว่าไม่มี cache เก็บไว้
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
