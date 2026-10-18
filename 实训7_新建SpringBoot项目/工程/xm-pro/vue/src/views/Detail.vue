<template>
  <div>
    <!-- 🧱 第1点：搭建查询区域 -->
    <div class="card" style="margin-bottom: 5px">
      <el-input
          style="width: 240px; margin-right: 10px"
          v-model="data.name"
          placeholder="请输入中药材名称查询"
          :prefix-icon="Search">
      </el-input>
      <el-button type="primary">查 询</el-button>
      <el-button type="warning">重 置</el-button>
    </div>

    <!-- 🧱 第2点：搭建功能按钮区 -->
    <div class="card" style="margin-bottom: 5px">
      <el-button type="primary">新 增</el-button>
      <el-button type="warning">批量删除</el-button>
      <el-button type="info">导 入</el-button>
      <el-button type="success">导 出</el-button>
    </div>

    <!-- 🧱 第3、4点：表格与分页区 -->
    <div class="card" style="margin-bottom: 5px">
      <!-- 表格 -->
      <el-table :data="data.tableData" stripe>
        <el-table-column label="名称" prop="name" />
        <el-table-column label="地址" prop="address" />
        <el-table-column label="日期" prop="date" />
      </el-table>

      <div style="margin-top: 15px">
        <el-pagination
            v-model:current-page="data.pageNum"
            v-model:page-size="data.pageSize"
            :page-sizes="[5, 10, 15, 20]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="data.total"
        />
      </div>


    </div>
  </div>
</template>

<script setup>
// ⚡ 第5点：使用 reactive 定义模拟数据 (数据必须在，分页才能生效)
import { reactive } from "vue";
import { Search } from "@element-plus/icons-vue";

const data = reactive({
  name: null,
  tableData: [
    { id: 1, name: '霍山石斛', address: '安徽六安霍山县', date: '2027-10-11' },
    { id: 2, name: '亳白芍', address: '安徽亳州', date: '2027-10-13' },
    { id: 3, name: '宣木瓜', address: '安徽宣城', date: '2028-10-15' },
    { id: 4, name: '滁菊', address: '安徽滁州全椒', date: '2028-10-16' },
    { id: 5, name: '茯苓', address: '安徽安庆岳西', date: '2028-10-17' },
    { id: 6, name: '山茱萸', address: '安徽黄山歙县', date: '2029-10-19' },
    { id: 7, name: '灵芝', address: '安徽池州石台', date: '2029-10-20' },
    { id: 8, name: '半夏', address: '安徽阜阳界首', date: '2030-10-21' },
    { id: 9, name: '断血流', address: '安徽六安金寨', date: '2031-10-22' }
  ],
  pageNum: 1,    // 当前页码
  pageSize: 10,  // 每页条数
  total: 50      // 总数据量 (由分页组件读取)
});
</script>

<style scoped>
.card {
  background-color: #ffffff;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
</style>