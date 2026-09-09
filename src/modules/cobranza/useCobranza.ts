import { computed, ref } from 'vue'
import type { Ot } from '@/modules/ots/types'
import type { Suscripcion } from '@/modules/suscripciones/types'
import type { Cobro, CobroInput, EstadoBoleta, EstadoPago } from './types'
import {
  actualizarCobro,
  cambiarEstadoBoleta,
  cambiarEstadoPago,
  crearCobro,
  crearCobroDesdeOt,
  crearCobroDesdeSuscripcion,
  eliminarCobro,
  listarCobros,
  obtenerCobro,
} from './cobranza.service'

export function useCobranza() {
  const cobros = ref<Cobro[]>([])
  const loading = ref(false)
  const error = ref('')
  const busqueda = ref('')

  const cobrosFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return cobros.value
    return cobros.value.filter((c) =>
      [String(c.numero), c.cliente_nombre, c.concepto, c.estado_pago, c.estado_boleta].some(
        (v) => v.toLowerCase().includes(q),
      ),
    )
  })

  async function cargar() {
    loading.value = true
    error.value = ''
    try {
      cobros.value = await listarCobros()
    } catch (e) {
      error.value = 'No se pudieron cargar los cobros.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function obtener(id: string) {
    return obtenerCobro(id)
  }

  function crear(input: CobroInput) {
    return crearCobro(input)
  }

  function actualizar(id: string, input: CobroInput) {
    return actualizarCobro(id, input)
  }

  function generarDesdeOt(ot: Ot) {
    return crearCobroDesdeOt(ot)
  }

  function generarDesdeSuscripcion(s: Suscripcion, mesCiclo: string) {
    return crearCobroDesdeSuscripcion(s, mesCiclo)
  }

  async function marcarPago(id: string, estado: EstadoPago, fecha: Date | null) {
    await cambiarEstadoPago(id, estado, fecha)
    await cargar()
  }

  async function marcarBoleta(id: string, estado: EstadoBoleta, url?: string) {
    await cambiarEstadoBoleta(id, estado, url)
    await cargar()
  }

  async function eliminar(id: string) {
    await eliminarCobro(id)
    await cargar()
  }

  return {
    cobros,
    cobrosFiltrados,
    loading,
    error,
    busqueda,
    cargar,
    obtener,
    crear,
    actualizar,
    generarDesdeOt,
    generarDesdeSuscripcion,
    marcarPago,
    marcarBoleta,
    eliminar,
  }
}
