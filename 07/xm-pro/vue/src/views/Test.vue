<template>
  <div>
    这是测试路由传参的，此页面是Test.vue，也是商品详情页！
  </div>
  <div style="margin-top: 28px">
    id是: {{ data.id }}, name是: {{ data.name }}
  </div>
</template>

<script setup>
import { reactive } from "vue";
import router from "@/router/index.js";

const data = reactive({
  id: router.currentRoute.value.query.id,
  name: router.currentRoute.value.query.name,
});
</script>