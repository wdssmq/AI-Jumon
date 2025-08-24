import { createMemoryHistory, createRouter } from 'vue-router'
// import { routes, } from 'vue-router/auto-routes'

import index from './pages/index.vue'
import about from './pages/about.vue'

const routes = [
  { path: '/', component: index },
  { path: '/about', component: about },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})


export default router