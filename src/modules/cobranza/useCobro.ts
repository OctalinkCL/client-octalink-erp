import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { obtenerCobro } from './cobranza.service'

/** Un cobro por id. Cuelga de la key 'cobros', así que se refresca con el resto. */
export function useCobro(id: Ref<string>) {
  const query = useQuery({
    queryKey: ['cobros', id],
    queryFn: () => obtenerCobro(id.value),
    enabled: () => !!id.value,
  })

  return {
    cobro: computed(() => query.data.value ?? null),
    loading: computed(() => query.isPending.value),
    error: computed(() => {
      if (query.error.value) return 'No se pudo cargar el cobro.'
      if (query.data.value === null) return 'Cobro no encontrado.'
      return ''
    }),
  }
}
