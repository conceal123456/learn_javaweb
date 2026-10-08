<template>
  <div style="padding: 20px; font-size: 15px">
    <h3>首页 Home</h3>
    <p>这个路由没有配置 meta.title，标签标题被守卫设成了：【{{ t }}】</p>

    <!-- 二、定义新路由：声明式跳转（讲义要求在 Home.vue 里写跳转语句） -->
    <h4>1. 声明式跳转 RouterLink</h4>
    <div>
      <RouterLink to="/test">去测试页 Test（不带参数）</RouterLink>　
      <RouterLink to="/test?id=123&name=手机">去测试页 Test（字符串带参）</RouterLink>
    </div>

    <!-- 三、编程式跳转：push 留历史、replace 不留历史 -->
    <h4>2. 编程式跳转 push / replace（用浏览器回退按钮对比效果）</h4>
    <div>
      <el-button type="primary" @click="$router.push('/test')">push 跳测试页</el-button>
      <el-button type="warning" @click="$router.replace('/test')">replace 跳测试页</el-button>
      <el-button @click="$router.back()">回退</el-button>
    </div>

    <!-- 四、路由传参：字符串形式与对象形式 -->
    <h4>3. 路由传参 query</h4>
    <div>
      <el-button type="primary" @click="$router.push('/test?id=123&name=手机')">字符串形式传参</el-button>
      <el-button type="success" @click="pushObj">对象形式传参</el-button>
    </div>

    <!-- 五、嵌套路由入口 -->
    <h4>4. 嵌套路由（父页面 Manage 里用 RouterView 渲染子页面）</h4>
    <div>
      <RouterLink to="/manage/user">后台-用户</RouterLink>　
      <RouterLink to="/manage/goods">后台-商品</RouterLink>　
      <RouterLink to="/manage/orders">后台-订单</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import router from '@/router/index.js'

const t = ref('')
onMounted(() => {
  t.value = document.title
})

// 对象形式配置要传递的数据，跳转后浏览器会自动转成 URL 字符串 /test?id=2&name=手机
const pushObj = () => {
  router.push({ path: '/test', query: { id: 2, name: '手机' } })
}
</script>
