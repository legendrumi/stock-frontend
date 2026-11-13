import axios from 'axios'

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})

export default {
    getItems(params) { return API.get('/items', { params }) },
    getCategories() { return API.get('/categories') },
    storeStock(itemId, data) { return API.post(`/items/${itemId}/stock`, data) },
    getMovements(params) { return API.get('/stock-movements', { params }) },
    getRequisitions(params) { return API.get('/requisitions', { params }) },
    decideRequisition(reqId, status) { return API.post(`/requisitions/${reqId}/decide`, { status }) }
}
