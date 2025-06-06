<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'
import { useRoute } from 'vue-router'

const route = useRoute()
const typeId = route.params.id as string

const items = ref<BreadcrumbItem[]>([
  { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
  { label: 'Pet Types', icon: 'i-lucide-dog', to: '/pet/ptype' },
  { label: 'View Pet Type', icon: 'i-lucide-eye', to: `/pet/ptype/${typeId}` }
])

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const token = ref<string | null>(null)
const petType = ref<{ type_name: string; description: string | null }>({ type_name: '', description: '' })
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  token.value = localStorage.getItem('authToken')
  if (!token.value) {
    return navigateTo('/')
  }

  try {
    const data = await $fetch<{ type_name: string; description: string | null }>(
      `http://localhost:3001/ptypes/${typeId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    petType.value = data

    petType.value = data
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to fetch pet type'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6 mx-auto" style="max-width: 750px;">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-5">View Pet Type</h1>
      <UBreadcrumb :items="items" />

      <UPageCard title="View Pet Type" description="Details about the selected pet type." spotlight
        spotlight-color="primary">
        <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
        <div v-else-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <div v-else>
          <UForm :state="petType" class="space-y-4">
            <UFormField label="Type Name" name="type_name">
              <UInput v-model="petType.type_name" disabled class="w-full" />
            </UFormField>

            <UFormField label="Description" name="description">
              <UTextarea v-model="petType.description" disabled class="w-full" />
            </UFormField>
          </UForm>
        </div>
      </UPageCard>
    </div>
  </div>
</template>