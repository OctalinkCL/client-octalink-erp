import type { Timestamp } from 'firebase/firestore'

export const ESTADOS_OT = ['pendiente', 'en_curso', 'completada'] as const
export type EstadoOt = (typeof ESTADOS_OT)[number]

export interface Ot {
  id: string
  numero: number
  cliente_id: string
  cliente_nombre: string
  // Cotización asociada (opcional, solo referencia). '' / null si es puntual.
  cotizacion_id: string
  cotizacion_numero: number | null
  descripcion: string
  monto: number
  emite_boleta: boolean
  estado: EstadoOt
  // Flag denormalizado: true cuando ya se generó un cobro desde esta OT.
  // Lo maneja el sistema (cobranza.service), no el formulario.
  cobro_generado: boolean
  notas: string
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

/** Lo que edita el formulario. El número y `cobro_generado` los pone el sistema. */
export type OtInput = Omit<
  Ot,
  'id' | 'numero' | 'cobro_generado' | 'creado_en' | 'actualizado_en'
>

export function otInputVacio(): OtInput {
  return {
    cliente_id: '',
    cliente_nombre: '',
    cotizacion_id: '',
    cotizacion_numero: null,
    descripcion: '',
    monto: 0,
    emite_boleta: false,
    estado: 'pendiente',
    notas: '',
  }
}
