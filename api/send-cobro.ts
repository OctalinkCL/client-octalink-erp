import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

// Mismo UID que `isOwner()` en firestore.rules — único usuario autorizado.
const OWNER_UID = 'nFCr8TpWRyOVxzY3ikHOXcCoojV2'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendCobroBody {
  to: string
  subject: string
  text: string
  html: string
  pdfBase64: string
  filename: string
}

// Verifica el ID token contra la API REST de Identity Platform (sin
// firebase-admin: esa dependencia arrastra `jose@6`, que es ESM-only y
// rompe el bundle de Vercel con ERR_REQUIRE_ESM). El API key de Firebase
// no es secreto — es el mismo que usa el frontend.
async function esOwner(idToken: string): Promise<boolean> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  )
  if (!res.ok) return false
  const data = (await res.json()) as { users?: { localId: string }[] }
  return data.users?.[0]?.localId === OWNER_UID
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

  if (!(await esOwner(token))) {
    res.status(401).json({ error: 'Token inválido o no autorizado.' })
    return
  }

  const { to, subject, text, html, pdfBase64, filename } = (req.body ?? {}) as Partial<SendCobroBody>
  if (!to || !subject || !text || !html || !pdfBase64 || !filename) {
    res.status(400).json({ error: 'Faltan datos del correo.' })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to,
      bcc: process.env.RESEND_FROM!,
      subject,
      text,
      html,
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
