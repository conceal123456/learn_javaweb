<template>
  <div style="padding: 20px; font-size: 15px">
    <h3>测试页 Test</h3>
    <p>标签标题：【{{ t }}】</p>

    <h4>取传递过来的值（两种写法都能拿到）</h4>
    <p>讲义写法 router.currentRoute.value.query：id = {{ q1.id }} ，name = {{ q1.name }}</p>
    <p>useRoute() 写法 route.query：id = {{ route.query.id }} ，name = {{ route.query.name }}</p>
    <p>当前完整地址：{{ router.currentRoute.value.fullPath }}</p>

    <h4>编程式跳回首页</h4>
    <el-button type="primary" @click="$router.push('/home')">push 回首页（回退能回到本页）</el-button>
    <el-button type="warning" @click="$router.replace('/home')">replace 回首页（回退回不到本页）</el-button>
    <p style="margin-top: 10px"><RouterLink to="/home">声明式回首页 RouterLink</RouterLink></p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router/index.js'

const route = useRoute()
// 讲义用的是 router.currentRoute.value.query.xxx 这种写法
const q1 = computed(() => router.currentRoute.value.query)

const t = ref('')
onMounted(() => {
  t.value = document.title
})
</script>
