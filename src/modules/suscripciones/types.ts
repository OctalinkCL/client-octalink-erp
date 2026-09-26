import type { Timestamp } from 'firebase/firestore'
import { mesCicloActual } from '@/lib/formato'

export const ESTADOS_SUSCRIPCION = ['activa', 'pausada'] as const
export type EstadoSuscripcion = (typeof ESTADOS_SUSCRIPCION)[number]

export interface Suscripcion {
  id: string
  cliente_id: string
  cliente_nombre: string
  descripcion: string
  monto: number // mensual, CLP
  dia_cobro: number // 1–28
  // 'YYYY-MM' desde cuando corre la suscripción. Los meses previos no cuentan
  // como deuda en la grilla. Docs antiguos no lo tienen: ver mesInicioDe().
  mes_inicio: string
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
    mes_inicio: mesCicloActual(),
    emite_boleta: false,
    estado: 'activa',
    cotizacion_id: '',
    cotizacion_numero: null,
    ot_id: '',
    ot_numero: null,
    notas: '',
  }
}

/** Mes de inicio; para docs sin el campo se usa el mes en que se creó. */
export function mesInicioDe(s: Pick<Suscripcion, 'mes_inicio' | 'creado_en'>): string {
  if (s.mes_inicio) return s.mes_inicio
  return s.creado_en ? mesCicloActual(s.creado_en.toDate()) : ''
}

/** Colores de badge por estado. */
export const CLASE_ESTADO_SUSCRIPCION: Record<EstadoSuscripcion, string> = {
  activa: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pausada: 'bg-muted text-muted-foreground',
}
