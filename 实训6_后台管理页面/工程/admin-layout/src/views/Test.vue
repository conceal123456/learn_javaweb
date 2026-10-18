<template>
  <div style="padding: 20px">
    <h3>测试页 Test</h3>
    <p>标签标题：【{{ t }}】</p>
    <p>路由传参：id = {{ route.query.id }} ，name = {{ route.query.name }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const t = ref('')
onMounted(() => {
  t.value = document.title
})
</script>
