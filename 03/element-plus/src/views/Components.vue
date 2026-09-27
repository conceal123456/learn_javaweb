<template>
  <div style="padding: 20px;">
    <h2>实训4 Element-Plus 组件全览（对照老师逐节补齐）</h2>

    <!-- 一、Input 输入框 -->
    <h4>一、Input 输入框</h4>
    <el-input v-model="data.input" style="width: 240px" placeholder="请输入单行文本" />

    <!-- 二、文本域 -->
    <h4>二、文本域 textarea</h4>
    <el-input type="textarea" v-model="data.textarea" style="width: 240px" :rows="2" placeholder="Please input" />

    <!-- 三、Select 选择器 -->
    <h4>三、Select 选择器</h4>
    <el-select v-model="data.value" placeholder="请选择中药" style="width: 230px">
      <el-option v-for="item in data.options" :key="item.id" :label="item.name" :value="item.name" />
    </el-select>
    <span> 你的选择：{{ data.value }}</span>

    <!-- 四、单选 -->
    <h4>四、单选按钮 el-radio</h4>
    <el-radio-group v-model="data.sex">
      <el-radio value="男">男</el-radio>
      <el-radio value="女">女</el-radio>
    </el-radio-group>
    <span> 你的选择是：{{ data.sex }}</span>

    <h4>四(b)、单选按钮组 el-radio-button</h4>
    <el-radio-group v-model="data.tag" size="large">
      <el-radio-button label="我发布的内容" value="1" />
      <el-radio-button label="我点赞的内容" value="2" />
      <el-radio-button label="我收藏的内容" value="3" />
    </el-radio-group>
    <span> 你的选择是：{{ data.tag }}</span>

    <!-- 五、多选框基本用法 -->
    <h4>五、Checkbox 基本用法</h4>
    <div>
      <el-checkbox v-model="checked1" label="冬虫" size="large" />
      <el-checkbox v-model="checked2" label="人参" size="large" />
    </div>
    <div>
      <el-checkbox v-model="checked3" label="鹿茸" size="small" />
      <el-checkbox v-model="checked4" label="枸杞" size="small" />
    </div>
    <p>大号1：{{ checked1 ? '已勾选' : '未勾选' }}　大号2：{{ checked2 ? '已勾选' : '未勾选' }}　小号1：{{ checked3 ? '已勾选' : '未勾选' }}　小号2：{{ checked4 ? '已勾选' : '未勾选' }}</p>

    <!-- 多选框组 -->
    <h4>五(b)、Checkbox 多选框组</h4>
    <el-checkbox-group v-model="data.checkList">
      <el-checkbox v-for="item in data.cols" :key="item.id" :label="item.name" :value="item.name" />
    </el-checkbox-group>
    <div>你的选择是：{{ data.checkList }}</div>

    <!-- 六、Image 图片 -->
    <h4>六、Image 基础用法（5 种 fit）</h4>
    <div>
      <span v-for="fit in fits" :key="fit" style="display:inline-block; text-align:center; margin-right:10px">
        {{ fit }}<br />
        <el-image style="width: 80px; height: 80px" :src="img" :fit="fit" />
      </span>
    </div>

    <h4>六(b)、Image 懒加载 lazy</h4>
    <div style="height: 200px; overflow-y: auto; border: 1px solid #eee;">
      <el-image v-for="(u, i) in imgList" :key="i" :src="u" lazy style="display:block; min-height:120px; margin-bottom:8px" />
    </div>

    <h4>六(c)、Image 预览缩放（点图放大）</h4>
    <el-image style="width: 80px; height: 80px" :src="img" :preview-src-list="imgList" :initial-index="0" fit="cover" />

    <!-- 七、Carousel 走马灯 -->
    <h4>七、轮播（修正 :interval 绑数字）</h4>
    <el-carousel height="160px" style="width: 400px" :interval="2000" arrow="hover">
      <el-carousel-item v-for="(c, i) in colors" :key="i">
        <div :style="slide(c)">第 {{ i + 1 }} 张</div>
      </el-carousel-item>
    </el-carousel>

    <h4>七(b)、卡片式轮播 type="card"</h4>
    <el-carousel height="160px" style="width: 600px" type="card" :interval="2000">
      <el-carousel-item v-for="(c, i) in colors" :key="i">
        <div :style="slide(c)">卡片 {{ i + 1 }}</div>
      </el-carousel-item>
    </el-carousel>

    <!-- 八、DatePicker -->
    <h4>八、日期选择</h4>
    <el-date-picker v-model="data.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" placeholder="选日期" />
    <span> {{ data.date }}</span>

    <h4>八(b)、日期时间 datetime</h4>
    <el-date-picker v-model="data.datetime" type="datetime" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选日期时间" />
    <span> {{ data.datetime }}</span>

    <h4>八(c)、时间 TimePicker</h4>
    <el-time-picker v-model="data.time" placeholder="选择时间" />

    <h4>八(d)、日期范围 daterange</h4>
    <el-date-picker v-model="data.daterange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
    <span> {{ data.daterange?.length ? data.daterange[0] + ' 到 ' + data.daterange[1] : '' }}</span>

    <!-- 九、表格 + 十、分页 + 十一、操作列/删除 -->
    <h4>九~十一、表格 + 分页(修正:真切片) + 操作列/删除</h4>
    <el-table :data="pagedData" style="width: 100%" stripe>
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="date" label="日期" width="180" />
      <el-table-column prop="address" label="主产地" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="danger" size="small" @click="del(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
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
import logo from '@/assets/logo.svg'

const img = logo
const imgList = [logo, logo, logo, logo, logo]
const fits = ['fill', 'contain', 'cover', 'none', 'scale-down']
const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
const slide = (c) => ({ height: '160px', background: c, textAlign: 'center', lineHeight: '160px', color: '#fff', fontSize: '24px' })

const data = reactive({
  input: '安中医',
  textarea: '',
  value: '',
  sex: '女',
  tag: '3',
  checkList: [],
  date: '',
  datetime: '',
  time: '',
  daterange: [],
  options: [{ id: 1, name: '虫草' }, { id: 2, name: '人参' }, { id: 3, name: '鹿茸' }, { id: 4, name: '牛黄' }],
  cols: [{ id: 1, name: '阿胶' }, { id: 2, name: '陈皮' }, { id: 3, name: '茯苓' }]
})

// 多选框基本用法
const checked1 = ref(true)
const checked2 = ref(false)
const checked3 = ref(false)
const checked4 = ref(false)

// 表格 + 分页（修正：真切片）
const tableData = reactive([
  { id: 1, name: '人参', date: '2028-05-03', address: '吉林长白山' },
  { id: 2, name: '三七', date: '2028-06-02', address: '云南文山' },
  { id: 3, name: '当归', date: '2028-09-07', address: '甘肃岷县' },
  { id: 4, name: '山药', date: '2028-11-26', address: '河南焦作' },
  { id: 5, name: '黄精', date: '2029-12-26', address: '池州九华山' },
  { id: 6, name: '石斛', date: '2028-05-12', address: '六安霍山' },
])
const currentPage = ref(1)
const pageSize = ref(3)
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableData.slice(start, start + pageSize.value)
})
const del = (id) => {
  const i = tableData.findIndex((x) => x.id === id)
  if (i > -1) tableData.splice(i, 1)
  alert('删除 id = ' + id + ' 的数据')
}
</script>
