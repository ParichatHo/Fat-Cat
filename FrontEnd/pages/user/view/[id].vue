    <script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const userId = route.params.id as string

const items = ref<BreadcrumbItem[]>([
  { label: 'Users', icon: 'i-lucide-users', to: '/user' },
  { label: 'View User Detail', icon: 'i-lucide-eye', to: `/user/view/${userId}` }
])

type User = {
  user_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: 'VETERINARIAN' | 'STAFF'
  image_url?: string
}

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return router.push('/')
  }

  loading.value = true
  error.value = null
  try {
    user.value = await $fetch<User>(`http://localhost:3001/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to load user details'
    await Swal.fire({
      title: 'Error!',
      text: error.value ?? 'Unknown error',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33',
    })
    router.push('/user')
  } finally {
    loading.value = false
  }
})

const formatPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10) return phone
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold mb-5">View User Detail</h1>
      <UBreadcrumb :items="items" />

      <div v-if="loading" class="text-center text-gray-500">Loading user data...</div>
      <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>

      <div v-else-if="user">
        <UPageCard title="User Details" description="Information about the selected user." orientation="vertical"
          spotlight spotlight-color="primary">
          <div class="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
            <!-- Profile Image: 50% of the card -->
            <img :src="user.image_url || '/default-user.png'" :alt="`${user.first_name} ${user.last_name}`"
              class="rounded-lg object-cover border border-gray-300 w-full md:w-1/2 h-80" />

            <!-- User Details -->
            <div class="flex-1 space-y-4 text-gray-800">
              <!-- Name and ID -->
              <div>
                <h2 class="text-2xl font-bold flex items-center gap-3">
                  {{ user.first_name }} {{ user.last_name }}
                  <UBadge color="primary" variant="soft" class="font-bold rounded-full">ID: {{ user.user_id }}</UBadge>
                </h2>
              </div>
              <!-- Grid of information -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <h3 class="font-semibold mb-1">First Name</h3>
                  <p class="text-sm text-gray-600">{{ user.first_name || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Last Name</h3>
                  <p class="text-sm text-gray-600">{{ user.last_name || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Phone Number</h3>
                  <p class="text-sm text-gray-600">{{ formatPhoneNumber(user.phone) || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Email</h3>
                  <p class="text-sm text-gray-600">{{ user.email || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Role</h3>
                  <p class="text-sm text-gray-600">{{ user.role === 'VETERINARIAN' ? 'Veterinarian' : user.role === 'STAFF' ? 'Staff' : '-' }}</p>
                </div>
              </div>
            </div>
          </div>
        </UPageCard>
      </div>
    </div>
  </div>
</template>