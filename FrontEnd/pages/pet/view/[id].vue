<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const petId = route.params.id as string

type Pet = {
  pet_id: number
  pet_name: string
  image_url?: string
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
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-6">Pet Details</h1>

    <div v-if="loading" class="text-center text-gray-500">Loading pet data...</div>

    <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>

    <div v-else-if="pet" class="space-y-6">
      <div class="flex items-center space-x-6">
        <img
          :src="pet.image_url || '/default-pet.png'"
          :alt="pet.pet_name"
          class="w-32 h-32 rounded-lg object-cover border border-gray-300"
        />
        <div>
          <h2 class="text-xl font-bold">{{ pet.pet_name }}</h2>
          <p class="text-gray-600">ID: {{ pet.pet_id }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
        <div>
          <h3 class="font-semibold mb-1">Type</h3>
          <p>{{ pet.type?.type_name || '-' }}</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1">Breed</h3>
          <p>{{ pet.breed_name || '-' }}</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1">Gender</h3>
          <p>{{ pet.gender || '-' }}</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1">Owner</h3>
          <p>{{ pet.owner ? `${pet.owner.first_name} ${pet.owner.last_name}` : '-' }}</p>
        </div>
      </div>

      <div>
        <button
          @click="router.back()"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Back to Pets List
        </button>
      </div>
    </div>
  </div>
</template>
