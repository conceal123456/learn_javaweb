<template>
  <div>
    <div class="card" style="margin-bottom: 5px">
      <el-input
          style="width: 240px; margin-right: 10px"
          v-model="query.username"
          placeholder="请输入账号或昵称查询"
          :prefix-icon="Search"
          clearable
          @keyup.enter="loadData">
      </el-input>
      <el-button type="primary" @click="loadData">查 询</el-button>
      <el-button type="warning" @click="reset">重 置</el-button>
      <el-button type="success" style="margin-left: 10px" @click="openAdd">新 增</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column label="账号" prop="username" min-width="120" />
        <el-table-column label="昵称" prop="nickname" min-width="120" />
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'warning' : 'info'">
              {{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="手机号" prop="phone" width="150" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :disabled="row.username === 'admin'" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 15px">
        <el-pagination
            v-model:current-page="query.pageNum"
            v-model:page-size="query.pageSize"
            :page-sizes="[5, 10, 15, 20]"
            background
            layout="total, sizes, prev, pager, next"
            :total="total"
            @current-change="loadData"
            @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="3-20 位" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password
                    :placeholder="form.id ? '留空表示不修改' : '默认 123456'" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio value="ADMIN">管理员</el-radio>
            <el-radio value="USER">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { addUser, deleteUser, getUserPage, updateUser } from '@/api/user'

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref()

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  username: ''
})

const emptyForm = () => ({
  id: null,
  username: '',
  password: '',
  nickname: '',
  role: route.meta.role || 'USER',
  phone: '',
  status: 1
})

const form = reactive(emptyForm())

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度 3-20 位', trigger: 'blur' }
  ]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      username: query.username || undefined,
      role: route.meta.role || undefined
    })
    tableData.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const reset = () => {
  query.username = ''
  query.pageNum = 1
  loadData()
}

const handleSizeChange = () => {
  query.pageNum = 1
  loadData()
}

const openAdd = () => {
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, emptyForm(), row, { password: '' })
  dialogVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateUser(form)
      ElMessage.success('修改成功')
    } else {
      await addUser(form)
      ElMessage.success('新增成功，默认密码 123456')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除账号「${row.username}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  loadData()
}

watch(() => route.path, () => {
  query.pageNum = 1
  loadData()
})

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
