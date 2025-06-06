<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { BreadcrumbItem } from '@nuxt/ui'
import Swal from 'sweetalert2'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const route = useRoute()
const customerId = route.params.id as string

const items = ref<BreadcrumbItem[]>([
  { label: 'Customers', icon: 'i-lucide-users', to: '/customer' },
  { label: 'Edit Customer', icon: 'i-lucide-user-check', to: `/customer/edit/${customerId}` }
])

const token = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

type Customer = {
  first_name: string
  last_name: string
  phone: string
  email: string
  address: string
}

const customer = ref<Customer>({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  address: ''
})

onMounted(async () => {
  token.value = localStorage.getItem('authToken')
  if (!token.value) {
    return navigateTo('/')
  }

  loading.value = true
  error.value = null
  try {
    const data = await $fetch<Customer>(`http://localhost:3001/owners/${customerId}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    customer.value = data
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to load customer data'
    await Swal.fire({
      title: "Error!",
      text: error.value ?? '',
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#EF4444"
    })
  } finally {
    loading.value = false
  }
})

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

async function submitForm() {
  const errors = validate(customer.value)
  if (errors.length > 0) {
    await Swal.fire({
      title: "Validation Error",
      text: "Please fill all required fields",
      icon: "warning",
      confirmButtonText: "OK",
      confirmButtonColor: "#F59E0B"
    })
    return
  }

  loading.value = true
  error.value = null

  try {
    await $fetch(`http://localhost:3001/owners/${customerId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customer.value)
    })

    loading.value = false

    await Swal.fire({
      title: "Updated!",
      text: "Customer has been updated successfully.",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#00C16A"
    })

    navigateTo('/customer')

  } catch (err: any) {
    loading.value = false
    error.value = err?.data?.message || err.message || 'Failed to update customer'

    await Swal.fire({
      title: "Error!",
      text: error.value ?? '',
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#EF4444"
    })
  }
}

</script>

<template>
  <div class="p-6 mx-auto" style="max-width: 750px;">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-5">Edit Customer</h1>
      <UBreadcrumb :items="items" />

      <UPageCard title="Edit Customer" description="Update customer details below.">
        <div v-if="loading" class="text-center py-10 text-gray-500">Loading customer data...</div>
        <div v-else>
          <UForm :state="customer" :validate="validate" @submit.prevent="submitForm" class="space-y-4">

            <!-- Row: First Name + Last Name -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="First Name" name="first_name" required class="w-full md:w-1/2">
                <UInput v-model="customer.first_name" placeholder="Enter first name" class="w-full" />
              </UFormField>

              <UFormField label="Last Name" name="last_name" required class="w-full md:w-1/2">
                <UInput v-model="customer.last_name" placeholder="Enter last name" class="w-full" />
              </UFormField>
            </div>

            <!-- Row: Phone + Email -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Phone" name="phone" required class="w-full md:w-1/2">
                <UInput v-model="customer.phone" placeholder="Enter phone number" class="w-full" />
              </UFormField>

              <UFormField label="Email" name="email" required class="w-full md:w-1/2">
                <UInput v-model="customer.email" placeholder="Enter email" type="email" class="w-full" />
              </UFormField>
            </div>

            <!-- Row: Address -->
            <UFormField label="Address" name="address" required>
              <UTextarea v-model="customer.address" placeholder="Enter address" class="w-full" />
            </UFormField>

            <!-- Button -->
            <div class="pt-4">
              <UButton type="submit" label="Save Changes" class="w-full justify-center" :loading="loading" />
            </div>

            <!-- Error -->
            <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

          </UForm>

        </div>
      </UPageCard>
    </div>
  </div>
</template>
