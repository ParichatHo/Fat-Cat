<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BreadcrumbItem } from '@nuxt/ui';

definePageMeta({
  layout: 'navbar',
  middleware: 'auth',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const recordId = route.params.id as string;

type MedicalRecord = {
  record_id: number;
  pet_id: number;
  vet_id: number;
  visit_date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  medication: string;
  notes: string;
  status: string;
  appointment_date: string;
  createdAt: string;
  updatedAt: string | null;
  pet?: {
    pet_id: number;
    pet_name: string;
    birth_date: string;
    breed_name: string;
    gender: string;
    owner_id: number;
    type_id: number;
    image_url: string;
    weight: number;
    createdAt: string;
    updatedAt: string;
    owner?: {
      owner_id: number;
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
      address: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  vet?: {
    vet_id: number;
    license_number: string;
    experience: number;
    education: string;
    user_id: number;
    createdAt: string;
    updatedAt: string;
    user?: {
      user_id: number;
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      phone: string;
      role: string;
      image_url: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

const record = ref<MedicalRecord | null>(null);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const token = ref<string | null>(null);

const items = ref<BreadcrumbItem[]>([
    { label: 'Pets', icon: 'i-lucide-paw-print', to: '/pet' },
    { label: 'View Pet Detail', icon: 'i-lucide-eye', to: '' }, // Placeholder
    { label: 'Record Details', icon: 'i-lucide-eye', to: '' },
]);

onMounted(async () => {
  token.value = localStorage.getItem('authToken');
  if (!token.value) {
    toast.add({ title: 'Please log in to continue', color: 'error' });
    return navigateTo('/');
  }

  await fetchRecord();
});

watch(record, (newRecord) => {
  if (newRecord?.pet?.pet_id) {
    items.value[1].to = `/pet/view/${newRecord.pet.pet_id}`;
  }
});

async function fetchRecord() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<MedicalRecord>(`http://localhost:3001/recs/${recordId}?include=pet,vet,user`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    console.log('Medical Record Data:', data);
    record.value = data;
  } catch (err: any) {
    error.value = err?.data?.message || err.message || 'Failed to load medical record';
    console.error('API Error:', err);
    toast.add({
      title: 'Error',
      description: error.value ?? 'Unknown error occurred',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function formatDisplayDateTime(dateString: string): string {
  if (!dateString) return 'No appointment';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formatting display datetime:', error);
    return 'Invalid date';
  }
}

function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return 'Not provided';

  // ลบอักขระที่ไม่ใช่ตัวเลข
  const digits = phone.replace(/\D/g, '');

  // ตรวจสอบว่ามีตัวเลขครบ 10 ตัวหรือไม่
  if (digits.length !== 10) return phone; // ถ้าไม่ครบ 10 ตัว คืนค่าเดิม

  // จัดรูปแบบเป็น xxx-xxx-xxxx
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type Status = 'completed' | 'scheduled' | 'cancelled';
type BadgeColor = 'success' | 'info' | 'error' | 'neutral' | undefined;

function getStatusColor(status: string): BadgeColor {
  const statusColors: Record<Status, BadgeColor> = {
    completed: 'success',
    scheduled: 'info',
    cancelled: 'error',
  };
  const normalizedStatus = status.toLowerCase();
  return normalizedStatus in statusColors ? statusColors[normalizedStatus as Status] : 'neutral';
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-5">Medical Record Details</h1>
      <div class="flex justify-between items-center">
        <UBreadcrumb :items="items" />
      </div>

      <div v-if="loading" class="text-center py-10">
        <div class="text-gray-500">Loading medical record...</div>
      </div>

      <div v-else-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-4 rounded-md">
        {{ error }}
      </div>

      <div v-else-if="record" class="space-y-6">
        <UPageCard title="Visit Information" description="General information about this medical visit.">
          <UForm :state="record" class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Visit Date" name="visit_date" class="w-full">
                <UInput :model-value="formatDisplayDateTime(record.visit_date)" readonly class="w-full" />
              </UFormField>
              <UFormField label="Record ID" name="record_id" class="w-full">
                <UInput :model-value="record.record_id.toString()" readonly class="w-full" />
              </UFormField>
            </div>
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Appointment Date" name="appointment_date" class="w-full">
                <UInput
                  :model-value="record.appointment_date ? formatDisplayDateTime(record.appointment_date) : 'No appointment'"
                  readonly
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status" name="status" class="w-full">
                <div class="flex items-center">
                  <UBadge :color="getStatusColor(record.status || 'No Status')" variant="subtle" class="capitalize">
                    {{ (record.status || 'No Status').charAt(0).toUpperCase() + (record.status || 'No Status').slice(1).toLowerCase() }}
                  </UBadge>
                </div>
              </UFormField>
            </div>
          </UForm>
        </UPageCard>

        <UPageCard title="Veterinarian Information" description="Information about the attending veterinarian.">
          <UForm :state="record" class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="First Name" name="vet_first_name" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.user?.first_name || 'Unknown'" readonly class="w-full" />
              </UFormField>
              <UFormField label="Last Name" name="vet_last_name" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.user?.last_name || 'Unknown'" readonly class="w-full" />
              </UFormField>
            </div>
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="License Number" name="license_number" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.license_number || 'Not provided'" readonly class="w-full" />
              </UFormField>
              <UFormField label="Experience" name="experience" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.experience ? `${record.vet.experience} years` : 'Not specified'"
                  readonly class="w-full" />
              </UFormField>
            </div>
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Education" name="education" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.education || 'Not provided'" readonly class="w-full" />
              </UFormField>
              <UFormField label="Email" name="vet_email" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.user?.email || 'Not provided'" readonly class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Phone" name="vet_phone">
              <UInput :model-value="formatPhoneNumber(record.vet?.user?.phone)" readonly class="w-full" />
            </UFormField>
          </UForm>
        </UPageCard>

        <UPageCard title="Medical Details" description="Detailed medical information and treatment records.">
          <UForm :state="record" class="space-y-4">
            <UFormField label="Symptoms" name="symptoms">
              <UTextarea :model-value="record.symptoms || 'No symptoms recorded'" readonly class="w-full" />
            </UFormField>
            <UFormField label="Diagnosis" name="diagnosis">
              <UTextarea :model-value="record.diagnosis || 'No diagnosis recorded'" readonly class="w-full" />
            </UFormField>
            <UFormField label="Treatment" name="treatment">
              <UTextarea :model-value="record.treatment || 'No treatment recorded'" readonly class="w-full" />
            </UFormField>
            <UFormField label="Medication" name="medication">
              <UTextarea :model-value="record.medication || 'No medication prescribed'" readonly class="w-full" />
            </UFormField>
            <UFormField v-if="record.notes" label="Additional Notes" name="notes">
              <UTextarea :model-value="record.notes" readonly class="w-full" />
            </UFormField>
          </UForm>
        </UPageCard>

        <UPageCard title="Record Information" description="Information about when this record was created and updated.">
          <UForm :state="record" class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Created At" name="createdAt" class="w-full md:w-1/2">
                <UInput :model-value="formatDisplayDateTime(record.createdAt)" readonly class="w-full" />
              </UFormField>
              <UFormField label="Updated At" name="updatedAt" class="w-full md:w-1/2">
                <UInput :model-value="record.updatedAt ? formatDisplayDateTime(record.updatedAt) : 'Never updated'" readonly
                  class="w-full" />
              </UFormField>
            </div>
          </UForm>
        </UPageCard>
      </div>

      <div v-else class="text-center py-10">
        <div class="text-gray-500 mb-4">Medical record not found</div>
        <UButton label="Back to Records" color="primary" variant="outline" @click="router.push('/medicalRecord')" />
      </div>
    </div>
  </div>
</template>