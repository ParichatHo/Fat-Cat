<script setup>

definePageMeta({
  layout: 'navbar2',
  middleware: 'auth'
})

const { data: pets, error } = await useAsyncData('pets', () =>
  $fetch('http://localhost:3001/appts', {
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