import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器：统一携带 token
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.token = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理 code
service.interceptors.response.use(
  (response) => {
    // 文件下载直接返回完整响应
    if (response.config.responseType === 'blob') {
      return response
    }
    const res = response.data
    if (res.code === '200') {
      return res
    }
    if (res.code === '401') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.error(res.msg || '登录已失效，请重新登录')
      setTimeout(() => {
        window.location.href = '/login'
      }, 600)
      return Promise.reject(new Error(res.msg || '登录已失效'))
    }
    ElMessage.error(res.msg || '操作失败')
    return Promise.reject(new Error(res.msg || '操作失败'))
  },
  (error) => {
    const msg = error.response?.data?.msg || error.message || '网络异常，请检查后端是否启动'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service
