<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
    layout: 'navbar',
    middleware: 'auth'
})

const items = ref<BreadcrumbItem[]>([
    { label: 'Customer', icon: 'i-lucide-users', to: '/customer' },
    { label: 'Customer View', icon: 'i-lucide-user', to: '' }
])

const customer = ref({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: ''
})

const loading = ref(false)
const error = ref<string | null>(null)

const token = ref<string | null>(null)
const customerId = '1'

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        navigateTo('/')
    }

    await fetchCustomerDetails()
})

type Customer = {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
}


const fetchCustomerDetails = async () => {
    loading.value = true
    error.value = null

    try {
        const response = await $fetch<Customer>(`http://localhost:3001/owners/${customerId}`, {
            headers: {
                Authorization: `Bearer ${token.value}`,
            }
        })
        customer.value = response
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to fetch customer details'
    } finally {
        loading.value = false
    }
}

</script>

<template>
    <div class="min-h-[calc(100vh-64px)] flex justify-center px-4 pt-6">
        <div class="w-full max-w-lg space-y-6">
            <h1 class="text-lg font-semibold text-gray-900 mb-2">Customers List</h1>
            <UBreadcrumb :items="items" />

            <UPageCard title="Customer Details" description="View the details of the selected customer." spotlight
                spotlight-color="primary">

                <div v-if="loading" class="text-center">Loading...</div>
                <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

                <UForm v-if="!loading && customer" :state="customer" class="space-y-4">
                    <UFormField label="First Name" name="first_name">
                        <UInput v-model="customer.first_name" readonly class="w-full" />
                    </UFormField>

                    <UFormField label="Last Name" name="last_name">
                        <UInput v-model="customer.last_name" readonly class="w-full" />
                    </UFormField>

                    <UFormField label="Phone" name="phone">
                        <UInput v-model="customer.phone" readonly class="w-full" />
                    </UFormField>

                    <UFormField label="Email" name="email">
                        <UInput v-model="customer.email" readonly class="w-full" />
                    </UFormField>

                    <UFormField label="Address" name="address">
                        <UTextarea v-model="customer.address" readonly class="w-full" />
                    </UFormField>
                </UForm>
            </UPageCard>
        </div>
    </div>
</template>
