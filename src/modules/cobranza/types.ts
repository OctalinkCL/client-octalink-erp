import type { Timestamp } from 'firebase/firestore'

export const ESTADOS_PAGO = ['pendiente', 'enviado', 'pagado'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const ESTADOS_BOLETA = ['no_aplica', 'pendiente', 'enviada'] as const
export type EstadoBoleta = (typeof ESTADOS_BOLETA)[number]

export type OrigenCobro = 'ot' | 'suscripcion' | 'directo'

export interface Cobro {
  id: string
  numero: number
  cliente_id: string
  cliente_nombre: string
  origen: OrigenCobro
  // Back-references opcionales para reconstruir el relato. Vacíos si no aplican.
  ot_id: string
  ot_numero: number | null
  cotizacion_id: string
  cotizacion_numero: number | null
  suscripcion_id: string
  mes_ciclo: string // 'YYYY-MM' para cobros de suscripción
  concepto: string
  monto: number
  estado_pago: EstadoPago
  estado_boleta: EstadoBoleta
  fecha_pago: Timestamp | null
  url_boleta: string
  notas: string
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

/** Lo que edita el formulario de cobro directo. El número lo pone el sistema. */
export type CobroInput = Omit<
  Cobro,
  'id' | 'numero' | 'fecha_pago' | 'creado_en' | 'actualizado_en'
>

export function cobroInputVacio(): CobroInput {
  return {
    cliente_id: '',
    cliente_nombre: '',
    origen: 'directo',
    ot_id: '',
    ot_numero: null,
    cotizacion_id: '',
    cotizacion_numero: null,
    suscripcion_id: '',
    mes_ciclo: '',
    concepto: '',
    monto: 0,
    estado_pago: 'pendiente',
    estado_boleta: 'no_aplica',
    url_boleta: '',
    notas: '',
  }
}

export const LABEL_ESTADO_BOLETA: Record<EstadoBoleta, string> = {
  no_aplica: 'sin boleta',
  pendiente: 'boleta pendiente',
  enviada: 'boleta enviada',
}
