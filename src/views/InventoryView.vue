<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/axios'

const items = ref([])
const categories = ref([])
const query = reactive({ q: '', cat: '', st: '', sort: 'name', dir: 1 })
const modalData = ref(null)
const editItemObj = ref(null)

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const CATS = ['Office Supplies', 'IT Equipment', 'Maintenance', 'Cleaning', 'Safety']

const st = (i) => i.qty <= 0 ? 'out' : i.qty <= (i.min || 5) ? 'low' : 'ok'
const badge = (i) => {
  const s = st(i)
  const cls = { ok: 'b-ok', low: 'b-warn', out: 'b-bad' }[s]
  const lbl = { ok: 'In stock', low: 'Low', out: 'Out' }[s]
  return `<span class="b ${cls}">${lbl}</span>`
}

const filteredItems = computed(() => {
  const qStr = query.q.toLowerCase()
  return (items.value || []).filter(i => {
    const matchQ = !qStr || [i.name, i.sku, i.location?.name || i.loc, i.cat || i.category?.name].some(x => String(x || '').toLowerCase().includes(qStr))
    const matchCat = !query.cat || (i.category?.name || i.cat) === query.cat
    const matchSt = !query.st || (query.st === 'yes' || query.st === 'no' ? st(i) !== 'out' && !!i.broken === (query.st === 'yes') : st(i) === query.st)
    return matchQ && matchCat && matchSt
  }).sort((a, b) => {
    let valA = '', valB = ''
    if (query.sort === 'name') {
      valA = a.name || ''
      valB = b.name || ''
    } else if (query.sort === 'cat') {
      valA = a.cat || a.category?.name || ''
      valB = b.cat || b.category?.name || ''
    } else if (query.sort === 'loc') {
      valA = a.loc || a.location?.name || ''
      valB = b.loc || b.location?.name || ''
    } else if (query.sort === 'qty') {
      valA = Number(a.qty) || 0
      valB = Number(b.qty) || 0
    } else {
      valA = a[query.sort] || ''
      valB = b[query.sort] || ''
    }

    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA > valB) return 1 * query.dir
    if (valA < valB) return -1 * query.dir
    return 0
  })
})

const sortBy = (column) => {
  if (query.sort === column) {
    query.dir = -query.dir
  } else {
    query.sort = column
    query.dir = 1
  }
}

const fetchItems = async () => {
  try {
    const res = await api.getItems()
    items.value = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
  } catch (err) { 
    console.error(err) 
    showToast('Error loading inventory items', 'error')
  }
}

const fetchCategories = async () => {
  try {
    const res = await api.getCategories()
    categories.value = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
  } catch (err) { console.error(err) }
}

const handleStock = async (itemId, type) => {
  const qty = prompt(`Enter quantity to ${type}:`, '10')
  if (!qty) return
  const ref = prompt('Enter reference or note:', 'PO-100')
  if (!ref) return
  try {
    await api.storeStock(itemId, { type, qty: parseInt(qty), ref })
    await fetchItems()
    showToast(`Stock ${type} processed successfully!`, 'success')
  } catch (err) { 
    showToast(err.response?.data?.message || 'Error', 'error') 
  }
}

const openAddModal = () => {
  editItemObj.value = null
  modalData.value = { name: '', sku: '', cat: CATS[0], loc: '', unit: 'pcs', qty: 0, cost: 0, min: 5, max: 50, broken: false }
}

const openEditModal = (i) => {
  editItemObj.value = i
  modalData.value = { 
    name: i.name, 
    sku: i.sku, 
    cat: i.cat || i.category?.name || CATS[0], 
    loc: i.loc || i.location?.name || '', 
    unit: i.unit || 'pcs', 
    cost: i.cost || 0, 
    min: i.min || 5, 
    max: i.max || 50, 
    broken: !!i.broken 
  }
}

const closeModal = () => {
  modalData.value = null
}

const saveItem = () => {
  if (!modalData.value.name.trim() || !modalData.value.sku.trim()) {
    alert('Name and SKU are required.')
    return
  }
  if (editItemObj.value) {
    editItemObj.value.name = modalData.value.name
    editItemObj.value.sku = modalData.value.sku
    editItemObj.value.cat = modalData.value.cat
    editItemObj.value.loc = modalData.value.loc
    editItemObj.value.unit = modalData.value.unit
    editItemObj.value.cost = modalData.value.cost
    editItemObj.value.min = modalData.value.min
    editItemObj.value.max = modalData.value.max
    editItemObj.value.broken = modalData.value.broken
    showToast('Item updated successfully!', 'success')
  } else {
    const newItem = {
      id: 'I-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
      name: modalData.value.name,
      sku: modalData.value.sku,
      cat: modalData.value.cat,
      loc: modalData.value.loc,
      unit: modalData.value.unit,
      qty: Number(modalData.value.qty) || 0,
      cost: Number(modalData.value.cost) || 0,
      min: Number(modalData.value.min) || 5,
      max: Number(modalData.value.max) || 50,
      broken: modalData.value.broken
    }
    items.value.unshift(newItem)
    showToast('Item added successfully!', 'success')
  }
  closeModal()
}

onMounted(async () => {
  await fetchItems()
  await fetchCategories()
  showToast('Inventory data loaded successfully from database!', 'success')
})
</script>

<template>
  <div>
    <div v-if="toast.show" 
         class="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
         :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'">
      <span>{{ toast.message }}</span>
    </div>

    <div class="flex flex-wrap gap-2 mb-4 items-center">
      <input v-model="query.q" class="inp max-w-xs" type="search" placeholder="Search name, SKU, location  ( / )" aria-label="Search inventory">
      
      <select v-model="query.cat" class="inp !w-auto" aria-label="Category">
        <option value="">All categories</option>
        <option v-for="c in (categories.length ? categories : CATS.map(x => ({id: x, name: x})))" :key="c.id || c.name" :value="c.name">
          {{ c.name }}
        </option>
      </select>

      <select v-model="query.st" class="inp !w-auto" aria-label="Status">
        <option value="">Any status</option>
        <option value="ok">In stock</option>
        <option value="low">Low</option>
        <option value="out">Out</option>
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>

      <button @click="openAddModal" class="btn btn-p ml-auto inline-flex items-center gap-1 cursor-pointer">
        <svg class="w-4 h-4 inline-block align-middle shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Add item
      </button>
    </div>

    <div class="card overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-left text-xs text-mute border-b border-line">
          <tr>
            <th @click="sortBy('name')" class="cursor-pointer hover:text-ink">
              Item <span v-if="query.sort === 'name'">{{ query.dir > 0 ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('cat')" class="cursor-pointer hover:text-ink">
              Category <span v-if="query.sort === 'cat'">{{ query.dir > 0 ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('loc')" class="cursor-pointer hover:text-ink">
              Location <span v-if="query.sort === 'loc'">{{ query.dir > 0 ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('qty')" class="text-right cursor-pointer hover:text-ink">
              On hand <span v-if="query.sort === 'qty'">{{ query.dir > 0 ? '▲' : '▼' }}</span>
            </th>
            <th>Status</th>
            <th>isBroken</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in filteredItems" :key="i.id" class="border-t border-line">
            <td><b>{{ i.name }}</b><br><span class="text-xs text-mute">{{ i.sku }}</span></td>
            <td>{{ i.cat || i.category?.name || '-' }}</td>
            <td>{{ i.loc || i.location?.name || '-' }}</td>
            <td class="text-right font-mono">{{ Number(i.qty).toLocaleString() }} <span class="text-xs text-mute">{{ i.unit || 'pcs' }}</span></td>
            <td><span v-html="badge(i)"></span></td>
            <td>
              <span v-if="st(i) !== 'out'" class="b" :class="i.broken ? 'b-bad' : 'b-ok'">{{ i.broken ? 'Yes' : 'No' }}</span>
              <span v-else>-</span>
            </td>
            <td class="text-right whitespace-nowrap space-x-1">
              <button @click="handleStock(i.id, 'IN')" class="btn cursor-pointer">Receive</button>
              <button @click="handleStock(i.id, 'OUT')" class="btn cursor-pointer">Issue</button>
              <button @click="handleStock(i.id, 'ADJ')" class="btn cursor-pointer">Adjust</button>
              <button @click="openEditModal(i)" class="btn inline-flex items-center cursor-pointer" aria-label="Edit item">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
              </button>
            </td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="7" class="p-6 text-sm text-mute text-center">No items match your filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalData" class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div class="card w-full max-w-md p-5 max-h-full overflow-y-auto bg-[var(--card)]">
        <h2 class="font-semibold text-lg mb-4">{{ editItemObj ? 'Edit item' : 'Add item' }}</h2>
        <form @submit.prevent="saveItem">
          <label class="block text-sm mb-3">Name
            <input v-model="modalData.name" class="inp mt-1" required>
          </label>
          <div class="grid grid-cols-2 gap-x-3">
            <label class="block text-sm mb-3">SKU
              <input v-model="modalData.sku" class="inp mt-1" required>
            </label>
            <label class="block text-sm mb-3">Category
              <select v-model="modalData.cat" class="inp mt-1">
                <option v-for="c in CATS" :key="c">{{ c }}</option>
              </select>
            </label>
            <label class="block text-sm mb-3">Location
              <input v-model="modalData.loc" class="inp mt-1">
            </label>
            <label class="block text-sm mb-3">Unit
              <input v-model="modalData.unit" class="inp mt-1">
            </label>
            <label v-if="!editItemObj" class="block text-sm mb-3">Opening quantity
              <input v-model.number="modalData.qty" type="number" min="0" class="inp mt-1">
            </label>
            <label class="block text-sm mb-3">Unit cost
              <input v-model.number="modalData.cost" type="number" min="0" step="0.01" class="inp mt-1">
            </label>
            <label class="block text-sm mb-3">Reorder level
              <input v-model.number="modalData.min" type="number" min="0" class="inp mt-1">
            </label>
            <label class="block text-sm mb-3">Max level
              <input v-model.number="modalData.max" type="number" min="0" class="inp mt-1">
            </label>
            <label class="block text-sm mb-3">isBroken
              <select v-model="modalData.broken" class="inp mt-1">
                <option :value="false">No</option>
                <option :value="true">Yes</option>
              </select>
            </label>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" @click="closeModal" class="btn cursor-pointer">Cancel</button>
            <button type="submit" class="btn btn-p cursor-pointer">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
