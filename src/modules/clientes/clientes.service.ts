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
import type { Cliente, ClienteInput } from './types'

// Capa de datos: solo Firestore, sin Vue. Reutilizable desde cualquier módulo.

const clientesCol = collection(db, 'clientes')

export async function listarClientes(): Promise<Cliente[]> {
  const snap = await getDocs(query(clientesCol, orderBy('nombre')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cliente)
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(clientesCol, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Cliente) : null
}

export async function crearCliente(input: ClienteInput): Promise<string> {
  const ref = await addDoc(clientesCol, {
    ...input,
    creado_en: serverTimestamp(),
    actualizado_en: serverTimestamp(),
  })
  return ref.id
}

export async function actualizarCliente(id: string, input: ClienteInput): Promise<void> {
  await updateDoc(doc(clientesCol, id), {
    ...input,
    actualizado_en: serverTimestamp(),
  })
}

export async function eliminarCliente(id: string): Promise<void> {
  await deleteDoc(doc(clientesCol, id))
}
