const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

/** Formatea un entero de pesos chilenos: 12345 → "$12.345". */
export function formatoCLP(monto: number): string {
  return clp.format(Number(monto) || 0)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Mes de ciclo 'YYYY-MM' para una fecha (por defecto, hoy). */
export function mesCicloActual(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}`
}

/** '2026-09' → 'Septiembre 2026'. */
export function mesCicloLegible(mesCiclo: string): string {
  const [y, m] = mesCiclo.split('-').map(Number)
  if (!y || !m) return mesCiclo
  const txt = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  )
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}
