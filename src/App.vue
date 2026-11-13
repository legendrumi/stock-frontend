<script setup>
import { ref, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import api from './api/axios'

const route = useRoute()
const isSidebarOpen = ref(false)
const role = ref('admin')
const pendingCount = ref(0)

const toggleTheme = () => {
  const d = document.documentElement
  const dark = d.dataset.theme ? d.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches
  d.dataset.theme = dark ? 'light' : 'dark'
}

const toggleSidebar = (open) => {
  isSidebarOpen.value = open
}

const IC = {
  squares: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  box: 'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
  arrows: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  clip: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75'
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'squares' },
  { name: 'Inventory', path: '/inventory', icon: 'box' },
  { name: 'Stock movements', path: '/movements', icon: 'arrows' },
  { name: 'Requisitions', path: '/requisitions', icon: 'clip' },
]

const pageTitle = () => {
  const found = navItems.find(item => item.path === route.path)
  return found ? found.name : 'Dashboard'
}

onMounted(async () => {
  try {
    const res = await api.getRequisitions()
    const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
    pendingCount.value = list.filter(r => r.status === 'pending').length
  } catch (e) {}
})
</script>

<template>
  <div class="flex h-full bg-bg text-ink">
    <div 
      v-if="isSidebarOpen" 
      @click="toggleSidebar(false)" 
      class="fixed inset-0 z-30 bg-black/40 md:hidden"
    ></div>

    <aside 
      class="fixed md:static inset-y-0 left-0 z-40 w-60 shrink-0 transition-transform bg-card border-r border-line flex flex-col"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
      aria-label="Primary"
    >
      <div class="px-5 py-4 font-bold text-lg flex items-center gap-2">
        <span class="grid place-items-center w-8 h-8 rounded-lg bg-brand text-white" aria-hidden="true">
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
          </svg>
        </span>
        StockRoom
      </div>
      <nav class="px-3 space-y-1 text-sm">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          @click="toggleSidebar(false)"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
          :class="route.path === item.path ? 'bg-brand text-white' : 'hover:bg-bg'"
        >
          <svg class="w-5 h-5 inline-block align-middle shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :d="IC[item.icon]"/>
          </svg>
          <span>{{ item.name }}</span>
          <span v-if="item.path === '/requisitions' && pendingCount > 0" class="ml-auto b b-warn">{{ pendingCount }}</span>
        </router-link>
      </nav>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="flex items-center gap-3 px-4 py-3 bg-card border-b border-line">
        <button @click="toggleSidebar(true)" class="btn md:hidden" aria-label="Open menu">
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          </svg>
        </button>
        <h1 class="font-semibold text-lg mr-auto">{{ pageTitle() }}</h1>
        
        <select v-model="role" class="inp !w-auto">
          <option value="admin">Admin</option>
        </select>

        <button @click="toggleTheme" class="btn" aria-label="Toggle dark mode">
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
          </svg>
        </button>
      </header>

      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
