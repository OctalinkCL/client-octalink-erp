const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

/** Formatea un entero de pesos chilenos: 12345 → "$12.345". */
export function formatoCLP(monto: number): string {
  return clp.format(Number(monto) || 0)
}
