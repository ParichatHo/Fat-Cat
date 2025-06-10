<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'
import axios from 'axios'

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

// Define error interface for better type safety
interface ApiError {
    message?: string;
    data?: {
        message?: string;
    };
    response?: {
        data?: {
            message?: string;
        };
    };
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
    vet_id: undefined as number | null | undefined, // Allow null for not found case
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
    { label: 'Create New Record', icon: 'i-lucide-plus', to: '/medicalRecord/create' }
])

// Helper function to extract error message
function extractErrorMessage(err: unknown): string {
    if (err && typeof err === 'object') {
        const apiError = err as ApiError;
        return apiError.data?.message ||
            apiError.response?.data?.message ||
            apiError.message ||
            'An unknown error occurred';
    }
    if (typeof err === 'string') {
        return err;
    }
    return 'An unknown error occurred';
}

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        toast.add({ title: 'Please log in to continue', color: 'error' })
        return navigateTo('/login')
    }

    try {
        // Fetch user info to get veterinarian name
        const userData = localStorage.getItem('user');
        const email = userData ? JSON.parse(userData).email : null;
        if (!email) {
            throw new Error('User email not found');
        }

        console.log('Fetching user info for email:', email);
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

        console.log('User info response:', userResponse.data);

        // Set veterinarian name
        vetName.value = userResponse.data.full_name || 'Unknown Veterinarian';

        // Try to get vet_id from veterinarians API
        console.log('Fetching veterinarians list to find vet_id...');
        try {
            const vetsResponse = await axios.get('http://localhost:3001/vets', {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Veterinarians response:', vetsResponse.data);

            // Find the vet that matches the current user's email
            const currentVet = vetsResponse.data.find((vet: Vet) =>
                vet.user.email === email
            );

            if (currentVet) {
                record.value.vet_id = currentVet.vet_id;
                console.log('Found vet_id:', record.value.vet_id);
            } else {
                console.warn('Current user not found in veterinarians list');
                record.value.vet_id = null;
            }
        } catch (vetError) {

            console.error('Error fetching veterinarians:', vetError);
        }

        console.log('Final vet_id:', record.value.vet_id);

        // Fetch pets
        await fetchPets();
    } catch (err: unknown) {
        console.error('Error in onMounted:', err);
        const errorMessage = extractErrorMessage(err);
        error.value = errorMessage;
        toast.add({
            title: 'Error',
            description: errorMessage,
            color: 'error'
        });
    }
})

async function fetchPets() {
    try {
        // Add null check for token
        if (!token.value) {
            throw new Error('Authentication token not available');
        }

        const data = await $fetch<Pet[]>('http://localhost:3001/pets', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        petList.value = data.map(pet => ({
            label: pet.pet_name,
            value: pet.pet_id
        }))
        console.log('Pets data:', petList.value)
    } catch (err: unknown) {
        console.error('Error fetching pets:', err)
        toast.add({
            title: 'Error',
            description: 'Failed to load pets',
            color: 'error'
        })
    }
}

function validate(): boolean {
    console.log('=== Validation started ===');
    errors.value = {}

    console.log('pet_id:', record.value.pet_id);
    console.log('vet_id:', record.value.vet_id);
    console.log('visit_date:', record.value.visit_date);

    if (!record.value.pet_id?.value) errors.value.pet_id = 'Required'
    if (!record.value.visit_date) errors.value.visit_date = 'Required'

    if (record.value.vet_id === null) {
        console.warn('vet_id is null - veterinarian not found in system');
        errors.value.vet_id = 'Your account is not set up as a veterinarian. Please contact administrator.';
    } else if (record.value.vet_id === undefined) {
        console.warn('vet_id is undefined - still loading');
        errors.value.vet_id = 'Still loading veterinarian information. Please wait...';
    }

    // Validate appointment date if provided
    if (record.value.appointment_date) {
        const appointmentDate = new Date(record.value.appointment_date)
        if (isNaN(appointmentDate.getTime())) {
            errors.value.appointment_date = 'Invalid appointment date format'
        } else if (record.value.visit_date) {
            const visitDate = new Date(record.value.visit_date)
            if (!isNaN(visitDate.getTime()) && appointmentDate < visitDate) {
                errors.value.appointment_date = 'Appointment date cannot be before visit date'
            }
        }
    }

    console.log('Validation errors:', errors.value);
    const isValid = Object.keys(errors.value).length === 0;
    console.log('Validation result:', isValid);

    return isValid;
}

async function createRecord() {
    console.log('=== createRecord function called ===');
    console.log('Current record data:', record.value);

    if (!validate()) {
        console.log('Validation failed:', errors.value);
        toast.add({
            title: 'Error',
            description: 'Please fill in all required fields',
            color: 'error'
        });
        return;
    }
    console.log('Validation passed');

    // Additional check for vet_id
    if (!record.value.vet_id) {
        console.log('vet_id is missing:', record.value.vet_id);
        toast.add({
            title: 'Error',
            description: 'Unable to determine veterinarian. Please refresh the page and try again.',
            color: 'error'
        });
        return;
    }
    console.log('vet_id check passed:', record.value.vet_id);

    // Check if token is available
    if (!token.value) {
        toast.add({
            title: 'Error',
            description: 'Authentication token not available. Please log in again.',
            color: 'error'
        });
        return;
    }

    loading.value = true;
    error.value = null;
    console.log('Starting API call...');

    try {
        const visitDateTime = new Date(record.value.visit_date + 'T00:00:00.000Z').toISOString();
        let appointmentDateTime = undefined;
        if (record.value.appointment_date) {
            appointmentDateTime = new Date(record.value.appointment_date).toISOString();
        }

        const payload = {
            pet_id: record.value.pet_id?.value,
            vet_id: record.value.vet_id,
            visit_date: visitDateTime,
            symptoms: record.value.symptoms || '',
            diagnosis: record.value.diagnosis || '',
            treatment: record.value.treatment || '',
            medication: record.value.medication || '',
            notes: record.value.notes || '',
            appointment_date: appointmentDateTime,
            status: record.value.status?.value
        };

        console.log('Sending payload:', payload);
        console.log('Token:', token.value ? 'Present' : 'Missing');

        const response = await $fetch('http://localhost:3001/recs', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('API Response:', response);

        toast.add({
            title: 'Medical Record Created',
            description: 'New medical record has been created successfully.',
            color: 'success'
        });

        await Swal.fire({
            title: 'Success!',
            text: 'Medical record has been created successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00C16A'
        });

        console.log('Navigating to /medicalRecord');
        router.push('/medicalRecord');
    } catch (err: unknown) {
        console.error('=== API Error Details ===');
        console.error('Error object:', err);

        const errorMessage = extractErrorMessage(err);
        console.error('Extracted error message:', errorMessage);

        error.value = errorMessage;
        toast.add({
            title: 'Error',
            description: errorMessage,
            color: 'error'
        });
    } finally {
        loading.value = false;
        console.log('=== createRecord function completed ===');
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

            <div v-if="petList.length === 0 && !loading && !error"
                class="text-yellow-600 text-sm bg-yellow-50 p-4 rounded-md">
                <p>No pets available. Please ensure the API is running.</p>
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
                            <USelectMenu v-model="record.pet_id" :items="petList" option-attribute="label" by="value"
                                placeholder="Select pet" class="w-full" />
                        </UFormField>

                        <!-- Vet - Show automatically detected veterinarian -->
                        <UFormField label="Veterinarian" class="w-full">
                            <UInput :value="vetName || 'Loading...'" disabled class="w-full" />
                            <template #hint>
                                <span class="text-xs text-gray-500">
                                    Automatically detected from your login session
                                </span>
                            </template>
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