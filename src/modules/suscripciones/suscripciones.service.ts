import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { EstadoSuscripcion, Suscripcion, SuscripcionInput } from './types'

const suscripcionesCol = collection(db, 'suscripciones')

export async function listarSuscripciones(): Promise<Suscripcion[]> {
  const snap = await getDocs(query(suscripcionesCol, orderBy('cliente_nombre')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Suscripcion)
}

export async function obtenerSuscripcion(id: string): Promise<Suscripcion | null> {
  const snap = await getDoc(doc(suscripcionesCol, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Suscripcion) : null
}

export async function crearSuscripcion(input: SuscripcionInput): Promise<string> {
  const ref = await addDoc(suscripcionesCol, {
    ...input,
    creado_en: serverTimestamp(),
    actualizado_en: serverTimestamp(),
  })
  return ref.id
}

export async function actualizarSuscripcion(
  id: string,
  input: SuscripcionInput,
): Promise<void> {
  await updateDoc(doc(suscripcionesCol, id), {
    ...input,
    actualizado_en: serverTimestamp(),
  })
}

export async function cambiarEstadoSuscripcion(
  id: string,
  estado: EstadoSuscripcion,
): Promise<void> {
  await updateDoc(doc(suscripcionesCol, id), {
    estado,
    actualizado_en: serverTimestamp(),
  })
}

export async function eliminarSuscripcion(id: string): Promise<void> {
  await deleteDoc(doc(suscripcionesCol, id))
}
