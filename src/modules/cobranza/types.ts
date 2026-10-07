import type { Timestamp } from 'firebase/firestore'
import { fechaISO, mesCicloActual } from '@/lib/formato'

export const ESTADOS_PAGO = ['pendiente', 'enviado', 'pagado'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

/** Filtro de la lista de Cobranza. 'por_cobrar' = pendiente + enviado. */
export type FiltroPago = EstadoPago | 'todos' | 'por_cobrar'

export const ESTADOS_BOLETA = ['no_aplica', 'pendiente', 'enviada'] as const
export type EstadoBoleta = (typeof ESTADOS_BOLETA)[number]

export type OrigenCobro = 'ot' | 'suscripcion' | 'directo'

export const TIPOS_EVENTO_COBRO = ['creado', 'enviado', 'reenviado', 'pagado'] as const
export type TipoEventoCobro = (typeof TIPOS_EVENTO_COBRO)[number]

export interface EventoCobro {
  tipo: TipoEventoCobro
  fecha: Timestamp
}

export const LABEL_EVENTO_COBRO: Record<TipoEventoCobro, string> = {
  creado: 'Creado',
  enviado: 'Enviado',
  reenviado: 'Reenviado',
  pagado: 'Pagado',
}

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
  // 'YYYY-MM' mes al que pertenece el cobro (filtro de Cobranza). En los de
  // suscripción es además el mes de la grilla. Docs antiguos pueden tenerlo ''.
  mes_ciclo: string
  concepto: string
  monto: number
  // 'YYYY-MM-DD' fecha del documento, editable (por defecto el día en que se
  // crea). Va en el PDF. `creado_en` queda como registro del sistema.
  // Docs antiguos no la tienen: ver fechaEmisionDe().
  fecha_emision: string
  // 'YYYY-MM-DD' desde cuando corresponde enviar el cobro. '' = cobrar ya.
  // Docs anteriores al campo no lo tienen (undefined) y se tratan como ''.
  fecha_cobro: string
  estado_pago: EstadoPago
  estado_boleta: EstadoBoleta
  fecha_pago: Timestamp | null
  url_boleta: string
  notas: string
  historial: EventoCobro[]
  // Cobro cargado a posteriori (meses previos al uso del sistema). No consume el
  // correlativo: su `numero` es una serie propia y se muestra como 'P<n>'.
  historico?: boolean
  creado_en: Timestamp | null
  actualizado_en: Timestamp | null
}

/** Lo que edita el formulario de cobro directo. El número y el historial los pone el sistema. */
export type CobroInput = Omit<
  Cobro,
  'id' | 'numero' | 'fecha_pago' | 'historial' | 'creado_en' | 'actualizado_en'
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
    mes_ciclo: mesCicloActual(),
    concepto: '',
    monto: 0,
    fecha_emision: fechaISO(),
    fecha_cobro: '',
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

/** Pendiente con fecha de cobro futura: todavía no toca enviarlo. */
export function esProgramado(c: Pick<Cobro, 'estado_pago' | 'fecha_cobro'>): boolean {
  return c.estado_pago === 'pendiente' && !!c.fecha_cobro && c.fecha_cobro > fechaISO()
}

/** Número visible del cobro: '12', o 'P3' si es histórico. */
export function numeroCobro(c: Pick<Cobro, 'numero' | 'historico'>): string {
  return c.historico ? `P${c.numero}` : String(c.numero)
}

/** Fecha de emisión; para docs sin el campo, el día en que se creó. */
export function fechaEmisionDe(c: Pick<Cobro, 'fecha_emision' | 'creado_en'>): string {
  if (c.fecha_emision) return c.fecha_emision
  return c.creado_en ? fechaISO(c.creado_en.toDate()) : ''
}

/** Mes 'YYYY-MM' del cobro; para docs antiguos sin mes, el de la fecha de emisión. */
export function mesDeCobro(c: Pick<Cobro, 'mes_ciclo' | 'fecha_emision' | 'creado_en'>): string {
  return c.mes_ciclo || fechaEmisionDe(c).slice(0, 7)
}

/** Colores de badge por estado (Cobranza y detalle del cobro). */
export const CLASE_PAGO: Record<EstadoPago, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  enviado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pagado: 'bg-green-500/10 text-green-600 dark:text-green-400',
}
export const CLASE_BOLETA: Record<EstadoBoleta, string> = {
  no_aplica: 'bg-muted text-muted-foreground',
  pendiente: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  enviada: 'bg-green-500/10 text-green-600 dark:text-green-400',
}
