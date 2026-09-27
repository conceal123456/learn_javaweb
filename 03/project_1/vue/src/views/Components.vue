<template>
  <div style="padding: 20px;">
    <h2>实训4 Element-Plus 常用组件</h2>

    <h4>一、Input 输入框</h4>
    <el-input v-model="data.text" style="width: 240px" placeholder="请输入" />
    <span> 你输入了：{{ data.text }}</span>

    <h4>三、Select 选择器</h4>
    <el-select v-model="data.value" placeholder="请选择中药" style="width: 230px">
      <el-option v-for="item in data.options" :key="item.id" :label="item.name" :value="item.name" />
    </el-select>
    <span> 你的选择：{{ data.value }}</span>

    <h4>四、单选按钮组</h4>
    <el-radio-group v-model="data.sex">
      <el-radio value="男">男</el-radio>
      <el-radio value="女">女</el-radio>
    </el-radio-group>
    <span> 你的选择是：{{ data.sex }}</span>

    <h4>五、多选框组</h4>
    <el-checkbox-group v-model="data.checkList">
      <el-checkbox v-for="item in data.cols" :key="item.id" :label="item.name" :value="item.name" />
    </el-checkbox-group>
    <div>你的选择是：{{ data.checkList }}</div>

    <h4>八、日期选择器</h4>
    <el-date-picker v-model="data.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" placeholder="选日期" />
    <span> 你选的日期：{{ data.date }}</span>

    <h4>七、轮播（修正：:interval 用冒号绑定数字）</h4>
    <el-carousel height="160px" style="width: 400px" :interval="2000" arrow="hover">
      <el-carousel-item v-for="(c, i) in colors" :key="i">
        <div :style="{ height: '160px', background: c, textAlign: 'center', lineHeight: '160px', color: '#fff', fontSize: '24px' }">第 {{ i + 1 }} 张</div>
      </el-carousel-item>
    </el-carousel>

    <h4>九、数据表格 + 十、分页</h4>
    <el-table :data="pagedData" style="width: 100%" stripe>
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="date" label="日期" width="180" />
      <el-table-column prop="address" label="主产地" />
    </el-table>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[3, 5, 10]"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="tableData.length"
      style="margin-top: 12px"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'

const data = reactive({
  text: '',
  value: '',
  sex: '女',
  checkList: [],
  date: '',
  options: [{ id: 1, name: '虫草' }, { id: 2, name: '人参' }, { id: 3, name: '鹿茸' }],
  cols: [{ id: 1, name: '阿胶' }, { id: 2, name: '陈皮' }, { id: 3, name: '茯苓' }]
})

const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']

const tableData = [
  { name: '人参', date: '2028-05-03', address: '吉林长白山' },
  { name: '三七', date: '2028-06-02', address: '云南文山' },
  { name: '当归', date: '2028-09-07', address: '甘肃岷县' },
  { name: '山药', date: '2028-11-26', address: '河南焦作' },
  { name: '黄精', date: '2029-12-26', address: '池州九华山' },
  { name: '石斛', date: '2028-05-12', address: '六安霍山' },
]
// 修正：分页真正生效——按当前页对 tableData 做切片
const currentPage = ref(1)
const pageSize = ref(3)
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableData.slice(start, start + pageSize.value)
})
</script>
