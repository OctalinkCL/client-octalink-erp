import { useColorMode } from '@vueuse/core'
import { effectScope } from 'vue'

// Scope "detached": sus watchers (los que sincronizan la clase .dark del <html>)
// viven mientras vive la app, no mientras vive el primer componente que llame a
// useTheme(). Si no, al desmontarse ese componente (navegar a otra sección) Vue
// mata ese watcher y el tema deja de aplicarse hasta refrescar la página.
const mode = effectScope(true).run(() => useColorMode())!

export function useTheme() {
  return { theme: mode.store }
}
