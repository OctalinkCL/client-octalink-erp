import type { Timestamp } from 'firebase/firestore'

export const ESTADOS_SUSCRIPCION = ['activa', 'pausada'] as const
export type EstadoSuscripcion = (typeof ESTADOS_SUSCRIPCION)[number]

export interface Suscripcion {
  id: string
  cliente_id: string
  cliente_nombre: string
  descripcion: string
  monto: number // mensual, CLP
  dia_cobro: number // 1–28
  emite_boleta: boolean
  estado: EstadoSuscripcion
  // Back-references opcionales (origen del plan). Vacíos si nació solo.
  cotizacion_id: string
  cotizacion_numero: number | null
  ot_id: string
  ot_numero: number | null
  notas: string
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

export type SuscripcionInput = Omit<
  Suscripcion,
  'id' | 'creado_en' | 'actualizado_en'
>

export function suscripcionInputVacio(): SuscripcionInput {
  return {
    cliente_id: '',
    cliente_nombre: '',
    descripcion: '',
    monto: 0,
    dia_cobro: 1,
    emite_boleta: false,
    estado: 'activa',
    cotizacion_id: '',
    cotizacion_numero: null,
    ot_id: '',
    ot_numero: null,
    notas: '',
  }
}
