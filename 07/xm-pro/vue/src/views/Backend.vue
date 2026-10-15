<template>
  <div style="padding: 20px">
    <h3>前后端联调：Vue 调用 SpringBoot 接口</h3>
    <p style="font-size: 15px; color: #666; line-height: 1.9">
      当前页面只请求 <code>http://localhost:5173/api/xxx</code>，
      由 <code>vite.config.js</code> 里的 <code>server.proxy</code> 转发到
      <code>http://localhost:8080/xxx</code>，所以浏览器层面没有跨域问题。<br />
      后端每个接口都返回统一的 <code>{ code, msg, data }</code> 结构，前端固定按这三个字段解析。
    </p>

    <el-alert
      v-if="!backendOk"
      title="还没调通：请先确认后端已启动"
      type="warning"
      :closable="false"
      style="margin: 12px 0"
    >
      在 IDEA 里运行 <code>SpringbootApplication</code>，控制台出现
      <code>Tomcat started on port 8080</code> 后再点下面的按钮。
    </el-alert>

    <el-card shadow="never" style="margin: 12px 0">
      <template #header><b>1. 逐个调用后端接口</b></template>
      <div style="display: flex; gap: 10px; flex-wrap: wrap">
        <el-button type="primary" @click="call('/hello', '直接返回字符串的接口')">GET /hello</el-button>
        <el-button type="success" @click="call('/result', '统一返回包装类 Result')">GET /result</el-button>
        <el-button @click="call('/map', '返回 Map（未包装）')">GET /map</el-button>
        <el-button type="warning" @click="call('/number', '系统异常：除零，应返回 code=500')">
          GET /number
        </el-button>
        <el-button type="danger" @click="call('/business', '业务异常：应返回 code=400')">
          GET /business
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never" style="margin: 12px 0">
      <template #header><b>2. 返回结果（后端原始 JSON）</b></template>
      <el-table :data="rows" border size="small" empty-text="点上面的按钮发一次请求">
        <el-table-column prop="time" label="时间" width="110" />
        <el-table-column prop="method" label="请求" width="130" />
        <el-table-column label="code" width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.code === '200' ? 'success' : row.code === '400' ? 'warning' : row.code ? 'danger' : 'info'"
              size="small"
            >
              {{ row.code ?? (row.body.includes('"name"') ? '未包装' : '—') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="返回内容">
          <template #default="{ row }">
            <div style="font-family: Consolas, monospace; font-size: 13px; word-break: break-all">
              {{ row.body }}
            </div>
            <div v-if="row.error" style="color: #f56c6c; font-size: 13px">{{ row.error }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" style="margin: 12px 0">
      <template #header><b>3. 解析后的 data 字段</b></template>
      <el-descriptions v-if="last" :column="1" border size="small">
        <el-descriptions-item label="code">{{ last.code ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="msg">{{ last.msg ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="data">{{ last.data ?? '—（该接口没有 data）' }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="还没有请求结果" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/api/request.js'

const rows = ref([])
const last = ref(null)
const backendOk = ref(true)

const call = async (url, label) => {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  try {
    const data = await request.get(url)
    backendOk.value = true
    last.value = data
    rows.value.unshift({
      time,
      method: `GET ${url}（${label}）`,
      code: data?.code,
      body: JSON.stringify(data),
      error: '',
    })
  } catch (e) {
    backendOk.value = false
    last.value = null
    rows.value.unshift({
      time,
      method: `GET ${url}（${label}）`,
      code: null,
      body: '（请求失败，没有返回体）',
      error: e.message,
    })
  }
}
</script>
