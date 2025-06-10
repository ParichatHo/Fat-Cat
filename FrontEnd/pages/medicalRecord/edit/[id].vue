<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'
import axios from 'axios' // Add axios for /user/info request

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

interface MedicalRecord {
    record_id: number;
    pet_id: number;
    vet_id: number;
    visit_date: string;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    medication: string;
    notes: string;
    appointment_date?: string;
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    pet: Pet;
    vet: Vet;
}

const petList = ref<SelectOption<number>[]>([])
const statusOptions = ref<SelectOption<string>[]>([
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
])
const vetName = ref<string>('') // Store veterinarian name from /user/info
const record = ref({
    pet_id: undefined as SelectOption<number> | undefined,
    vet_id: undefined as number | undefined, // Store vet_id directly as a number
    visit_date: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medication: '',
    notes: '',
    appointment_date: '' as string | undefined,
    status: undefined as SelectOption<string> | undefined
})
const loading = ref(false)
const error = ref<string | null>(null)
const token = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const items = ref<BreadcrumbItem[]>([
    { label: 'Medical Records', icon: 'i-lucide-file-text', to: '/medicalRecord' },
    { label: 'Edit Record', icon: 'i-lucide-edit', to: `/medicalRecord/edit/${route.params.id}` }
])

onMounted(async () => {
    token.value = localStorage.getItem('authToken');
    if (!token.value) {
        toast.add({ title: 'Please log in to continue', color: 'error' });
        return navigateTo('/login');
    }
    try {
        // Fetch user info first to get veterinarian name
        const userData = localStorage.getItem('user');
        const email = userData ? JSON.parse(userData).email : null;
        if (!email) {
            throw new Error('User email not found');
        }
        const userResponse = await axios.post(
            'http://localhost:3001/user/info',
            { email },
            {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        vetName.value = userResponse.data.full_name || 'Unknown Veterinarian';

        // Fetch pets and record (skip fetchVets since we don’t need the dropdown)
        await Promise.all([fetchPets()]).then(fetchRecord);
    } catch (err: any) {
        console.error('Error in onMounted:', err);
        error.value = err.message || 'Failed to initialize data';
        toast.add({
            title: 'Error',
            description: error.value ?? 'Failed to load pets', // Use fallback
            color: 'error'
        })
    }
});

async function fetchPets() {
    try {
        const data = await $fetch<Pet[]>('http://localhost:3001/pets', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        petList.value = data.map(pet => ({
            label: pet.pet_name,
            value: pet.pet_id
        }))
    } catch (err: any) {
        console.error('Error fetching pets:', err)
        toast.add({
            title: 'Error',
            description: 'Failed to load pets',
            color: 'error'
        })
    }
}

async function fetchRecord() {
    loading.value = true
    error.value = null

    try {
        const recordId = route.params.id
        if (!recordId || typeof recordId !== 'string' || isNaN(Number(recordId))) {
            error.value = 'Invalid record ID';
            toast.add({ title: 'Error', description: 'Invalid record ID', color: 'error' });
            return;
        }

        const data = await $fetch<MedicalRecord>(`http://localhost:3001/recs/${recordId}`, {
            headers: {
                Authorization: `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            }
        })

        if (!data) {
            throw new Error('Medical record not found');
        }

        const petOption = petList.value.find(p => p.value === data.pet_id) ||
            { label: data.pet?.pet_name || 'Unknown Pet', value: data.pet_id };

        const statusOption = data.status ?
            statusOptions.value.find(s => s.value === data.status) ||
            { label: data.status, value: data.status } : undefined;

        if (!petList.value.find(p => p.value === data.pet_id)) {
            petList.value.push(petOption);
        }
        if (statusOption && !statusOptions.value.find(s => s.value === data.status)) {
            statusOptions.value.push(statusOption);
        }

        record.value = {
            pet_id: petOption,
            vet_id: data.vet_id, // Set vet_id directly
            visit_date: formatDateForInput(data.visit_date),
            symptoms: data.symptoms || '',
            diagnosis: data.diagnosis || '',
            treatment: data.treatment || '',
            medication: data.medication || '',
            notes: data.notes || '',
            appointment_date: formatDateTimeForInput(data.appointment_date),
            status: statusOption
        }

    } catch (err: any) {
        console.error('Error in fetchRecord:', err);
        error.value = err.status === 404 ? 'Medical record not found' :
            err.status === 401 ? 'Authentication failed' :
                err.status === 403 ? 'Permission denied' :
                    err.message || 'Failed to load medical record';
        toast.add({
            title: 'Error Loading Record',
            description: error.value ?? 'Unknown error occurred',
            color: 'error'
        });
        if (err.status === 401) {
            localStorage.removeItem('authToken');
            navigateTo('/login');
        }
    } finally {
        loading.value = false
    }
}

function validate(): boolean {
    errors.value = {};

    if (!record.value.pet_id?.value) {
        errors.value.pet_id = 'Pet selection is required';
    }

    if (!record.value.vet_id) { // Validate vet_id directly
        errors.value.vet_id = 'Veterinarian is required';
    }

    if (!record.value.visit_date) {
        errors.value.visit_date = 'Visit date is required';
    } else {
        const visitDate = new Date(record.value.visit_date);
        if (isNaN(visitDate.getTime())) {
            errors.value.visit_date = 'Invalid visit date format';
        } else if (visitDate > new Date()) {
            errors.value.visit_date = 'Visit date cannot be in the future';
        }
    }

    if (record.value.appointment_date) {
        const appointmentDate = new Date(record.value.appointment_date);
        if (isNaN(appointmentDate.getTime())) {
            errors.value.appointment_date = 'Invalid appointment date format';
        } else if (record.value.visit_date) {
            const visitDate = new Date(record.value.visit_date);
            if (!isNaN(visitDate.getTime()) && appointmentDate < visitDate) {
                errors.value.appointment_date = 'Appointment date cannot be before visit date';
            }
        }
    }

    if (record.value.symptoms && record.value.symptoms.trim() === '') {
        errors.value.symptoms = 'Symptoms cannot be empty if provided';
    }

    return Object.keys(errors.value).length === 0;
}

async function updateRecord() {
    if (!validate()) {
        toast.add({
            title: 'Validation Error',
            description: 'Please correct the errors',
            color: 'error'
        })
        return
    }

    loading.value = true
    error.value = null

    try {
        let visitDateTime: string;
        try {
            visitDateTime = new Date(record.value.visit_date + 'T00:00:00.000Z').toISOString();
        } catch (dateError) {
            throw new Error('Invalid visit date format');
        }

        let appointmentDateTime: string | undefined;
        if (record.value.appointment_date) {
            try {
                appointmentDateTime = new Date(record.value.appointment_date).toISOString();
            } catch (dateError) {
                throw new Error('Invalid appointment date format');
            }
        }

        const payload = {
            pet_id: record.value.pet_id?.value,
            vet_id: record.value.vet_id, // Use vet_id directly
            visit_date: visitDateTime,
            symptoms: record.value.symptoms || '',
            diagnosis: record.value.diagnosis || '',
            treatment: record.value.treatment || '',
            medication: record.value.medication || '',
            notes: record.value.notes || '',
            appointment_date: appointmentDateTime,
            status: record.value.status?.value
        }

        await $fetch(`http://localhost:3001/recs/${route.params.id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        toast.add({
            title: 'Success',
            description: 'Medical record updated',
            color: 'success'
        })

        await Swal.fire({
            title: 'Success!',
            text: 'Medical record has been updated successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00C16A'
        })

        router.push('/medicalRecord')
    } catch (err: any) {
        console.error('Error updating record:', err);
        error.value = err?.data?.message || err.message || 'Failed to update medical record'
        toast.add({
            title: 'Update Failed',
            description: error.value ?? 'Unknown error occurred',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

async function retryFetchRecord() {
    error.value = null
    await fetchRecord()
}

const today = new Date().toISOString().split('T')[0]

function formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string:', dateString);
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return '';
    }
}

function formatDateTimeForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid datetime string:', dateString);
            return '';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
        console.error('Error formatting datetime:', error, dateString);
        return '';
    }
}
</script>

<template>
    <div class="p-6 mx-auto" style="max-width: 750px;">
        <div class="space-y-6">
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Edit Medical Record</h1>
            <UBreadcrumb :items="items" />

            <div v-if="loading" class="text-center py-10">
                <div class="flex flex-col items-center space-y-2">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div class="text-gray-500">Loading medical record...</div>
                </div>
            </div>

            <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-sm font-medium text-red-800">Error Loading Record</h3>
                        <p class="mt-1 text-sm text-red-700">{{ error }}</p>
                        <div class="mt-3">
                            <UButton @click="retryFetchRecord" size="sm" color="error" variant="outline">
                                Try Again
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="petList.length === 0 && !loading && !error"
                class="text-yellow-600 text-sm bg-yellow-50 p-4 rounded-md">
                <p>No pets available. Please ensure the API is running.</p>
            </div>

            <div v-else-if="!loading && !error">
                <UPageCard title="Edit Medical Record Information"
                    description="Update the details for the medical record.">
                    <form @submit.prevent="updateRecord" class="space-y-4">

                        <!-- Visit Date -->
                        <UFormField label="Visit Date" required class="w-full" :error="errors.visit_date">
                            <UInput v-model="record.visit_date" type="date" :max="today" class="w-full" />
                        </UFormField>

                        <!-- Pet -->
                        <UFormField label="Pet" required class="w-full" :error="errors.pet_id">
                            <USelectMenu v-model="record.pet_id" :items="petList" option-attribute="label" by="value"
                                placeholder="Select pet" class="w-full" />
                        </UFormField>

                        <!-- Vet -->
                        <UFormField label="Veterinarian" required class="w-full" :error="errors.vet_id">
                            <UInput :value="vetName" disabled class="w-full" />
                        </UFormField>

                        <!-- Symptoms -->
                        <UFormField label="Symptoms" name="symptoms" class="w-full">
                            <UTextarea v-model="record.symptoms" class="w-full"
                                placeholder="Describe the symptoms..." />
                        </UFormField>

                        <!-- Diagnosis -->
                        <UFormField label="Diagnosis" name="diagnosis" class="w-full">
                            <UTextarea v-model="record.diagnosis" class="w-full" placeholder="Enter diagnosis..." />
                        </UFormField>

                        <!-- Treatment -->
                        <UFormField label="Treatment" name="treatment" class="w-full">
                            <UTextarea v-model="record.treatment" class="w-full"
                                placeholder="Describe treatment plan..." />
                        </UFormField>

                        <!-- Medication -->
                        <UFormField label="Medication" name="medication" class="w-full">
                            <UTextarea v-model="record.medication" class="w-full" placeholder="List medications..." />
                        </UFormField>

                        <!-- Notes -->
                        <UFormField label="Additional Notes" name="notes" class="w-full">
                            <UTextarea v-model="record.notes" class="w-full" placeholder="Any additional notes..." />
                        </UFormField>

                        <!-- Appointment Date -->
                        <UFormField label="Appointment Date" class="w-full" :error="errors.appointment_date">
                            <UInput v-model="record.appointment_date" type="datetime-local" class="w-full"
                                placeholder="Select appointment date and time (optional)" />
                        </UFormField>

                        <!-- Status -->
                        <UFormField label="Appointment Status" class="w-full">
                            <USelectMenu v-model="record.status" :items="statusOptions" option-attribute="label"
                                by="value" placeholder="Select status (optional)" class="w-full" clearable />
                        </UFormField>

                        <div class="flex justify-end gap-4 pt-4">
                            <UButton type="button" label="Cancel" color="neutral" variant="outline"
                                @click="router.push('/medicalRecord')" />
                            <UButton type="submit" label="Update Record" icon="i-lucide-save" color="primary"
                                :loading="loading" :disabled="loading" />
                        </div>
                    </form>
                </UPageCard>
            </div>
        </div>
    </div>
</template>