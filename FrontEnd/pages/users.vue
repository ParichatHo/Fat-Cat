<script setup>
import { ref } from 'vue'

definePageMeta({
  layout: 'navbar',
  middleware: 'auth'
})

const roles = ['VETERINARIAN', 'STAFF']

const { data: users, error, refresh } = await useAsyncData('users', () =>
  $fetch('http://localhost:3001/users')
)

const editingUserId = ref(null)
const editedRole = ref('')

const startEdit = (user) => {
  editingUserId.value = user.user_id
  editedRole.value = user.role
}

const cancelEdit = () => {
  editingUserId.value = null
  editedRole.value = ''
}

const saveEdit = async (userId) => {
  try {
    await $fetch(`http://localhost:3001/users/${userId}`, {
      method: 'PUT',
      body: { role: editedRole.value },
    })
    alert('Update role successfully')
    editingUserId.value = null
    editedRole.value = ''
    refresh()
  } catch (err) {
    alert('Failed to update role')
  }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-3xl font-semibold mb-8 text-gray-800">Users List</h1>

    <div v-if="error" class="text-red-500 font-medium">Error loading users.</div>
    <div v-else-if="!users || users.length === 0" class="text-gray-500">No users found.</div>

    <table v-else class="w-full border-collapse rounded-md overflow-hidden shadow-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">ID</th>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">First Name</th>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">Last Name</th>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">Email</th>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">Phone</th>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">Role</th>
          <th class="text-left px-4 py-3 text-gray-600 text-sm font-medium">Action</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100">
        <tr v-for="user in users" :key="user.user_id" class="hover:bg-gray-50 transition-colors duration-150">
          <td class="px-4 py-3 text-gray-700 text-sm">{{ user.user_id }}</td>
          <td class="px-4 py-3 text-gray-700 text-sm">{{ user.first_name }}</td>
          <td class="px-4 py-3 text-gray-700 text-sm">{{ user.last_name }}</td>
          <td class="px-4 py-3 text-gray-700 text-sm truncate max-w-[180px]" :title="user.email">{{ user.email }}</td>
          <td class="px-4 py-3 text-gray-700 text-sm">{{ user.phone }}</td>
          <td class="px-4 py-3 text-gray-700 text-sm font-medium">
            <template v-if="editingUserId === user.user_id">
              <select v-model="editedRole"
                class="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
            </template>
            <template v-else>
              <span class="capitalize">{{ user.role.toLowerCase() }}</span>
            </template>
          </td>
          <td class="px-4 py-3 text-sm space-x-2">
            <template v-if="editingUserId === user.user_id">
              <button @click="saveEdit(user.user_id)"
                class="bg-primary text-white rounded-md px-3 py-1 hover:primary-700 transition">
                Save
              </button>
              <button @click="cancelEdit"
                class="bg-gray-300 text-gray-700 rounded-md px-3 py-1 hover:bg-gray-400 transition">
                Cancel
              </button>
            </template>
            <template v-else>
              <button @click="startEdit(user)"
                class="bg-gray-100 text-gray-700 rounded-md px-3 py-1 hover:bg-gray-200 transition">
                Edit
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
