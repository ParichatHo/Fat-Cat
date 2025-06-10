<script setup lang="ts">
import { ref, onMounted, h, computed, watch } from 'vue';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();
const toast = useToast();
const globalFilter = ref('');

definePageMeta({
  layout: 'navbar2',
  middleware: 'auth',
});

type Appointment = {
  appointment_id: number;
  record_id: number;
  vet_id: number;
  appointment_date: string;
  note: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string | null;
  rec?: {
    record_id: number;
    pet_id: number;
    pet?: {
      pet_name: string;
    };
  };
  vet?: {
    vet_id: number;
    user_id: number;
    user?: {
      user_id: number;
      first_name: string;
      last_name: string;
    };
  };
};

const pagination = ref({
  pageIndex: 0,
  pageSize: 5,
});

const token = ref<string | null>(null);
const appointments = ref<Appointment[]>([]);
const error = ref<string | null>(null);
const loading = ref<boolean>(false);
const appointmentToDelete = ref<Appointment | null>(null);

// Filter appointments based on globalFilter
const filteredAppointments = computed(() => {
  if (!appointments.value) return [];
  const keyword = globalFilter.value.toLowerCase();
  return appointments.value.filter((appointment) =>
    [
      appointment.rec?.pet?.pet_name || `Pet ID ${appointment.rec?.pet_id || appointment.record_id}`,
      appointment.vet?.user
        ? `${appointment.vet.user.first_name} ${appointment.vet.user.last_name}`
        : `Vet ID ${appointment.vet_id}`,
      appointment.note || '',
      appointment.status,
      new Date(appointment.appointment_date).toLocaleString(),
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(keyword))
  );
});

// Compute paginated appointments
const paginatedAppointments = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return filteredAppointments.value.slice(start, end);
});

// Compute the "Showing X to Y of Z" text
const showingText = computed(() => {
  const total = filteredAppointments.value.length;
  const pageSize = pagination.value.pageSize;
  const pageIndex = pagination.value.pageIndex;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);
  return total > 0 ? `Showing ${start} to ${end} of ${total} entries` : 'No entries to show';
});

// Reset pagination when globalFilter changes
const resetPagination = () => {
  pagination.value.pageIndex = 0;
};

// Watch globalFilter to reset pagination
watch(globalFilter, () => {
  resetPagination();
});

onMounted(async () => {
  token.value = localStorage.getItem('authToken');
  if (!token.value) {
    toast.add({ title: 'Please log in to continue', color: 'error' });
    return navigateTo('/login');
  }

  loading.value = true;
  error.value = null;
  try {
    const data = await $fetch<Appointment[]>('http://localhost:3001/appts?include=rec,vet,user', {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    console.log('API Response:', data);
    appointments.value = data;
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to load appointments';
    console.error('API Error:', err);
    toast.add({
      title: 'Failed to load appointments',
      description: error.value ?? 'Unknown error occurred',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
});

async function confirmDeleteAppointment() {
  if (!appointmentToDelete.value) return;
  try {
    await $fetch(`http://localhost:3001/appts/${appointmentToDelete.value.appointment_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` },
    });
    appointments.value = appointments.value.filter(
      (appointment) => appointment.appointment_id !== appointmentToDelete.value!.appointment_id
    );
    toast.add({
      title: 'Success',
      description: 'Appointment deleted successfully',
      color: 'success',
    });
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to delete appointment';
    toast.add({
      title: 'Failed to delete appointment',
      description: error.value ?? 'Unknown error occurred',
      color: 'error',
    });
  } finally {
    appointmentToDelete.value = null;
  }
}

function getDropdownActions(appointment: Appointment): DropdownMenuItem[] {
  return [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      onClick: () => {
        router.push(`/appointment/view/${appointment.appointment_id}`);
      },
    },
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onClick: () => {
        router.push(`/appointment/edit/${appointment.appointment_id}`);
      },
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onClick: async () => {
        appointmentToDelete.value = appointment;
        Swal.fire({
          title: 'Delete this appointment?',
          html: `Are you sure you want to delete the appointment for <strong>${
            appointment.rec?.pet?.pet_name || `Pet ID ${appointment.rec?.pet_id || appointment.record_id}`
          }</strong> on <strong>${new Date(appointment.appointment_date).toLocaleDateString()}</strong>?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#00C16A',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete',
          cancelButtonText: 'Cancel',
        }).then(async (result) => {
          if (result.isConfirmed) {
            await confirmDeleteAppointment();
            Swal.fire({
              title: 'Deleted',
              html: `Appointment for <strong>${
                appointment.rec?.pet?.pet_name || `Pet ID ${appointment.rec?.pet_id || appointment.record_id}`
              }</strong> has been deleted.`,
              icon: 'success',
              confirmButtonColor: '#00C16A',
            });
          }
        });
      },
    },
  ];
}

const columns: TableColumn<Appointment>[] = [
  {
    accessorKey: 'appointment_id',
    header: 'ID',
    cell: ({ row }) => `#${row.original.appointment_id}`,
  },
  {
    accessorKey: 'pet_name',
    header: 'Pet Name',
    cell: ({ row }) => row.original.rec?.pet?.pet_name || `Pet ID ${row.original.rec?.pet_id || row.original.record_id}`,
  },
  {
    accessorKey: 'vet',
    header: 'Veterinarian',
    cell: ({ row }) =>
      row.original.vet?.user
        ? `${row.original.vet.user.first_name} ${row.original.vet.user.last_name}`
        : `Vet ID ${row.original.vet_id}`,
  },
  {
    accessorKey: 'appointment_date',
    header: 'Appointment Date',
    cell: ({ row }) => new Date(row.getValue('appointment_date')).toLocaleString(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => row.getValue('status'),
  },
  {
    accessorKey: 'note',
    header: 'Note',
    cell: ({ row }) =>
      h('div', { class: 'truncate max-w-xs', title: row.getValue('note') || '' }, row.getValue('note') || 'No note'),
  },
  {
    id: 'actions',
  },
];

const createAppointment = () => {
  navigateTo('/appointment/create');
};
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 mb-3">Appointments</h1>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load appointments data: {{ error }}
    </div>

    <div v-else-if="loading" class="text-center py-10 text-gray-500">
      Loading appointments data...
    </div>

    <div v-else-if="appointments.length === 0" class="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <p class="text-lg font-medium">No appointments found.</p>
    </div>

    <div v-else>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <UInput
              :model-value="globalFilter"
              class="max-w-sm"
              placeholder="Search appointments..."
              @update:model-value="globalFilter = $event"
            />
            <UButton
              label="New Appointment"
              color="primary"
              @click="createAppointment"
              icon="i-lucide-plus"
            />
          </div>
        </template>

        <UTable
          :data="paginatedAppointments"
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
            :total="filteredAppointments.length"
            @update:page="(p) => pagination.pageIndex = p - 1"
            class="pr-0"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>