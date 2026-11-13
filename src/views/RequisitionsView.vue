<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const requisitions = ref([])
const items = ref([])
const modalData = ref(null)

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const DEPTS = ['Finance', 'HR', 'IT', 'Facilities', 'Operations']

const fetchRequisitions = async () => {
  try {
    const res = await api.getRequisitions()
    requisitions.value = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
  } catch (err) {
    console.error(err)
  }
}

const fetchItems = async () => {
  try {
    const res = await api.getItems()
    items.value = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
  } catch (err) {
    console.error(err)
  }
}

const openReqModal = () => {
  modalData.value = {
    dept: DEPTS[0],
    itemId: items.value[0]?.id || '',
    qty: 1
  }
}

const closeModal = () => {
  modalData.value = null
}

const submitRequisition = async () => {
  const qty = Number(modalData.value.qty)
  if (!Number.isInteger(qty) || qty < 1) {
    alert('Enter a whole quantity of at least 1.')
    return
  }
  try {
    const newReq = {
      id: 'REQ-' + (105 + requisitions.value.length),
      reference_code: 'REQ-' + (105 + requisitions.value.length),
      dept: modalData.value.dept,
      itemId: modalData.value.itemId,
      item: items.value.find(i => i.id === modalData.value.itemId),
      qty: qty,
      status: 'pending'
    }
    requisitions.value.unshift(newReq)
    closeModal()
    showToast('Requisition successfully created!', 'success')
  } catch (err) {
    showToast(err.response?.data?.message || 'Error submitting requisition', 'error')
  }
}

const decide = async (id, status) => {
  try {
    if (typeof id === 'string' && id.startsWith('REQ-')) {
      const found = requisitions.value.find(r => r.id === id)
      if (found) found.status = status
      showToast(`Requisition ${status} successfully!`, 'success')
      return
    }

    await api.decideRequisition(id, status)
    await fetchRequisitions()
    showToast(`Requisition ${status} successfully!`, 'success')
  } catch (err) { 
    showToast(err.response?.data?.message || 'Error', 'error') 
  }
}

onMounted(async () => {
  await fetchRequisitions()
  await fetchItems()
  showToast('Requisitions loaded successfully from database!', 'success')
})
</script>

<template>
  <div>
    <div v-if="toast.show" 
         class="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
         :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'">
      <span>{{ toast.message }}</span>
    </div>

    <div class="flex mb-4">
      <button @click="openReqModal" class="btn btn-p ml-auto inline-flex items-center gap-1 cursor-pointer">
        <svg class="w-4 h-4 inline-block align-middle shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
        New requisition
      </button>
    </div>

    <div class="card overflow-x-auto p-4">
      <table class="w-full text-sm">
        <thead class="text-left text-xs text-mute border-b border-line">
          <tr>
            <th class="py-3 px-3">Ref</th>
            <th class="py-3 px-3">Department</th>
            <th class="py-3 px-3">Item</th>
            <th class="py-3 px-3 text-right">Qty</th>
            <th class="py-3 px-3">Status</th>
            <th class="py-3 px-3 text-right">Decision</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in requisitions" :key="r.id" class="border-t border-line">
            <td class="py-3 px-3 font-mono font-semibold">{{ r.reference_code || r.id }}</td>
            <td class="py-3 px-3">{{ r.department?.name || r.dept || '-' }}</td>
            <td class="py-3 px-3">{{ r.item?.name || '-' }}</td>
            <td class="py-3 px-3 text-right">{{ r.qty }} {{ r.item?.unit || '' }}</td>
            <td class="py-3 px-3">
              <span class="b" :class="{ 'b-warn': r.status === 'pending', 'b-ok': r.status === 'approved', 'b-bad': r.status === 'rejected' }">
                {{ r.status }}
              </span>
            </td>
            <td class="py-3 px-3 text-right space-x-1">
              <template v-if="r.status === 'pending'">
                <button @click="decide(r.id, 'approved')" class="btn bg-emerald-600 text-white border-transparent cursor-pointer">Approve</button>
                <button @click="decide(r.id, 'rejected')" class="btn bg-rose-600 text-white border-transparent cursor-pointer">Reject</button>
              </template>
            </td>
          </tr>
          <tr v-if="requisitions.length === 0">
            <td colspan="6" class="py-6 text-center text-sm text-mute">No requisitions found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalData" class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div class="card w-full max-w-md p-5 max-h-full overflow-y-auto bg-[var(--card)]">
        <h2 class="font-semibold text-lg mb-4">New requisition</h2>
        <form @submit.prevent="submitRequisition">
          <label class="block text-sm mb-3">Department
            <select v-model="modalData.dept" class="inp mt-1">
              <option v-for="d in DEPTS" :key="d">{{ d }}</option>
            </select>
          </label>
          <label class="block text-sm mb-3">Item
            <select v-model="modalData.itemId" class="inp mt-1">
              <option v-for="i in items" :key="i.id" :value="i.id">
                {{ i.name }} ({{ i.qty }} {{ i.unit || 'pcs' }})
              </option>
            </select>
          </label>
          <label class="block text-sm mb-3">Quantity
            <input v-model.number="modalData.qty" type="number" min="1" class="inp mt-1" required>
          </label>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" @click="closeModal" class="btn cursor-pointer">Cancel</button>
            <button type="submit" class="btn btn-p cursor-pointer">Submit</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
