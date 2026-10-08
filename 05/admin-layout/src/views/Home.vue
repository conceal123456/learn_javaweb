<template>
  <div style="padding: 20px">
    <h3>首页 Home</h3>
    <p>这条路由没有配置 meta.title，当前标签标题被守卫设成了【{{ t }}】。</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const t = ref('')
onMounted(() => {
  t.value = document.title
})
</script>
