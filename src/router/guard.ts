import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Guard de autenticación. Rutas con `meta.requiresAuth` exigen sesión;
 * si no hay, redirige a /login guardando el destino en `?redirect=`.
 * Si ya hay sesión y se entra a /login, manda al dashboard.
 */
export function registerGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.whenReady

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.name === 'login' && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
  })
}
