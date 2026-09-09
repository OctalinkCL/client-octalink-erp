import type { RouteRecordRaw } from 'vue-router'
import PanelLayout from '@/layouts/PanelLayout.vue'

/** Rutas protegidas (requieren sesión), envueltas en PanelLayout. */
export const panelRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PanelLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/DashboardView.vue'),
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('@/modules/clientes/ClientesView.vue'),
      },
      {
        path: 'cotizaciones',
        name: 'cotizaciones',
        component: () => import('@/modules/cotizaciones/CotizacionesView.vue'),
      },
      {
        path: 'cotizaciones/nueva',
        name: 'cotizacion-nueva',
        component: () => import('@/modules/cotizaciones/CotizacionFormView.vue'),
      },
      {
        path: 'cotizaciones/:id',
        name: 'cotizacion-editar',
        component: () => import('@/modules/cotizaciones/CotizacionFormView.vue'),
      },
      {
        path: 'ots',
        name: 'ots',
        component: () => import('@/modules/ots/OtsView.vue'),
      },
      {
        path: 'ots/nueva',
        name: 'ot-nueva',
        component: () => import('@/modules/ots/OtFormView.vue'),
      },
      {
        path: 'ots/:id',
        name: 'ot-editar',
        component: () => import('@/modules/ots/OtFormView.vue'),
      },
      {
        path: 'cobranza',
        name: 'cobranza',
        component: () => import('@/modules/cobranza/CobranzaView.vue'),
      },
      {
        path: 'cobranza/nueva',
        name: 'cobro-nuevo',
        component: () => import('@/modules/cobranza/CobroFormView.vue'),
      },
      {
        path: 'cobranza/:id',
        name: 'cobro-editar',
        component: () => import('@/modules/cobranza/CobroFormView.vue'),
      },
      {
        path: 'suscripciones',
        name: 'suscripciones',
        component: () => import('@/modules/suscripciones/SuscripcionesView.vue'),
      },
      {
        path: 'suscripciones/nueva',
        name: 'suscripcion-nueva',
        component: () => import('@/modules/suscripciones/SuscripcionFormView.vue'),
      },
      {
        path: 'suscripciones/:id',
        name: 'suscripcion-editar',
        component: () => import('@/modules/suscripciones/SuscripcionFormView.vue'),
      },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('@/modules/configuracion/ConfiguracionView.vue'),
      },
      // Próximos módulos: cobranza, suscripciones
    ],
  },
]
