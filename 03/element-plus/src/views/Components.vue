<template>
  <div style="padding: 20px;">
    <h2>实训4 Element-Plus 组件全览（对照老师逐节补齐）</h2>

    <!-- 一、Input 输入框 -->
    <h4 id="s1">一、Input 输入框</h4>
    <el-input v-model="data.input" style="width: 240px" placeholder="请输入单行文本" />

    <!-- 二、文本域 -->
    <h4 id="s2">二、文本域 textarea</h4>
    <el-input type="textarea" v-model="data.textarea" style="width: 240px" :rows="2" placeholder="Please input" />

    <!-- 三、Select 选择器 -->
    <h4 id="s3">三、Select 选择器</h4>
    <el-select v-model="data.value" placeholder="请选择中药" style="width: 230px">
      <el-option v-for="item in data.options" :key="item.id" :label="item.name" :value="item.name" />
    </el-select>
    <span> 你的选择：{{ data.value }}</span>

    <!-- 四、单选 -->
    <h4 id="s4">四、单选按钮 el-radio</h4>
    <el-radio-group v-model="data.sex">
      <el-radio value="男">男</el-radio>
      <el-radio value="女">女</el-radio>
    </el-radio-group>
    <span> 你的选择是：{{ data.sex }}</span>

    <h4 id="s4b">四(b)、单选按钮组 el-radio-button</h4>
    <el-radio-group v-model="data.tag" size="large">
      <el-radio-button label="我发布的内容" value="1" />
      <el-radio-button label="我点赞的内容" value="2" />
      <el-radio-button label="我收藏的内容" value="3" />
    </el-radio-group>
    <span> 你的选择是：{{ data.tag }}</span>

    <!-- 五、多选框基本用法 -->
    <h4 id="s5">五、Checkbox 基本用法</h4>
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
    <h4 id="s5b">五(b)、Checkbox 多选框组</h4>
    <el-checkbox-group v-model="data.checkList">
      <el-checkbox v-for="item in data.cols" :key="item.id" :label="item.name" :value="item.name" />
    </el-checkbox-group>
    <div>你的选择是：{{ data.checkList }}</div>

    <!-- 六、Image 图片 -->
    <h4 id="s6">六、Image 基础用法（同一张图、5 种 fit 对比）</h4>
    <div>
      <span v-for="fit in fits" :key="fit" style="display:inline-block; text-align:center; margin-right:10px">
        {{ fit }}<br />
        <el-image style="width: 100px; height: 100px" :src="img" :fit="fit" />
      </span>
    </div>

    <h4 id="s6b">六(b)、Image 懒加载 lazy（在下面这个 240px 的容器里滚动才发请求）</h4>
    <div style="height: 240px; overflow-y: auto; border: 1px solid #eee;">
      <el-image v-for="(u, i) in lazyList" :key="i" :src="u" lazy style="display:block; height:150px; margin-bottom:8px" />
    </div>

    <h4 id="s6c">六(c)、Image 预览缩放（点图放大，可滚轮缩放、左右切换）</h4>
    <el-image style="width: 100px; height: 100px" :src="img" :preview-src-list="imgs" :initial-index="0" fit="cover" />
    <span style="margin-left:10px">缩略图；点击打开全屏预览器</span>

    <!-- 七、Carousel 走马灯 -->
    <h4 id="s7">七、轮播（修正 :interval 绑数字，arrow=hover 悬停才出箭头）</h4>
    <el-carousel height="200px" style="width: 460px" :interval="2000" arrow="hover">
      <el-carousel-item v-for="(u, i) in imgs" :key="i">
        <img style="width: 100%; height: 100%; object-fit: cover;" :src="u" alt="轮播图片" />
      </el-carousel-item>
    </el-carousel>

    <h4 id="s7b">七(b)、卡片式轮播 type="card"</h4>
    <el-carousel height="200px" style="width: 640px" type="card" :interval="2000">
      <el-carousel-item v-for="(u, i) in imgs" :key="i">
        <img style="width: 100%; height: 100%; object-fit: cover;" :src="u" alt="轮播图片" />
      </el-carousel-item>
    </el-carousel>

    <!-- 八、DatePicker -->
    <h4 id="s8">八、日期选择</h4>
    <el-date-picker v-model="data.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" placeholder="选日期" />
    <span> {{ data.date }}</span>

    <h4 id="s8b">八(b)、日期时间 datetime</h4>
    <el-date-picker v-model="data.datetime" type="datetime" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选日期时间" />
    <span> {{ data.datetime }}</span>

    <h4 id="s8c">八(c)、时间 TimePicker</h4>
    <el-time-picker v-model="data.time" placeholder="选择时间" />

    <h4 id="s8d">八(d)、日期范围 daterange</h4>
    <el-date-picker v-model="data.daterange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
    <span> {{ data.daterange?.length ? data.daterange[0] + ' 到 ' + data.daterange[1] : '' }}</span>

    <!-- 九、表格 + 十、分页 + 十一、弹窗与删除 -->
    <h4 id="s9">九~十一、表格 + 分页(修正:真切片) + 弹窗与删除</h4>
    <div style="margin-bottom: 10px">
      <el-button type="primary" @click="openAdd">新增</el-button>
      <span style="margin-left: 12px">共 {{ tableData.length }} 条数据</span>
    </div>
    <el-table :data="pagedData" style="width: 100%" stripe>
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="date" label="日期" width="180" />
      <el-table-column prop="address" label="主产地" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="view(scope.row)">查看</el-button>
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

    <!-- 十一、弹窗：el-dialog 新增表单 -->
    <el-dialog v-model="dialogVisible" title="新增中药材" width="420px">
      <el-form label-width="70px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如：大别山天麻" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="form.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" placeholder="选日期" style="width: 100%" /></el-form-item>
        <el-form-item label="主产地"><el-input v-model="form.address" placeholder="如：六安金寨、霍山" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 自备图片：放在 public/img 下，用绝对路径 /img/xxx.jpg 引用，不依赖外部图床
const imgs = ['/img/shihu.jpg', '/img/baishao.jpg', '/img/mugua.jpg', '/img/juhua.jpg']
const img = imgs[0]
// 懒加载要够长才能看出"滚到才加载"
const lazyList = [...imgs, ...imgs]
const fits = ['fill', 'contain', 'cover', 'none', 'scale-down']

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

// 十一、弹窗：新增
const dialogVisible = ref(false)
const form = reactive({ name: '', date: '', address: '' })
let nextId = 100
const openAdd = () => {
  form.name = ''
  form.date = ''
  form.address = ''
  dialogVisible.value = true
}
const save = () => {
  if (!form.name) {
    ElMessage.warning('名称不能为空')
    return
  }
  tableData.push({ id: nextId++, name: form.name, date: form.date, address: form.address })
  dialogVisible.value = false
  ElMessage.success('已新增：' + form.name)
}

// 查看：把整行数据弹出来
const view = (row) => {
  ElMessageBox.alert(`名称 ${row.name}　日期 ${row.date}　主产地 ${row.address}`, '第 ' + row.id + ' 行', {
    confirmButtonText: '关闭',
  })
}

// 删除：先确认框，再真的从响应式数组里移除
const del = (id) => {
  const row = tableData.find((x) => x.id === id)
  ElMessageBox.confirm(`确定删除【${row.name}】这条数据吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(() => {
      tableData.splice(tableData.findIndex((x) => x.id === id), 1)
      ElMessage.success('已删除 id = ' + id)
    })
    .catch(() => ElMessage.info('已取消删除'))
}

// 演示辅助：URL 上加 ?open=add / ?open=view / ?open=del 可在加载后自动打开对应弹窗，
// 方便无头浏览器截图（原生点击截不到）。正常使用时不写参数即可。
onMounted(() => {
  const which = new URLSearchParams(location.search).get('open')
  const row = tableData[0]
  if (!row) return
  if (which === 'add') openAdd()
  else if (which === 'view') view(row)
  else if (which === 'del') del(row.id)
})
</script>
