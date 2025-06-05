<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'
import Swal from 'sweetalert2' 

const items = ref<BreadcrumbItem[]>([
  { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
  { label: 'Pet Types', icon: 'i-lucide-dog', to: '/pet/ptype' },
  { label: 'Create Pet Type', icon: 'i-lucide-plus', to: '/pet/ptype/create' }
])

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const form = ref({
  type_name: '',
  description: ''
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
    await $fetch('http://localhost:3001/ptypes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    success.value = true

    // ✅ แสดง SweetAlert เมื่อสำเร็จ
    await Swal.fire({
      title: "Success!",
      text: "Pet type has been created.",
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#00C16A"
    })

    form.value = { type_name: '', description: '' }
    navigateTo('/pet/ptype')
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to create pet type'
  } finally {
    loading.value = false
  }
}

type FormError = { name: string; message: string }

const validate = (state: any): FormError[] => {
  const errors: FormError[] = []
  if (!state.type_name) errors.push({ name: 'type_name', message: 'Required' })
  return errors
}
</script>


<template>
    <div class="p-6 mx-auto" style="max-width: 750px;">
        <div class="space-y-6">
            <h1 class="text-2xl font-semibold text-gray-900 mb-6">Pet Types</h1>
            <!-- Breadcrumb -->
            <UBreadcrumb :items="items" />

            <!-- Form Card -->
            <UPageCard title="Create Pet Type"
                description="Add a new pet type to the system by filling out the form below.">
                <UForm :state="form" :validate="validate" @submit.prevent="submitForm" class="space-y-4">
                    <UFormField label="Type Name" name="type_name" required>
                        <UInput v-model="form.type_name" placeholder="Enter pet type name" class="w-full" />
                    </UFormField>

                    <UFormField label="Description" name="description">
                        <UTextarea v-model="form.description" placeholder="Enter description (optional)"
                            class="w-full" />
                    </UFormField>

                    <div class="pt-4">
                        <UButton type="submit" label="Create Pet Type" class="w-full justify-center"
                            :loading="loading" />
                    </div>

                    <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
                    <div v-if="success" class="text-green-600 text-sm font-medium">Pet type created successfully!</div>
                </UForm>
            </UPageCard>
        </div>
    </div>
</template>
