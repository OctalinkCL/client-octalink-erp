import type { Timestamp } from 'firebase/firestore'

export interface Cliente {
  id: string
  nombre: string
  rut: string
  email: string
  telefono: string
  direccion: string
  contacto: string
  notas: string
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

/** Datos que edita el formulario (sin id ni timestamps). */
export type ClienteInput = Omit<Cliente, 'id' | 'creado_en' | 'actualizado_en'>

export function clienteInputVacio(): ClienteInput {
  return {
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: '',
    contacto: '',
    notas: '',
  }
}
