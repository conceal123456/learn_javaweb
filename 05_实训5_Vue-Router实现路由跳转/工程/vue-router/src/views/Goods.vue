<template>
  <div><h4>商品列表</h4><p>标签标题：【{{ t }}】</p></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const t = ref('')
onMounted(() => { t.value = document.title })
</script>
