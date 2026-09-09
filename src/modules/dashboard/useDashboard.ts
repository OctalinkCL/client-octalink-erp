import { computed, ref } from 'vue'
import { mesCicloActual } from '@/lib/formato'
import { listarCobros } from '@/modules/cobranza/cobranza.service'
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { listarCotizaciones } from '@/modules/cotizaciones/cotizaciones.service'
import { listarOts } from '@/modules/ots/ots.service'
import { useOts } from '@/modules/ots/useOts'
import { listarSuscripciones } from '@/modules/suscripciones/suscripciones.service'
import type { Cobro } from '@/modules/cobranza/types'
import type { Cotizacion } from '@/modules/cotizaciones/types'
import type { Ot } from '@/modules/ots/types'
import type { Suscripcion } from '@/modules/suscripciones/types'

function esDelMesActual(ts: Cobro['fecha_pago']): boolean {
  if (!ts) return false
  const d = ts.toDate()
  const hoy = new Date()
  return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth()
}

/**
 * Agregador de solo lectura del Dashboard. Carga las 4 colecciones de una vez
 * y cruza en el cliente (a esta escala son migajas para Firestore).
 */
export function useDashboard() {
  const cobros = ref<Cobro[]>([])
  const ots = ref<Ot[]>([])
  const cotizaciones = ref<Cotizacion[]>([])
  const suscripciones = ref<Suscripcion[]>([])

  const loading = ref(false)
  const error = ref('')
  const procesando = ref('')

  const { generarDesdeOt, generarDesdeSuscripcion } = useCobranza()
  const { generarDesdeCotizacion } = useOts()

  const mesActual = mesCicloActual()

  async function cargar() {
    loading.value = true
    error.value = ''
    try {
      const [c, o, q, s] = await Promise.all([
        listarCobros(),
        listarOts(),
        listarCotizaciones(),
        listarSuscripciones(),
      ])
      cobros.value = c
      ots.value = o
      cotizaciones.value = q
      suscripciones.value = s
    } catch (e) {
      error.value = 'No se pudo cargar el dashboard.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // --- Bandeja de tareas ---

  const suscripcionesSinCobro = computed(() =>
    suscripciones.value.filter(
      (s) =>
        s.estado === 'activa' &&
        !cobros.value.some(
          (c) => c.suscripcion_id === s.id && c.mes_ciclo === mesActual,
        ),
    ),
  )

  const otsSinCobro = computed(() =>
    ots.value.filter(
      (o) => o.estado === 'completada' && !cobros.value.some((c) => c.ot_id === o.id),
    ),
  )

  const cotizacionesSinOt = computed(() =>
    cotizaciones.value.filter(
      (q) => q.estado === 'aceptada' && !ots.value.some((o) => o.cotizacion_id === q.id),
    ),
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
    suscripcionesActivas: suscripciones.value.filter((s) => s.estado === 'activa').length,
    mrr: suscripciones.value
      .filter((s) => s.estado === 'activa')
      .reduce((acc, s) => acc + (s.monto || 0), 0),
    cotizacionesPendientes: cotizaciones.value.filter((q) => q.estado === 'pendiente')
      .length,
  }))

  // --- Acciones (reusan los composables dueños; luego recargan) ---

  async function generarCobroDeSuscripcion(s: Suscripcion) {
    procesando.value = `sus-${s.id}`
    try {
      await generarDesdeSuscripcion(s, mesActual)
      await cargar()
    } catch (e) {
      console.error(e)
      window.alert('No se pudo generar el cobro.')
    } finally {
      procesando.value = ''
    }
  }

  async function generarCobroDeOt(o: Ot) {
    procesando.value = `ot-${o.id}`
    try {
      await generarDesdeOt(o)
      await cargar()
    } catch (e) {
      console.error(e)
      window.alert('No se pudo generar el cobro.')
    } finally {
      procesando.value = ''
    }
  }

  async function generarOtDeCotizacion(q: Cotizacion) {
    procesando.value = `cot-${q.id}`
    try {
      await generarDesdeCotizacion(q)
      await cargar()
    } catch (e) {
      console.error(e)
      window.alert('No se pudo generar la OT.')
    } finally {
      procesando.value = ''
    }
  }

  return {
    loading,
    error,
    procesando,
    mesActual,
    cargar,
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
