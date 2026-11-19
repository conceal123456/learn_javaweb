import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', meta: { title: '首页' }, component: () => import('../views/Home.vue') },
    { path: '/test', name: 'test', meta: { title: '测试页' }, component: () => import('../views/Test.vue') },
    {
      path: '/manage',
      name: 'manage',
      meta: { title: '后台管理' },
      component: () => import('../views/Manage.vue'),
      children: [
        // 访问 /manage 本身时默认进 detail，和老师实训6 的写法一致
        { path: '', name: 'manageHome', redirect: '/manage/detail' },
        { path: 'detail', name: 'detail', meta: { title: '内容展示' }, component: () => import('../views/Detail.vue') },
        { path: 'user', name: 'user', meta: { title: '用户列表' }, component: () => import('../views/User.vue') },
        { path: 'goods', name: 'goods', meta: { title: '商品列表' }, component: () => import('../views/Goods.vue') },
        { path: 'orders', name: 'orders', meta: { title: '订单列表' }, component: () => import('../views/Orders.vue') },
        { path: 'admin', name: 'admin', meta: { title: '管理员信息', role: 'ADMIN' }, component: () => import('../views/User.vue') },
        { path: 'staff', name: 'staff', meta: { title: '普通用户信息', role: 'USER' }, component: () => import('../views/User.vue') }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '中药材后台管理系统'
  next()
})

export default router
