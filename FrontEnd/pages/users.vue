<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { getPaginationRowModel } from '@tanstack/vue-table'

const router = useRouter()

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
const error = ref<string | null>(null)
const loading = ref<boolean>(false)
const userToDelete = ref<User | null>(null)
const columnFilters = ref([{ id: 'email', value: '' }])
const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const table = useTemplateRef('table')
const toast = useToast()
const showDeleteModal = ref(false)

// Compute the "Showing X to Y of Z" text
const showingText = computed(() => {
  const total = users.value.length
  const pageSize = pagination.value.pageSize
  const pageIndex = pagination.value.pageIndex
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)
  return total > 0 ? `Showing ${start} to ${end} of ${total} entries` : 'No entries to show'
})

// Fetch users data on mount
onMounted(async () => {
  token.value = localStorage.getItem('authToken')
  if (!token.value) {
    return navigateTo('/')
  }

  loading.value = true
  error.value = null
  try {
    const fetched = await $fetch<User[]>('http://localhost:3001/users', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    users.value = fetched
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Unknown error'
  } finally {
    loading.value = false
  }
})

async function confirmDeleteUser() {
  if (!userToDelete.value) return
  try {
    await $fetch(`http://localhost:3001/users/${userToDelete.value.user_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    users.value = users.value.filter(u => u.user_id !== userToDelete.value?.user_id)
    toast.add({ title: 'User deleted successfully', color: 'success' })
  } catch (err: any) {
    toast.add({
      title: 'Failed to delete user',
      description: err?.data?.message || err.message || 'Unknown error',
      color: 'error'
    })
  } finally {
    showDeleteModal.value = false
    userToDelete.value = null
  }
}

function getDropdownActions(user: User): DropdownMenuItem[] {
  return [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      onClick: () => {
        router.push(`/user/view/${user.user_id}`)
      }
    },
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onClick: () => {
        router.push(`/user/edit/${user.user_id}`)
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onClick: async () => {
        userToDelete.value = user
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
            await confirmDeleteUser()
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
  // Handle dropdown select if needed
}
// Column definitions for the table
const columns: TableColumn<User>[] = [
  {
    accessorKey: 'user_id',
    header: 'ID',
    cell: ({ row }) => {
      const userId = row.original.user_id
      return `#${userId}`
    }
  },
  { accessorKey: 'first_name', header: 'First Name' },
  { accessorKey: 'last_name', header: 'Last Name' },
  { accessorKey: 'phone', header: 'Phone' },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('div', { class: 'truncate max-w-xs', title: row.getValue('email') }, row.getValue('email'))
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const user = row.original as User
      return h('span', user.role.toLowerCase())
    }
  },
  {
    id: 'actions',
  }
]
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-3">Users</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load users data: {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-10 text-gray-500">Loading users data...</div>

    <div v-else-if="users.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <p class="text-lg font-medium">No users found.</p>
    </div>

    <div v-else>
      <UCard>
        <!-- Header -->
        <template #header>
          <div class="flex justify-between items-center">
            <UInput :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string" class="max-w-sm"
              placeholder="Filter emails..."
              @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)" />
          </div>
        </template>

        <!-- Content -->
        <UTable
          ref="table"
          v-model:column-filters="columnFilters"
          :data="users"
          :columns="columns"
          v-model:pagination="pagination"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }"
          class="border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <template #actions-cell="{ row }">
            <UDropdownMenu :items="getDropdownActions(row.original)" @select="onDropdownSelect">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Actions" />
            </UDropdownMenu>
          </template>
        </UTable>

        <!-- Footer with pagination and showing text -->
        <div class="flex items-center justify-between pt-4 w-full px-0">
          <span class="text-sm text-gray-600 pl-0">{{ showingText }}</span>
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="users.length"
            @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
            class="pr-0"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>