import { computed, ref } from 'vue'
import { mesCicloActual } from '@/lib/formato'
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { useOts } from '@/modules/ots/useOts'
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
 * Agregador de solo lectura del Dashboard. Carga solo lo accionable
 * (ver dashboard.service) y cruza en el cliente. Las secciones "sin cobro" /
 * "sin OT" usan flags denormalizados (`cobro_generado`, `ot_generada`), así
 * que no hace falta traer el histórico de cobros para saberlo.
 */
export function useDashboard() {
  const cobros = ref<Cobro[]>([])
  const otsCompletadas = ref<Ot[]>([])
  const cotizaciones = ref<Cotizacion[]>([])
  const suscripcionesActivas = ref<Suscripcion[]>([])

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
      const d = await cargarDatosDashboard()
      cobros.value = d.cobros
      otsCompletadas.value = d.otsCompletadas
      cotizaciones.value = d.cotizaciones
      suscripcionesActivas.value = d.suscripcionesActivas
    } catch (e) {
      error.value = 'No se pudo cargar el dashboard.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

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
  // porCobrar: todos los no-pagados vienen en el set "abiertos".
  // cobradoMes: los pagados de este mes vienen en el set "pagados este mes".

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
