import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { mesCicloActual } from '@/lib/formato'
import { crearCobroDesdeOt, crearCobroDesdeSuscripcion } from '@/modules/cobranza/cobranza.service'
import { crearOtDesdeCotizacion } from '@/modules/ots/ots.service'
import type { Cobro } from '@/modules/cobranza/types'
import type { Cotizacion } from '@/modules/cotizaciones/types'
import type { Ot } from '@/modules/ots/types'
import type { Suscripcion } from '@/modules/suscripciones/types'
import { cargarDatosDashboard } from './dashboard.service'

function esDelMesActual(ts: Cobro['fecha_pago']): boolean {
  if (!ts) return false
  const d = ts.toDate()
  const hoy = new Date()
  return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth()
}

/**
 * Agregador de solo lectura del Dashboard. Query `['dashboard']` con datos
 * acotados (ver dashboard.service); las acciones llaman a los services y
 * invalidan las keys afectadas.
 */
export function useDashboard() {
  const qc = useQueryClient()
  const mesActual = mesCicloActual()
  const procesando = ref('')

  const query = useQuery({ queryKey: ['dashboard'], queryFn: cargarDatosDashboard })

  const loading = computed(() => query.isPending.value)
  const error = computed(() => (query.error.value ? 'No se pudo cargar el dashboard.' : ''))

  const cobros = computed(() => query.data.value?.cobros ?? [])
  const otsCompletadas = computed(() => query.data.value?.otsCompletadas ?? [])
  const cotizaciones = computed(() => query.data.value?.cotizaciones ?? [])
  const suscripcionesActivas = computed(() => query.data.value?.suscripcionesActivas ?? [])

  // --- Bandeja de tareas ---

  const suscripcionesSinCobro = computed(() =>
    suscripcionesActivas.value.filter(
      (s) =>
        !cobros.value.some(
          (c) => c.suscripcion_id === s.id && c.mes_ciclo === mesActual,
        ),
    ),
  )

  const otsSinCobro = computed(() =>
    otsCompletadas.value.filter((o) => !o.cobro_generado),
  )

  const cotizacionesSinOt = computed(() =>
    cotizaciones.value.filter((q) => q.estado === 'aceptada' && !q.ot_generada),
  )

  const cobrosPorEnviar = computed(() =>
    cobros.value.filter((c) => c.estado_pago === 'pendiente'),
  )

  const cobrosPorCobrar = computed(() =>
    cobros.value.filter((c) => c.estado_pago === 'enviado'),
  )

  const boletasPendientes = computed(() =>
    cobros.value.filter((c) => c.estado_boleta === 'pendiente'),
  )

  const hayTareas = computed(
    () =>
      suscripcionesSinCobro.value.length > 0 ||
      otsSinCobro.value.length > 0 ||
      cotizacionesSinOt.value.length > 0 ||
      cobrosPorEnviar.value.length > 0 ||
      cobrosPorCobrar.value.length > 0 ||
      boletasPendientes.value.length > 0,
  )

  // --- Resumen ---

  const resumen = computed(() => ({
    porCobrar: cobros.value
      .filter((c) => c.estado_pago !== 'pagado')
      .reduce((acc, c) => acc + (c.monto || 0), 0),
    cobradoMes: cobros.value
      .filter((c) => c.estado_pago === 'pagado' && esDelMesActual(c.fecha_pago))
      .reduce((acc, c) => acc + (c.monto || 0), 0),
    suscripcionesActivas: suscripcionesActivas.value.length,
    mrr: suscripcionesActivas.value.reduce((acc, s) => acc + (s.monto || 0), 0),
    cotizacionesPendientes: cotizaciones.value.filter((q) => q.estado === 'pendiente')
      .length,
  }))

  // --- Acciones ---

  async function correr(clave: string, fn: () => Promise<unknown>, keys: string[]) {
    procesando.value = clave
    try {
      await fn()
      for (const k of ['dashboard', ...keys]) {
        qc.invalidateQueries({ queryKey: [k] })
      }
    } catch (e) {
      console.error(e)
      window.alert('No se pudo completar la acción.')
    } finally {
      procesando.value = ''
    }
  }

  const generarCobroDeSuscripcion = (s: Suscripcion) =>
    correr(`sus-${s.id}`, () => crearCobroDesdeSuscripcion(s, mesActual), ['cobros', 'cobros-mes'])

  const generarCobroDeOt = (o: Ot) =>
    correr(`ot-${o.id}`, () => crearCobroDesdeOt(o), ['cobros', 'ots'])

  const generarOtDeCotizacion = (q: Cotizacion) =>
    correr(`cot-${q.id}`, () => crearOtDesdeCotizacion(q), ['ots', 'cotizaciones'])

  return {
    loading,
    error,
    procesando,
    mesActual,
    cargar: () => query.refetch(),
    suscripcionesSinCobro,
    otsSinCobro,
    cotizacionesSinOt,
    cobrosPorEnviar,
    cobrosPorCobrar,
    boletasPendientes,
    hayTareas,
    resumen,
    generarCobroDeSuscripcion,
    generarCobroDeOt,
    generarOtDeCotizacion,
  }
}
