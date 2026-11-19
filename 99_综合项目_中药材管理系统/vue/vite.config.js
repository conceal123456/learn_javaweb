import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    watch: {
      // 编辑器的原子保存会生成 .xxx.tmpdir 临时目录，避免 Vite 监听报 EBUSY
      ignored: ['**/.*.tmpdir/**', '**/node_modules/**']
    },
    proxy: {
      // 前端所有 /api 开头的请求转发到 SpringBoot，避免跨域
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
