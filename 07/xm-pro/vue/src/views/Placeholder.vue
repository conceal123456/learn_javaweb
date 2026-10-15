<template>
  <div style="padding: 20px">
    <el-empty :description="`${title}：本讲只演示菜单与路由，页面内容后续讲次再补`" />
    <div style="text-align: center; font-size: 14px; color: #909399">
      当前路径：{{ route.path }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta?.title || '占位页面')
</script>
