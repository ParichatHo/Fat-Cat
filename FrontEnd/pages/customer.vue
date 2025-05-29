<script setup>
import { ref } from 'vue'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const { data: owners, error, refresh } = await useAsyncData('owners', () =>
  $fetch('http://localhost:3001/owners')
)
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h2 class="text-2xl font-semibold text-gray-900 mb-6">Owners List</h2>

    <div v-if="error" class="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md mb-4">
      Failed to load owners data.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-5 py-3 text-sm font-semibold text-gray-600 tracking-wide border-b border-gray-200">
              ID
            </th>
            <th class="text-left px-5 py-3 text-sm font-semibold text-gray-600 tracking-wide border-b border-gray-200">
              First Name
            </th>
            <th class="text-left px-5 py-3 text-sm font-semibold text-gray-600 tracking-wide border-b border-gray-200">
              Last Name
            </th>
            <th class="text-left px-5 py-3 text-sm font-semibold text-gray-600 tracking-wide border-b border-gray-200">
              Phone
            </th>
            <th class="text-left px-5 py-3 text-sm font-semibold text-gray-600 tracking-wide border-b border-gray-200">
              Email
            </th>
            <th class="text-left px-5 py-3 text-sm font-semibold text-gray-600 tracking-wide border-b border-gray-200">
              Address
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="owner in owners"
            :key="owner.owner_id"
            class="text-gray-700 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
          >
            <td class="px-5 py-3 text-sm border-b border-gray-200">{{ owner.owner_id }}</td>
            <td class="px-5 py-3 text-sm border-b border-gray-200">{{ owner.first_name }}</td>
            <td class="px-5 py-3 text-sm border-b border-gray-200">{{ owner.last_name }}</td>
            <td class="px-5 py-3 text-sm border-b border-gray-200">{{ owner.phone }}</td>
            <td class="px-5 py-3 text-sm border-b border-gray-200 truncate max-w-xs" title="{{ owner.email }}">{{ owner.email }}</td>
            <td class="px-5 py-3 text-sm border-b border-gray-200 truncate max-w-lg" title="{{ owner.address }}">{{ owner.address }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
