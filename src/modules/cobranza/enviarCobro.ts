import { auth } from '@/lib/firebase'
import { formatoCLP } from '@/lib/formato'
import { obtenerCliente } from '@/modules/clientes/clientes.service'
import { cambiarEstadoPago } from './cobranza.service'
import { base64OrdenDeCobro } from './ordenDeCobroPdf'
import type { Cobro } from './types'

function mensaje(cobro: Cobro, clienteNombre: string): string {
  return [
    `Hola ${clienteNombre},`,
    '',
    `Te compartimos la orden de cobro N°${cobro.numero} por ${formatoCLP(cobro.monto)}` +
      (cobro.concepto ? ` — ${cobro.concepto}.` : '.'),
    '',
    'Adjuntamos el PDF con el detalle y los datos bancarios para la transferencia.',
    '',
    'Saludos,',
    'Octalink',
  ].join('\n')
}

/** Envía el cobro por correo (PDF adjunto vía Resend) y marca el pago como 'enviado'. */
export async function enviarCobro(cobro: Cobro): Promise<void> {
  const cliente = await obtenerCliente(cobro.cliente_id)
  if (!cliente?.email) throw new Error('El cliente no tiene email registrado.')

  const user = auth.currentUser
  if (!user) throw new Error('Sesión no válida.')
  const token = await user.getIdToken()

  const pdfBase64 = await base64OrdenDeCobro(cobro)

  const res = await fetch('/api/send-cobro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: cliente.email,
      subject: `Orden de cobro N°${cobro.numero} — Octalink`,
      message: mensaje(cobro, cliente.nombre),
      pdfBase64,
      filename: `orden-de-cobro-${cobro.numero}.pdf`,
    }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || 'No se pudo enviar el correo.')
  }

  await cambiarEstadoPago(cobro.id, 'enviado', null)
}
