# Foley — sonido de interfaz (propuesta, no implementado)

Estado: análisis únicamente. Nada de esto está instalado ni escrito en el código todavía.

Referencia: https://usefoley.dev/docs.html

## Qué es

Librería JS que sintetiza efectos de sonido de interfaz en tiempo real con Web Audio
API (sin archivos de audio, sin requests de red). ~7.6 kB, cero dependencias,
licencia MIT. Existe paquete oficial `@foleyjs/vue` con plugin + directiva
(`v-foley`), lo que encaja directo con el stack Vue 3 del proyecto.

## Dificultad: baja

- No toca Firestore, Resend ni el modelo de datos — es puramente frontend/UX.
- Se activa incremental, botón por botón, sin automatizaciones de fondo (alineado
  con la filosofía "primero creamos, después mejoramos" del proyecto).
- Único requisito técnico: gesto del usuario para desbloquear audio (estándar de
  navegadores), la librería ya lo maneja sola.

## Cómo se vería

### 1. Registrar el plugin — `src/main.ts`

```ts
import { FoleyPlugin } from '@foleyjs/vue'

createApp(App)
  .use(createPinia())
  .use(FoleyPlugin, { theme: 'default', volume: 0.6 })
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .mount('#app')
```

### 2. Store para mute global — `src/stores/settings.ts` (mismo patrón que `auth.ts`)

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { set as foleySet } from '@foleyjs/core'

export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(localStorage.getItem('soundEnabled') !== 'false')

  watch(soundEnabled, (v) => {
    foleySet({ muted: !v })
    localStorage.setItem('soundEnabled', String(v))
  }, { immediate: true })

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
  }

  return { soundEnabled, toggleSound }
})
```

### 3. Sonido al hacer click en el sidebar — `src/components/AppNav.vue`

```vue
<SidebarMenuItem v-for="item in items" :key="item.to">
  <SidebarMenuButton as-child :is-active="...">
    <RouterLink :to="item.to" v-foley="'tick'">
      <component :is="item.icon" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### 4. Switch on/off — vista `/configuracion` (ya existe la ruta)

```vue
<script setup>
import { useSettingsStore } from '@/stores/settings'
const settings = useSettingsStore()
</script>

<template>
  <label class="flex items-center gap-2">
    <input type="checkbox" v-model="settings.soundEnabled" />
    Sonidos de interfaz
  </label>
</template>
```

Nota: el proyecto no tiene componente `Switch` de shadcn-vue instalado (solo hay
`checkbox`). Si se quiere un switch visual real: `npx shadcn-vue add switch`.

## Impacto si se implementa

- Archivo nuevo: `src/stores/settings.ts`.
- Una línea en `main.ts` (registro del plugin).
- Atributos `v-foley` agregados donde se quiera sonido (botones de cobranza,
  guardar, enviar, etc.) — no requiere tocar lógica existente.
- No afecta cobranza, cotizaciones, OTs ni ningún flujo de datos.

## Pendiente antes de implementar

- Decidir qué acciones concretas llevan sonido (guardar cobro, marcar pagado,
  enviar boleta, toggle dark mode, etc.).
- Elegir tema de sonido (default / soft / mechanical / glass).
- Confirmar si se instala `npx shadcn-vue add switch` o se usa checkbox simple.
