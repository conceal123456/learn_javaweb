<template>
  <div style="padding: 20px; font-size: 22px">
    商品列表（子路由 /manage/goods，标签标题：{{ t }}）
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const t = ref('')
onMounted(() => {
  t.value = document.title
})
</script>
