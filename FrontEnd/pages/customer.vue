<script setup lang="ts">
import { h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

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
const table = useTemplateRef('table')
const columnFilters = ref([{ id: 'email', value: '' }])

const columns: TableColumn<Owner>[] = [
  {
    accessorKey: 'owner_id',
    header: 'ID'
  },
  {
    accessorKey: 'first_name',
    header: 'First Name'
  },
  {
    accessorKey: 'last_name',
    header: 'Last Name'
  },
  {
    accessorKey: 'phone',
    header: 'Phone'
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('div', { class: 'truncate max-w-xs', title: row.getValue('email') }, row.getValue('email'))
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => h('div', { class: 'truncate max-w-lg', title: row.getValue('address') }, row.getValue('address'))
  }
]

onMounted(() => {
  if (process.client) {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
      return navigateTo('/')
    }
  }
})

const { data, error, refresh } = await useAsyncData('owners', () =>
  $fetch('http://localhost:3001/owners', {
    headers: {
      Authorization: `Bearer ${token.value}`
    }
  })
)

watch(data, (newData) => {
  owners.value = Array.isArray(newData) ? (newData as Owner[]) : []
}, { immediate: true })

// Function to handle navigation to create customer page
const createCustomer = () => {
  navigateTo('/customers/create')
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">
      Customers List
    </h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load customers data: {{ error.message || 'Unknown error' }}
    </div>

    <div v-else-if="!owners || owners.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <p class="text-lg font-medium">No customers found.</p>
    </div>

    <div v-else class="flex flex-col flex-1 w-full">
      <div class="flex py-3.5 border-accented justify-between items-center">
        <UInput :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string" class="max-w-sm"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)" />
        <UButton label="Create Customer" color="primary" @click="createCustomer" class="ml-4" />
      </div>

      <div class="table-container">
        <UTable ref="table" v-model:column-filters="columnFilters" :data="owners" :columns="columns"
          class="border border-gray-300 dark:border-gray-600 rounded-md" />
      </div>
    </div>
  </div>
</template>