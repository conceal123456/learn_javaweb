import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('../views/Home.vue') },
    { path: '/comp', name: 'comp', component: () => import('../views/Components.vue') }
  ],
})

export default router
