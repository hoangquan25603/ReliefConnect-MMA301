import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'

const app = createApp(App)

// ── Plugins ──────────────────────────────────────────────────
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(i18n)

// ── Element Plus icons (global) ──────────────────────────────
for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.mount('#app')
