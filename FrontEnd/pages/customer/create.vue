<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'

// Breadcrumb with icons
const items = ref<BreadcrumbItem[]>([
  { label: 'Customer', icon: 'i-lucide-users', to: '/customer' },
  { label: 'Create New Customer', icon: 'i-lucide-user-plus', to: '/customer/create' }
])

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const form = ref({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  address: ''
})

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const token = ref<string | null>(null)
onMounted(() => {
  token.value = localStorage.getItem('authToken')
  if (!token.value) {
    navigateTo('/')
  }
})

async function submitForm() {
  const errors = validate(form.value)
  if (errors.length > 0) {
    error.value = 'Please fill all required fields'
    return
  }

  loading.value = true
  error.value = null
  success.value = false

  try {
    await $fetch('http://localhost:3001/owners', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    success.value = true
    form.value = { first_name: '', last_name: '', phone: '', email: '', address: '' }
    navigateTo('/customer')
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to create owner'
  } finally {
    loading.value = false
  }
}

type FormError = { name: string; message: string }

const validate = (state: any): FormError[] => {
  const errors: FormError[] = []
  if (!state.first_name) errors.push({ name: 'first_name', message: 'Required' })
  if (!state.last_name) errors.push({ name: 'last_name', message: 'Required' })
  if (!state.phone) errors.push({ name: 'phone', message: 'Required' })
  if (!state.email) errors.push({ name: 'email', message: 'Required' })
  if (!state.address) errors.push({ name: 'address', message: 'Required' })
  return errors
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
    <div class="w-full max-w-lg space-y-6">
      <!-- Breadcrumb with icons -->
      <UBreadcrumb :items="items">
      </UBreadcrumb>


      <!-- Form Card -->
      <UPageCard title="Create New Customer"
        description="Add a new customer to the system by filling out the form below.">
        <UForm :state="form" :validate="validate" @submit.prevent="submitForm" class="space-y-4">
          <UFormField label="First Name" name="first_name" required>
            <UInput v-model="form.first_name" placeholder="Enter your first name" class="w-full" />
          </UFormField>

          <UFormField label="Last Name" name="last_name" required>
            <UInput v-model="form.last_name" placeholder="Enter your last name" class="w-full" />
          </UFormField>

          <UFormField label="Phone" name="phone" required>
            <UInput v-model="form.phone" placeholder="Enter your phone number" class="w-full" />
          </UFormField>

          <UFormField label="Email" name="email" required>
            <UInput v-model="form.email" placeholder="Enter your email" type="email" class="w-full" />
          </UFormField>

          <UFormField label="Address" name="address" required>
            <UTextarea v-model="form.address" placeholder="Enter your address" class="w-full" />
          </UFormField>

          <div class="pt-4">
            <UButton type="submit" label="Create Customer" class="w-full justify-center" :loading="loading" />
          </div>

          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
          <div v-if="success" class="text-green-600 text-sm font-medium">Customer created successfully!</div>
        </UForm>
      </UPageCard>
    </div>
  </div>
</template>
