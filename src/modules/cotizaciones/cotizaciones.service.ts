import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  calcularTotal,
  type Cotizacion,
  type CotizacionInput,
  type EstadoCotizacion,
} from './types'

const cotizacionesCol = collection(db, 'cotizaciones')
const contadorRef = doc(db, 'settings', 'cotizaciones')

export async function listarCotizaciones(): Promise<Cotizacion[]> {
  const snap = await getDocs(query(cotizacionesCol, orderBy('numero', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cotizacion)
}

export async function obtenerCotizacion(id: string): Promise<Cotizacion | null> {
  const snap = await getDoc(doc(cotizacionesCol, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Cotizacion) : null
}

/**
 * Crea la cotización asignando el correlativo dentro de una transacción:
 * lee settings/cotizaciones, usa ese número y lo sube a +1 de forma atómica.
 * Ni un doble-click duplica el número.
 */
export async function crearCotizacion(
  input: CotizacionInput,
): Promise<{ id: string; numero: number }> {
  const nuevaRef = doc(cotizacionesCol)

  const numero = await runTransaction(db, async (tx) => {
    const contadorSnap = await tx.get(contadorRef)
    const siguiente =
      contadorSnap.exists() && Number(contadorSnap.data().siguiente_numero) >= 1
        ? Math.trunc(Number(contadorSnap.data().siguiente_numero))
        : 1

    tx.set(nuevaRef, {
      ...input,
      numero: siguiente,
      total: calcularTotal(input.items),
      ot_generada: false,
      fecha: serverTimestamp(),
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp(),
    })
    tx.set(contadorRef, { siguiente_numero: siguiente + 1 }, { merge: true })

    return siguiente
  })

  return { id: nuevaRef.id, numero }
}

export async function actualizarCotizacion(
  id: string,
  input: CotizacionInput,
): Promise<void> {
  await updateDoc(doc(cotizacionesCol, id), {
    ...input,
    total: calcularTotal(input.items),
    actualizado_en: serverTimestamp(),
  })
}

export async function cambiarEstadoCotizacion(
  id: string,
  estado: EstadoCotizacion,
): Promise<void> {
  await updateDoc(doc(cotizacionesCol, id), {
    estado,
    actualizado_en: serverTimestamp(),
  })
}

export async function eliminarCotizacion(id: string): Promise<void> {
  await deleteDoc(doc(cotizacionesCol, id))
}
