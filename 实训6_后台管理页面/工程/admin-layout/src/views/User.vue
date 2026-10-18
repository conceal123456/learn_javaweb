<template>
  <div style="padding: 20px; font-size: 22px">
    用户列表（子路由 /manage/user，标签标题：{{ t }}）
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const t = ref('')
onMounted(() => {
  t.value = document.title
})
</script>
