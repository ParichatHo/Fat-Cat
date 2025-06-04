<script setup lang="ts">
import { ref, watch, h, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { resolveComponent } from 'vue'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

type User = {
  user_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: 'VETERINARIAN' | 'STAFF'
}

const token = ref<string | null>(null)
const users = ref<User[]>([])
const error = ref<Error | null>(null)
const table = useTemplateRef('table')
const columnFilters = ref([{ id: 'email', value: '' }])

const editingUserId = ref<string | null>(null)
const editedRole = ref('')
const roles = ['VETERINARIAN', 'STAFF']

onMounted(async () => {
  if (process.client) {
    token.value = localStorage.getItem('authToken')
    if (!token.value) {
      return navigateTo('/')
    }

    try {
      const fetched = await $fetch<User[]>('http://localhost:3001/users', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      users.value = fetched
    } catch (err: any) {
      error.value = err
    }
  }
})

const refreshUsers = async () => {
  if (!token.value) return
  try {
    const fetched = await $fetch<User[]>('http://localhost:3001/users', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    users.value = fetched
  } catch (err: any) {
    error.value = err
  }
}

const startEdit = (user: User) => {
  editingUserId.value = user.user_id
  editedRole.value = user.role
}

const cancelEdit = () => {
  editingUserId.value = null
  editedRole.value = ''
}

const saveEdit = async (userId: string) => {
  if (!token.value) return
  try {
    await $fetch(`http://localhost:3001/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: { role: editedRole.value }
    })
    alert('Update role successfully')
    editingUserId.value = null
    editedRole.value = ''
    await refreshUsers()
  } catch (err) {
    alert('Failed to update role')
  }
}

const columns: TableColumn<User>[] = [
  { accessorKey: 'user_id', header: 'ID' },
  { accessorKey: 'first_name', header: 'First Name' },
  { accessorKey: 'last_name', header: 'Last Name' },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('div', { class: 'truncate max-w-xs', title: row.getValue('email') }, row.getValue('email'))
  },
  { accessorKey: 'phone', header: 'Phone' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const user = row.original as User
      if (editingUserId.value === user.user_id) {
        return h('select', {
          class: 'border rounded-md px-2 py-1',
          value: editedRole.value,
          onChange: (e: Event) => {
            editedRole.value = (e.target as HTMLSelectElement).value
          }
        }, roles.map(role =>
          h('option', { value: role }, role)
        ))
      } else {
        return h('span', user.role.toLowerCase())
      }
    }
  },
  {
    id: 'actions',
    header: 'Action',
    cell: ({ row }) => {
      const user = row.original as User
      const UButton = resolveComponent('UButton')

      if (editingUserId.value === user.user_id) {
        return h('div', { class: 'space-x-2' }, [
          h(UButton, {
            color: 'primary',
            onClick: () => saveEdit(user.user_id)
          }, { default: () => 'Save' }),
          h(UButton, {
            color: 'neutral',
            variant: 'outline',
            onClick: cancelEdit
          }, { default: () => 'Cancel' })
        ])
      } else {
        return h(UButton, {
          color: 'neutral',
          variant: 'outline',
          onClick: () => startEdit(user)
        }, { default: () => 'Edit' })
      }
    }
  }
]
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Users List</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load users: {{ error.message || 'Unknown error' }}
    </div>

    <div v-else-if="!users || users.length === 0" class="text-center text-gray-500 bg-gray-50 p-6 rounded-lg">
      <p class="text-lg font-medium">No users found.</p>
    </div>

    <div v-else class="flex flex-col">
      <div class="flex py-3.5 justify-between items-center">
        <UInput :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string" class="max-w-sm"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)" />
      </div>

      <UTable ref="table" v-model:column-filters="columnFilters" :data="users" :columns="columns"
        class="border border-gray-300 dark:border-gray-600 rounded-md" />
    </div>
  </div>
</template>
