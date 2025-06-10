<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
    layout: 'navbar2',
    middleware: 'auth'
})

const router = useRouter()
const route = useRoute()
const toast = useToast()

type SelectOption<T> = { label: string; value: T }

    interface Vet {
    vet_id: number;
    license_number: string;
    experience: number;
    education: string;
    user_id: number;
    user: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        role: string;
        image_url?: string;
    };
}

interface Pet {
    pet_id: number;
    pet_name: string;
}

const petList = ref<SelectOption<number>[]>([])
const vetList = ref<SelectOption<number>[]>([])

const items = ref<BreadcrumbItem[]>([
    { label: 'Medical Records', icon: 'i-lucide-file-text', to: '/medicalRecord' },
    { label: 'Create New Record', icon: 'i-lucide-plus', to: '/medicalRecord/create' }
])

const record = ref({
    pet_id: undefined as SelectOption<number> | undefined,
    vet_id: undefined as SelectOption<number> | undefined,
    visit_date: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medication: '',
    notes: ''
})

const loading = ref(false)
const error = ref<string | null>(null)
const token = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        toast.add({ title: 'Please log in to continue', color: 'error' })
        return navigateTo('/login')
    }

    await Promise.all([fetchPets(), fetchVets()])
})

async function fetchPets() {
    try {
        const data = await $fetch<Pet[]>('http://localhost:3001/pets', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        petList.value = data.map(pet => ({
            label: pet.pet_name,
            value: pet.pet_id
        }))
        console.log('Pets data:', petList.value)
    } catch (err: any) {
        console.error('Error fetching pets:', err)
        toast.add({
            title: 'Error',
            description: 'Failed to load pets',
            color: 'error'
        })
    }
}

async function fetchVets() {
    loading.value = true
    try {
        const data = await $fetch<Vet[]>('http://localhost:3001/vets', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        console.log('Vets data:', data)
        
        // แก้ไขการ map ข้อมูลให้เข้าถึง first_name และ last_name จาก user object
        vetList.value = data.map(vet => ({
            label: `${vet.user.first_name} ${vet.user.last_name}`,
            value: vet.vet_id
        }))
        console.log('Mapped vetList:', vetList.value)
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to load veterinarians'
        console.error('API Error Details:', err)
        toast.add({
            title: 'Error',
            description: error.value || 'Unknown error occurred',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

function validate(): boolean {
    errors.value = {}
    if (!record.value.pet_id?.value) errors.value.pet_id = 'Required'
    if (!record.value.vet_id?.value) errors.value.vet_id = 'Required'
    if (!record.value.visit_date) errors.value.visit_date = 'Required'
    return Object.keys(errors.value).length === 0
}

async function createRecord() {
    if (!validate()) {
        toast.add({
            title: 'Error',
            description: 'Please fill in all required fields',
            color: 'error'
        })
        return
    }

    loading.value = true
    error.value = null

    try {
        // Convert date string to ISO DateTime format
        const visitDateTime = new Date(record.value.visit_date + 'T00:00:00.000Z').toISOString()
        
        const payload = {
            pet_id: record.value.pet_id?.value,
            vet_id: record.value.vet_id?.value,
            visit_date: visitDateTime, // Send as ISO DateTime
            symptoms: record.value.symptoms,
            diagnosis: record.value.diagnosis,
            treatment: record.value.treatment,
            medication: record.value.medication,
            notes: record.value.notes
        }

        await $fetch('http://localhost:3001/recs', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        toast.add({
            title: 'Medical Record Created',
            description: 'New medical record has been created successfully.',
            color: 'success'
        })
        await Swal.fire({
            title: 'Success!',
            text: 'Medical record has been created successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00C16A'
        })

        router.push('/medicalRecord')
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Failed to create medical record'
        console.error('API Error:', err)
        toast.add({
            title: 'Error',
            description: error.value || 'Unknown error occurred',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
const today = new Date().toISOString().split('T')[0]
</script>

<template>
    <div class="p-6 mx-auto" style="max-width: 750px;">
        <div class="space-y-6">
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Create Medical Record</h1>
            <UBreadcrumb :items="items" />

            <div v-if="loading" class="text-center py-10">
                <div class="text-gray-500">Loading...</div>
            </div>

            <div v-else-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-4 rounded-md">
                {{ error }}
            </div>

            <div v-if="vetList.length === 0 && !loading && !error" class="text-yellow-600 text-sm">
                No veterinarians available. Please check the API.
            </div>

            <div v-else>
                <UPageCard title="Medical Record Information"
                    description="Provide the necessary details for the new medical record.">
                    <form @submit.prevent="createRecord" class="space-y-4">
                        <!-- Visit Date -->
                        <UFormField label="Visit Date" required class="w-full" :error="errors.visit_date">
                            <UInput v-model="record.visit_date" type="date" :max="today" class="w-full" />
                        </UFormField>

                        <!-- Pet -->
                        <UFormField label="Pet" required class="w-full" :error="errors.pet_id">
                            <USelectMenu v-model="record.pet_id" :items="petList" option-attribute="label"
                                by="value" placeholder="Select pet" class="w-full" />
                        </UFormField>

                        <!-- Vet -->
                        <UFormField label="Veterinarian" required class="w-full" :error="errors.vet_id">
                            <USelectMenu v-model="record.vet_id" :items="vetList" option-attribute="label"
                                by="value" placeholder="Select veterinarian" class="w-full" />
                        </UFormField>

                        <!-- Symptoms -->
                        <UFormField label="Symptoms" name="symptoms" class="w-full">
                            <UTextarea v-model="record.symptoms" class="w-full" />
                        </UFormField>

                        <!-- Diagnosis -->
                        <UFormField label="Diagnosis" name="diagnosis" class="w-full">
                            <UTextarea v-model="record.diagnosis" class="w-full" />
                        </UFormField>

                        <!-- Treatment -->
                        <UFormField label="Treatment" name="treatment" class="w-full">
                            <UTextarea v-model="record.treatment" class="w-full" />
                        </UFormField>

                        <!-- Medication -->
                        <UFormField label="Medication" name="medication" class="w-full">
                            <UTextarea v-model="record.medication" class="w-full" />
                        </UFormField>

                        <!-- Notes -->
                        <UFormField label="Additional Notes" name="notes" class="w-full">
                            <UTextarea v-model="record.notes" class="w-full" />
                        </UFormField>

                        <div class="flex justify-end gap-4">
                            <UButton type="submit" label="Save Record" icon="i-lucide-save" color="primary"
                                :loading="loading" :disabled="loading" />
                        </div>
                    </form>
                </UPageCard>
            </div>
        </div>
    </div>
</template>