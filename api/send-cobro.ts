import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { Resend } from 'resend'

// Mismo UID que `isOwner()` en firestore.rules — único usuario autorizado.
const OWNER_UID = 'nFCr8TpWRyOVxzY3ikHOXcCoojV2'

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  })
}

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendCobroBody {
  to: string
  subject: string
  message: string
  pdfBase64: string
  filename: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' })
    return
  }

  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  if (!token) {
    res.status(401).json({ error: 'Falta token de autenticación.' })
    return
  }

  try {
    const decoded = await getAuth().verifyIdToken(token)
    if (decoded.uid !== OWNER_UID) {
      res.status(403).json({ error: 'No autorizado.' })
      return
    }
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
    return
  }

  const { to, subject, message, pdfBase64, filename } = (req.body ?? {}) as Partial<SendCobroBody>
  if (!to || !subject || !message || !pdfBase64 || !filename) {
    res.status(400).json({ error: 'Faltan datos del correo.' })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to,
      subject,
      text: message,
      attachments: [{ filename, content: pdfBase64 }],
    })
    if (error) {
      console.error(error)
      res.status(502).json({ error: 'No se pudo enviar el correo.' })
      return
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(502).json({ error: 'No se pudo enviar el correo.' })
  }
}
