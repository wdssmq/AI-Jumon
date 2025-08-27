import { createApp } from 'vue'
import '@unocss/reset/normalize.css'
import './style.css'
import 'virtual:uno.css'
import router from './router'
import App from './App.vue'

createApp(App)
.use(router)
.mount('#app').$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
  window.ipcRenderer.on('click-count', (_event, message) => {
    console.log(message)
  })
})
