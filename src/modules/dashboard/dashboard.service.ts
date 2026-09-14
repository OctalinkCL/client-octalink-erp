import { Timestamp, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Cobro } from '@/modules/cobranza/types'
import type { Cotizacion } from '@/modules/cotizaciones/types'
import type { Ot } from '@/modules/ots/types'
import type { Suscripcion } from '@/modules/suscripciones/types'

const cobrosCol = collection(db, 'cobros')
const otsCol = collection(db, 'ots')
const cotizacionesCol = collection(db, 'cotizaciones')
const suscripcionesCol = collection(db, 'suscripciones')

export interface DatosDashboard {
  /** Unión sin duplicados: cobros abiertos + boleta pendiente + pagados este mes. */
  cobros: Cobro[]
  otsCompletadas: Ot[]
  /** Cotizaciones pendientes + aceptadas. */
  cotizaciones: Cotizacion[]
  suscripcionesActivas: Suscripcion[]
}

function inicioDeMes(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/**
 * Carga solo lo accionable con queries de campo único (sin índices compuestos):
 * no lee colecciones enteras, así que el costo no crece con el histórico.
 * Ver docs/crear-modulo.md → agregadores de solo lectura.
 */
export async function cargarDatosDashboard(): Promise<DatosDashboard> {
  const desde = Timestamp.fromDate(inicioDeMes())

  const [abiertos, boletaPend, pagadosMes, ots, cots, subs] = await Promise.all([
    getDocs(query(cobrosCol, where('estado_pago', 'in', ['pendiente', 'enviado']))),
    getDocs(query(cobrosCol, where('estado_boleta', '==', 'pendiente'))),
    getDocs(query(cobrosCol, where('fecha_pago', '>=', desde))),
    getDocs(query(otsCol, where('estado', '==', 'completada'))),
    getDocs(query(cotizacionesCol, where('estado', 'in', ['pendiente', 'aceptada']))),
    getDocs(query(suscripcionesCol, where('estado', '==', 'activa'))),
  ])

  const cobrosMap = new Map<string, Cobro>()
  for (const snap of [abiertos, boletaPend, pagadosMes]) {
    for (const d of snap.docs) cobrosMap.set(d.id, { id: d.id, ...d.data() } as Cobro)
  }

  return {
    cobros: [...cobrosMap.values()],
    otsCompletadas: ots.docs.map((d) => ({ id: d.id, ...d.data() }) as Ot),
    cotizaciones: cots.docs.map((d) => ({ id: d.id, ...d.data() }) as Cotizacion),
    suscripcionesActivas: subs.docs.map((d) => ({ id: d.id, ...d.data() }) as Suscripcion),
  }
}
