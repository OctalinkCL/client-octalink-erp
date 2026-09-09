import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
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

const KEY = ['cobros'] as const

export function useCobranza() {
  const qc = useQueryClient()
  const busqueda = ref('')

  // Un cambio en cobros afecta también ots (flag cobro_generado), el mapa de
  // cobros del mes de suscripciones, y el dashboard.
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['ots'] })
    qc.invalidateQueries({ queryKey: ['cobros-mes'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const query = useQuery({ queryKey: KEY, queryFn: listarCobros })

  const cobros = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() => (query.error.value ? 'No se pudieron cargar los cobros.' : ''))

  const cobrosFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return cobros.value
    return cobros.value.filter((c) =>
      [String(c.numero), c.cliente_nombre, c.concepto, c.estado_pago, c.estado_boleta].some(
        (v) => v.toLowerCase().includes(q),
      ),
    )
  })

  const crearMut = useMutation({
    mutationFn: (input: CobroInput) => crearCobro(input),
    onSuccess: invalidar,
  })

  const actualizarMut = useMutation({
    mutationFn: (v: { id: string; input: CobroInput }) => actualizarCobro(v.id, v.input),
    onSuccess: invalidar,
  })

  const pagoMut = useMutation({
    mutationFn: (v: { id: string; estado: EstadoPago; fecha: Date | null }) =>
      cambiarEstadoPago(v.id, v.estado, v.fecha),
    onSuccess: invalidar,
  })

  const boletaMut = useMutation({
    mutationFn: (v: { id: string; estado: EstadoBoleta; url?: string }) =>
      cambiarEstadoBoleta(v.id, v.estado, v.url),
    onSuccess: invalidar,
  })

  const generarDesdeOtMut = useMutation({
    mutationFn: (ot: Ot) => crearCobroDesdeOt(ot),
    onSuccess: invalidar,
  })

  const generarDesdeSuscripcionMut = useMutation({
    mutationFn: (v: { s: Suscripcion; mesCiclo: string }) =>
      crearCobroDesdeSuscripcion(v.s, v.mesCiclo),
    onSuccess: invalidar,
  })

  const eliminarMut = useMutation({
    mutationFn: (id: string) => eliminarCobro(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Cobro[]>(KEY)
      qc.setQueryData<Cobro[]>(KEY, (old = []) => old.filter((c) => c.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: invalidar,
  })

  return {
    cobros,
    cobrosFiltrados,
    loading,
    error,
    busqueda,
    cargar: () => query.refetch(),
    obtener: (id: string) => obtenerCobro(id),
    crear: (input: CobroInput) => crearMut.mutateAsync(input),
    actualizar: (id: string, input: CobroInput) => actualizarMut.mutateAsync({ id, input }),
    marcarPago: (id: string, estado: EstadoPago, fecha: Date | null) =>
      pagoMut.mutateAsync({ id, estado, fecha }),
    marcarBoleta: (id: string, estado: EstadoBoleta, url?: string) =>
      boletaMut.mutateAsync({ id, estado, url }),
    generarDesdeOt: (ot: Ot) => generarDesdeOtMut.mutateAsync(ot),
    generarDesdeSuscripcion: (s: Suscripcion, mesCiclo: string) =>
      generarDesdeSuscripcionMut.mutateAsync({ s, mesCiclo }),
    eliminar: (id: string) => eliminarMut.mutateAsync(id),
  }
}
