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
const petId = route.params.id as string

const items = ref<BreadcrumbItem[]>([
  { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
  { label: 'View Pet Detail', icon: 'i-lucide-eye', to: `/pet/view/${petId}` }
])

type Pet = {
  pet_id: number
  pet_name: string
  image_url?: string
  birth_date?: string
  weight?: number
  type?: {
    type_name: string
  }
  breed_name?: string
  gender?: string
  owner?: {
    first_name: string
    last_name: string
  }
}

const pet = ref<Pet | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birthDateObj = new Date(birthDate)
  const age = today.getFullYear() - birthDateObj.getFullYear()
  const m = today.getMonth() - birthDateObj.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
    return age - 1
  }
  return age
}

onMounted(async () => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return router.push('/')
  }

  loading.value = true
  error.value = null
  try {
    pet.value = await $fetch<Pet>(`http://localhost:3001/pets/${petId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to load pet details'
    await Swal.fire({
      title: 'Error!',
      text: error.value ?? 'Unknown error',
      icon: 'error',
      confirmButtonText: 'OK'
    })
    router.push('/pet')
  } finally {
    loading.value = false
  }
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatAge = (birthDateStr?: string) => {
  if (!birthDateStr) return '-'
  const birth = new Date(birthDateStr)
  const today = new Date()

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += lastMonth.getDate()
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  let ageString = ''
  if (years > 0) ageString += `${years} years`
  if (months > 0) ageString += `${ageString ? ', ' : ''}${months} months`

  return ageString || '0 days'
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold mb-5">View Pet Detail</h1>
      <UBreadcrumb :items="items" />

      <div v-if="loading" class="text-center text-gray-500">Loading pet data...</div>
      <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>

      <div v-else-if="pet">
        <UPageCard title="Pet Details" description="Information about the selected pet." orientation="vertical"
          spotlight spotlight-color="primary">
          <div class="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
            <!-- รูปภาพ: 50% ของการ์ด -->
            <img :src="pet.image_url || '/default-pet.png'" :alt="pet.pet_name"
              class="rounded-lg object-cover border border-gray-300 w-full md:w-1/2 h-80" />

            <!-- รายละเอียด -->
            <div class="flex-1 space-y-4 text-gray-800">
              <!-- ชื่อและ ID -->
              <div>
                <h2 class="text-2xl font-bold flex items-center gap-3">
                  {{ pet.pet_name }}
                  <UBadge color="primary" variant="soft" class="font-bold rounded-full">ID: {{ pet.pet_id }}</UBadge>
                </h2>
              </div>
              <!-- Grid ของข้อมูล -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <h3 class="font-semibold mb-1">Type</h3>
                  <p class="text-sm text-gray-600">{{ pet.type?.type_name || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Breed</h3>
                  <p class="text-sm text-gray-600">{{ pet.breed_name || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Gender</h3>
                  <p class="text-sm text-gray-600">{{ pet.gender || '-' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Owner</h3>
                  <p class="text-sm text-gray-600">{{ pet.owner ? `${pet.owner.first_name} ${pet.owner.last_name}` : '-'
                    }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Birthdate</h3>
                  <p class="text-sm text-gray-600">{{ formatDate(pet.birth_date) }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Age</h3>
                  <p class="text-sm text-gray-600">{{ formatAge(pet.birth_date) }}</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-1">Weight (kg)</h3>
                  <p class="text-sm text-gray-600">{{ pet.weight !== undefined ? `${pet.weight} kg` : '-' }}</p>
                </div>
              </div>

            </div>
          </div>
        </UPageCard>
      </div>
    </div>
  </div>
</template>
