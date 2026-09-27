<template>
  <div><h4>用户列表</h4><p>标签标题：【{{ t }}】（这条路由有 meta.title）</p></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const t = ref('')
onMounted(() => { t.value = document.title })
</script>
