<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BreadcrumbItem } from '@nuxt/ui';

definePageMeta({
  layout: 'navbar2',
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

// Initialize breadcrumb with a placeholder for petId
const items = ref<BreadcrumbItem[]>([
  { label: 'Medical Records', icon: 'i-lucide-file-text', to: '/medicalRecord' },
  { label: 'Record Details', icon: 'i-lucide-eye', to: '' },
]);

onMounted(async () => {
  token.value = localStorage.getItem('authToken');
  if (!token.value) {
    toast.add({ title: 'Please log in to continue', color: 'error' });
    return navigateTo('/login');
  }

  await fetchRecord();
});

// Watch for changes in record.value to update breadcrumb
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

function goBack() {
  router.push('/medicalRecord')
}

function editRecord() {
  if (record.value) {
    router.push(`/medicalRecord/edit/${record.value.record_id}`)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="space-y-6">
      <h1 class="text-xl font-semibold text-gray-900 mb-5">Medical Record Details</h1>
      <div class="flex justify-between items-center">
  <UBreadcrumb :items="items" />
  <!-- Action Buttons -->
  <div class="flex justify-end gap-3">
    <UButton 
      label="Edit Record" 
      color="primary" 
      icon="i-lucide-edit"
      @click="editRecord" 
    />
  </div>
</div>


      <div v-if="loading" class="text-center py-10">
        <div class="text-gray-500">Loading medical record...</div>
      </div>

      <div v-else-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-4 rounded-md">
        {{ error }}
      </div>

      <div v-else-if="record" class="space-y-6">
        <!-- Visit Information -->
        <UPageCard title="Visit Information" description="General information about this medical visit.">
          <UForm :state="record" class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Visit Date" name="visit_date" class="w-full md:w-1/2">
                <UInput :model-value="formatDateTime(record.visit_date)" readonly class="w-full" />
              </UFormField>

              <UFormField label="Record ID" name="record_id" class="w-full md:w-1/2">
                <UInput :model-value="record.record_id.toString()" readonly class="w-full" />
              </UFormField>
            </div>
          </UForm>
        </UPageCard>

        <!-- Pet Information -->
        <UPageCard title="Pet Information" description="Details about the pet for this medical record.">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Left: Pet Image -->
            <div class="w-full md:w-1/2 flex justify-center items-center">
              <img v-if="record.pet?.image_url" :src="record.pet.image_url" alt="Pet Image"
                class="w-full h-auto max-h-64 object-cover rounded-md" />
              <div v-else class="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md text-gray-500">
                No image available
              </div>
            </div>

            <!-- Right: Pet Details -->
            <div class="w-full md:w-1/2">
              <UForm :state="record" class="space-y-4">
                <!-- Row: Pet Name + Breed -->
                <div class="flex flex-col md:flex-row gap-4">
                  <UFormField label="Pet Name" name="pet_name" class="w-full md:w-1/2">
                    <UInput :model-value="record.pet?.pet_name || 'Unknown Pet'" readonly class="w-full" />
                  </UFormField>

                  <UFormField label="Breed" name="breed_name" class="w-full md:w-1/2">
                    <UInput :model-value="record.pet?.breed_name || 'Not specified'" readonly class="w-full" />
                  </UFormField>
                </div>

                <!-- Row: Age + Gender -->
                <div class="flex flex-col md:flex-row gap-4">
                  <UFormField label="Age" name="age" class="w-full md:w-1/2">
                    <UInput
                      :model-value="record.pet?.birth_date ? `${calculateAge(record.pet.birth_date)} years old` : 'Not specified'"
                      readonly class="w-full" />
                  </UFormField>

                  <UFormField label="Gender" name="gender" class="w-full md:w-1/2">
                    <UInput :model-value="record.pet?.gender || 'Not specified'" readonly class="w-full" />
                  </UFormField>
                </div>

                <!-- Row: Weight + Birth Date -->
                <div class="flex flex-col md:flex-row gap-4">
                  <UFormField label="Weight" name="weight" class="w-full md:w-1/2">
                    <UInput :model-value="record.pet?.weight ? `${record.pet.weight} kg` : 'Not specified'" readonly
                      class="w-full" />
                  </UFormField>

                  <UFormField label="Birth Date" name="birth_date" class="w-full md:w-1/2">
                    <UInput :model-value="record.pet?.birth_date ? formatDate(record.pet.birth_date) : 'Not specified'"
                      readonly class="w-full" />
                  </UFormField>
                </div>
              </UForm>
            </div>
          </div>
        </UPageCard>

        <!-- Owner Information -->
        <UPageCard v-if="record.pet?.owner" title="Owner Information" description="Information about the pet owner.">
          <UForm :state="record" class="space-y-4">
            <!-- Row: Owner Name -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="First Name" name="owner_first_name" class="w-full md:w-1/2">
                <UInput :model-value="record.pet.owner.first_name" readonly class="w-full" />
              </UFormField>

              <UFormField label="Last Name" name="owner_last_name" class="w-full md:w-1/2">
                <UInput :model-value="record.pet.owner.last_name" readonly class="w-full" />
              </UFormField>
            </div>

            <!-- Row: Email + Phone -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Email" name="owner_email" class="w-full md:w-1/2">
                <UInput :model-value="record.pet.owner.email" readonly class="w-full" />
              </UFormField>

              <UFormField label="Phone" name="owner_phone" class="w-full md:w-1/2">
                <UInput :model-value="record.pet.owner.phone || 'Not provided'" readonly class="w-full" />
              </UFormField>
            </div>

            <!-- Address -->
            <UFormField label="Address" name="owner_address">
              <UTextarea :model-value="record.pet.owner.address || 'Not provided'" readonly class="w-full" />
            </UFormField>
          </UForm>
        </UPageCard>

        <!-- Veterinarian Information -->
        <UPageCard title="Veterinarian Information" description="Information about the attending veterinarian.">
          <UForm :state="record" class="space-y-4">
            <!-- Row: Doctor Name -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="First Name" name="vet_first_name" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.user?.first_name || 'Unknown'" readonly class="w-full" />
              </UFormField>

              <UFormField label="Last Name" name="vet_last_name" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.user?.last_name || 'Unknown'" readonly class="w-full" />
              </UFormField>
            </div>

            <!-- Row: License + Experience -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="License Number" name="license_number" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.license_number || 'Not provided'" readonly class="w-full" />
              </UFormField>

              <UFormField label="Experience" name="experience" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.experience ? `${record.vet.experience} years` : 'Not specified'"
                  readonly class="w-full" />
              </UFormField>
            </div>

            <!-- Row: Education + Email -->
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Education" name="education" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.education || 'Not provided'" readonly class="w-full" />
              </UFormField>

              <UFormField label="Email" name="vet_email" class="w-full md:w-1/2">
                <UInput :model-value="record.vet?.user?.email || 'Not provided'" readonly class="w-full" />
              </UFormField>
            </div>

            <!-- Phone -->
            <UFormField label="Phone" name="vet_phone">
              <UInput :model-value="record.vet?.user?.phone || 'Not provided'" readonly class="w-full" />
            </UFormField>
          </UForm>
        </UPageCard>

        <!-- Medical Details -->
        <UPageCard title="Medical Details" description="Detailed medical information and treatment records.">
          <UForm :state="record" class="space-y-4">
            <!-- Symptoms -->
            <UFormField label="Symptoms" name="symptoms">
              <UTextarea :model-value="record.symptoms || 'No symptoms recorded'" readonly class="w-full" />
            </UFormField>

            <!-- Diagnosis -->
            <UFormField label="Diagnosis" name="diagnosis">
              <UTextarea :model-value="record.diagnosis || 'No diagnosis recorded'" readonly class="w-full" />
            </UFormField>

            <!-- Treatment -->
            <UFormField label="Treatment" name="treatment">
              <UTextarea :model-value="record.treatment || 'No treatment recorded'" readonly class="w-full" />
            </UFormField>

            <!-- Medication -->
            <UFormField label="Medication" name="medication">
              <UTextarea :model-value="record.medication || 'No medication prescribed'" readonly class="w-full" />
            </UFormField>

            <!-- Notes -->
            <UFormField v-if="record.notes" label="Additional Notes" name="notes">
              <UTextarea :model-value="record.notes" readonly class="w-full" />
            </UFormField>
          </UForm>
        </UPageCard>

        <!-- Record Timestamps -->
        <UPageCard title="Record Information" description="Information about when this record was created and updated.">
          <UForm :state="record" class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
              <UFormField label="Created At" name="createdAt" class="w-full md:w-1/2">
                <UInput :model-value="formatDateTime(record.createdAt)" readonly class="w-full" />
              </UFormField>

              <UFormField label="Updated At" name="updatedAt" class="w-full md:w-1/2">
                <UInput :model-value="record.updatedAt ? formatDateTime(record.updatedAt) : 'Never updated'" readonly
                  class="w-full" />
              </UFormField>
            </div>
          </UForm>
        </UPageCard>
      </div>

      <!-- Not Found State -->
      <div v-else class="text-center py-10">
        <div class="text-gray-500 mb-4">Medical record not found</div>
        <UButton label="Back to Records" color="primary" variant="outline" @click="router.push('/medicalRecord')" />
      </div>
    </div>
  </div>
</template>