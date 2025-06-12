<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'
import type { BreadcrumbItem } from '@nuxt/ui'

const router = useRouter()

const items = ref<BreadcrumbItem[]>([
    { label: 'Profile', icon: 'i-lucide-user', to: '/profileVet' },
    { label: 'Edit Profile', icon: 'i-lucide-user-pen', to: '/profileVet/edit' }
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

// ดึงข้อมูลผู้ใช้จาก localStorage
const currentUser = computed(() => {
    if (process.client) {
        const userData = localStorage.getItem('user')
        return userData ? JSON.parse(userData) : null
    }
    return null
})

const form = ref({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    role: undefined as SelectOption<string> | undefined,
    password: '',
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
const phoneTouched = ref(false)

// Computed property to check if selected role is veterinarian
const isVeterinarian = computed(() => {
    return form.value.role?.value === 'VETERINARIAN'
})

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    const email = currentUser.value?.email

    if (!token.value || !email) {
        await Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to edit your profile',
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6',
        })
        return router.push('/')
    }

    console.log('Loading profile data for email:', email)
    console.log('Token:', token.value ? 'Present' : 'Missing')

    try {
        // Fetch user data
        const response = await axios.post(
            'http://localhost:3001/user/info',
            { email },
            {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const userData = response.data
        console.log('Fetched user data:', userData)

        // Format phone number from API
        const formattedPhone = formatPhoneNumber(userData.phone?.replace(/\D/g, '') || '')

        form.value = {
            first_name: userData.first_name || userData.full_name?.split(' ')[0] || '',
            last_name: userData.last_name || userData.full_name?.split(' ').slice(1).join(' ') || '',
            phone: formattedPhone,
            email: userData.email || '',
            role: roleOptions.find(opt => opt.value === userData.role),
            password: '',
            image_url: userData.image_url || '',
            // Veterinarian specific fields
            license_number: userData.veterinarian?.license_number || '',
            experience: userData.veterinarian?.experience?.toString() || '',
            education: userData.veterinarian?.education || ''
        }

        // Set initial image preview
        imagePreview.value = userData.image_url || null

        console.log('Form populated:', form.value)
    } catch (err: any) {
        console.error('Failed to load profile data:', err)
        error.value = err?.response?.data?.message || err?.message || 'Failed to load profile data. Please try again.'

        if (error.value) {
            await Swal.fire({
                title: 'Error!',
                text: error.value,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#d33',
            })
        }
    }
})

// Phone number formatting functions
const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

const handlePhoneInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    const value = input.value
    const digits = value.replace(/\D/g, '')
    const limitedDigits = digits.slice(0, 10)
    const formattedPhone = formatPhoneNumber(limitedDigits)
    form.value.phone = formattedPhone
    input.value = formattedPhone
    phoneTouched.value = true
}

const handlePhoneKeydown = (event: KeyboardEvent) => {
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true) ||
        (event.keyCode >= 35 && event.keyCode <= 39)) {
        return
    }
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
        event.preventDefault()
    }
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

// Experience input handlers
const handleExperienceInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    let value = input.value.replace(/\D/g, '')
    value = value.slice(0, 3)
    form.value.experience = value
    input.value = value
}

const handleExperienceKeydown = (event: KeyboardEvent) => {
    if (
        [8, 9, 27, 13, 46].includes(event.keyCode) ||
        (event.keyCode === 65 && event.ctrlKey) ||
        (event.keyCode === 67 && event.ctrlKey) ||
        (event.keyCode === 86 && event.ctrlKey) ||
        (event.keyCode === 88 && event.ctrlKey) ||
        (event.keyCode >= 35 && event.keyCode <= 39)
    ) {
        return
    }
    if (
        (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) &&
        (event.keyCode < 96 || event.keyCode > 105)
    ) {
        event.preventDefault()
    }
    const currentValue = form.value.experience
    if (currentValue.length >= 3 && ![8, 46].includes(event.keyCode)) {
        event.preventDefault()
    }
}

const handleExperiencePaste = (event: ClipboardEvent) => {
    event.preventDefault()
    const paste = event.clipboardData?.getData('text') || ''
    const digits = paste.replace(/\D/g, '').slice(0, 3)
    form.value.experience = digits
}

// Validation function
function validate(): boolean {
    errors.value = {}

    if (!form.value.first_name.trim()) {
        errors.value.first_name = 'First name is required'
    }

    if (!form.value.last_name.trim()) {
        errors.value.last_name = 'Last name is required'
    }

    if (!form.value.phone) {
        errors.value.phone = 'Phone number is required'
    } else if (phoneTouched.value && form.value.phone.length > 0 && !/^\d{3}-\d{3}-\d{4}$/.test(form.value.phone)) {
        errors.value.phone = 'Phone number must be in the format 080-123-4569'
    }

    if (!form.value.email.trim()) {
        errors.value.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'Please enter a valid email address'
    }

    if (!form.value.role?.value) {
        errors.value.role = 'Role is required'
    }

    if (form.value.password && form.value.password.length < 6) {
        errors.value.password = 'Password must be at least 6 characters long'
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

// File handling functions
function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0] || null

    if (file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            error.value = 'Please select a valid image file (JPEG, JPG, PNG, WebP)'
            imageFile.value = null
            imagePreview.value = form.value.image_url || null
            target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            error.value = 'Image file size must be less than 5MB'
            imageFile.value = null
            imagePreview.value = form.value.image_url || null
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
        imagePreview.value = form.value.image_url || null
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
// function handleRoleChange() {
//     if (form.value.role?.value !== 'VETERINARIAN') {
//         form.value.license_number = ''
//         form.value.experience = ''
//         form.value.education = ''
//         delete errors.value.license_number
//         delete errors.value.experience
//         delete errors.value.education
//     }
// }

// Submit form function
async function submitForm() {
    phoneTouched.value = true

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
        if (form.value.role?.value) {
            formData.append('role', form.value.role.value)
        }
        if (form.value.password && form.value.password.trim()) {
            formData.append('password', form.value.password.trim())
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

        // Handle image removal
        if (!imagePreview.value && !imageFile.value) {
            formData.append('remove_image', 'true')
            console.log('Removing image')
        }

        // Debug FormData contents
        console.log('FormData contents:')
        for (let [key, value] of formData.entries()) {
            console.log(key, value)
        }

        // Update profile using the user info endpoint
        const response = await axios.put(
            'http://localhost:3001/user/update-profile',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token.value}`,
                    // ไม่ต้องใส่ Content-Type สำหรับ multipart/form-data
                },
            }
        )

        console.log('Update response:', response.data)
        success.value = true

        // *** การแก้ไขหลัก - อัปเดต localStorage และ form.value ***
        if (response.data.user) {
            // อัปเดต localStorage ด้วยข้อมูลใหม่
            localStorage.setItem('user', JSON.stringify(response.data.user))

            // อัปเดต form.value ด้วยข้อมูลใหม่ (รวมถึง image_url)
            form.value.image_url = response.data.user.image_url || ''

            // อัปเดต imagePreview ด้วย URL ใหม่
            imagePreview.value = response.data.user.image_url || null

            // รีเซ็ต imageFile เพราะเราได้อัปโหลดแล้ว
            imageFile.value = null

            // เคลียร์ input file
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            if (fileInput) {
                fileInput.value = ''
            }
        }

        await Swal.fire({
            title: 'Success!',
            text: 'Your profile has been updated successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#00C16A',
        })

        router.push('/profileVet')
    } catch (err: any) {
        console.error('Submit error:', err)
        error.value = err?.response?.data?.message || err?.message || 'Failed to update profile'
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
</script>

<template>
    <div class="max-w-4xl mx-auto p-6">
        <div class="space-y-6">
            <h1 class="text-xl font-semibold text-gray-900 mb-5">Edit Profile</h1>
            <UBreadcrumb :items="items" />
            <UPageCard title="Edit Profile" description="Update your personal information">
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

                    <UFormField label="Role" required class="flex-1" :error="errors.role">
                        <USelectMenu v-model="form.role" :items="roleOptions" option-attribute="label" by="value"
                            placeholder="Select role" class="w-full" disabled />
                    </UFormField>

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
                                <img :src="imagePreview" alt="Profile preview"
                                    class="w-32 h-32 object-cover rounded-lg border border-gray-300" />
                                <button type="button" @click="removeImage"
                                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 flex gap-3">
                        <UButton type="submit" label="Update Profile" class="flex-1 justify-center" :loading="loading"
                            :disabled="loading" />
                    </div>

                    <div v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</div>
                    <div v-if="success" class="text-green-600 text-sm font-medium mt-2">Profile updated successfully!
                    </div>
                </form>
            </UPageCard>
        </div>
    </div>
</template>