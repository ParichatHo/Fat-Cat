<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import type { BreadcrumbItem } from '@nuxt/ui'
import { navigateTo } from '#app'

const items = ref<BreadcrumbItem[]>([
    { label: 'Users', icon: 'i-lucide-users', to: '/user' },
    { label: 'Create User', icon: 'i-lucide-user-plus', to: '/user/create' }
])

definePageMeta({
    layout: 'navbar',
    middleware: 'auth'
})

type SelectOption<T> = { label: string; value: T }

const roleOptions: SelectOption<string>[] = [
    { label: 'Veterinarian', value: 'VETERINARIAN' },
    { label: 'Staff', value: 'STAFF' }
]

const form = ref({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    role: undefined as SelectOption<string> | undefined,
    password: '',
    confirm_password: '',
    image_url: '',
    // Veterinarian specific fields
    license_number: '',
    experience: '',
    education: ''
})

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const token = ref<string | null>(null)
const errors = ref<Record<string, string>>({})
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const phoneTouched = ref(false) // Track if phone field has been interacted with

// Computed property to check if selected role is veterinarian
const isVeterinarian = computed(() => {
    return form.value.role?.value === 'VETERINARIAN'
})

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
        navigateTo('/')
        return
    }
})

// ฟังก์ชันการจัดการหมายเลขโทรศัพท์
const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '') // ลบตัวเลขที่ไม่ใช่ตัวเลข
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

const handlePhoneInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const value = input.value
    const digits = value.replace(/\D/g, '') // เอาแค่ตัวเลข
    const limitedDigits = digits.slice(0, 10) // จำกัดจำนวนเป็น 10 ตัวเลข
    const formattedPhone = formatPhoneNumber(limitedDigits) // ฟอร์แมตหมายเลขโทรศัพท์
    form.value.phone = formattedPhone
    input.value = formattedPhone
    phoneTouched.value = true // ตั้งค่าว่ากรอกแล้ว
}

const handlePhoneKeydown = (event: KeyboardEvent) => {
    // ยอมรับแค่ Backspace, Delete, Tab, Escape, Enter
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true) ||
        (event.keyCode >= 35 && event.keyCode <= 39)) {
        return
    }
    // แค่ตัวเลข
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
        event.preventDefault()
    }
    // ห้ามกรอกเกิน 10 ตัว
    const currentDigits = form.value.phone.replace(/\D/g, '')
    if (currentDigits.length >= 10 && ![8, 46].includes(event.keyCode)) {
        event.preventDefault()
    }
}

const handlePhonePaste = (event: ClipboardEvent) => {
    event.preventDefault()
    const paste = event.clipboardData?.getData('text') || ''
    const digits = paste.replace(/\D/g, '').slice(0, 10)
    const formattedPhone = formatPhoneNumber(digits)
    form.value.phone = formattedPhone
    phoneTouched.value = true
}

const handleExperienceInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-numeric characters
    // Limit to a reasonable number of digits (e.g., 3 digits for years)
    value = value.slice(0, 3);
    form.value.experience = value;
    input.value = value;
};

const handleExperienceKeydown = (event: KeyboardEvent) => {
    // Allow: Backspace, Delete, Tab, Escape, Enter, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Home, End, Left, Right
    if (
        [8, 9, 27, 13, 46].includes(event.keyCode) ||
        (event.keyCode === 65 && event.ctrlKey) ||
        (event.keyCode === 67 && event.ctrlKey) ||
        (event.keyCode === 86 && event.ctrlKey) ||
        (event.keyCode === 88 && event.ctrlKey) ||
        (event.keyCode >= 35 && event.keyCode <= 39)
    ) {
        return;
    }
    // Allow only numeric keys (0-9)
    if (
        (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) &&
        (event.keyCode < 96 || event.keyCode > 105)
    ) {
        event.preventDefault();
    }
    // Prevent input if length is already 3 digits
    const currentValue = form.value.experience;
    if (currentValue.length >= 3 && ![8, 46].includes(event.keyCode)) {
        event.preventDefault();
    }
};

// Function to handle paste events for Experience
const handleExperiencePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '').slice(0, 3); // Keep only digits, max 3
    form.value.experience = digits;
};

function validate(): boolean {
    errors.value = {}

    // Validate first name
    if (!form.value.first_name.trim()) {
        errors.value.first_name = 'First name is required'
    }

    // Validate last name
    if (!form.value.last_name.trim()) {
        errors.value.last_name = 'Last name is required'
    }

    // Validate phone
    if (!form.value.phone) {
        errors.value.phone = 'Phone number is required'
    } else if (phoneTouched.value && form.value.phone.length > 0 && !/^\d{3}-\d{3}-\d{4}$/.test(form.value.phone)) {
        errors.value.phone = 'Phone number must be in the format 080-123-4569'
    }

    // Validate email
    if (!form.value.email.trim()) {
        errors.value.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'Please enter a valid email address'
    }

    // Validate role
    if (!form.value.role?.value) {
        errors.value.role = 'Role is required'
    }

    // Validate password
    if (!form.value.password) {
        errors.value.password = 'Password is required'
    } else if (form.value.password.length < 6) {
        errors.value.password = 'Password must be at least 6 characters long'
    }

    // Validate confirm password
    if (!form.value.confirm_password) {
        errors.value.confirm_password = 'Please confirm your password'
    } else if (form.value.password !== form.value.confirm_password) {
        errors.value.confirm_password = 'Passwords do not match'
    }

    // Validate veterinarian specific fields
    if (isVeterinarian.value) {
        if (!form.value.license_number.trim()) {
            errors.value.license_number = 'License number is required for veterinarians'
        }

        if (!form.value.experience.trim()) {
            errors.value.experience = 'Experience is required for veterinarians'
        }

        if (!form.value.education.trim()) {
            errors.value.education = 'Education is required for veterinarians'
        }
    }

    return Object.keys(errors.value).length === 0
}

function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0] || null

    if (file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            error.value = 'Please select a valid image file (JPEG, JPG, PNG, WebP)'
            imageFile.value = null
            imagePreview.value = null
            target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            error.value = 'Image file size must be less than 5MB'
            imageFile.value = null
            imagePreview.value = null
            target.value = ''
            return
        }

        error.value = null
        imageFile.value = file
        console.log('Selected file:', file.name, file.type, file.size)

        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    } else {
        imageFile.value = null
        imagePreview.value = null
    }
}

function removeImage() {
    imageFile.value = null
    imagePreview.value = null
    form.value.image_url = ''

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
        fileInput.value = ''
    }

    console.log('Image removed')
}

// Clear veterinarian fields when role changes to STAFF
function handleRoleChange() {
    if (form.value.role?.value !== 'VETERINARIAN') {
        form.value.license_number = ''
        form.value.experience = ''
        form.value.education = ''
        // Clear veterinarian field errors
        delete errors.value.license_number
        delete errors.value.experience
        delete errors.value.education
    }
}

async function submitForm() {
    phoneTouched.value = true // Ensure validation is triggered on submit

    if (!validate()) {
        return
    }

    loading.value = true
    error.value = null
    success.value = false

    try {
        const formData = new FormData()
        formData.append('first_name', form.value.first_name.trim())
        formData.append('last_name', form.value.last_name.trim())
        formData.append('phone', form.value.phone.replace(/[-\s]/g, ''))
        formData.append('email', form.value.email.trim())
        formData.append('password', form.value.password.trim())
        if (form.value.role?.value) {
            formData.append('role', form.value.role.value)
        }

        // Add veterinarian specific fields if role is VETERINARIAN
        if (isVeterinarian.value) {
            formData.append('license_number', form.value.license_number.trim())
            formData.append('experience', form.value.experience.trim())
            formData.append('education', form.value.education.trim())
        }

        // Handle image file
        if (imageFile.value) {
            formData.append('image_file', imageFile.value)
            console.log('Uploading new image:', imageFile.value.name)
        }

        // Debug FormData contents
        console.log('FormData contents:')
        for (let [key, value] of formData.entries()) {
            console.log(key, value)
        }

        const response = await $fetch('http://localhost:3001/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.value}`
            },
            body: formData
        })

        console.log('Create response:', response)
        success.value = true

        await Swal.fire({
            title: 'Success!',
            text: 'User has been created successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00C16A',
        })

        navigateTo('/user')
    } catch (err: any) {
        console.error('Submit error:', err)
        error.value = err?.data?.message || err?.message || 'Failed to create user'
        if (error.value) {
            await Swal.fire({
                title: 'Error!',
                text: error.value as string,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#d33',
            })
        }
    } finally {
        loading.value = false
    }
}

function resetForm() {
    form.value = {
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        role: undefined,
        password: '',
        confirm_password: '',
        image_url: '',
        license_number: '',
        experience: '',
        education: ''
    }
    errors.value = {}
    imageFile.value = null
    imagePreview.value = null
    phoneTouched.value = false
    error.value = null
    success.value = false

    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
        fileInput.value = ''
    }
}
</script>

<template>
    <div class="p-6 mx-auto" style="max-width: 750px;">
        <div class="space-y-6">
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Create User</h1>
            <UBreadcrumb :items="items" />
            <UPageCard title="Create New User" description="Fill in the user's information">
                <form @submit.prevent="submitForm" class="space-y-4">
                    <div class="flex gap-4">
                        <UFormField label="First Name" required class="flex-1" :error="errors.first_name">
                            <UInput v-model="form.first_name" placeholder="First name" class="w-full" />
                        </UFormField>
                        <UFormField label="Last Name" required class="flex-1" :error="errors.last_name">
                            <UInput v-model="form.last_name" placeholder="Last name" class="w-full" />
                        </UFormField>
                    </div>

                    <div class="flex gap-4">
                        <UFormField label="Phone Number" required class="flex-1" :error="errors.phone">
                            <UInput v-model="form.phone" placeholder="Enter phone number (e.g., 0801234569)"
                                class="w-full" @input="handlePhoneInput" @keydown="handlePhoneKeydown"
                                @paste="handlePhonePaste" maxlength="12" type="tel" autocomplete="tel" />
                        </UFormField>
                        <UFormField label="Email" required class="flex-1" :error="errors.email">
                            <UInput v-model="form.email" type="email" placeholder="user@example.com" class="w-full" />
                        </UFormField>
                    </div>

                    <div class="flex gap-4">
                        <UFormField label="Role" required class="flex-1" :error="errors.role">
                            <USelectMenu v-model="form.role" :items="roleOptions" option-attribute="label" by="value"
                                placeholder="Select role" class="w-full" @change="handleRoleChange" />
                        </UFormField>
                    </div>

                    <div class="flex gap-4">
                        <UFormField label="Password" required class="flex-1" :error="errors.password">
                            <UInput v-model="form.password" type="password" placeholder="Enter password" class="w-full" />
                        </UFormField>
                        <UFormField label="Confirm Password" required class="flex-1" :error="errors.confirm_password">
                            <UInput v-model="form.confirm_password" type="password" placeholder="Confirm password" class="w-full" />
                        </UFormField>
                    </div>

                    <!-- Veterinarian Specific Fields -->
                    <div v-if="isVeterinarian" class="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 class="text-lg font-medium text-blue-900 mb-3">Veterinarian Information</h3>

                        <div class="flex space-x-4">
                            <UFormField label="License Number" required :error="errors.license_number" class="flex-1">
                                <UInput v-model="form.license_number" placeholder="Enter veterinarian license number"
                                    class="w-full h-10" />
                            </UFormField>

                            <UFormField label="Experience (years)" required :error="errors.experience" class="flex-1">
                                <UInput v-model="form.experience" placeholder="Enter years of experience (e.g., 5)"
                                    class="w-full h-10" @input="handleExperienceInput"
                                    @keydown="handleExperienceKeydown" @paste="handleExperiencePaste" maxlength="3"
                                    type="text" autocomplete="off" />
                            </UFormField>
                        </div>

                        <UFormField label="Education" required :error="errors.education">
                            <UTextarea v-model="form.education" placeholder="Describe your educational background..."
                                class="w-full" />
                        </UFormField>
                    </div>

                    <div class="space-y-4">
                        <UFormField label="Profile Image" :error="errors.image">
                            <UInput type="file" name="image_file" accept="image/jpeg,image/jpg,image/png,image/webp"
                                @change="handleFileChange" class="w-full" />
                            <div class="text-sm text-gray-500 mt-1">
                                Supported formats: JPEG, JPG, PNG, WebP (Max size: 5MB)
                            </div>
                        </UFormField>
                        <div v-if="imagePreview" class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Image Preview:</label>
                            <div class="relative inline-block">
                                <img :src="imagePreview" alt="User profile preview"
                                    class="w-32 h-32 object-cover rounded-lg border border-gray-300" />
                                <button type="button" @click="removeImage"
                                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 flex gap-4">
                        <UButton type="submit" label="Create User" class="flex-1 justify-center" :loading="loading"
                            :disabled="loading" />
                        <UButton type="button" label="Reset Form" variant="outline" class="flex-1 justify-center" 
                            @click="resetForm" :disabled="loading" />
                    </div>

                    <div v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</div>
                    <div v-if="success" class="text-green-600 text-sm font-medium mt-2">User created successfully!</div>
                </form>
            </UPageCard>
        </div>
    </div>
</template>