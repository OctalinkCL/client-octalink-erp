import { computed, ref } from 'vue'
import type { Cotizacion } from '@/modules/cotizaciones/types'
import type { EstadoOt, Ot, OtInput } from './types'
import {
  actualizarOt,
  cambiarEstadoOt,
  crearOt,
  crearOtDesdeCotizacion,
  eliminarOt,
  listarOts,
  obtenerOt,
} from './ots.service'

export function useOts() {
  const ots = ref<Ot[]>([])
  const loading = ref(false)
  const error = ref('')
  const busqueda = ref('')

  const otsFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return ots.value
    return ots.value.filter((o) =>
      [String(o.numero), o.cliente_nombre, o.descripcion, o.estado].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  })

  async function cargar() {
    loading.value = true
    error.value = ''
    try {
      ots.value = await listarOts()
    } catch (e) {
      error.value = 'No se pudieron cargar las OTs.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function obtener(id: string) {
    return obtenerOt(id)
  }

  function crear(input: OtInput) {
    return crearOt(input)
  }

  function actualizar(id: string, input: OtInput) {
    return actualizarOt(id, input)
  }

  function generarDesdeCotizacion(c: Cotizacion) {
    return crearOtDesdeCotizacion(c)
  }

  async function cambiarEstado(id: string, estado: EstadoOt) {
    await cambiarEstadoOt(id, estado)
    await cargar()
  }

  async function eliminar(id: string) {
    await eliminarOt(id)
    await cargar()
  }

  return {
    ots,
    otsFiltradas,
    loading,
    error,
    busqueda,
    cargar,
    obtener,
    crear,
    actualizar,
    generarDesdeCotizacion,
    cambiarEstado,
    eliminar,
  }
}
