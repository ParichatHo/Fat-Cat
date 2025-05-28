<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Home',
  to: '/getting-started',
  icon: 'i-lucide-home',
},
{
  label: 'Appointment',
  to: '/getting-started',
  icon: 'i-lucide-calendar-clock',
}])
</script>

<template>
  <UHeader toggle-side="left">
    <template #title>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />


    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
