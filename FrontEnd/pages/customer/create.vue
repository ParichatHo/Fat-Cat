<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'
import Swal from 'sweetalert2'

// Breadcrumb and other setup remains unchanged
const items = ref<BreadcrumbItem[]>([
  { label: 'Customers', icon: 'i-lucide-users', to: '/customer' },
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
const phoneTouched = ref(false) // Track if phone field has been interacted with

const token = ref<string | null>(null)
onMounted(() => {
  token.value = localStorage.getItem('authToken')
  if (!token.value) {
    navigateTo('/')
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
  form.value.phone = formattedPhone
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
  const currentDigits = form.value.phone.replace(/\D/g, '')
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
  form.value.phone = formattedPhone
  phoneTouched.value = true
}

async function submitForm() {
  phoneTouched.value = true // Ensure validation is triggered on submit
  const errors = validate(form.value)
  if (errors.length > 0) {
    error.value = 'Please fill all required fields correctly'
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

    await Swal.fire({
      title: "Success!",
      text: "Customer has been created.",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#00C16A"
    })

    form.value = { first_name: '', last_name: '', phone: '', email: '', address: '' }
    phoneTouched.value = false // Reset touched state
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
  if (!state.phone) {
    errors.push({ name: 'phone', message: 'Required' })
  } else if (phoneTouched.value && state.phone.length > 0 && !/^\d{3}-\d{3}-\d{4}$/.test(state.phone)) {
    errors.push({ name: 'phone', message: 'Phone number must be in the format 080-123-4569' })
  }
  if (!state.email) errors.push({ name: 'email', message: 'Required' })
  if (!state.address) errors.push({ name: 'address', message: 'Required' })
  return errors
}
</script>

<template>
  <div class="p-6 mx-auto" style="max-width: 750px;">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-5">Create New Customer</h1>
      <UBreadcrumb :items="items"></UBreadcrumb>

      <UPageCard title="Create New Customer"
        description="Add a new customer to the system by filling out the form below.">
        <UForm :state="form" :validate="validate" @submit.prevent="submitForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="First Name" name="first_name" required>
              <UInput v-model="form.first_name" placeholder="Enter your first name" class="w-full" />
            </UFormField>

            <UFormField label="Last Name" name="last_name" required>
              <UInput v-model="form.last_name" placeholder="Enter your last name" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField 
              label="Phone" 
              name="phone" 
              required 
              :error="phoneTouched && validate(form).find(e => e.name === 'phone')?.message"
            >
              <UInput 
                v-model="form.phone" 
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

            <UFormField label="Email" name="email" required>
              <UInput v-model="form.email" placeholder="Enter your email" type="email" class="w-full" />
            </UFormField>
          </div>

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