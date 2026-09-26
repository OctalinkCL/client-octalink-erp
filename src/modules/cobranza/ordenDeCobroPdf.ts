import pdfMake from 'pdfmake/build/pdfmake'
import vfs from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { fechaISO, formatoCLP } from '@/lib/formato'
import { logoSvg } from '@/lib/logo'
import { OCTALINK } from '@/lib/octalink'
import { fechaEmisionDe, numeroCobro, type Cobro } from './types'

pdfMake.addVirtualFileSystem(vfs)

// Fecha del documento: la de emisión del cobro (o hoy, si no tiene).
function fechaDocumento(cobro: Cobro): string {
  const [y, m, d] = (fechaEmisionDe(cobro) || fechaISO()).split('-').map(Number)
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(y, m - 1, d))
}

function definicion(cobro: Cobro): TDocumentDefinitions {
  const b = OCTALINK.banco
  return {
    pageSize: 'A4',
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { fontSize: 10, lineHeight: 1.3 },
    content: [
      {
        columns: [
          [
            { svg: logoSvg('#0e0e0e'), width: 132, margin: [0, 2, 0, 8] },
            { text: OCTALINK.email, color: '#666', fontSize: 9 },
          ],
          [
            { text: 'ORDEN DE COBRO', style: 'titulo', alignment: 'right' },
            { text: `N° ${numeroCobro(cobro)}`, alignment: 'right' },
            { text: fechaDocumento(cobro), alignment: 'right', color: '#666' },
          ],
        ],
      },
      { text: '', margin: [0, 16] },

      { text: 'Cliente', style: 'label' },
      { text: cobro.cliente_nombre },
      { text: '', margin: [0, 10] },

      { text: 'Concepto', style: 'label' },
      { text: cobro.concepto || '—' },
      { text: '', margin: [0, 10] },

      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Total a pagar', style: 'label', border: [false, true, false, false] },
              {
                text: formatoCLP(cobro.monto),
                style: 'monto',
                alignment: 'right',
                border: [false, true, false, false],
              },
            ],
          ],
        },
        layout: { hLineColor: () => '#ccc' },
      },
      { text: '', margin: [0, 18] },

      { text: 'Datos para transferencia', style: 'label' },
      {
        table: {
          widths: ['auto', '*'],
          body: [
            ['Banco', b.banco],
            ['Tipo de cuenta', b.tipo_cuenta],
            ['N° de cuenta', b.numero],
            ['Titular', b.titular],
            ['RUT', b.rut],
            ['Email', b.email],
          ],
        },
        layout: 'noBorders',
        margin: [0, 4, 0, 0],
      },
      { text: '', margin: [0, 20] },

      {
        text: 'Este documento es una orden de cobro interna. No constituye boleta ni factura.',
        color: '#888',
        fontSize: 8,
      },
    ],
    styles: {
      titulo: { fontSize: 15, bold: true },
      label: { bold: true, color: '#444', margin: [0, 0, 0, 2] },
      monto: { fontSize: 14, bold: true },
    },
  }
}

export function descargarOrdenDeCobro(cobro: Cobro): void {
  pdfMake.createPdf(definicion(cobro)).download(`orden-de-cobro-${numeroCobro(cobro)}.pdf`)
}

export function base64OrdenDeCobro(cobro: Cobro): Promise<string> {
  return pdfMake.createPdf(definicion(cobro)).getBase64()
}
