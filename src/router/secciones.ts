import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  ClipboardListIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
} from '@lucide/vue'

/** Secciones del panel: fuente única para el sidebar y el breadcrumb. */
export const secciones = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/clientes', label: 'Clientes', icon: UsersIcon },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileTextIcon },
  { to: '/ots', label: 'Órdenes de trabajo', icon: ClipboardListIcon },
  { to: '/cobranza', label: 'Cobranza', icon: ReceiptIcon },
  { to: '/suscripciones', label: 'Suscripciones', icon: RepeatIcon },
  { to: '/configuracion', label: 'Configuración', icon: SettingsIcon },
]

/** Sección a la que pertenece una ruta (`/ots/abc` → Órdenes de trabajo). */
export function seccionDe(path: string) {
  return secciones.find((s) => (s.to === '/' ? path === '/' : path.startsWith(s.to)))
}
