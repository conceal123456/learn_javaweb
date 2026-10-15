import axios from 'axios'

/**
 * 与 SpringBoot 后端通信的统一入口。
 *
 * baseURL 用 '/api' 这种相对路径，配合 vite.config.js 里的 server.proxy：
 *   浏览器请求  http://localhost:5173/api/hello
 *   vite 转发到 http://localhost:8080/hello
 * 这样浏览器层面不存在跨域，后端也不需要写跨域配置。
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器：可以在这里统一加 token、打印日志
request.interceptors.request.use(
  (config) => {
    console.log('[请求]', config.method?.toUpperCase(), config.baseURL + config.url)
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：后端统一返回 { code, msg, data }，这里先按 HTTP 状态码兜底
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 网络层错误（后端没启动、超时、404 等）走这里
    const status = error.response?.status
    const msg =
      status === 404
        ? '接口不存在（404）：确认后端已启动，且地址与 vite 代理里的 target 一致'
        : error.code === 'ERR_NETWORK'
          ? '连不上后端（确认 SpringBoot 已在 8080 端口启动）'
          : error.message
    return Promise.reject(new Error(msg))
  },
)

export default request
