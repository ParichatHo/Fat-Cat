<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'
import { navigateTo } from '#app'

const items = ref<BreadcrumbItem[]>([
    { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
    { label: 'Add New Pet', icon: 'i-lucide-dog', to: '/pet/create' }
])

definePageMeta({
    layout: 'navbar',
    middleware: 'auth'
})

type SelectOption<T> = { label: string; value: T }

const petTypesExtra = ref<SelectOption<number>[]>([])
const ownersExtra = ref<SelectOption<number>[]>([])
const genderOptions: SelectOption<string>[] = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
]

const form = ref({
    pet_name: '',
    birth_date: '',
    breed_name: '',
    gender: undefined as SelectOption<string> | undefined,
    owner_id: undefined as SelectOption<number> | undefined,
    type_id: undefined as SelectOption<number> | undefined,
    image_url: '',
    weight: ''
})

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const token = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null) // เพิ่มตัวแปรสำหรับเก็บ URL ของ image preview
const errors = ref<Record<string, string>>({})

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        navigateTo('/')
        return
    }

    try {
        const typesData = await $fetch<{ type_id: number; type_name: string }[]>('http://localhost:3001/ptypes', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        petTypesExtra.value = typesData.map((type) => ({
            label: type.type_name,
            value: type.type_id
        }))

        const ownersData = await $fetch<{ owner_id: number; first_name: string; last_name: string }[]>('http://localhost:3001/owners', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        ownersExtra.value = ownersData.map((owner) => ({
            label: `${owner.first_name} ${owner.last_name}`,
            value: owner.owner_id
        }))
    } catch (err) {
        error.value = 'Failed to load pet types or owners. Please try again.'
        console.error('Failed to load data', err)
    }
})

function validate(): boolean {
    errors.value = {}
    if (!form.value.pet_name) errors.value.pet_name = 'Required'
    if (!form.value.birth_date) errors.value.birth_date = 'Required'
    if (!form.value.breed_name) errors.value.breed_name = 'Required'
    if (!form.value.gender?.value) errors.value.gender = 'Required'
    if (!form.value.owner_id?.value) errors.value.owner_id = 'Required'
    if (!form.value.type_id?.value) errors.value.type_id = 'Required'
    if (!selectedFile.value) errors.value.image_file = 'Required'
    if (!form.value.weight) errors.value.weight = 'Required'
    else if (isNaN(Number(form.value.weight)) || Number(form.value.weight) <= 0) errors.value.weight = 'Must be a positive number'
    return Object.keys(errors.value).length === 0
}

function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0] || null

    if (file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            error.value = 'Please select a valid image file (JPEG, JPG, PNG, WebP)'
            selectedFile.value = null
            imagePreview.value = null
            target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            error.value = 'Image file size must be less than 5MB'
            selectedFile.value = null
            imagePreview.value = null
            target.value = ''
            return
        }

        error.value = null
        selectedFile.value = file

        // สร้าง image preview
        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    } else {
        selectedFile.value = null
        imagePreview.value = null
    }
}

function removeImage() {
    selectedFile.value = null
    imagePreview.value = null
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
        fileInput.value = ''
    }
}

async function submitForm() {
    if (!validate()) {
        return
    }
    loading.value = true
    error.value = null
    success.value = false

    try {
        const formData = new FormData()
        formData.append('pet_name', form.value.pet_name)
        formData.append('birth_date', form.value.birth_date)
        formData.append('breed_name', form.value.breed_name)
        formData.append('gender', form.value.gender?.value || '')
        formData.append('owner_id', form.value.owner_id?.value?.toString() || '')
        formData.append('type_id', form.value.type_id?.value?.toString() || '')
        formData.append('weight', form.value.weight)
        if (selectedFile.value) {
            formData.append('image_file', selectedFile.value)
        }

        await $fetch('http://localhost:3001/pets', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token.value}`,
            },
            body: formData,
        })

        success.value = true
        await Swal.fire({
            title: 'Success!',
            text: 'Pet has been added successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00C16A',
        })

        // รีเซ็ตฟอร์ม
        form.value = {
            pet_name: '',
            birth_date: '',
            breed_name: '',
            gender: undefined,
            owner_id: undefined,
            type_id: undefined,
            image_url: '',
            weight: '',
        }
        selectedFile.value = null
        imagePreview.value = null
        errors.value = {}
        navigateTo('/pet')
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to add pet'
        console.error('Submit error:', err)
    } finally {
        loading.value = false
    }
}

const today = new Date().toISOString().split('T')[0] // yyyy-mm-dd

</script>

<template>
    <div class="p-6 mx-auto" style="max-width: 750px;">
        <div class="space-y-6">
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Add New Pet</h1>
            <UBreadcrumb :items="items" />
            <UPageCard title="Add New Pet" description="Fill in the form to add a new pet">
                <form @submit.prevent="submitForm" class="space-y-4">
                    <div class="flex gap-4">
                        <UFormField label="Pet Name" required class="flex-1" :error="errors.pet_name">
                            <UInput v-model="form.pet_name" placeholder="Pet name" class="w-full" />
                        </UFormField>
                        <UFormField label="Birth Date" required class="flex-1" :error="errors.birth_date">
                            <UInput v-model="form.birth_date" type="date" :max="today" class="w-full" />
                        </UFormField>

                    </div>
                    <div class="flex gap-4">
                        <UFormField label="Pet Type" required class="flex-1" :error="errors.type_id">
                            <USelectMenu v-model="form.type_id" :items="petTypesExtra" option-attribute="label"
                                by="value" placeholder="Select pet type" class="w-full" />
                        </UFormField>
                        <UFormField label="Breed" required class="flex-1" :error="errors.breed_name">
                            <UInput v-model="form.breed_name" placeholder="Breed" class="w-full" />
                        </UFormField>
                    </div>
                    <div class="flex gap-4">
                        <UFormField label="Gender" required class="flex-1" :error="errors.gender">
                            <USelectMenu v-model="form.gender" :items="genderOptions" option-attribute="label"
                                by="value" placeholder="Select gender" class="w-full" />
                        </UFormField>
                        <UFormField label="Weight (kg)" required class="flex-1" :error="errors.weight">
                            <UInput v-model="form.weight" type="number" min="0" step="0.1" placeholder="Weight in kg"
                                class="w-full" />
                        </UFormField>
                        <UFormField label="Owner" required class="flex-1" :error="errors.owner_id">
                            <USelectMenu v-model="form.owner_id" :items="ownersExtra" option-attribute="label"
                                by="value" placeholder="Select owner" class="w-full" />
                        </UFormField>
                    </div>
                    <div class="space-y-4">
                        <UFormField label="Pet Image" required :error="errors.image_file">
                            <UInput type="file" name="image_file" accept="image/jpeg,image/jpg,image/png,image/webp"
                                @change="handleFileChange" class="w-full" />
                            <div class="text-sm text-gray-500 mt-1">
                                Supported formats: JPEG, JPG, PNG, WebP (Max size: 5MB)
                            </div>
                        </UFormField>
                        <div v-if="imagePreview" class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Image Preview:</label>
                            <div class="relative inline-block">
                                <img :src="imagePreview" alt="Pet preview"
                                    class="w-32 h-32 object-cover rounded-lg border border-gray-300" />
                                <button type="button" @click="removeImage"
                                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="pt-4">
                        <UButton type="submit" label="Add Pet" class="w-full justify-center" :loading="loading"
                            :disabled="loading" />
                    </div>
                    <div v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</div>
                    <div v-if="success" class="text-green-600 text-sm font-medium mt-2">Pet added successfully!</div>
                </form>
            </UPageCard>
        </div>
    </div>
</template>