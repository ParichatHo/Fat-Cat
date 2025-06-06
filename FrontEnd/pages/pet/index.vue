<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
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
    accessorKey: 'pet_name',
    header: 'Name',
    cell: ({ row }) => {
      const pet = row.original
      return h('div', { class: 'flex items-center space-x-3' }, [
        h('img', {
          src: pet.image_url || '/default-pet.png',
          alt: pet.pet_name,
          class: 'w-10 h-10 rounded-full object-cover'
        }),
        h('span', {}, pet.pet_name)
      ])
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

      // คำนวณความแตกต่างของเวลา
      let years = today.getFullYear() - birth.getFullYear()
      let months = today.getMonth() - birth.getMonth()
      let days = today.getDate() - birth.getDate()

      // ปรับค่าติดลบ
      if (days < 0) {
        months -= 1
        // หาจำนวนวันในเดือนที่แล้ว
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        days += lastMonth.getDate()
      }

      if (months < 0) {
        years -= 1
        months += 12
      }

      // สร้าง string ผลลัพธ์
      let ageString = ''
      if (years > 0) ageString += `${years} years`
      if (months > 0) ageString += `${ageString ? ', ' : ''}${months} months`

      return ageString || '0 days'
    }
  },
  { accessorKey: 'weight', header: 'Weight (kg)', cell: ({ row }) => row.original.weight ?? '-' },

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
            confirmDeletePet()
            Swal.fire('Deleted', `<strong>${pet.pet_name}</strong> has been deleted.`, 'success')
          }
        })
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
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Pets</h1>

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

      <UTable ref="table" :columns="columns" :data="filteredPets" class="border border-gray-300 mt-4 rounded-md">
        <template #actions-cell="{ row }">
          <UDropdownMenu :items="getDropdownActions(row.original)">
            <UButton icon="i-lucide-ellipsis-vertical" variant="ghost" color="neutral" />
          </UDropdownMenu>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
