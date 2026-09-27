import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 实训3：引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

app.use(router)
// 注意：app.use(ElementPlus) 必须在 createApp 之后
app.use(ElementPlus, { locale: zhCn })

// 全局注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
