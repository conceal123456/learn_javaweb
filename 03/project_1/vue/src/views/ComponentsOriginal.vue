<template>
  <div style="padding: 20px;">
    <h2>实训4 老师原版写法（问题复现）</h2>
    <p style="color:#c0392b">下面刻意用老师的原始写法，用来和修正版对比。</p>

    <h4>轮播：interval="3000"（字符串，控制台会报 Invalid prop 类型告警）</h4>
    <el-carousel height="160px" style="width: 400px" autoplay interval="3000" pause-on-hover>
      <el-carousel-item v-for="(c, i) in colors" :key="i">
        <div :style="slide(c)">第 {{ i + 1 }} 张</div>
      </el-carousel-item>
    </el-carousel>

    <h4>表格 + 分页：:data 绑整份 tableData，没按页切片</h4>
    <el-table :data="tableData" style="width: 100%" stripe>
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="date" label="日期" width="180" />
      <el-table-column prop="address" label="主产地" />
    </el-table>
    <el-pagination
      v-model:current-page="currentPage4"
      v-model:page-size="pageSize4"
      :page-sizes="[5, 10, 15, 50]"
      :background
      layout="total, sizes, prev, pager, next, jumper"
      :total=tableData.length
    />
    <p style="color:#c0392b">现象：每页条数选了 5，但表格仍把全部数据一次显示完，点页码也不变——分页没真正生效。</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
const slide = (c) => ({ height: '160px', background: c, textAlign: 'center', lineHeight: '160px', color: '#fff', fontSize: '24px' })

const tableData = reactive([
  { name: '人参', date: '2028-05-03', address: '吉林长白山' },
  { name: '三七', date: '2028-06-02', address: '云南文山' },
  { name: '当归', date: '2028-09-07', address: '甘肃岷县' },
  { name: '山药', date: '2028-11-26', address: '河南焦作' },
  { name: '黄精', date: '2029-12-26', address: '池州九华山' },
  { name: '石斛', date: '2028-05-12', address: '六安霍山' },
  { name: '白芍', date: '2028-06-18', address: '亳州' },
])
const currentPage4 = ref(1)
const pageSize4 = ref(5)
</script>
