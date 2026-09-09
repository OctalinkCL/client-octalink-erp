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
import type { Cotizacion } from '@/modules/cotizaciones/types'
import type { EstadoOt, Ot, OtInput } from './types'

const otsCol = collection(db, 'ots')
const contadorRef = doc(db, 'settings', 'ots')

function marcarCotizacionConOt(cotizacionId: string, valor: boolean) {
  if (!cotizacionId) return Promise.resolve()
  return updateDoc(doc(db, 'cotizaciones', cotizacionId), { ot_generada: valor })
}

export async function listarOts(): Promise<Ot[]> {
  const snap = await getDocs(query(otsCol, orderBy('numero', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ot)
}

export async function obtenerOt(id: string): Promise<Ot | null> {
  const snap = await getDoc(doc(otsCol, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Ot) : null
}

/** OT ya generada desde una cotización dada, si existe. */
export async function otDeCotizacion(cotizacionId: string): Promise<Ot | null> {
  const snap = await getDocs(
    query(otsCol, where('cotizacion_id', '==', cotizacionId), limit(1)),
  )
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Ot)
}

// Asigna el correlativo dentro de una transacción y crea la OT.
async function asignarNumeroYCrear(
  ref: DocumentReference,
  input: OtInput,
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
      cobro_generado: false,
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp(),
    })
    tx.set(contadorRef, { siguiente_numero: siguiente + 1 }, { merge: true })

    return siguiente
  })
}

export async function crearOt(input: OtInput): Promise<{ id: string; numero: number }> {
  const ref = doc(otsCol)
  const numero = await asignarNumeroYCrear(ref, input)
  return { id: ref.id, numero }
}

export async function crearOtDesdeCotizacion(
  c: Cotizacion,
): Promise<{ id: string; numero: number; yaExistia: boolean }> {
  const existente = await otDeCotizacion(c.id)

  let result: { id: string; numero: number; yaExistia: boolean }
  if (existente) {
    result = { id: existente.id, numero: existente.numero, yaExistia: true }
  } else {
    const input: OtInput = {
      cliente_id: c.cliente_id,
      cliente_nombre: c.cliente_nombre,
      origen: 'cotizacion',
      cotizacion_id: c.id,
      cotizacion_numero: c.numero,
      descripcion: `Cotización N°${c.numero}`,
      monto: c.total,
      emite_boleta: false,
      estado: 'pendiente',
      notas: '',
    }
    const ref = doc(otsCol)
    const numero = await asignarNumeroYCrear(ref, input)
    result = { id: ref.id, numero, yaExistia: false }
  }

  await marcarCotizacionConOt(c.id, true)
  return result
}

export async function actualizarOt(id: string, input: OtInput): Promise<void> {
  await updateDoc(doc(otsCol, id), { ...input, actualizado_en: serverTimestamp() })
}

export async function cambiarEstadoOt(id: string, estado: EstadoOt): Promise<void> {
  await updateDoc(doc(otsCol, id), { estado, actualizado_en: serverTimestamp() })
}

export async function eliminarOt(id: string): Promise<void> {
  const ot = await obtenerOt(id)
  if (ot?.cotizacion_id) await marcarCotizacionConOt(ot.cotizacion_id, false)
  await deleteDoc(doc(otsCol, id))
}
