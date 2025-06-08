<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import Swal from 'sweetalert2'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
})

const router = useRouter()
const globalFilter = ref('')
const showDeleteModal = ref(false)
const petToDelete = ref<Pet | null>(null)
const toast = useToast()
const table = useTemplateRef('table')

type Pet = {
  pet_id: number
  pet_name: string
  image_url?: string
  type?: {
    type_name: string
  }
  breed_name?: string
  gender?: string
  owner?: {
    first_name: string
    last_name: string
  }
  weight?: number
  birth_date?: string
}

const { data: pets, error } = await useAsyncData<Pet[]>('pets', () =>
  $fetch('http://localhost:3001/pets', {
    credentials: 'include',
  })
)

const filteredPets = computed(() => {
  if (!pets.value) return []
  const keyword = globalFilter.value.toLowerCase()
  return pets.value.filter((pet) =>
    [pet.pet_name, pet.breed_name, pet.type?.type_name, pet.gender, pet.owner?.first_name, pet.owner?.last_name]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(keyword))
  )
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 5 // Adjust pageSize as needed
})

// Compute the "Showing X to Y of Z" text
const showingText = computed(() => {
  const total = filteredPets.value.length
  const pageSize = pagination.value.pageSize
  const pageIndex = pagination.value.pageIndex
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)
  return total > 0 ? `Showing ${start} to ${end} of ${total} entries` : 'No entries to show'
})

onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) navigateTo('/')
})

const columns: TableColumn<Pet>[] = [
  {
    accessorKey: 'pet_id',
    header: 'ID',
    cell: ({ row }) => {
      const petId = row.original.pet_id
      return `#${petId}`
    }
  },
  {
    id: 'img',
    // header: 'Image',
    cell: ({ row }) => {
      const pet = row.original
      return h('img', {
        src: pet.image_url || '/default-pet.png', // ใช้ URL ของรูปภาพ หรือรูปที่มีค่า default
        alt: pet.pet_name,
        class: 'w-10 h-10 rounded-full object-cover'
      })
    }
  },

  {
    accessorKey: 'pet_name',
    header: 'Name',
    cell: ({ row }) => {
      const pet = row.original
      return h('span', {}, pet.pet_name) 
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => row.original.type?.type_name || '-',
  },
  { accessorKey: 'breed_name', header: 'Breed' },
  { accessorKey: 'gender', header: 'Gender' },
  {
    accessorKey: 'birthdate',
    header: 'Birthdate',
    cell: ({ row }) => {
      const dateStr = row.original.birth_date
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: ({ row }) => {
      const birthDateStr = row.original.birth_date
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
      if (years === 0 && months === 0) ageString = `${days} days`

      return ageString
    }
  },
  {
    accessorKey: 'weight',
    header: 'Weight (kg)',
    cell: ({ row }) => row.original.weight !== undefined ? row.original.weight.toFixed(1) : '-'
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    cell: ({ row }) =>
      `${row.original.owner?.first_name || '-'} ${row.original.owner?.last_name || '-'}`,
  },
  {
    id: 'actions',
  }
]

function getDropdownActions(pet: Pet): DropdownMenuItem[] {
  return [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      onClick: () => router.push(`/pet/view/${pet.pet_id}`)
    },
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onClick: () => router.push(`/pet/edit/${pet.pet_id}`)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onClick: () => {
        petToDelete.value = pet
        Swal.fire({
          title: 'Delete this pet?',
          html: `Are you sure you want to delete <strong>${pet.pet_name}</strong>?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#00C16A',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete',
          cancelButtonText: 'Cancel'
        }).then(async (result) => {
          if (result.isConfirmed) {
            await confirmDeletePet()
            Swal.fire({
              title: "Deleted",
              html: `<strong>${pet.pet_name}</strong> has been deleted.`,
              icon: "success",
              confirmButtonColor: "#00C16A"
            });
          }
        });
      }
    }
  ]
}

async function confirmDeletePet() {
  if (!petToDelete.value) return
  try {
    await $fetch(`http://localhost:3001/pets/${petToDelete.value.pet_id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    pets.value = (pets.value ?? []).filter(p => p.pet_id !== petToDelete.value?.pet_id)
    toast.add({ title: 'Pet deleted successfully', color: 'success' })
  } catch (err: any) {
    toast.add({
      title: 'Failed to delete pet',
      description: err?.data?.message || err.message || 'Unknown error',
      color: 'error'
    })
  } finally {
    showDeleteModal.value = false
    petToDelete.value = null
  }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-3">Pets</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Error loading pets: {{ error }}
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <UInput v-model="globalFilter" placeholder="Search pets..." class="max-w-sm" />
          <div class="flex space-x-2">
            <UButton @click="navigateTo('/pet/ptype')" color="neutral" variant="outline" icon="i-lucide-eye">
              View Pet Type
            </UButton>
            <UButton @click="navigateTo('/pet/create')" icon="i-lucide-plus">
              New Pet
            </UButton>
          </div>
        </div>
      </template>

      <UTable ref="table" :columns="columns" :data="filteredPets" v-model:pagination="pagination" :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }" class="border border-gray-300 rounded-md">
        <template #actions-cell="{ row }">
          <UDropdownMenu :items="getDropdownActions(row.original)">
            <UButton icon="i-lucide-ellipsis-vertical" variant="ghost" color="neutral" />
          </UDropdownMenu>
        </template>
      </UTable>

      <div class="flex items-center justify-between pt-4 w-full px-0">
        <span class="text-sm text-gray-600 pl-0">{{ showingText }}</span>
        <UPagination :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize" :total="filteredPets.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" class="pr-0" />
      </div>
    </UCard>
  </div>
</template>