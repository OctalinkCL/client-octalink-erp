import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { cobrosDeSuscripcionesDelAnio } from './cobranza.service'
import type { Cobro } from './types'

/**
 * Cobros de suscripción de un año, como `suscripcion_id -> mes_ciclo -> Cobro`.
 * La key cuelga de `['cobros-mes']`, así que se invalida con los mismos
 * cambios que ya refrescaban el cobro del mes (generar, marcar pago, etc.).
 */
export function useCobrosSuscripcionAnio(anio: Ref<number>) {
  const query = useQuery({
    queryKey: ['cobros-mes', 'anio', anio],
    queryFn: () => cobrosDeSuscripcionesDelAnio(anio.value),
  })

  const porSuscripcion = computed(() => {
    const mapa = new Map<string, Map<string, Cobro>>()
    for (const c of query.data.value ?? []) {
      if (!mapa.has(c.suscripcion_id)) mapa.set(c.suscripcion_id, new Map())
      mapa.get(c.suscripcion_id)!.set(c.mes_ciclo, c)
    }
    return mapa
  })

  return { porSuscripcion, loading: computed(() => query.isPending.value) }
}
