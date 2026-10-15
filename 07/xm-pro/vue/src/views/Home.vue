<template>
  <div style="margin-bottom: 28px">
    这是Home.vue
  </div>
  <div>
    <!-- 在 <el-button> 标签中间加上了显示的文字 -->
    <el-button
        type="primary"
        @click="$router.push({ path: '/test', query: { id: '2024207335102 王陈飞', name: '手机' } })"
    >
      点击跳转到Test.vue传参
    </el-button>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
</script>
