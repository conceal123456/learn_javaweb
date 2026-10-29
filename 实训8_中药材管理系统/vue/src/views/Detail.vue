<template>
  <div>
    <!-- 🧱 第1点：搭建查询区域 -->
    <div class="card" style="margin-bottom: 5px">
      <el-input
          style="width: 240px; margin-right: 10px"
          v-model="data.name"
          placeholder="请输入中药材名称查询"
          :prefix-icon="Search"
          clearable
          @keyup.enter="loadData">
      </el-input>
      <el-button type="primary" @click="loadData">查 询</el-button>
      <el-button type="warning" @click="reset">重 置</el-button>
    </div>

    <!-- 🧱 第2点：搭建功能按钮区 -->
    <div class="card" style="margin-bottom: 5px">
      <el-button type="primary" @click="openAdd">新 增</el-button>
      <el-button type="warning" @click="batchDelete">批量删除</el-button>
      <el-button type="info" @click="importVisible = true">导 入</el-button>
      <el-button type="success" @click="exportData">导 出</el-button>
      <el-button link @click="downloadTpl">下载导入模板</el-button>
    </div>

    <!-- 🧱 第3、4点：表格与分页区 -->
    <div class="card" style="margin-bottom: 5px">
      <el-table
          :data="data.tableData"
          stripe
          v-loading="data.loading"
          @selection-change="(val) => (data.selection = val)">
        <el-table-column type="selection" width="50" />
        <el-table-column label="名称" prop="name" min-width="130" />
        <el-table-column label="产地" prop="origin" min-width="160" />
        <el-table-column label="单价" width="100">
          <template #default="{ row }">￥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="库存" width="100">
          <template #default="{ row }">{{ row.stock }} kg</template>
        </el-table-column>
        <el-table-column label="生产日期" prop="produceDate" width="130" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 15px">
        <el-pagination
            v-model:current-page="data.pageNum"
            v-model:page-size="data.pageSize"
            :page-sizes="[5, 10, 15, 20]"
            background
            layout="total, sizes, prev, pager, next"
            :total="data.total"
            @current-change="loadData"
            @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑中药材' : '新增中药材'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="药材名称" prop="name">
          <el-input v-model="form.name" placeholder="如：霍山石斛" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.alias" placeholder="如：米斛" />
        </el-form-item>
        <el-form-item label="产地" prop="origin">
          <el-input v-model="form.origin" placeholder="如：安徽六安霍山县" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" style="width: 200px" />
        </el-form-item>
        <el-form-item label="生产日期">
          <el-date-picker v-model="form.produceDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="保质期">
          <el-input v-model="form.shelfLife" placeholder="如：24个月" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="功效描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importVisible" title="导入中药材" width="500px" @closed="fileList = []">
      <div style="margin-bottom: 12px; font-size: 14px; color: #666">
        请先下载模板，按表头填写后上传，支持 .xlsx / .xls。
      </div>
      <el-upload
          v-model:file-list="fileList"
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">把 Excel 拖到这里，或 <em>点击选择文件</em></div>
      </el-upload>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" :disabled="!fileList.length" @click="doImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, UploadFilled } from '@element-plus/icons-vue'
import {
  addHerb,
  deleteHerb,
  deleteHerbBatch,
  downloadTemplate,
  exportHerb,
  getHerbPage,
  importHerb,
  updateHerb
} from '@/api/herb'
import { downloadBlob } from '@/utils/download'

const data = reactive({
  name: null,
  tableData: [],
  pageNum: 1,
  pageSize: 10,
  total: 0,
  loading: false,
  selection: []
})

const dialogVisible = ref(false)
const importVisible = ref(false)
const saving = ref(false)
const importing = ref(false)
const fileList = ref([])
const formRef = ref()

const emptyForm = () => ({
  id: null,
  name: '',
  alias: '',
  origin: '',
  price: 0,
  stock: 0,
  produceDate: '',
  shelfLife: '24个月',
  description: '',
  status: 1
})

const form = reactive(emptyForm())

const rules = {
  name: [{ required: true, message: '请输入药材名称', trigger: 'blur' }],
  origin: [{ required: true, message: '请输入产地', trigger: 'blur' }]
}

const params = () => ({
  pageNum: data.pageNum,
  pageSize: data.pageSize,
  name: data.name || undefined
})

const loadData = async () => {
  data.loading = true
  try {
    const res = await getHerbPage(params())
    data.tableData = res.data.records
    data.total = res.data.total
  } finally {
    data.loading = false
  }
}

const reset = () => {
  data.name = null
  data.pageNum = 1
  loadData()
}

const handleSizeChange = () => {
  data.pageNum = 1
  loadData()
}

const openAdd = () => {
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, emptyForm(), row)
  dialogVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateHerb(form)
      ElMessage.success('修改成功')
    } else {
      await addHerb(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  await deleteHerb(row.id)
  ElMessage.success('删除成功')
  if (data.tableData.length === 1 && data.pageNum > 1) {
    data.pageNum -= 1
  }
  loadData()
}

const batchDelete = async () => {
  if (!data.selection.length) {
    ElMessage.warning('请先勾选要删除的药材')
    return
  }
  await ElMessageBox.confirm(`确定删除选中的 ${data.selection.length} 条药材吗？`, '批量删除', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  const res = await deleteHerbBatch(data.selection.map((item) => item.id))
  ElMessage.success(res.msg)
  data.pageNum = 1
  loadData()
}

const exportData = async () => {
  const res = await exportHerb(params())
  await downloadBlob(res, '中药材数据.xlsx')
  ElMessage.success('导出成功')
}

const downloadTpl = async () => {
  const res = await downloadTemplate()
  await downloadBlob(res, '中药材导入模板.xlsx')
}

const doImport = async () => {
  const file = fileList.value[0]?.raw
  if (!file) {
    ElMessage.warning('请选择 Excel 文件')
    return
  }
  importing.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await importHerb(fd)
    ElMessage.success(res.msg)
    importVisible.value = false
    data.pageNum = 1
    loadData()
  } finally {
    importing.value = false
  }
}

onMounted(loadData)
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
