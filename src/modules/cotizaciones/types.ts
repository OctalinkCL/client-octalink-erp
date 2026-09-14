import type { Timestamp } from 'firebase/firestore'

export const ESTADOS_COTIZACION = ['pendiente', 'aceptada', 'rechazada'] as const
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number]

export interface ItemCotizacion {
  item: string
  descripcion: string
  precio: number
}

export interface Cotizacion {
  id: string
  numero: number
  cliente_id: string
  cliente_nombre: string
  items: ItemCotizacion[]
  total: number
  estado: EstadoCotizacion
  // Flag denormalizado: true cuando ya se generó una OT desde esta cotización.
  // Lo maneja el sistema (ots.service), no el formulario.
  ot_generada: boolean
  fecha: Timestamp | null
  notas: string
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

/** Lo que edita el formulario. El número, el total y `ot_generada` los pone el sistema. */
export type CotizacionInput = Omit<
  Cotizacion,
  'id' | 'numero' | 'total' | 'ot_generada' | 'fecha' | 'creado_en' | 'actualizado_en'
>

export function itemVacio(): ItemCotizacion {
  return { item: '', descripcion: '', precio: 0 }
}

export function cotizacionInputVacio(): CotizacionInput {
  return {
    cliente_id: '',
    cliente_nombre: '',
    items: [itemVacio()],
    estado: 'pendiente',
    notas: '',
  }
}

export function calcularTotal(items: ItemCotizacion[]): number {
  return items.reduce((acc, i) => acc + (Math.trunc(Number(i.precio)) || 0), 0)
}
