<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [{
    label: 'Home',
    to: '/getting-started',
    icon: 'i-lucide-book-open',
    active: route.path.startsWith('/getting-started')
}, {
    label: 'Components',
    to: '/components',
    icon: 'i-lucide-box',
    active: route.path.startsWith('/components')
}, {
    label: 'Roadmap',
    icon: 'i-lucide-map',
    to: '/roadmap'
}])
</script>

<template>
    <UHeader toggle-side="left">
        <template #title>
            <a href="https://your-target-url.com" target="_blank" rel="noopener noreferrer">
                <Logo class="h-6 w-auto" />
            </a>
        </template>

        <UNavigationMenu :items="items" />

        <template #right>
            <UColorModeButton />

            <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
                <UButton color="neutral" variant="ghost" to="https://github.com/nuxt/ui" target="_blank"
                    icon="i-simple-icons-github" aria-label="GitHub" />
            </UTooltip>
        </template>

        <template #body>
            <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        </template>
    </UHeader>
</template>
