# ERP Octalink

Sistema interno para ordenar cotizaciones, cobros puntuales y suscripciones
mensuales. Ver [Claude.md](./Claude.md) para el brief completo.

## Stack

- Vue 3 + Vite + TypeScript
- Tailwind CSS 4 + shadcn-vue
- Vue Router + Pinia
- Firebase (Firestore + Auth) — pendiente de conectar

## Comandos

```bash
pnpm install     # instalar dependencias
pnpm dev         # servidor de desarrollo (http://localhost:5173)
pnpm build       # type-check + build de producción
pnpm preview     # previsualizar el build
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar. Las `VITE_*` son de Firebase (no son
secretas). `RESEND_*` van sin prefijo `VITE_` porque solo las usa el backend.

## Estructura

```
src/
  components/ui/          # componentes shadcn-vue (button, input, label)
  layouts/
    AuthLayout.vue        # pantallas públicas (login)
    PanelLayout.vue       # app con sesión (sidebar + header)
  lib/
    firebase.ts           # init de Firebase (db, auth)
    utils.ts              # helper cn()
  router/
    index.ts              # arma el router y registra el guard
    guard.ts              # guard de autenticación (beforeEach)
    routes/
      auth.routes.ts      # rutas públicas → AuthLayout
      panel.routes.ts     # rutas protegidas (meta.requiresAuth) → PanelLayout
  modules/
    clientes/             # cada módulo autocontenido: types + service + composable + vistas
  stores/
    auth.ts               # sesión (user, login, logout) con Pinia
  views/                  # pantallas sueltas (LoginView, DashboardView)
```

Para crear un módulo nuevo: [docs/crear-modulo.md](./docs/crear-modulo.md).

## Autenticación

Un solo usuario. Crear el login en Firebase Console → Authentication →
Sign-in method: habilitar **Email/Password** → pestaña Users → Add user.
El guard manda a `/login` si no hay sesión y guarda el destino en `?redirect=`.
# client-octalink-erp
