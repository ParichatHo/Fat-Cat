<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
    layout: 'navbar',
    middleware: 'auth'
})

const items = ref<BreadcrumbItem[]>([
    { label: 'Customers', icon: 'i-lucide-users', to: '/customer' },
    { label: 'Customer Details', icon: 'i-lucide-user', to: '' }
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
    <div class="p-6 mx-auto" style="max-width: 750px;">
        <div class="space-y-6">
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Customer Details</h1>
            <UBreadcrumb :items="items" />

            <UPageCard title="Customer Details" description="View the details of the selected customer." spotlight
                spotlight-color="primary">

                <div v-if="loading" class="text-center">Loading...</div>
                <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

                <UForm v-if="!loading && customer" :state="customer" class="space-y-4">
                    <!-- Row: First Name + Last Name -->
                    <div class="flex flex-col md:flex-row gap-4">
                        <UFormField label="First Name" name="first_name" class="w-full md:w-1/2">
                            <UInput v-model="customer.first_name" readonly class="w-full" />
                        </UFormField>

                        <UFormField label="Last Name" name="last_name" class="w-full md:w-1/2">
                            <UInput v-model="customer.last_name" readonly class="w-full" />
                        </UFormField>
                    </div>

                    <!-- Row: Phone + Email -->
                    <div class="flex flex-col md:flex-row gap-4">
                        <UFormField label="Phone" name="phone" class="w-full md:w-1/2">
                            <UInput v-model="customer.phone" readonly class="w-full" />
                        </UFormField>

                        <UFormField label="Email" name="email" class="w-full md:w-1/2">
                            <UInput v-model="customer.email" readonly class="w-full" />
                        </UFormField>
                    </div>

                    <!-- Row: Address -->
                    <UFormField label="Address" name="address">
                        <UTextarea v-model="customer.address" readonly class="w-full" />
                    </UFormField>
                </UForm>

            </UPageCard>
        </div>
    </div>
</template>
