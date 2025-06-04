<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const route = useRoute()
const customerId = route.params.id as string

// Breadcrumb with icons for Edit page
const items = ref<BreadcrumbItem[]>([
    { label: 'Customer', icon: 'i-lucide-users', to: '/customer' },
    { label: 'Edit Customer', icon: 'i-lucide-user-check', to: `/customer/edit/${customerId}` }
])

const token = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)

const toast = useToast()

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
        error.value = err?.data?.message || err.message || 'Unknown error'
    } finally {
        loading.value = false
    }
})


onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        return navigateTo('/')
    }

    loading.value = true
    error.value = null
    try {
        const data = await $fetch(`http://localhost:3001/owners/${customerId}`, {
            headers: { Authorization: `Bearer ${token.value}` }
        }) as Customer

        customer.value = data

    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Unknown error'
    } finally {
        loading.value = false
    }
})

type FormError<T = string> = { name: T; message: string }

const validate = (state: any): FormError<string>[] => {
    const errors: FormError<string>[] = []
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
        error.value = errors.join(', ')
        return
    }

    loading.value = true
    error.value = null
    success.value = false

    try {
        await $fetch(`http://localhost:3001/owners/${customerId}`, {
            method: 'PUT', // หรือ PATCH ตาม API
            headers: {
                Authorization: `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customer.value)
        })
        success.value = true
        toast.add({ title: 'Customer updated successfully!', color: 'success' })
        navigateTo('/customer')
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to update customer'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div class="w-full max-w-lg space-y-6">
            <!-- Breadcrumb with icons -->
            <UBreadcrumb :items="items" />

            <UPageCard title="Edit Customer" description="Update customer details below.">
                <div v-if="loading" class="text-center py-10 text-gray-500">Loading customer data...</div>
                <div v-else>
                    <UForm :state="customer" :validate="validate" @submit.prevent="submitForm" class="space-y-4">
                        <UFormField label="First Name" name="first_name" required>
                            <UInput v-model="customer.first_name" placeholder="Enter first name" class="w-full" />
                        </UFormField>

                        <UFormField label="Last Name" name="last_name" required>
                            <UInput v-model="customer.last_name" placeholder="Enter last name" class="w-full" />
                        </UFormField>

                        <UFormField label="Phone" name="phone" required>
                            <UInput v-model="customer.phone" placeholder="Enter phone number" class="w-full" />
                        </UFormField>

                        <UFormField label="Email" name="email" required>
                            <UInput v-model="customer.email" placeholder="Enter email" type="email" class="w-full" />
                        </UFormField>

                        <UFormField label="Address" name="address" required>
                            <UTextarea v-model="customer.address" placeholder="Enter address" class="w-full" />
                        </UFormField>

                        <div class="pt-4">
                            <UButton type="submit" label="Save Changes" class="w-full justify-center"
                                :loading="loading" />
                        </div>

                        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
                        <div v-if="success" class="text-green-600 text-sm font-medium">Customer updated successfully!
                        </div>
                    </UForm>
                </div>
            </UPageCard>
        </div>
    </div>
</template>
