import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('../views/Home.vue') },
    { path: '/test', name: 'test', component: () => import('../views/Test.vue') },
    { path: '/manage', name: 'manage', meta: { title: '后台管理' }, component: () => import('../views/Manage.vue'), children: [
      { path: 'user', name: 'user', meta: { title: '用户列表' }, component: () => import('../views/User.vue') },
      { path: 'goods', name: 'goods', meta: { title: '商品列表' }, component: () => import('../views/Goods.vue') },
      { path: 'orders', name: 'orders', meta: { title: '订单列表' }, component: () => import('../views/Orders.vue') },
    ] }
  ],
})

// 修正版守卫：给没有 meta.title 的页面一个兜底默认标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '默认标题'
  next()
})

export default router
