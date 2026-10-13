import type { Component } from 'vue'
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  ClipboardListIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
} from '@lucide/vue'

type Seccion = {
  to: string
  label: string
  icon: Component
  /** No aparece en el sidebar (se llega desde otro lado), pero sí en el breadcrumb. */
  fueraDelSidebar?: boolean
}

/** Secciones del panel: fuente única para el sidebar y el breadcrumb. */
export const secciones: Seccion[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/clientes', label: 'Clientes', icon: UsersIcon },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileTextIcon },
  { to: '/ots', label: 'Órdenes de trabajo', icon: ClipboardListIcon },
  { to: '/cobranza', label: 'Cobranza', icon: ReceiptIcon },
  { to: '/suscripciones', label: 'Suscripciones', icon: RepeatIcon },
  // Se abre desde el menú de usuario (UserMenu.vue).
  { to: '/configuracion', label: 'Configuración', icon: SettingsIcon, fueraDelSidebar: true },
]

/** Sección a la que pertenece una ruta (`/ots/abc` → Órdenes de trabajo). */
export function seccionDe(path: string) {
  return secciones.find((s) => (s.to === '/' ? path === '/' : path.startsWith(s.to)))
}
