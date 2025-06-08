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
const phoneTouched = ref(false) // Track if phone field has been interacted with

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

// Format phone number as XXX-XXX-XXXX
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  // Apply format XXX-XXX-XXXX
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

// Handle phone input to allow only numbers and format automatically
const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // Extract only digits from the input
  const digits = value.replace(/\D/g, '')
  
  // Limit to 10 digits maximum
  const limitedDigits = digits.slice(0, 10)
  
  // Format the phone number
  const formattedPhone = formatPhoneNumber(limitedDigits)
  
  // Update form value and input field
  customer.value.phone = formattedPhone
  input.value = formattedPhone
  
  phoneTouched.value = true // Mark phone field as touched
}

// Handle keydown to prevent non-numeric characters
const handlePhoneKeydown = (event: KeyboardEvent) => {
  // Allow: backspace, delete, tab, escape, enter
  if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (event.keyCode === 65 && event.ctrlKey === true) ||
    (event.keyCode === 67 && event.ctrlKey === true) ||
    (event.keyCode === 86 && event.ctrlKey === true) ||
    (event.keyCode === 88 && event.ctrlKey === true) ||
    // Allow: home, end, left, right
    (event.keyCode >= 35 && event.keyCode <= 39)) {
    return
  }
  
  // Ensure that it is a number and stop the keypress if not
  if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
    event.preventDefault()
  }
  
  // Also prevent input if we already have 10 digits
  const currentDigits = customer.value.phone.replace(/\D/g, '')
  if (currentDigits.length >= 10 && ![8, 46].includes(event.keyCode)) {
    event.preventDefault()
  }
}

// Handle paste event to clean pasted content
const handlePhonePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const paste = event.clipboardData?.getData('text') || ''
  const digits = paste.replace(/\D/g, '').slice(0, 10)
  const formattedPhone = formatPhoneNumber(digits)
  customer.value.phone = formattedPhone
  phoneTouched.value = true
}

type FormError = { name: string; message: string }

const validate = (state: any): FormError[] => {
  const errors: FormError[] = []
  if (!state.first_name) errors.push({ name: 'first_name', message: 'Required' })
  if (!state.last_name) errors.push({ name: 'last_name', message: 'Required' })
  if (!state.phone) {
    errors.push({ name: 'phone', message: 'Required' })
  } else if (phoneTouched.value && state.phone.length > 0 && !/^\d{3}-\d{3}-\d{4}$/.test(state.phone)) {
    errors.push({ name: 'phone', message: 'Phone number must be in the format 080-123-4569' })
  }
  if (!state.email) errors.push({ name: 'email', message: 'Required' })
  if (!state.address) errors.push({ name: 'address', message: 'Required' })
  return errors
}

async function submitForm() {
  phoneTouched.value = true // Ensure validation is triggered on submit
  const errors = validate(customer.value)
  if (errors.length > 0) {
    await Swal.fire({
      title: "Validation Error",
      text: "Please fill all required fields correctly",
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
              <UFormField 
                label="Phone" 
                name="phone" 
                required 
                class="w-full md:w-1/2"
                :error="phoneTouched && validate(customer).find(e => e.name === 'phone')?.message"
              >
                <UInput 
                  v-model="customer.phone" 
                  placeholder="Enter phone number (e.g., 0801234569)" 
                  class="w-full" 
                  @input="handlePhoneInput"
                  @keydown="handlePhoneKeydown"
                  @paste="handlePhonePaste"
                  maxlength="12" 
                  type="tel"
                  autocomplete="tel"
                />
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