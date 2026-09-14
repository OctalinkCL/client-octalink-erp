import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { EstadoSuscripcion, Suscripcion, SuscripcionInput } from './types'
import {
  actualizarSuscripcion,
  cambiarEstadoSuscripcion,
  crearSuscripcion,
  eliminarSuscripcion,
  listarSuscripciones,
  obtenerSuscripcion,
} from './suscripciones.service'

const KEY = ['suscripciones'] as const

export function useSuscripciones() {
  const qc = useQueryClient()
  const busqueda = ref('')

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const query = useQuery({ queryKey: KEY, queryFn: listarSuscripciones })

  const suscripciones = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() =>
    query.error.value ? 'No se pudieron cargar las suscripciones.' : '',
  )

  const suscripcionesFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return suscripciones.value
    return suscripciones.value.filter((s) =>
      [s.cliente_nombre, s.descripcion, s.estado].some((v) => v.toLowerCase().includes(q)),
    )
  })

  const crearMut = useMutation({
    mutationFn: (input: SuscripcionInput) => crearSuscripcion(input),
    onSuccess: invalidar,
  })

  const actualizarMut = useMutation({
    mutationFn: (v: { id: string; input: SuscripcionInput }) =>
      actualizarSuscripcion(v.id, v.input),
    onSuccess: invalidar,
  })

  const estadoMut = useMutation({
    mutationFn: (v: { id: string; estado: EstadoSuscripcion }) =>
      cambiarEstadoSuscripcion(v.id, v.estado),
    onSuccess: invalidar,
  })

  const eliminarMut = useMutation({
    mutationFn: (id: string) => eliminarSuscripcion(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Suscripcion[]>(KEY)
      qc.setQueryData<Suscripcion[]>(KEY, (old = []) => old.filter((s) => s.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: invalidar,
  })

  return {
    suscripciones,
    suscripcionesFiltradas,
    loading,
    error,
    busqueda,
    cargar: () => query.refetch(),
    obtener: (id: string) => obtenerSuscripcion(id),
    crear: (input: SuscripcionInput) => crearMut.mutateAsync(input),
    actualizar: (id: string, input: SuscripcionInput) =>
      actualizarMut.mutateAsync({ id, input }),
    cambiarEstado: (id: string, estado: EstadoSuscripcion) =>
      estadoMut.mutateAsync({ id, estado }),
    eliminar: (id: string) => eliminarMut.mutateAsync(id),
  }
}
