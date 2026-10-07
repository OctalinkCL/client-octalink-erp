import { computed, ref } from 'vue'
import { mesCicloActual } from '@/lib/formato'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Ot } from '@/modules/ots/types'
import type { Suscripcion } from '@/modules/suscripciones/types'
import { mesDeCobro, type Cobro, type CobroInput, type EstadoBoleta, type EstadoPago, type FiltroPago } from './types'
import {
  actualizarCobro,
  cambiarEstadoBoleta,
  cambiarEstadoPago,
  crearCobro,
  crearCobroDesdeOt,
  crearCobroDesdeSuscripcion,
  cobroDeSuscripcionMes,
  eliminarCobro,
  listarCobros,
  obtenerCobro,
} from './cobranza.service'

const KEY = ['cobros'] as const

export function useCobranza() {
  const qc = useQueryClient()
  const busqueda = ref('')
  // Parte en lo abierto de cualquier mes: el filtro de mes es para el historial.
  const filtroPago = ref<FiltroPago>('por_cobrar')
  // 'YYYY-MM' o 'todos'.
  const filtroMes = ref<string>('todos')

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

  // Mes actual + meses con al menos un cobro, del más reciente al más antiguo.
  const mesesDisponibles = computed(() =>
    [...new Set([mesCicloActual(), ...cobros.value.map(mesDeCobro).filter(Boolean)])]
      .sort()
      .reverse(),
  )

  const cobrosFiltrados = computed(() => {
    let lista = cobros.value
    if (filtroMes.value !== 'todos') {
      lista = lista.filter((c) => mesDeCobro(c) === filtroMes.value)
    }
    if (filtroPago.value === 'por_cobrar') {
      lista = lista.filter((c) => c.estado_pago !== 'pagado')
    } else if (filtroPago.value !== 'todos') {
      lista = lista.filter((c) => c.estado_pago === filtroPago.value)
    }
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return lista
    return lista.filter((c) =>
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
    filtroPago,
    filtroMes,
    mesesDisponibles,
    cargar: () => query.refetch(),
    obtener: (id: string) => obtenerCobro(id),
    cobroDeSuscripcionMes: (suscripcionId: string, mesCiclo: string) =>
      cobroDeSuscripcionMes(suscripcionId, mesCiclo),
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
