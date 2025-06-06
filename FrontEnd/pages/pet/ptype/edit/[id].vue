<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { BreadcrumbItem } from '@nuxt/ui'
import Swal from 'sweetalert2'

const route = useRoute()

const items = ref<BreadcrumbItem[]>([
    { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
    { label: 'Pet Types', icon: 'i-lucide-dog', to: '/pet/ptype' },
    { label: 'Edit Pet Type', icon: 'i-lucide-pencil', to: `/pet/ptype/${route.params.id}/edit` }
])

definePageMeta({
    layout: 'navbar',
    middleware: 'auth'
})

interface PetType {
    id: number
    type_name: string
    description?: string
}

const form = ref({
    type_name: '',
    description: ''
})

const loading = ref(false)
const error = ref<string | null>(null)
const token = ref<string | null>(null)

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        navigateTo('/')
        return
    }

    try {
        const data = await $fetch<PetType>(`http://localhost:3001/ptypes/${route.params.id}`, {
            headers: {
                Authorization: `Bearer ${token.value}`
            }
        })
        form.value = {
            type_name: data.type_name,
            description: data.description || ''
        }
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to load pet type data'
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

    try {
        await $fetch(`http://localhost:3001/ptypes/${route.params.id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(form.value)
        })

        await Swal.fire({
            title: "Updated!",
            text: "Pet type has been updated successfully.",
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#00C16A"
        })

        navigateTo('/pet/ptype')
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to update pet type'
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
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Edit Pet Type</h1>
            <UBreadcrumb :items="items" />

            <UPageCard title="Edit Pet Type"
                description="Update the information for this pet type using the form below.">
                <UForm :state="form" :validate="validate" @submit.prevent="submitForm" class="space-y-4">
                    <UFormField label="Type Name" name="type_name" required>
                        <UInput v-model="form.type_name" placeholder="Enter pet type name" class="w-full" />
                    </UFormField>

                    <UFormField label="Description" name="description">
                        <UTextarea v-model="form.description" placeholder="Enter description (optional)"
                            class="w-full" />
                    </UFormField>

                    <div class="pt-4">
                        <UButton type="submit" label="Update Pet Type" class="w-full justify-center"
                            :loading="loading" />
                    </div>

                    <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
                </UForm>
            </UPageCard>
        </div>
    </div>
</template>
