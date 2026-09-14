import { auth } from '@/lib/firebase'
import { formatoCLP } from '@/lib/formato'
import { obtenerCliente } from '@/modules/clientes/clientes.service'
import { registrarEnvioCobro } from './cobranza.service'
import { base64OrdenDeCobro } from './ordenDeCobroPdf'
import type { Cobro } from './types'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const FIRMA_TEXTO = [
  'Saludos,',
  'Equipo Octalink',
  '',
  'Enviado automáticamente desde octalink_erp. Si este correo llegó por error, contáctenos.',
].join('\n')

const FIRMA_HTML = `
  <p>Saludos,<br>Equipo Octalink</p>
  <p style="font-style: italic; color: #888; font-size: 12px;">
    Enviado automáticamente desde octalink_erp. Si este correo llegó por error, contáctenos.
  </p>
`

function textoPlano(cobro: Cobro, clienteNombre: string): string {
  return [
    `Hola ${clienteNombre},`,
    '',
    `Te compartimos la orden de cobro N°${cobro.numero} por ${formatoCLP(cobro.monto)}` +
      (cobro.concepto ? ` — ${cobro.concepto}.` : '.'),
    '',
    'Adjuntamos el PDF con el detalle.',
    '',
    FIRMA_TEXTO,
  ].join('\n')
}

function html(cobro: Cobro, clienteNombre: string): string {
  const detalle = cobro.concepto ? ` — ${escapeHtml(cobro.concepto)}.` : '.'
  return [
    `<p>Hola ${escapeHtml(clienteNombre)},</p>`,
    `<p>Te compartimos la orden de cobro N°${cobro.numero} por ${formatoCLP(cobro.monto)}${detalle}</p>`,
    '<p>Adjuntamos el PDF con el detalle.</p>',
    FIRMA_HTML,
  ].join('\n')
}

function textoPlanoRecordatorio(cobro: Cobro, clienteNombre: string): string {
  return [
    `Hola ${clienteNombre},`,
    '',
    `Te escribimos para recordarte que tienes un compromiso pendiente: la orden de cobro N°${cobro.numero} por ${formatoCLP(cobro.monto)}` +
      (cobro.concepto ? ` — ${cobro.concepto}.` : '.'),
    '',
    'Si ya realizaste el pago, ¡gracias, ignora este mensaje! Si necesitas ayuda o tienes alguna duda, escríbenos y lo vemos juntos.',
    '',
    'Adjuntamos nuevamente el PDF con el detalle.',
    '',
    FIRMA_TEXTO,
  ].join('\n')
}

function htmlRecordatorio(cobro: Cobro, clienteNombre: string): string {
  const detalle = cobro.concepto ? ` — ${escapeHtml(cobro.concepto)}.` : '.'
  return [
    `<p>Hola ${escapeHtml(clienteNombre)},</p>`,
    `<p>Te escribimos para recordarte que tienes un compromiso pendiente: la orden de cobro N°${cobro.numero} por ${formatoCLP(cobro.monto)}${detalle}</p>`,
    '<p>Si ya realizaste el pago, ¡gracias, ignora este mensaje! Si necesitas ayuda o tienes alguna duda, escríbenos y lo vemos juntos.</p>',
    '<p>Adjuntamos nuevamente el PDF con el detalle.</p>',
    FIRMA_HTML,
  ].join('\n')
}

/**
 * Envía el cobro por correo (PDF adjunto vía Resend). La primera vez usa la
 * plantilla de orden de cobro; de ahí en adelante, la de recordatorio. El
 * estado de pago queda 'enviado' sin importar cuántas veces se mande — el
 * detalle de cada envío queda en `historial`.
 */
export async function enviarCobro(cobro: Cobro): Promise<void> {
  const cliente = await obtenerCliente(cobro.cliente_id)
  if (!cliente?.email) throw new Error('El cliente no tiene email registrado.')

  const user = auth.currentUser
  if (!user) throw new Error('Sesión no válida.')
  const token = await user.getIdToken()

  const esReenvio = (cobro.historial ?? []).some(
    (h) => h.tipo === 'enviado' || h.tipo === 'reenviado',
  )

  const pdfBase64 = await base64OrdenDeCobro(cobro)

  const subject = esReenvio
    ? `Recordatorio: cobro N°${cobro.numero} — Octalink`
    : `Orden de cobro N°${cobro.numero} — Octalink`

  const res = await fetch('/api/send-cobro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: cliente.email,
      subject,
      text: esReenvio
        ? textoPlanoRecordatorio(cobro, cliente.nombre)
        : textoPlano(cobro, cliente.nombre),
      html: esReenvio ? htmlRecordatorio(cobro, cliente.nombre) : html(cobro, cliente.nombre),
      pdfBase64,
      filename: `orden-de-cobro-${cobro.numero}.pdf`,
    }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || 'No se pudo enviar el correo.')
  }

  await registrarEnvioCobro(cobro.id, esReenvio ? 'reenviado' : 'enviado')
}
