<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/axios'

const movements = ref([])
const filterType = ref('')

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const TY = { IN: 'Receive', OUT: 'Issue', ADJ: 'Adjust' }
const when = (t) => t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'

const filteredMovements = computed(() => {
  return (movements.value || []).filter(m => !filterType.value || m.type === filterType.value)
})

onMounted(async () => {
  try {
    const res = await api.getMovements()
    movements.value = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
    showToast('Movements loaded successfully from database!', 'success')
  } catch (err) {
    console.error(err)
    showToast('Error loading movements', 'error')
  }
})
</script>

<template>
  <div>
    <div v-if="toast.show" 
         class="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
         :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'">
      <span>{{ toast.message }}</span>
    </div>

    <div class="mb-4">
      <select v-model="filterType" class="inp !w-auto" aria-label="Movement type">
        <option value="">All movements</option>
        <option v-for="(lbl, k) in TY" :key="k" :value="k">{{ lbl }}</option>
      </select>
    </div>
    <div class="card p-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-mute border-b border-line">
              <th class="py-3 px-3">When</th>
              <th class="py-3 px-3">Item</th>
              <th class="py-3 px-3">Type</th>
              <th class="py-3 px-3 text-right">Qty</th>
              <th class="py-3 px-3">By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in filteredMovements" :key="m.id" class="border-t border-line">
              <td class="py-3 px-3 whitespace-nowrap">{{ when(m.created_at) }}</td>
              <td class="py-3 px-3">{{ m.item?.name || '-' }}</td>
              <td class="py-3 px-3">{{ TY[m.type] || m.type }}</td>
              <td class="py-3 px-3 text-right font-mono" :class="m.qty < 0 ? 'text-bad' : 'text-ok'">
                {{ m.qty > 0 ? '+' : '' }}{{ m.qty }}
              </td>
              <td class="py-3 px-3">{{ m.by || 'System' }}</td>
            </tr>
            <tr v-if="filteredMovements.length === 0">
              <td colspan="5" class="py-6 text-center text-sm text-mute">No movements yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
