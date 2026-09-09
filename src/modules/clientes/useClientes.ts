import { computed, ref } from 'vue'
import type { Cliente, ClienteInput } from './types'
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
} from './clientes.service'

/**
 * Estado reactivo de la lista de clientes. Los componentes usan esto;
 * nunca importan firebase/firestore directo.
 */
export function useClientes() {
  const clientes = ref<Cliente[]>([])
  const loading = ref(false)
  const error = ref('')
  const busqueda = ref('')

  const clientesFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return clientes.value
    return clientes.value.filter((c) =>
      [c.nombre, c.rut, c.email, c.contacto].some((v) => v.toLowerCase().includes(q)),
    )
  })

  async function cargar() {
    loading.value = true
    error.value = ''
    try {
      clientes.value = await listarClientes()
    } catch (e) {
      error.value = 'No se pudieron cargar los clientes.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function crear(input: ClienteInput) {
    const id = await crearCliente(input)
    await cargar()
    return id
  }

  async function actualizar(id: string, input: ClienteInput) {
    await actualizarCliente(id, input)
    await cargar()
  }

  async function eliminar(id: string) {
    await eliminarCliente(id)
    await cargar()
  }

  return {
    clientes,
    clientesFiltrados,
    loading,
    error,
    busqueda,
    cargar,
    crear,
    actualizar,
    eliminar,
  }
}
