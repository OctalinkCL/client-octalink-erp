import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Cotizacion, CotizacionInput, EstadoCotizacion } from './types'
import {
  actualizarCotizacion,
  cambiarEstadoCotizacion,
  crearCotizacion,
  eliminarCotizacion,
  listarCotizaciones,
  obtenerCotizacion,
} from './cotizaciones.service'

const KEY = ['cotizaciones'] as const

export function useCotizaciones() {
  const qc = useQueryClient()
  const busqueda = ref('')

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const query = useQuery({ queryKey: KEY, queryFn: listarCotizaciones })

  const cotizaciones = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() =>
    query.error.value ? 'No se pudieron cargar las cotizaciones.' : '',
  )

  const cotizacionesFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return cotizaciones.value
    return cotizaciones.value.filter((c) =>
      [String(c.numero), c.cliente_nombre, c.estado].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  })

  const crearMut = useMutation({
    mutationFn: (input: CotizacionInput) => crearCotizacion(input),
    onSuccess: invalidar,
  })

  const actualizarMut = useMutation({
    mutationFn: (v: { id: string; input: CotizacionInput }) =>
      actualizarCotizacion(v.id, v.input),
    onSuccess: invalidar,
  })

  const estadoMut = useMutation({
    mutationFn: (v: { id: string; estado: EstadoCotizacion }) =>
      cambiarEstadoCotizacion(v.id, v.estado),
    onSuccess: invalidar,
  })

  const eliminarMut = useMutation({
    mutationFn: (id: string) => eliminarCotizacion(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Cotizacion[]>(KEY)
      qc.setQueryData<Cotizacion[]>(KEY, (old = []) => old.filter((c) => c.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: invalidar,
  })

  return {
    cotizaciones,
    cotizacionesFiltradas,
    loading,
    error,
    busqueda,
    cargar: () => query.refetch(),
    obtener: (id: string) => obtenerCotizacion(id),
    crear: (input: CotizacionInput) => crearMut.mutateAsync(input),
    actualizar: (id: string, input: CotizacionInput) =>
      actualizarMut.mutateAsync({ id, input }),
    cambiarEstado: (id: string, estado: EstadoCotizacion) =>
      estadoMut.mutateAsync({ id, estado }),
    eliminar: (id: string) => eliminarMut.mutateAsync(id),
  }
}
