<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2';


const router = useRouter()

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

type Owner = {
  owner_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  address: string
}

const token = ref<string | null>(null)
const owners = ref<Owner[]>([])
const error = ref<string | null>(null)
const loading = ref<boolean>(false)

const table = useTemplateRef('table')
const columnFilters = ref([{ id: 'email', value: '' }])

const toast = useToast()

const showDeleteModal = ref(false)
const ownerToDelete = ref<Owner | null>(null)

const columns: TableColumn<Owner>[] = [
  { accessorKey: 'owner_id', header: 'ID' },
  { accessorKey: 'first_name', header: 'First Name' },
  { accessorKey: 'last_name', header: 'Last Name' },
  { accessorKey: 'phone', header: 'Phone' },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) =>
      h('div', { class: 'truncate max-w-xs', title: row.getValue('email') }, row.getValue('email'))
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) =>
      h('div', { class: 'truncate max-w-lg', title: row.getValue('address') }, row.getValue('address'))
  },
  {
    id: 'actions',
    // header: 'Actions'
  }
]

async function confirmDeleteOwner() {
  if (!ownerToDelete.value) return
  try {
    await $fetch(`http://localhost:3001/owners/${ownerToDelete.value.owner_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    owners.value = owners.value.filter(o => o.owner_id !== ownerToDelete.value?.owner_id)
    toast.add({ title: 'Customer deleted successfully', color: 'success' })
  } catch (err: any) {
    toast.add({
      title: 'Failed to delete customer',
      description: err?.data?.message || err.message || 'Unknown error',
      color: 'error'
    })
  } finally {
    showDeleteModal.value = false
    ownerToDelete.value = null
  }
}

onMounted(async () => {
  token.value = localStorage.getItem('authToken')
  if (!token.value) {
    return navigateTo('/')
  }

  loading.value = true
  error.value = null
  try {
    const data = await $fetch<Owner[]>('http://localhost:3001/owners', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    owners.value = data
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Unknown error'
  } finally {
    loading.value = false
  }
})

const createCustomer = () => {
  navigateTo('/customer/create')
}

function getDropdownActions(user: Owner): DropdownMenuItem[] {
  return [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      onClick: () => {
        router.push(`/customer/view/${user.owner_id}`)
      }
    },
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onClick: () => {
        router.push(`/customer/edit/${user.owner_id}`)
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onClick: async () => {
        ownerToDelete.value = user
        Swal.fire({
          title: "Delete this user?",
          html: `Are you sure you want to delete <strong>${user.first_name} ${user.last_name}</strong>?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#00C16A",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, delete",
          cancelButtonText: "Cancel"
        }).then(async (result) => {
          if (result.isConfirmed) {
            await confirmDeleteOwner()
            Swal.fire({
              title: "Deleted",
              html: `<strong>${user.first_name} ${user.last_name}</strong> has been deleted.`,
              icon: "success",
              confirmButtonColor: "#00C16A"
            });
          }
        });
      }

    }
  ]
}

function onDropdownSelect(item: DropdownMenuItem) {
  // ตัวอย่างถ้าต้องการจัดการ select จาก dropdown
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Customers</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load customers data: {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-10 text-gray-500">Loading customers data...</div>

    <div v-else-if="owners.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <p class="text-lg font-medium">No customers found.</p>
    </div>

    <div v-else>
      <UCard>
        <!-- Header -->
        <template #header>
          <div class="flex justify-between items-center">
            <UInput :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string" class="max-w-sm"
              placeholder="Filter emails..."
              @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)" />
            <UButton label="New Customer" color="primary" @click="createCustomer" icon="i-lucide-plus" />
          </div>
        </template>

        <!-- Content -->
        <UTable ref="table" v-model:column-filters="columnFilters" :data="owners" :columns="columns"
          class="border border-gray-300 dark:border-gray-600 rounded-md mt-4">
          <template #actions-cell="{ row }">
            <UDropdownMenu :items="getDropdownActions(row.original)" @select="onDropdownSelect">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Actions" />
            </UDropdownMenu>
          </template>
        </UTable>

        <!-- Footer (ถ้าต้องการใส่ footer) -->
        <!--
          <template #footer>
            <div class="text-sm text-gray-500 text-center py-3">Footer content here</div>
          </template>
          -->
      </UCard>
    </div>

    <!-- Confirm delete modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-lg shadow-lg ring ring-gray-200 dark:ring-gray-700 p-6 animate-scale-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Delete
          </h2>
          <button @click="showDeleteModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <span class="sr-only">Close</span>
            <i class="i-lucide-x w-5 h-5"></i>
          </button>
        </div>
        <div class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete
          <strong>{{ ownerToDelete?.first_name }} {{ ownerToDelete?.last_name }}</strong>?
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showDeleteModal = false"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-md transition">
            Cancel
          </button>
          <button @click="confirmDeleteOwner"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>