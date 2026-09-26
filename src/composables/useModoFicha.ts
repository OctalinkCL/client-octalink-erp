import { ref } from 'vue'

/**
 * Modo ficha / edición para las vistas de detalle (cobro, OT, cotización,
 * suscripción). Un registro existente parte en la ficha (solo lectura) y
 * "Editar" habilita los datos; uno nuevo parte directo en edición.
 *
 * `campos` son los datos que "Cancelar" restaura. El estado NO va aquí: se
 * guarda al instante desde la columna lateral, sin pasar por "Editar".
 */
export function useModoFicha<T extends object>(
  form: T,
  campos: readonly (keyof T)[],
  esNuevo: boolean,
) {
  const editando = ref(esNuevo)
  let copia: Partial<T> = {}

  function empezarEdicion() {
    // Copia profunda: algunos campos son arrays/objetos (ítems de cotización).
    copia = JSON.parse(JSON.stringify(Object.fromEntries(campos.map((k) => [k, form[k]]))))
    editando.value = true
  }

  function cancelarEdicion() {
    Object.assign(form, copia)
    editando.value = false
  }

  return { editando, empezarEdicion, cancelarEdicion }
}
