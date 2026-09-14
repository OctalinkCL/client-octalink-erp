import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// settings/<clave> → { siguiente_numero: number }
export type ClaveContador = 'cotizaciones' | 'ots' | 'cobros'

export async function obtenerSiguienteNumero(clave: ClaveContador): Promise<number> {
  const snap = await getDoc(doc(db, 'settings', clave))
  const n = snap.exists() ? Number(snap.data().siguiente_numero) : NaN
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : 1
}

export async function guardarSiguienteNumero(
  clave: ClaveContador,
  siguiente: number,
): Promise<void> {
  const n = Math.max(1, Math.trunc(Number(siguiente) || 1))
  await setDoc(doc(db, 'settings', clave), { siguiente_numero: n }, { merge: true })
}
