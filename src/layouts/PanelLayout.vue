<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/cotizaciones', label: 'Cotizaciones' },
  { to: '/ots', label: 'OTs' },
  // { to: '/cobranza', label: 'Cobranza' },
  // { to: '/suscripciones', label: 'Suscripciones' },
  { to: '/configuracion', label: 'Configuración' },
]

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-svh grid grid-cols-[220px_1fr]">
    <aside class="flex flex-col gap-1 border-r bg-muted/30 p-4">
      <p class="px-2 pb-3 text-sm font-semibold">ERP Octalink</p>
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="rounded-md px-2 py-1.5 text-sm hover:bg-muted"
        active-class="bg-muted font-medium"
      >
        {{ item.label }}
      </RouterLink>
    </aside>

    <div class="flex flex-col">
      <header class="flex items-center justify-between border-b px-6 py-3">
        <span class="text-sm text-muted-foreground">{{ auth.user?.email }}</span>
        <Button variant="outline" size="sm" @click="handleLogout">Cerrar sesión</Button>
      </header>
      <main class="flex-1 p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
