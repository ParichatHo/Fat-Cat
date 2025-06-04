<script setup>

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const { data: pets, error } = await useAsyncData('pets', () =>
  $fetch('http://localhost:3001/pets', {
    credentials: 'include'  // ส่ง cookie / credentials ไปด้วย
  })
)

onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return navigateTo('/')
  }
})

</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">List of Pets</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <div v-for="pet in pets" :key="pet.pet_id"
        class="border rounded-lg shadow p-4 hover:shadow-lg transition-shadow duration-300">
        <img v-if="pet.image_url" :src="pet.image_url" :alt="`Image of ${pet.pet_name}`"
          class="w-full h-48 object-cover rounded mb-3" />

        <h2 class="text-xl font-semibold mb-2">{{ pet.pet_name }}</h2>
        <p><strong>Type:</strong> {{ pet.type?.type_name || 'N/A' }}</p>
        <p><strong>Breed:</strong> {{ pet.breed_name || 'N/A' }}</p>
        <p><strong>Gender:</strong> {{ pet.gender || 'N/A' }}</p>
        <p class="mt-3 text-sm text-gray-600">
          Owner: {{ pet.owner?.first_name || '-' }} {{ pet.owner?.last_name || '-' }}
        </p>
      </div>
    </div>
    <div v-if="error" class="text-red-500 mt-4">Error loading pets.</div>
  </div>
</template>
