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
},
{
    label: 'Customer',
    to: '/getting-started',
    icon: 'i-lucide-users',
},
{
    label: 'Pet',
    to: '/getting-started',
    icon: 'i-lucide-paw-print',
}])
</script>

<template>
    <UHeader toggle-side="left">
        <template #title>
            <img src="~/assets/img/logo5.png" alt="Logo" class="w-auto h-23 mt-1" />
        </template>

        <UNavigationMenu :items="items" />

        <template #right>
            <UColorModeButton />
            <UButton size="md" color="neutral" variant="outline"> Logout
            </UButton>
        </template>

        <template #body>
            <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        </template>
    </UHeader>
    <slot />
</template>
