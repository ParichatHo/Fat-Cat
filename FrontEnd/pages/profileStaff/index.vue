<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
})

const router = useRouter()

type User = {
  user_id: string
  first_name: string
  last_name: string
  full_name: string
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

// ดึงข้อมูลผู้ใช้จาก localStorage
const currentUser = computed(() => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
  return null
})

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const token = localStorage.getItem('authToken')
  const email = currentUser.value?.email

  if (!token || !email) {
    await Swal.fire({
      title: 'Authentication Required',
      text: 'Please log in to view your profile',
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
    })
    return router.push('/')
  }

  loading.value = true
  error.value = null
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

    // แปลงข้อมูลจาก API response ให้ตรงกับ User type
    user.value = {
      user_id: response.data.user_id || response.data.id,
      first_name: response.data.first_name || response.data.full_name?.split(' ')[0] || '',
      last_name: response.data.last_name || response.data.full_name?.split(' ').slice(1).join(' ') || '',
      full_name: response.data.full_name,
      phone: response.data.phone || '',
      email: response.data.email,
      role: response.data.role,
      image_url: response.data.image_url,
      veterinarian: response.data.veterinarian
    }

    console.log('Profile data:', user.value) // Debug log
  } catch (err: any) {
    error.value = err?.response?.data?.message || err.message || 'Failed to load profile'
    await Swal.fire({
      title: 'Error!',
      text: error.value ?? 'Unknown error',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33',
    })
    router.push('/')
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
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">My Profile</h1>
        <!-- <UButton @click="editProfile" color="primary" size="lg" icon="i-lucide-edit-3">
            Edit Profile
          </UButton> -->
      </div>

      <div v-if="loading" class="text-center text-gray-500">Loading profile data...</div>
      <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>

      <div v-else-if="user">
        <UPageCard title="Profile Information" description="Your personal and professional information."
          orientation="vertical" spotlight spotlight-color="primary">
          <div class="space-y-8">
            <!-- Profile Section -->
            <div class="flex flex-col lg:flex-row lg:space-x-8 space-y-6 lg:space-y-0">
              <!-- Profile Image -->
              <div class="flex-shrink-0 lg:w-80">
                <div class="relative">
                  <img :src="user.image_url || '/default-user.png'"
                    :alt="user.full_name || `${user.first_name} ${user.last_name}`"
                    class="rounded-xl object-cover border border-gray-200 shadow-sm w-full h-80" />
                  <!-- Optional: Add camera icon for image upload -->
                  <!-- <button class="absolute bottom-3 right-3 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors">
                    <UIcon name="i-lucide-camera" class="w-4 h-4" />
                  </button> -->
                </div>
              </div>

              <!-- Basic Information -->
              <div class="flex-1">
                <!-- Name and ID Header -->
                <div class="mb-6">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 class="text-3xl font-bold text-gray-900">
                      {{ user.full_name || `${user.first_name} ${user.last_name}` }}
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
                        <UBadge :color="user.role === 'VETERINARIAN' ? 'info' : 'neutral'" variant="subtle" size="md"
                          class="font-medium">
                          <UIcon :name="user.role === 'VETERINARIAN' ? 'i-lucide-stethoscope' : 'i-lucide-user'"
                            class="w-4 h-4 mr-1" />
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
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <UIcon name="i-lucide-stethoscope" class="w-6 h-6 text-blue-600" />
                      Professional Information
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">Your veterinarian credentials and qualifications</p>
                  </div>
                </div>
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
                <p class="text-gray-600 mb-4">No veterinarian information available.</p>
                <UButton @click="router.push('/profile/edit?section=professional')" color="primary" variant="outline"
                  icon="i-lucide-plus">
                  Add Professional Information
                </UButton>
              </div>
            </div>

            <!-- Quick Actions Section -->
            <div class="border-t border-gray-200 pt-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <UButton @click="router.push('/profileStaff/edit')" color="neutral" variant="outline" block
                  icon="i-lucide-edit">
                  Edit Profile
                </UButton>
                <UButton @click="router.push('/profileStaff/change-password')" color="neutral" variant="outline" block
                  icon="i-lucide-key">
                  Change Password
                </UButton>
                <UButton @click="router.push('/profileStaff')" color="neutral" variant="outline" block
                  icon="i-lucide-settings">
                  Account Settings
                </UButton>
              </div>
            </div>
          </div>
        </UPageCard>
      </div>
    </div>
  </div>
</template>