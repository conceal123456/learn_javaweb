import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', redirect: '/home' },
        { path: '/home', name: 'home', meta: { title: '首页' }, component: () => import('../views/Home.vue') },
        { path: '/test', name: 'test', meta: { title: '测试页' }, component: () => import('../views/Test.vue') },

        // ==========================================
        // 1. 配置父路由 /manage 对应 Manage.vue
        // ==========================================
        {
            path: '/manage',
            name: 'manage',
            meta: { title: '后台管理' }, // 父路由标题
            component: () => import('../views/Manage.vue'),
            // 注意：删除了 redirect: '/manage/detail'，让点击“管理首页”真正跳转到空路径
            children: [
                // 当点击“管理首页”时（路径 /manage），默认渲染 Index.vue
                { path: '', name: 'manageIndex', meta: { title: '后台管理首页' }, component: () => import('../views/Index.vue') },

                // 2. 配置 children 子路由，将 Detail.vue 配置为 /manage/detail 子页面
                // 3. 各个子路由添加 meta 标题
                { path: 'detail', name: 'detail', meta: { title: '内容展示' }, component: () => import('../views/Detail.vue') },
                { path: 'user', name: 'user', meta: { title: '用户列表' }, component: () => import('../views/User.vue') },
                { path: 'goods', name: 'goods', meta: { title: '商品列表' }, component: () => import('../views/Goods.vue') },
                { path: 'orders', name: 'orders', meta: { title: '订单列表' }, component: () => import('../views/Orders.vue') }
            ]
        }
    ]
})


router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '后台管理系统';
    next();
})

export default router
