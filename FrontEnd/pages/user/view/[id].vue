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
  veterinarian?: {
    vet_id: number
    license_number: string
    experience: number
    education: string
  }
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
    console.log('User data:', user.value) // Debug log
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
  <div class="max-w-4xl mx-auto p-6">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold mb-5">View User Detail</h1>
      <UBreadcrumb :items="items" />

      <div v-if="loading" class="text-center text-gray-500">Loading user data...</div>
      <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>

      <div v-else-if="user">
        <UPageCard title="User Details" description="Information about the selected user." orientation="vertical"
          spotlight spotlight-color="primary">
          <div class="space-y-8">
            <!-- Profile Section -->
            <div class="flex flex-col lg:flex-row lg:space-x-8 space-y-6 lg:space-y-0">
              <!-- Profile Image -->
              <div class="flex-shrink-0 lg:w-80">
                <img :src="user.image_url || '/default-user.png'" :alt="`${user.first_name} ${user.last_name}`"
                  class="rounded-xl object-cover border border-gray-200 shadow-sm w-full h-80" />
              </div>

              <!-- Basic Information -->
              <div class="flex-1">
                <!-- Name and ID Header -->
                <div class="mb-6">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 class="text-3xl font-bold text-gray-900">
                      {{ user.first_name }} {{ user.last_name }}
                    </h2>
                    <UBadge color="primary" variant="soft" size="lg" class="font-semibold rounded-full w-fit">
                      ID: {{ user.user_id }}
                    </UBadge>
                  </div>
                </div>
                
                <!-- Basic Info Grid -->
                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1">
                      <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">First Name</label>
                      <p class="text-base text-gray-900">{{ user.first_name || '-' }}</p>
                    </div>
                    <div class="space-y-1">
                      <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Last Name</label>
                      <p class="text-base text-gray-900">{{ user.last_name || '-' }}</p>
                    </div>
                    <div class="space-y-1">
                      <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                      <p class="text-base text-gray-900">{{ formatPhoneNumber(user.phone) || '-' }}</p>
                    </div>
                    <div class="space-y-1">
                      <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Email</label>
                      <p class="text-base text-gray-900 break-words">{{ user.email || '-' }}</p>
                    </div>
                    <div class="space-y-1 md:col-span-2">
                      <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Role</label>
                      <div class="flex items-center gap-2">
                        <UBadge 
                          :color="user.role === 'VETERINARIAN' ? 'info' : 'neutral'" 
                          variant="subtle" 
                          size="md"
                          class="font-medium"
                        >
                          <UIcon 
                            :name="user.role === 'VETERINARIAN' ? 'i-lucide-stethoscope' : 'i-lucide-user'" 
                            class="w-4 h-4 mr-1" 
                          />
                          {{ user.role === 'VETERINARIAN' ? 'Veterinarian' : user.role === 'STAFF' ? 'Staff' : '-' }}
                        </UBadge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Veterinarian Information Section -->
            <div v-if="user.role === 'VETERINARIAN' && user.veterinarian" class="border-t border-gray-200 pt-8">
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <UIcon name="i-lucide-stethoscope" class="w-6 h-6 text-blue-600" />
                  Professional Information
                </h3>
                <p class="text-sm text-gray-600 mt-1">Veterinarian credentials and qualifications</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div class="space-y-1">
                  <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Vet ID</label>
                  <p class="text-base text-gray-900 font-mono">{{ user.veterinarian.vet_id || '-' }}</p>
                </div>
                <div class="space-y-1">
                  <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">License Number</label>
                  <p class="text-base text-gray-900 font-mono">{{ user.veterinarian.license_number || '-' }}</p>
                </div>
                <div class="space-y-1">
                  <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Experience</label>
                  <p class="text-base text-gray-900">
                    {{ user.veterinarian.experience ? `${user.veterinarian.experience} years` : '-' }}
                  </p>
                </div>
                <div class="space-y-1 md:col-span-2 xl:col-span-3">
                  <label class="text-sm font-medium text-gray-500 uppercase tracking-wider">Education</label>
                  <p class="text-base text-gray-900 leading-relaxed">{{ user.veterinarian.education || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Message when no veterinarian data -->
            <div v-else-if="user.role === 'VETERINARIAN' && !user.veterinarian" class="border-t border-gray-200 pt-8">
              <div class="text-center py-8">
                <UIcon name="i-lucide-info" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p class="text-gray-600">No veterinarian information available for this user.</p>
              </div>
            </div>
          </div>
        </UPageCard>
      </div>
    </div>
  </div>
</template>