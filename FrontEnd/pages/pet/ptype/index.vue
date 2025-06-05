<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import type { TableColumn, DropdownMenuItem, BreadcrumbItem } from '@nuxt/ui'
import Swal from 'sweetalert2';

definePageMeta({
    layout: 'navbar',
    middleware: 'auth'
})

type PetType = {
    type_id: number
    type_name: string
    description: string
}

const items = ref<BreadcrumbItem[]>([
    { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
    { label: 'Pet Types', icon: 'i-lucide-dog', to: '/pet/ptype' }
])

const router = useRouter()
const token = ref<string | null>(null)
const petTypes = ref<PetType[]>([])
const error = ref<string | null>(null)
const loading = ref<boolean>(false)
const toast = useToast()

const showDeleteModal = ref(false)
const petTypeToDelete = ref<PetType | null>(null)

const table = useTemplateRef('table')
const columnFilters = ref([{ id: 'type_name', value: '' }])

const columns: TableColumn<PetType>[] = [
    {
        accessorKey: 'type_id',
        header: 'ID',
        cell: ({ row }) => h('span', { class: 'text-gray-500' }, `#${row.getValue('type_id')}`)
    },
    {
        accessorKey: 'type_name',
        header: 'Type Name',
        cell: ({ row }) =>
            h('div', { class: 'truncate max-w-sm', title: row.getValue('type_name') }, row.getValue('type_name'))
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) =>
            h('div', { class: 'truncate max-w-sm', title: row.getValue('description') }, row.getValue('description'))
    },
    {
        id: 'actions',
        header: 'Action',
    }
]

function createPetType() {
    router.push('/pet/ptype/create')
}

function getDropdownActions(ptype: PetType): DropdownMenuItem[] {
    return [
        {
            label: 'View',
            icon: 'i-lucide-eye',
            onClick: () => router.push(`/pet/ptype/view/${ptype.type_id}`)
        },
        {
            label: 'Edit',
            icon: 'i-lucide-edit',
            onClick: () => router.push(`/pet/ptype/edit/${ptype.type_id}`)
        },
        {
            label: 'Delete',
            icon: 'i-lucide-trash',
            color: 'error',
            onClick: async () => {
                petTypeToDelete.value = ptype
                Swal.fire({
                    title: "Delete this pet type?",
                    html: `Are you sure you want to delete <strong>${ptype.type_name}</strong>?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#00C16A",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Yes, delete",
                    cancelButtonText: "Cancel"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await confirmDeletePetType()
                        Swal.fire({
                            title: "Deleted",
                            html: `<strong>${ptype.type_name}</strong> has been deleted.`,
                            icon: "success",
                            confirmButtonColor: "#00C16A"
                        });
                    }
                });
            }
        }
    ]
}

async function confirmDeletePetType() {
    if (!petTypeToDelete.value) return
    try {
        await $fetch(`http://localhost:3001/ptypes/${petTypeToDelete.value.type_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token.value}` }
        })
        petTypes.value = petTypes.value.filter(p => p.type_id !== petTypeToDelete.value?.type_id)
        toast.add({ title: 'Pet type deleted successfully', color: 'success' })
    } catch (err: any) {
        toast.add({
            title: 'Failed to delete pet type',
            description: err?.data?.message || err.message || 'Unknown error',
            color: 'error'
        })
    } finally {
        showDeleteModal.value = false
        petTypeToDelete.value = null
    }
}

onMounted(async () => {
    token.value = localStorage.getItem('authToken')
    if (!token.value) return navigateTo('/')
    loading.value = true
    try {
        const data = await $fetch<PetType[]>('http://localhost:3001/ptypes', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        petTypes.value = data
    } catch (err: any) {
        error.value = err?.data?.message || err.message || 'Unknown error'
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="p-6 mx-auto" style="max-width: 750px;">

        <h1 class="text-2xl font-semibold text-gray-900 mb-6">Pet Types</h1>
        <!-- Breadcrumb -->
        <UBreadcrumb :items="items" class="mb-6" />
        <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
            Failed to load pet types: {{ error }}
        </div>

        <div v-else-if="loading" class="text-center py-10 text-gray-500">Loading pet types...</div>

        <div v-else-if="petTypes.length === 0"
            class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <p class="text-lg font-medium">No pet types found.</p>
        </div>

        <div v-else>
            <UCard>
                <!-- Header -->
                <template #header>
                    <div class="flex justify-between items-center">
                        <UInput :model-value="table?.tableApi?.getColumn('type_name')?.getFilterValue() as string"
                            class="max-w-sm" placeholder="Filter pet types..."
                            @update:model-value="table?.tableApi?.getColumn('type_name')?.setFilterValue($event)" />
                        <UButton label="Add Pet Type" color="primary" @click="createPetType" icon="i-lucide-plus" />
                    </div>
                </template>

                <!-- Content -->
                <UTable ref="table" v-model:column-filters="columnFilters" :data="petTypes" :columns="columns"
                    class="border border-gray-300 dark:border-gray-600 rounded-md mt-4">
                    <template #actions-cell="{ row }">
                        <UDropdownMenu :items="getDropdownActions(row.original)">
                            <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost"
                                aria-label="Actions" />
                        </UDropdownMenu>
                    </template>
                </UTable>
            </UCard>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div
                class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-lg shadow-lg ring ring-gray-200 dark:ring-gray-700 p-6 animate-scale-in">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</h2>
                    <button @click="showDeleteModal = false"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <span class="sr-only">Close</span>
                        <i class="i-lucide-x w-5 h-5"></i>
                    </button>
                </div>
                <div class="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete
                    <strong>{{ petTypeToDelete?.type_name }}</strong>?
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button @click="showDeleteModal = false"
                        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-md transition">
                        Cancel
                    </button>
                    <button @click="confirmDeletePetType"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
