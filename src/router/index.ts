import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './routes/auth.routes'
import { panelRoutes } from './routes/panel.routes'
import { registerGuards } from './guard'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...panelRoutes,
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

registerGuards(router)

export default router
