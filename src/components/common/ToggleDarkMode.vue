<script setup>
import { ref, onMounted } from 'vue'
import { Moon, Sun } from '@lucide/vue'

const isDark = ref(false)

function toggleDarkMode() {
    isDark.value = !isDark.value

    document.documentElement.classList.toggle(
        'dark',
        isDark.value
    )

    document.documentElement.setAttribute(
        'data-theme',
        isDark.value ? 'dark' : 'light'
    )

    localStorage.setItem(
        'theme',
        isDark.value ? 'dark' : 'light'
    )
}

onMounted(() => {
    const theme = localStorage.getItem('theme')

    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        isDark.value = true
        document.documentElement.classList.add('dark')
        document.documentElement.setAttribute('data-theme', 'dark')
    }
})
</script>

<template>
    <button @click="toggleDarkMode"
        class="relative h-8 w-16 rounded-full bg-gray-200 transition-colors dark:bg-gray-700 cursor-pointer border border-[var(--line)]"
        aria-label="Toggle dark mode">
        <div class="absolute top-1 left-1 flex h-6 w-6 items-center justify-center 
        rounded-full bg-white dark:bg-gray-900 shadow-md
        transition-transform" :class="{ 'translate-x-8': isDark }">
            <span v-if="isDark" class="flex items-center justify-center">
                <Moon :size="16" fill="#FFF" color="#FFF" />
            </span>
            <span v-else class="flex items-center justify-center">
                <Sun :size="16" fill="#EAB308" color="#EAB308" />
            </span>
        </div>
    </button>
</template>

<style scoped></style>
