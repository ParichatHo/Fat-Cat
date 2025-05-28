<script setup>

definePageMeta({
  layout: 'navbar'
})

const { data: pets, error } = await useAsyncData('pets', () =>
  $fetch('http://localhost:3001/pets')
)
</script>

<template>
  <div>
    <h1>List of Pets</h1>
    <ul>
      <li v-for="pet in pets" :key="pet.pet_id">
        {{ pet.pet_name }} - {{ pet.type?.type_name }} - {{ pet.breed_name }} - {{ pet.gender }} 
        <br />
        Owner: {{ pet.owner?.first_name }} {{ pet.owner?.last_name }}
      </li>

    </ul>
    <div v-if="error">Error loading pets.</div>
  </div>
</template>
