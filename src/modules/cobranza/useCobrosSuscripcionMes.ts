import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { cobrosDeSuscripcionesDelMes } from './cobranza.service'

/**
 * Mapa `suscripcion_id -> { id, numero }` de los cobros de un mes de ciclo.
 * Se invalida junto con `['cobros-mes']` al generar un cobro de suscripción.
 */
export function useCobrosSuscripcionMes(mesCiclo: string) {
  const query = useQuery({
    queryKey: ['cobros-mes', mesCiclo],
    queryFn: () => cobrosDeSuscripcionesDelMes(mesCiclo),
  })

  const mapa = computed(
    () => query.data.value ?? new Map<string, { id: string; numero: number }>(),
  )

  return { mapa }
}
