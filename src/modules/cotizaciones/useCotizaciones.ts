import { computed, ref } from 'vue'
import type { Cotizacion, CotizacionInput, EstadoCotizacion } from './types'
import {
  actualizarCotizacion,
  cambiarEstadoCotizacion,
  crearCotizacion,
  eliminarCotizacion,
  listarCotizaciones,
  obtenerCotizacion,
} from './cotizaciones.service'

export function useCotizaciones() {
  const cotizaciones = ref<Cotizacion[]>([])
  const loading = ref(false)
  const error = ref('')
  const busqueda = ref('')

  const cotizacionesFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return cotizaciones.value
    return cotizaciones.value.filter((c) =>
      [String(c.numero), c.cliente_nombre, c.estado].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  })

  async function cargar() {
    loading.value = true
    error.value = ''
    try {
      cotizaciones.value = await listarCotizaciones()
    } catch (e) {
      error.value = 'No se pudieron cargar las cotizaciones.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function obtener(id: string) {
    return obtenerCotizacion(id)
  }

  function crear(input: CotizacionInput) {
    return crearCotizacion(input)
  }

  function actualizar(id: string, input: CotizacionInput) {
    return actualizarCotizacion(id, input)
  }

  async function cambiarEstado(id: string, estado: EstadoCotizacion) {
    await cambiarEstadoCotizacion(id, estado)
    await cargar()
  }

  async function eliminar(id: string) {
    await eliminarCotizacion(id)
    await cargar()
  }

  return {
    cotizaciones,
    cotizacionesFiltradas,
    loading,
    error,
    busqueda,
    cargar,
    obtener,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
  }
}
