<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import type { BreadcrumbItem, DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { Table } from '@tanstack/vue-table'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const petId = route.params.id as string
const table = ref<Table<MedicalRecord> | null>(null)
const globalFilter = ref('')
const toast = useToast()

const items = ref<BreadcrumbItem[]>([
  { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
  { label: 'View Pet Detail', icon: 'i-lucide-eye', to: `/pet/view/${petId}` }
])

type Pet = {
  pet_id: number
  pet_name: string
  image_url?: string
  birth_date?: string
  weight?: number
  type?: {
    type_name: string
  }
  breed_name?: string
  gender?: string
  owner?: {
    first_name: string
    last_name: string
  }
}

type MedicalRecord = {
  record_id: number
  pet_id: number
  vet_id: number
  visit_date: string
  symptoms: string
  diagnosis: string
  treatment: string
  medication: string
  notes: string
  createdAt: string
  updatedAt: string | null
  pet?: {
    pet_name: string
  }
  vet?: {
    vet_id: number
    license_number: string
    experience: number
    education: string
    user_id: number
    user?: {
      user_id: number
      first_name: string
      last_name: string
    }
  }
}

const pet = ref<Pet | null>(null)
const medicalRecords = ref<MedicalRecord[]>([])
const loading = ref(true)
const loadingMedicalRecords = ref(true)
const error = ref<string | null>(null)
const medicalRecordsError = ref<string | null>(null)
const columnFilters = ref([{ id: 'symptoms', value: '' }])

// Pagination for medical records - เริ่มต้นที่หน้าแรก
const pagination = ref({
  pageIndex: 0,
  pageSize: 4
})

// Filter medical records for this specific pet
const filteredRecords = computed(() => {
  if (!medicalRecords.value) return []
  const keyword = globalFilter.value.toLowerCase()
  const petRecords = medicalRecords.value.filter(record => record.pet_id === parseInt(petId))

  if (!keyword) return petRecords

  return petRecords.filter((record) =>
    [
      record.vet?.user ? `${record.vet.user.first_name} ${record.vet.user.last_name}` : `Vet ID ${record.vet_id}`,
      record.symptoms || '',
      record.diagnosis || '',
      record.treatment || '',
      record.medication || '',
      record.notes || ''
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(keyword))
  )
})

// เพิ่ม computed สำหรับข้อมูลที่จะแสดงในตารางตาม pagination
const paginatedRecords = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredRecords.value.slice(start, end)
})

// Compute the "Showing X to Y of Z" text
const showingText = computed(() => {
  const total = filteredRecords.value.length
  const pageSize = pagination.value.pageSize
  const pageIndex = pagination.value.pageIndex
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)
  return total > 0 ? `Showing ${start} to ${end} of ${total} entries` : 'No entries to show'
})

// คำนวณจำนวนหน้าทั้งหมด
const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pagination.value.pageSize)
})

// ฟังก์ชันสำหรับเปลี่ยนหน้า
const handlePageChange = (page: number) => {
  pagination.value.pageIndex = page - 1 // UPagination ใช้ 1-based, เราใช้ 0-based
}

// ฟังก์ชันดึงข้อมูลสัตว์เลี้ยง
const fetchPetData = async (token: string) => {
  try {
    pet.value = await $fetch<Pet>(`http://localhost:3001/pets/${petId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to load pet details'
    await Swal.fire({
      title: 'Error!',
      text: error.value ?? 'Unknown error',
      icon: 'error',
      confirmButtonText: 'OK'
    })
    router.push('/pet')
  }
}

// ฟังก์ชันดึงข้อมูลประวัติการรักษา
const fetchMedicalRecords = async (token: string) => {
  try {
    const data = await $fetch<MedicalRecord[]>('http://localhost:3001/recs', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    medicalRecords.value = data
  } catch (err: any) {
    medicalRecordsError.value = err?.data?.message || err.message || 'Failed to load medical records'
    console.error('Medical Records Error:', err)
    toast.add({
      title: 'Failed to load medical records',
      description: medicalRecordsError.value ?? 'Unknown error',
      color: 'error'
    })
  }
}

// View medical record function
const viewMedicalRecord = (recordId: number) => {
  router.push(`/medRec/view/${recordId}`)
}

// Table columns for medical records
const columns: TableColumn<MedicalRecord>[] = [
  {
    accessorKey: 'record_id',
    header: 'ID',
    cell: ({ row }) => `#${row.original.record_id}`
  },
  {
    accessorKey: 'vet',
    header: 'Veterinarian',
    cell: ({ row }) =>
      row.original.vet?.user ? `${row.original.vet.user.first_name} ${row.original.vet.user.last_name}` : `Vet ID ${row.original.vet_id}`
  },
  {
    accessorKey: 'visit_date',
    header: 'Visit Date',
    cell: ({ row }) => new Date(row.getValue('visit_date')).toLocaleDateString()
  },
  {
    accessorKey: 'symptoms',
    header: 'Symptoms',
    cell: ({ row }) =>
      h('div', { class: 'truncate max-w-24', title: row.getValue('symptoms') }, row.getValue('symptoms'))
  },
  {
    id: 'actions',
    header: 'View',
  }
]

// Reset pagination เมื่อมีการ search
const resetPagination = () => {
  pagination.value.pageIndex = 0
}

// Watch globalFilter เพื่อ reset pagination
watch(globalFilter, () => {
  resetPagination()
})

onMounted(async () => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return router.push('/')
  }

  loading.value = true
  loadingMedicalRecords.value = true
  error.value = null
  medicalRecordsError.value = null

  try {
    // ดึงข้อมูลสัตว์เลี้ยงและประวัติการรักษาพร้อมกัน
    await Promise.all([
      fetchPetData(token),
      fetchMedicalRecords(token)
    ])
  } finally {
    loading.value = false
    loadingMedicalRecords.value = false
  }
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatAge = (birthDateStr?: string) => {
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

const createMedicalRecord = () => {
  navigateTo(`/medicalRecord/create?petId=${petId}`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold mb-5">View Pet Detail</h1>
      <UBreadcrumb :items="items" />

      <div v-if="loading" class="text-center text-gray-500">Loading pet data...</div>
      <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>

      <div v-else-if="pet">
        <!-- Layout แบบ Side by Side with Equal Height -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
          
          <!-- Left Column: Pet Details -->
          <div class="flex flex-col h-full">
            <UPageCard 
              title="Pet Details" 
              description="Information about the selected pet."
              spotlight 
              spotlight-color="primary"
              class="flex-1 flex flex-col h-full"
            >
              <div class="flex flex-col h-full">
                <!-- แสดงรูปกับรายละเอียดข้างกัน -->
                <div class="flex flex-col md:flex-row gap-6 flex-1">
                  <!-- รูปภาพ -->
                  <div class="flex-shrink-0">
                    <img :src="pet.image_url || '/default-pet.png'" :alt="pet.pet_name"
                      class="rounded-lg object-cover border border-gray-300 w-full md:w-48 h-72" />
                  </div>

                  <!-- รายละเอียด -->
                  <div class="flex-1 space-y-4 text-gray-800">
                    <!-- ชื่อและ ID -->
                    <div>
                      <h2 class="text-2xl font-bold flex items-center gap-3 flex-wrap">
                        {{ pet.pet_name }}
                        <UBadge color="primary" variant="soft" class="font-bold rounded-full">ID: {{ pet.pet_id }}</UBadge>
                      </h2>
                    </div>
                    
                    <!-- Grid ของข้อมูล -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 class="font-semibold mb-1">Type</h3>
                        <p class="text-sm text-gray-600">{{ pet.type?.type_name || '-' }}</p>
                      </div>
                      <div>
                        <h3 class="font-semibold mb-1">Breed</h3>
                        <p class="text-sm text-gray-600">{{ pet.breed_name || '-' }}</p>
                      </div>
                      <div>
                        <h3 class="font-semibold mb-1">Gender</h3>
                        <p class="text-sm text-gray-600">{{ pet.gender || '-' }}</p>
                      </div>
                      <div>
                        <h3 class="font-semibold mb-1">Owner</h3>
                        <p class="text-sm text-gray-600">{{ pet.owner ? `${pet.owner.first_name} ${pet.owner.last_name}` : '-' }}</p>
                      </div>
                      <div>
                        <h3 class="font-semibold mb-1">Birthdate</h3>
                        <p class="text-sm text-gray-600">{{ formatDate(pet.birth_date) }}</p>
                      </div>
                      <div>
                        <h3 class="font-semibold mb-1">Age</h3>
                        <p class="text-sm text-gray-600">{{ formatAge(pet.birth_date) }}</p>
                      </div>
                      <div class="sm:col-span-2">
                        <h3 class="font-semibold mb-1">Weight (kg)</h3>
                        <p class="text-sm text-gray-600">{{ pet.weight !== undefined ? `${pet.weight.toFixed(1)} kg` : '-' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right Column: Medical Records -->
          <div class="flex flex-col h-full">
            <div v-if="medicalRecordsError" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md">
              Failed to load medical records: {{ medicalRecordsError }}
            </div>

            <div v-else-if="loadingMedicalRecords" class="flex-1 flex items-center justify-center text-gray-500">
              Loading medical records...
            </div>

            <!-- แสดงตารางเสมอ แม้ไม่มีข้อมูล -->
            <div v-else class="flex-1 flex flex-col">
              <UCard class="flex-1 flex flex-col">
                <template #header>
                  <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold">Medical Records</h2>
                  </div>
                  <div class="flex justify-between items-center">
                    <UInput 
                      :model-value="globalFilter" 
                      class="max-w-xs" 
                      placeholder="Search records..."
                      size="sm"
                      @update:model-value="globalFilter = $event" 
                    />
                  </div>
                </template>

                <div class="flex-1 flex flex-col">
                  <!-- ตารางจะแสดงเสมอ -->
                  <div class="flex-1">
                    <UTable 
                      ref="table" 
                      v-model:column-filters="columnFilters" 
                      :data="paginatedRecords" 
                      :columns="columns"
                      class="border border-gray-300 dark:border-gray-600 rounded-md h-full"
                    >
                      <template #actions-cell="{ row }">
                        <UButton 
                          icon="i-lucide-eye" 
                          color="neutral" 
                          variant="ghost" 
                          size="sm"
                          aria-label="View Medical Record"
                          @click="viewMedicalRecord(row.original.record_id)"
                        />
                      </template>
                      
                      <!-- แสดงข้อความเมื่อไม่มีข้อมูล -->
                      <template #empty-state>
                        <div class="text-center py-8">
                          <div class="text-gray-400 mb-3">
                            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Medical Records</h3>
                          <p class="text-gray-500 dark:text-gray-400 mb-4">This pet doesn't have any medical records yet.</p>
                          <UButton label="Add First Medical Record" color="primary" @click="createMedicalRecord"
                            icon="i-lucide-plus" />
                        </div>
                      </template>
                    </UTable>
                  </div>

                  <!-- Pagination section - แสดงเฉพาะเมื่อมีข้อมูลมากกว่า pageSize -->
                  <div v-if="filteredRecords.length > pagination.pageSize" class="flex items-center justify-between pt-4 w-full px-0 dark:border-gray-700 mt-auto">
                    <span class="text-sm text-gray-600 pl-0">{{ showingText }}</span>
                    <UPagination
                      :default-page="pagination.pageIndex + 1"
                      :items-per-page="pagination.pageSize"
                      :total="filteredRecords.length"
                      @update:page="handlePageChange"
                      class="pr-0"
                    />
                  </div>
                  
                  <!-- แสดงเฉพาะ showingText เมื่อมีข้อมูลแต่น้อยกว่าหรือเท่ากับ pageSize -->
                  <div v-else-if="filteredRecords.length > 0" class="flex items-center justify-start pt-4 w-full px-0 dark:border-gray-700 mt-auto">
                    <span class="text-sm text-gray-600 pl-0">{{ showingText }}</span>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>