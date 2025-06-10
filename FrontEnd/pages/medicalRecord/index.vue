<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { Table } from '@tanstack/vue-table'

const table = ref<Table<MedicalRecord> | null>(null)
const router = useRouter()
const globalFilter = ref('')

definePageMeta({
  layout: 'navbar2',
  middleware: 'auth'
})

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

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

// Filter medical records based on globalFilter
const filteredRecords = computed(() => {
  if (!records.value) return []
  const keyword = globalFilter.value.toLowerCase()
  return records.value.filter((record) =>
    [
      record.pet?.pet_name || `Pet ID ${record.pet_id}`,
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

// Compute paginated records based on pagination settings
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

const token = ref<string | null>(null)
const records = ref<MedicalRecord[]>([])
const error = ref<string | null>(null)
const loading = ref<boolean>(false)
const recordToDelete = ref<MedicalRecord | null>(null)
const columnFilters = ref([{ id: 'symptoms', value: '' }])
const toast = useToast()

// Reset pagination when globalFilter changes
const resetPagination = () => {
  pagination.value.pageIndex = 0
}

// Watch globalFilter to reset pagination
watch(globalFilter, () => {
  resetPagination()
})

// In onMounted
onMounted(async () => {
  token.value = localStorage.getItem('authToken')
  console.log('Token:', token.value)
  if (!token.value) {
    toast.add({ title: 'Please log in to continue', color: 'error' })
    return navigateTo('/login')
  }

  loading.value = true
  error.value = null
  try {
    const data = await $fetch<MedicalRecord[]>('http://localhost:3001/recs', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    console.log('API Response:', data)
    records.value = data
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Unknown error'
    console.error('API Error:', err)
    toast.add({
      title: 'Failed to load records',
      description: error.value || 'Unknown error', // Changed from ?? to || to ensure string
      color: 'error'
    })
  } finally {
    loading.value = false
  }
})

// In confirmDeleteRecord
async function confirmDeleteRecord() {
  if (!recordToDelete.value) return
  try {
    await $fetch(`http://localhost:3001/recs/${recordToDelete.value.record_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    records.value = records.value.filter(record => record.record_id !== recordToDelete.value!.record_id)
    toast.add({
      title: 'Success',
      description: 'Medical record deleted successfully',
      color: 'success'
    })
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Unknown error'
    toast.add({
      title: 'Failed to delete record',
      description: error.value || 'Unknown error', // Changed from ?? to || to ensure string
      color: 'error'
    })
  } finally {
    recordToDelete.value = null
  }
}

function getDropdownActions(record: MedicalRecord): DropdownMenuItem[] {
  return [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      onClick: () => {
        router.push(`/medicalRecord/view/${record.record_id}`)
      }
    },
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onClick: () => {
        router.push(`/medicalRecord/edit/${record.record_id}`)
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onClick: async () => {
        recordToDelete.value = record
        Swal.fire({
          title: "Delete this medical record?",
          html: `Are you sure you want to delete the record for <strong>${record.pet?.pet_name || `Pet ID ${record.pet_id}`}</strong> on <strong>${new Date(record.visit_date).toLocaleDateString()}</strong>?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#00C16A",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, delete",
          cancelButtonText: "Cancel"
        }).then(async (result) => {
          if (result.isConfirmed) {
            await confirmDeleteRecord()
            Swal.fire({
              title: "Deleted",
              html: `Medical record for <strong>${record.pet?.pet_name || `Pet ID ${record.pet_id}`}</strong> has been deleted.`,
              icon: "success",
              confirmButtonColor: "#00C16A"
            })
          }
        })
      }
    }
  ]
}

const columns: TableColumn<MedicalRecord>[] = [
  {
    accessorKey: 'record_id',
    header: 'ID',
    cell: ({ row }) => `#${row.original.record_id}`
  },
  {
    accessorKey: 'pet_name',
    header: 'Pet Name',
    cell: ({ row }) => row.original.pet?.pet_name || 'Unknown Pet'
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
      h('div', { class: 'truncate max-w-xs', title: row.getValue('symptoms') }, row.getValue('symptoms'))
  },
  {
    accessorKey: 'diagnosis',
    header: 'Diagnosis',
    cell: ({ row }) =>
      h('div', { class: 'truncate max-w-xs', title: row.getValue('diagnosis') }, row.getValue('diagnosis'))
  },
  {
    accessorKey: 'treatment',
    header: 'Treatment',
    cell: ({ row }) =>
      h('div', { class: 'truncate max-w-xs', title: row.getValue('treatment') }, row.getValue('treatment'))
  },
  {
    id: 'actions'
  }
]

const createMedicalRecord = () => {
  navigateTo('/medicalRecord/create')
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-3">Medical Records</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load medical records data: {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-10 text-gray-500">Loading medical records data...</div>

    <div v-else-if="records.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <p class="text-lg font-medium">No medical records found.</p>
    </div>

    <div v-else>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <UInput :model-value="globalFilter" class="max-w-sm" placeholder="Search records..."
              @update:model-value="globalFilter = $event" />
            <UButton label="New Medical Record" color="primary" @click="createMedicalRecord" icon="i-lucide-plus" />
          </div>
        </template>

        <UTable 
          ref="table" 
          v-model:column-filters="columnFilters" 
          :data="paginatedRecords" 
          :columns="columns"
          class="border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <template #actions-cell="{ row }">
            <UDropdownMenu :items="getDropdownActions(row.original)">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Actions" />
            </UDropdownMenu>
          </template>
        </UTable>

        <div class="flex items-center justify-between pt-4 w-full px-0">
          <span class="text-sm text-gray-600 pl-0">{{ showingText }}</span>
          <UPagination 
            :default-page="pagination.pageIndex + 1" 
            :items-per-page="pagination.pageSize"
            :total="filteredRecords.length" 
            @update:page="(p) => pagination.pageIndex = p - 1"
            class="pr-0" 
          />
        </div>
      </UCard>
    </div>
  </div>
</template>