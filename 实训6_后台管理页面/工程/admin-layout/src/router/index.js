import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('../views/Home.vue') },
    { path: '/test', name: 'test', component: () => import('../views/Test.vue') },
    {
      path: '/manage',
      name: 'manage',
      meta: { title: '后台管理' },
      component: () => import('../views/Manage.vue'),
      children: [
        // 访问 /manage 本身时默认进 detail，否则父页面右侧是空白的
        { path: '', name: 'manageHome', redirect: '/manage/detail' },
        { path: 'detail', name: 'detail', meta: { title: '内容展示' }, component: () => import('../views/Detail.vue') },
        { path: 'user', name: 'user', meta: { title: '用户列表' }, component: () => import('../views/User.vue') },
        { path: 'goods', name: 'goods', meta: { title: '商品列表' }, component: () => import('../views/Goods.vue') },
        { path: 'orders', name: 'orders', meta: { title: '订单列表' }, component: () => import('../views/Orders.vue') },
        { path: 'admin', name: 'admin', meta: { title: '管理员信息' }, component: () => import('../views/Admin.vue') },
        { path: 'staff', name: 'staff', meta: { title: '普通用户信息' }, component: () => import('../views/Staff.vue') },
      ],
    },
  ],
})

// from：将要进行跳转的当前 route 对象 (跳转前的一些操作)
// to: 跳转后 route 对象 (跳转后的一些操作)
// next(): 调用该方法后, 才能进入下一个钩子
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '中药材后台管理系统'
  next()
})

export default router
