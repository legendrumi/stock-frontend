import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import InventoryView from '../views/InventoryView.vue'
import MovementsView from '../views/MovementsView.vue'
import RequisitionsView from '../views/RequisitionsView.vue'

const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: DashboardView
    },
    {
        path: '/inventory',
        name: 'inventory',
        component: InventoryView
    },
    {
        path: '/movements',
        name: 'movements',
        component: MovementsView
    },
    {
        path: '/requisitions',
        name: 'requisitions',
        component: RequisitionsView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
