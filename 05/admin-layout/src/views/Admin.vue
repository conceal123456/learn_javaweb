<template>
  <div style="padding: 20px; font-size: 22px">
    管理员信息（子路由 /manage/admin，标签标题：{{ t }}）
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const t = ref('')
onMounted(() => {
  t.value = document.title
})
</script>
