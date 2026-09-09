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
        component: () => import('@/views/DashboardView.vue'),
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
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('@/modules/configuracion/ConfiguracionView.vue'),
      },
      // Próximos módulos: cobranza, suscripciones
    ],
  },
]
