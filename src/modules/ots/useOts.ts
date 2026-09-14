import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
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

const KEY = ['ots'] as const

export function useOts() {
  const qc = useQueryClient()
  const busqueda = ref('')

  // Un cambio en OTs también afecta cotizaciones (flag ot_generada) y el dashboard.
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['cotizaciones'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const query = useQuery({ queryKey: KEY, queryFn: listarOts })

  const ots = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() => (query.error.value ? 'No se pudieron cargar las OTs.' : ''))

  const otsFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return ots.value
    return ots.value.filter((o) =>
      [String(o.numero), o.cliente_nombre, o.descripcion, o.estado].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  })

  const crearMut = useMutation({
    mutationFn: (input: OtInput) => crearOt(input),
    onSuccess: invalidar,
  })

  const actualizarMut = useMutation({
    mutationFn: (v: { id: string; input: OtInput }) => actualizarOt(v.id, v.input),
    onSuccess: invalidar,
  })

  const estadoMut = useMutation({
    mutationFn: (v: { id: string; estado: EstadoOt }) => cambiarEstadoOt(v.id, v.estado),
    onSuccess: invalidar,
  })

  const generarMut = useMutation({
    mutationFn: (c: Cotizacion) => crearOtDesdeCotizacion(c),
    onSuccess: invalidar,
  })

  const eliminarMut = useMutation({
    mutationFn: (id: string) => eliminarOt(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Ot[]>(KEY)
      qc.setQueryData<Ot[]>(KEY, (old = []) => old.filter((o) => o.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: invalidar,
  })

  return {
    ots,
    otsFiltradas,
    loading,
    error,
    busqueda,
    cargar: () => query.refetch(),
    obtener: (id: string) => obtenerOt(id),
    crear: (input: OtInput) => crearMut.mutateAsync(input),
    actualizar: (id: string, input: OtInput) => actualizarMut.mutateAsync({ id, input }),
    cambiarEstado: (id: string, estado: EstadoOt) => estadoMut.mutateAsync({ id, estado }),
    generarDesdeCotizacion: (c: Cotizacion) => generarMut.mutateAsync(c),
    eliminar: (id: string) => eliminarMut.mutateAsync(id),
  }
}
