<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'
import axios from 'axios'

definePageMeta({
    layout: 'navbar2',
    middleware: 'auth'
})

const router = useRouter()
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
    birth_date: string;
    breed_name: string;
    gender: string;
    owner_id: number;
    type_id: number;
    image_url: string;
    weight: number;
    createdAt: string;
    updatedAt: string;
    type?: {
        type_name: string;
    };
    owner?: {
        owner_id: number;
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
        address: string;
        createdAt: string;
        updatedAt: string;
    };
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
const allPets = ref<Pet[]>([]) // Store all pet data
const selectedPet = ref<Pet | null>(null) // Store selected pet details
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

// Watch for pet selection changes
watch(() => record.value.pet_id, async (newPetId) => {
    if (newPetId?.value) {
        const pet = allPets.value.find(p => p.pet_id === newPetId.value)
        if (pet) {
            selectedPet.value = pet
            // Fetch detailed pet information including owner
            await fetchPetDetails(newPetId.value)
        }
    } else {
        selectedPet.value = null
    }
})

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
        
        allPets.value = data
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

async function fetchPetDetails(petId: number) {
    try {
        if (!token.value) return
        
        const data = await $fetch<Pet>(`http://localhost:3001/pets/${petId}?include=owner`, {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        
        selectedPet.value = data
        console.log('Pet details:', data)
    } catch (err: unknown) {
        console.error('Error fetching pet details:', err)
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

    // Validate visit date format
    if (record.value.visit_date) {
        const visitDate = new Date(record.value.visit_date);
        if (isNaN(visitDate.getTime())) {
            errors.value.visit_date = 'Invalid visit date format';
        } else {
            // Check if visit date is in the future (more than current time)
            const now = new Date();
            if (visitDate > now) {
                errors.value.visit_date = 'Visit date cannot be in the future';
            }
        }
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
        // Use the visit_date directly since it now includes time
        const visitDateTime = new Date(record.value.visit_date).toISOString();
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

// Helper functions for displaying pet information (Enhanced from code 2)
function formatDate(dateString: string) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function formatAge(birthDateStr?: string) {
    if (!birthDateStr) return '-'
    const birth = new Date(birthDateStr)
    const today = new Date()

    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    let days = today.getDate() - birth.getDate()

    if (days < 0) {
        months -= 1
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        days += lastMonth.getDate()
    }

    if (months < 0) {
        years -= 1
        months += 12
    }

    let ageString = ''
    if (years > 0) ageString += `${years} years`
    if (months > 0) ageString += `${ageString ? ', ' : ''}${months} months`

    if (years === 0 && months === 0 && days > 0) {
        ageString = `${days} days`
    }

    return ageString || '0 days'
}

function calculateAge(birthDate: string) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

function formatPhoneNumber(phone: string | undefined): string {
    if (!phone) return 'Not provided';

    // ลบอักขระที่ไม่ใช่ตัวเลข
    const digits = phone.replace(/\D/g, '');

    // ตรวจสอบว่ามีตัวเลขครบ 10 ตัวหรือไม่
    if (digits.length !== 10) return phone; // ถ้าไม่ครบ 10 ตัว คืนค่าเดิม

    // จัดรูปแบบเป็น xxx-xxx-xxxx
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Get current datetime for max attribute (to prevent future dates)
const now = new Date();
const maxDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T23:59`;
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

            <div v-else class="space-y-6">
                <!-- Pet Selection -->
                <UPageCard title="Pet Selection" description="Select the pet for this medical record.">
                    <div class="space-y-4">
                        <UFormField label="Pet" required class="w-full" :error="errors.pet_id">
                            <USelectMenu v-model="record.pet_id" :items="petList" option-attribute="label" by="value"
                                placeholder="Select pet" class="w-full" />
                        </UFormField>
                    </div>
                </UPageCard>

                <!-- Enhanced Pet Information Display (from code 2) -->
                <div v-if="selectedPet" class="space-y-4">
                    <UPageCard title="Pet Details" description="Information about the selected pet." spotlight
                        spotlight-color="primary">
                        <div class="flex flex-col h-full">
                            <!-- แสดงรูปกับรายละเอียดข้างกัน -->
                            <div class="flex flex-col md:flex-row gap-6 flex-1">
                                <!-- รูปภาพ - 50% -->
                                <div class="w-full md:w-1/2 flex-shrink-0">
                                    <img v-if="selectedPet.image_url" 
                                         :src="selectedPet.image_url" 
                                         :alt="selectedPet.pet_name"
                                         class="rounded-lg object-cover border border-gray-300 w-full h-72" />
                                    <div v-else class="w-full h-72 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 border-2 border-dashed border-gray-300">
                                        <div class="text-center">
                                            <UIcon name="i-lucide-image" class="w-12 h-12 mx-auto mb-2" />
                                            <p>No image available</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- รายละเอียด - 50% -->
                                <div class="w-full md:w-1/2 space-y-4 text-gray-800">
                                    <!-- ชื่อและ ID -->
                                    <div>
                                        <h2 class="text-2xl font-bold flex items-center gap-3 flex-wrap">
                                            {{ selectedPet.pet_name }}
                                            <UBadge color="primary" variant="soft" class="font-bold rounded-full">
                                                ID: {{ selectedPet.pet_id }}
                                            </UBadge>
                                        </h2>
                                    </div>

                                    <!-- Grid ของข้อมูล -->
                                    <div class="space-y-4">
                                        <!-- Type และ Breed ในแถวเดียวกัน -->
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 class="font-semibold mb-1">Type</h3>
                                                <p class="text-sm text-gray-600">{{ selectedPet.type?.type_name || '-' }}</p>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold mb-1">Breed</h3>
                                                <p class="text-sm text-gray-600">{{ selectedPet.breed_name || '-' }}</p>
                                            </div>
                                        </div>

                                        <!-- Gender และ Owner ในแถวเดียวกัน -->
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 class="font-semibold mb-1">Gender</h3>
                                                <p class="text-sm text-gray-600">{{ selectedPet.gender || '-' }}</p>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold mb-1">Owner</h3>
                                                <p class="text-sm text-gray-600">
                                                    {{ selectedPet.owner ? `${selectedPet.owner.first_name} ${selectedPet.owner.last_name}` : '-' }}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Birthdate และ Age ในแถวเดียวกัน -->
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 class="font-semibold mb-1">Birthdate</h3>
                                                <p class="text-sm text-gray-600">{{ formatDate(selectedPet.birth_date) }}</p>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold mb-1">Age</h3>
                                                <p class="text-sm text-gray-600">{{ formatAge(selectedPet.birth_date) }}</p>
                                            </div>
                                        </div>

                                        <!-- Weight และ Phone ในแถวเดียวกัน -->
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 class="font-semibold mb-1">Weight</h3>
                                                <p class="text-sm text-gray-600">
                                                    {{ selectedPet.weight !== undefined ? `${selectedPet.weight.toFixed(1)} kg` : '-' }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </UPageCard>
                </div>

                <!-- Medical Record Form -->
                <UPageCard title="Medical Record Information"
                    description="Provide the necessary details for the new medical record.">
                    <form @submit.prevent="createRecord" class="space-y-4">
                        <!-- Visit Date with Time -->
                        <UFormField label="Visit Date" name="visit_date" class="w-full" :error="errors.visit_date">
                            <UInput v-model="record.visit_date" type="datetime-local" :max="maxDateTime"
                                class="w-full" />
                        </UFormField>

                        <!-- Vet - Show automatically detected veterinarian -->
                        <UFormField label="Veterinarian" class="w-full">
                            <UInput :value="vetName || 'Loading...'" disabled class="w-full" />
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