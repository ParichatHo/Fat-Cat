<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
})

const items = ref<BreadcrumbItem[]>([
    { label: 'Profile', icon: 'i-lucide-user', to: '/profileVet' },
    { label: 'Change Password', icon: 'i-lucide-user-pen', to: '/profileVet/edit' }
])

const router = useRouter()

// Password validation schema
const passwordSchema = z.object({
  current: z.string().min(6, 'Must be at least 6 characters'),
  new: z.string().min(6, 'Must be at least 6 characters'),
  confirm: z.string().min(6, 'Must be at least 6 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

// Form state
const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined,
  confirm: undefined
})

const loading = ref(false)

// Get current user data
const currentUser = computed(() => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
  return null
})

// Custom validation function
const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  
  // Check if new password is same as current
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'New password must be different from current password' })
  }
  
  // Check if passwords match
  if (state.new && state.confirm && state.new !== state.confirm) {
    errors.push({ name: 'confirm', message: 'Passwords do not match' })
  }
  
  return errors
}

// Handle form submission
const onSubmit = async (event: FormSubmitEvent<PasswordSchema>): Promise<void> => {
  if (loading.value) return
  
  const token = localStorage.getItem('authToken')
  const email = currentUser.value?.email

  if (!token || !email) {
    await Swal.fire({
      title: 'Authentication Required',
      text: 'Please log in to change your password',
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#00C16A',
    })
    router.push('/')
    return
  }

  loading.value = true
  
  try {
    const response = await axios.post(
      'http://localhost:3001/user/change-password',
      {
        email: email,
        currentPassword: event.data.current,
        newPassword: event.data.new
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    await Swal.fire({
      title: 'Success!',
      text: 'Your password has been changed successfully',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#00C16A',
    })

    // Reset form
    password.current = undefined
    password.new = undefined
    password.confirm = undefined
    
    // Redirect back to profile
    router.push('/profileVet')
    
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message || err.message || 'Failed to change password'
    
    await Swal.fire({
      title: 'Error!',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#00C16A',
    })
  } finally {
    loading.value = false
  }
}

// Handle account deletion
const deleteAccount = async () => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This action cannot be undone! All your data will be permanently deleted.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#00C16A',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete my account',
    cancelButtonText: 'Cancel'
  })

  if (result.isConfirmed) {
    const token = localStorage.getItem('authToken')
    const email = currentUser.value?.email

    try {
      loading.value = true
      
      await axios.delete(
        'http://localhost:3001/user/delete-account',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: { email }
        }
      )

      await Swal.fire({
        title: 'Account Deleted',
        text: 'Your account has been permanently deleted',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#00C16A',
      })

      // Clear local storage and redirect
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      router.push('/')
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to delete account'
      
      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#00C16A',
      })
    } finally {
      loading.value = false
    }
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="space-y-6">
      <!-- Header -->
      <h1 class="text-xl font-semibold text-gray-900 mb-5">Change Password</h1>
      <UBreadcrumb :items="items" />
      <!-- Change Password Card -->
      <UPageCard
        title="Change Password"
        description="Confirm your current password before setting a new one."
        orientation="vertical"
        spotlight
        spotlight-color="primary"
      >
        <UForm
          :schema="passwordSchema"
          :state="password"
          :validate="validate"
          @submit="onSubmit"
          class="space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <UFormField name="current" label="Current Password" class="md:col-span-2">
              <UInput
                v-model="password.current"
                type="password"
                placeholder="Enter your current password"
                :loading="loading"
                :disabled="loading"
                class="w-full"
                icon="i-lucide-lock"
              />
            </UFormField>
            
            <UFormField name="new" label="New Password">
              <UInput
                v-model="password.new"
                type="password"
                placeholder="Enter new password"
                :loading="loading"
                :disabled="loading"
                class="w-full"
                icon="i-lucide-key"
              />
            </UFormField>
            
            <UFormField name="confirm" label="Confirm New Password">
              <UInput
                v-model="password.confirm"
                type="password"
                placeholder="Confirm new password"
                :loading="loading"
                :disabled="loading"
                class="w-full"
                icon="i-lucide-key"
              />
            </UFormField>
          </div>
          
          <div class="flex gap-3 pt-4">
            <UButton 
              type="submit" 
              color="primary"
              :loading="loading"
              :disabled="loading || !password.current || !password.new || !password.confirm"
              icon="i-lucide-check"
            >
              {{ loading ? 'Updating...' : 'Update Password' }}
            </UButton>
            <UButton 
              @click="router.push('/profileStaff')" 
              color="neutral" 
              variant="outline"
              :disabled="loading"
            >
              Cancel
            </UButton>
          </div>
        </UForm>
      </UPageCard>

      <!-- Password Requirements -->
      <!-- <UPageCard
        title="Password Requirements"
        description="Your password must meet the following criteria:"
        variant="subtle"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
            <span>At least 8 characters long</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500" />
            <span>Must be different from your current password</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-lucide-shield" class="w-4 h-4 text-blue-500" />
            <span>For security, use a combination of letters, numbers, and symbols</span>
          </div>
        </div>
      </UPageCard> -->

      <!-- Danger Zone -->
      <!-- <UPageCard
        title="Danger Zone"
        description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
        class="bg-gradient-to-tl from-red-50 via-red-50/50 to-white border-red-200"
      >
        <template #footer>
          <div class="flex justify-between items-center">
            <div class="text-sm text-red-600">
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 inline mr-1" />
              This action cannot be undone
            </div>
            <UButton 
              @click="deleteAccount"
              color="error" 
              variant="solid"
              :loading="loading"
              :disabled="loading"
              icon="i-lucide-trash-2"
            >
              {{ loading ? 'Deleting...' : 'Delete Account' }}
            </UButton>
          </div>
        </template>
      </UPageCard> -->
    </div>
  </div>
</template>