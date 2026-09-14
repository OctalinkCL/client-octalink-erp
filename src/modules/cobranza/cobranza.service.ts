import {
  type DocumentReference,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { mesCicloLegible } from '@/lib/formato'
import type { Ot } from '@/modules/ots/types'
import type { Suscripcion } from '@/modules/suscripciones/types'
import type { Cobro, CobroInput, EstadoBoleta, EstadoPago } from './types'

const cobrosCol = collection(db, 'cobros')
const contadorRef = doc(db, 'settings', 'cobros')

async function marcarOtConCobro(otId: string, valor: boolean): Promise<void> {
  if (!otId) return
  try {
    await updateDoc(doc(db, 'ots', otId), { cobro_generado: valor })
  } catch (e) {
    // La OT pudo haber sido borrada antes; entonces no hay flag que mantener.
    if ((e as { code?: string }).code !== 'not-found') throw e
  }
}

export async function listarCobros(): Promise<Cobro[]> {
  const snap = await getDocs(query(cobrosCol, orderBy('numero', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cobro)
}

export async function obtenerCobro(id: string): Promise<Cobro | null> {
  const snap = await getDoc(doc(cobrosCol, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Cobro) : null
}

/** Cobro ya generado desde una OT dada, si existe. */
export async function cobroDeOt(otId: string): Promise<Cobro | null> {
  const snap = await getDocs(query(cobrosCol, where('ot_id', '==', otId), limit(1)))
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Cobro)
}

/** Cobro de una suscripción para un mes de ciclo dado, si existe. */
export async function cobroDeSuscripcionMes(
  suscripcionId: string,
  mesCiclo: string,
): Promise<Cobro | null> {
  const snap = await getDocs(
    query(
      cobrosCol,
      where('suscripcion_id', '==', suscripcionId),
      where('mes_ciclo', '==', mesCiclo),
      limit(1),
    ),
  )
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Cobro)
}

/**
 * Cobros de suscripción de un mes de ciclo, indexados por `suscripcion_id`.
 * Para saber de un vistazo qué suscripciones ya tienen el cobro del mes.
 */
export async function cobrosDeSuscripcionesDelMes(
  mesCiclo: string,
): Promise<Map<string, { id: string; numero: number }>> {
  const snap = await getDocs(query(cobrosCol, where('mes_ciclo', '==', mesCiclo)))
  const map = new Map<string, { id: string; numero: number }>()
  for (const d of snap.docs) {
    const data = d.data()
    if (data.suscripcion_id) {
      map.set(data.suscripcion_id as string, {
        id: d.id,
        numero: data.numero as number,
      })
    }
  }
  return map
}

// Asigna el correlativo en una transacción y crea el cobro.
async function asignarNumeroYCrear(
  ref: DocumentReference,
  input: CobroInput,
): Promise<number> {
  return runTransaction(db, async (tx) => {
    const cSnap = await tx.get(contadorRef)
    const siguiente =
      cSnap.exists() && Number(cSnap.data().siguiente_numero) >= 1
        ? Math.trunc(Number(cSnap.data().siguiente_numero))
        : 1

    tx.set(ref, {
      ...input,
      numero: siguiente,
      fecha_pago: null,
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp(),
    })
    tx.set(contadorRef, { siguiente_numero: siguiente + 1 }, { merge: true })

    return siguiente
  })
}

export async function crearCobro(input: CobroInput): Promise<{ id: string; numero: number }> {
  const ref = doc(cobrosCol)
  const numero = await asignarNumeroYCrear(ref, input)
  return { id: ref.id, numero }
}

export async function crearCobroDesdeOt(
  ot: Ot,
): Promise<{ id: string; numero: number; yaExistia: boolean }> {
  const existente = await cobroDeOt(ot.id)

  let result: { id: string; numero: number; yaExistia: boolean }
  if (existente) {
    result = { id: existente.id, numero: existente.numero, yaExistia: true }
  } else {
    const input: CobroInput = {
      cliente_id: ot.cliente_id,
      cliente_nombre: ot.cliente_nombre,
      origen: 'ot',
      ot_id: ot.id,
      ot_numero: ot.numero,
      cotizacion_id: ot.cotizacion_id,
      cotizacion_numero: ot.cotizacion_numero,
      suscripcion_id: '',
      mes_ciclo: '',
      concepto: ot.descripcion || `OT N°${ot.numero}`,
      monto: ot.monto,
      estado_pago: 'pendiente',
      estado_boleta: ot.emite_boleta ? 'pendiente' : 'no_aplica',
      url_boleta: '',
      notas: '',
    }
    const ref = doc(cobrosCol)
    const numero = await asignarNumeroYCrear(ref, input)
    result = { id: ref.id, numero, yaExistia: false }
  }

  await marcarOtConCobro(ot.id, true)
  return result
}

export async function crearCobroDesdeSuscripcion(
  s: Suscripcion,
  mesCiclo: string,
): Promise<{ id: string; numero: number; yaExistia: boolean }> {
  const existente = await cobroDeSuscripcionMes(s.id, mesCiclo)
  if (existente) {
    return { id: existente.id, numero: existente.numero, yaExistia: true }
  }

  const input: CobroInput = {
    cliente_id: s.cliente_id,
    cliente_nombre: s.cliente_nombre,
    origen: 'suscripcion',
    ot_id: s.ot_id,
    ot_numero: s.ot_numero,
    cotizacion_id: s.cotizacion_id,
    cotizacion_numero: s.cotizacion_numero,
    suscripcion_id: s.id,
    mes_ciclo: mesCiclo,
    concepto: `${s.descripcion || 'Suscripción'} — ${mesCicloLegible(mesCiclo)}`,
    monto: s.monto,
    estado_pago: 'pendiente',
    estado_boleta: s.emite_boleta ? 'pendiente' : 'no_aplica',
    url_boleta: '',
    notas: '',
  }

  const ref = doc(cobrosCol)
  const numero = await asignarNumeroYCrear(ref, input)
  return { id: ref.id, numero, yaExistia: false }
}

export async function actualizarCobro(id: string, input: CobroInput): Promise<void> {
  await updateDoc(doc(cobrosCol, id), { ...input, actualizado_en: serverTimestamp() })
}

export async function cambiarEstadoPago(
  id: string,
  estado_pago: EstadoPago,
  fecha_pago: Date | null,
): Promise<void> {
  await updateDoc(doc(cobrosCol, id), {
    estado_pago,
    fecha_pago: estado_pago === 'pagado' ? (fecha_pago ?? new Date()) : null,
    actualizado_en: serverTimestamp(),
  })
}

export async function cambiarEstadoBoleta(
  id: string,
  estado_boleta: EstadoBoleta,
  url_boleta?: string,
): Promise<void> {
  const patch: Record<string, unknown> = {
    estado_boleta,
    actualizado_en: serverTimestamp(),
  }
  if (url_boleta !== undefined) patch.url_boleta = url_boleta
  await updateDoc(doc(cobrosCol, id), patch)
}

export async function eliminarCobro(id: string): Promise<void> {
  const cobro = await obtenerCobro(id)
  if (cobro?.ot_id) await marcarOtConCobro(cobro.ot_id, false)
  await deleteDoc(doc(cobrosCol, id))
}
