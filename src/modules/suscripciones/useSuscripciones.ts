import { computed, ref } from 'vue'
import type { EstadoSuscripcion, Suscripcion, SuscripcionInput } from './types'
import {
  actualizarSuscripcion,
  cambiarEstadoSuscripcion,
  crearSuscripcion,
  eliminarSuscripcion,
  listarSuscripciones,
  obtenerSuscripcion,
} from './suscripciones.service'

export function useSuscripciones() {
  const suscripciones = ref<Suscripcion[]>([])
  const loading = ref(false)
  const error = ref('')
  const busqueda = ref('')

  const suscripcionesFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return suscripciones.value
    return suscripciones.value.filter((s) =>
      [s.cliente_nombre, s.descripcion, s.estado].some((v) => v.toLowerCase().includes(q)),
    )
  })

  async function cargar() {
    loading.value = true
    error.value = ''
    try {
      suscripciones.value = await listarSuscripciones()
    } catch (e) {
      error.value = 'No se pudieron cargar las suscripciones.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function obtener(id: string) {
    return obtenerSuscripcion(id)
  }

  function crear(input: SuscripcionInput) {
    return crearSuscripcion(input)
  }

  function actualizar(id: string, input: SuscripcionInput) {
    return actualizarSuscripcion(id, input)
  }

  async function cambiarEstado(id: string, estado: EstadoSuscripcion) {
    await cambiarEstadoSuscripcion(id, estado)
    await cargar()
  }

  async function eliminar(id: string) {
    await eliminarSuscripcion(id)
    await cargar()
  }

  return {
    suscripciones,
    suscripcionesFiltradas,
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
