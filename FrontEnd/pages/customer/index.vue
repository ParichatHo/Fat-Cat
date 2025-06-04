<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { h } from 'vue'
import { useRouter } from 'vue-router'

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
      onClick: () => {
        // delete function
      }
    }
  ]
}

function onDropdownSelect(item: DropdownMenuItem) {
  if (item.label === 'Edit') {
    router.push(`/customer/edit/${item.userId}`) // ต้องส่ง userId ใน item ด้วย
  }
}


</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Customers List</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load customers data: {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-10 text-gray-500">Loading customers data...</div>

    <div v-else-if="owners.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <p class="text-lg font-medium">No customers found.</p>
    </div>

    <div v-else class="flex flex-col flex-1 w-full">
      <div class="flex py-3.5 border-accented justify-between items-center">
        <UInput :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string" class="max-w-sm"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)" />
        <UButton label="New Customer" color="primary" @click="createCustomer" icon="i-lucide-plus" class="ml-4" />
      </div>

      <div class="table-container">
        <UTable ref="table" v-model:column-filters="columnFilters" :data="owners" :columns="columns"
          class="border border-gray-300 dark:border-gray-600 rounded-md">

          <template #actions-cell="{ row }">
            <UDropdownMenu :items="getDropdownActions(row.original)" @select="onDropdownSelect">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Actions" />
            </UDropdownMenu>

          </template>


        </UTable>

      </div>
    </div>
  </div>
</template>
