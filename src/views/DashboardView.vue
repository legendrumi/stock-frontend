<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/axios'

const items = ref([])
const categories = ref([])
const movements = ref([])
const requisitions = ref([])

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const usd = (n) => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const st = (i) => i.qty <= 0 ? 'out' : i.qty <= (i.min || 5) ? 'low' : 'ok'

const categoryValues = computed(() => {
  const list = categories.value.map(cat => {
    const val = items.value
      .filter(i => (i.category?.name || i.cat) === cat.name)
      .reduce((s, i) => s + (i.qty * (i.cost || 0)), 0)
    return { id: cat.id, name: cat.name, val }
  })
  const maxVal = Math.max(...list.map(x => x.val), 1)
  return list.map(x => ({ ...x, pct: (x.val / maxVal) * 100 }))
})

onMounted(async () => {
  try {
    const [resItems, resCat, resMov, resReq] = await Promise.all([
      api.getItems(),
      api.getCategories(),
      api.getMovements(),
      api.getRequisitions()
    ])
    items.value = resItems?.data?.data || (Array.isArray(resItems?.data) ? resItems.data : [])
    categories.value = resCat?.data?.data || (Array.isArray(resCat?.data) ? resCat.data : [])
    movements.value = resMov?.data?.data || (Array.isArray(resMov?.data) ? resMov.data : [])
    requisitions.value = resReq?.data?.data || (Array.isArray(resReq?.data) ? resReq.data : [])
    showToast('Dashboard data loaded successfully!', 'success')
  } catch (err) {
    console.error(err)
    showToast('Error loading dashboard data', 'error')
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

    <div class="grid gap-4 grid-cols-2 xl:grid-cols-4">
      <div class="card p-4">
        <p class="text-xs text-mute">Items tracked</p>
        <p class="text-2xl font-bold mt-1">{{ items.length }}</p>
        <p class="text-xs text-mute mt-1">in {{ categories.length }} categories</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-mute">Stock value</p>
        <p class="text-2xl font-bold mt-1">{{ usd(items.reduce((s, i) => s + (i.qty * (i.cost || 0)), 0)) }}</p>
        <p class="text-xs text-mute mt-1">at unit cost</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-mute">Needs reorder</p>
        <p class="text-2xl font-bold mt-1" :class="items.filter(i => st(i) !== 'ok').length ? 'text-warn' : ''">
          {{ items.filter(i => st(i) !== 'ok').length }}
        </p>
        <p class="text-xs text-mute mt-1">{{ items.filter(i => i.qty <= 0).length }} out of stock</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-mute">Pending requests</p>
        <p class="text-2xl font-bold mt-1">{{ requisitions.filter(r => r.status === 'pending').length }}</p>
        <p class="text-xs text-mute mt-1">awaiting approval</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2 mt-4">
      <section class="card p-4">
        <h2 class="font-semibold mb-3">Value by category</h2>
        <div v-for="cat in categoryValues" :key="cat.id" class="mb-3">
          <div class="flex justify-between text-xs mb-1">
            <span>{{ cat.name }}</span>
            <span class="text-mute">{{ usd(cat.val) }}</span>
          </div>
          <div class="h-2 rounded bg-line">
            <div class="h-2 rounded bg-brand" :style="{ width: cat.pct + '%' }"></div>
          </div>
        </div>
      </section>

      <section class="card p-4">
        <h2 class="font-semibold mb-3">Reorder list</h2>
        <ul v-if="items.filter(i => st(i) !== 'ok').length" class="divide-y divide-line text-sm">
          <li v-for="i in items.filter(i => st(i) !== 'ok')" :key="i.id" class="py-2 flex items-center gap-2">
            <span class="mr-auto">
              <b>{{ i.name }}</b><br>
              <span class="text-xs text-mute">{{ i.qty }} on hand · reorder level {{ i.min || 5 }}</span>
            </span>
            <span class="b" :class="{ 'b-ok': st(i) === 'ok', 'b-warn': st(i) === 'low', 'b-bad': st(i) === 'out' }">
              {{ { ok: 'In stock', low: 'Low', out: 'Out' }[st(i)] }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-mute">Everything is above its reorder level.</p>
      </section>

      <section class="card p-4 lg:col-span-2">
        <h2 class="font-semibold mb-3">Recent activity</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-mute">
                <th>When</th>
                <th>Item</th>
                <th>Type</th>
                <th class="text-right">Qty</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in movements.slice(0, 6)" :key="m.id" class="border-t border-line">
                <td class="whitespace-nowrap">{{ m.created_at ? new Date(m.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-' }}</td>
                <td>{{ m.item?.name || '-' }}</td>
                <td>{{ { IN: 'Receive', OUT: 'Issue', ADJ: 'Adjust' }[m.type] || m.type }}</td>
                <td class="text-right font-mono" :class="m.qty < 0 ? 'text-bad' : 'text-ok'">
                  {{ m.qty > 0 ? '+' : '' }}{{ m.qty }}
                </td>
                <td>{{ m.by || 'System' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped></style>
