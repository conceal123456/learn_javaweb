import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    // 开发代理：把前端发出的 /api/xxx 转发到后端 8080 的 /xxx
    // 作用：浏览器只请求 5173，不存在跨域（CORS），后端也不用加跨域配置。
    // rewrite 把开头的 /api 去掉，因为后端接口路径是 /hello 而不是 /api/hello。
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
