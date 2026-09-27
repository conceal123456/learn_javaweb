<template>
  <div>
    <h3>测试页 Test</h3>
    <p>标签标题：【{{ t }}】</p>
    <p>路由传参：id = {{ route.query.id }} ，name = {{ route.query.name }}</p>
    <button @click="$router.push('/home')">用 $router.push 回首页</button>
    <button @click="$router.replace('/home')">用 $router.replace 回首页(不留历史)</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const t = ref('')
onMounted(() => { t.value = document.title })
</script>
