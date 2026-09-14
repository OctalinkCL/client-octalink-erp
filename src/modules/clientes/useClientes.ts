import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Cliente, ClienteInput } from './types'
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
} from './clientes.service'

const KEY = ['clientes'] as const

export function useClientes() {
  const qc = useQueryClient()
  const busqueda = ref('')

  const query = useQuery({ queryKey: KEY, queryFn: listarClientes })

  const clientes = computed(() => query.data.value ?? [])
  const loading = computed(() => query.isPending.value)
  const error = computed(() => (query.error.value ? 'No se pudieron cargar los clientes.' : ''))

  const clientesFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return clientes.value
    return clientes.value.filter((c) =>
      [c.nombre, c.rut, c.email, c.contacto].some((v) => v.toLowerCase().includes(q)),
    )
  })

  const crearMut = useMutation({
    mutationFn: (input: ClienteInput) => crearCliente(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  const actualizarMut = useMutation({
    mutationFn: (v: { id: string; input: ClienteInput }) => actualizarCliente(v.id, v.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  const eliminarMut = useMutation({
    mutationFn: (id: string) => eliminarCliente(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Cliente[]>(KEY)
      qc.setQueryData<Cliente[]>(KEY, (old = []) => old.filter((c) => c.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    clientes,
    clientesFiltrados,
    loading,
    error,
    busqueda,
    cargar: () => query.refetch(),
    crear: (input: ClienteInput) => crearMut.mutateAsync(input),
    actualizar: (id: string, input: ClienteInput) => actualizarMut.mutateAsync({ id, input }),
    eliminar: (id: string) => eliminarMut.mutateAsync(id),
  }
}
