import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Detalle abierto en un panel, guardado en la URL (`?<clave>=<id>`): así el
 * botón atrás lo cierra y el enlace se puede recargar o compartir.
 */
export function useDetalleQuery(clave: string) {
  const route = useRoute()
  const router = useRouter()

  const id = computed(() => {
    const v = route.query[clave]
    return typeof v === 'string' ? v : ''
  })

  function cerrar() {
    const query = { ...route.query }
    delete query[clave]
    router.replace({ query })
  }

  return { id, cerrar }
}
