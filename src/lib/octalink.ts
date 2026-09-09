// Datos de Octalink para la Orden de Cobro (PDF interno, no es boleta).
// TODO(JuanAndrés): completar con los datos reales.
export const OCTALINK = {
  razon_social: 'Octalink SpA',
  rut: '00.000.000-0',
  email: 'cobros@octalink.cl',
  banco: {
    banco: 'Banco BCI',
    tipo_cuenta: 'Cuenta Corriente',
    numero: '00000000',
    titular: 'Octalink SpA',
    rut_titular: '00.000.000-0',
    email: 'cobros@octalink.cl',
  },
} as const
