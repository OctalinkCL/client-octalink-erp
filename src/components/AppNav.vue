<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  ClipboardListIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
} from '@lucide/vue'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const route = useRoute()

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/clientes', label: 'Clientes', icon: UsersIcon },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileTextIcon },
  { to: '/ots', label: 'Órdenes de trabajo', icon: ClipboardListIcon },
  { to: '/cobranza', label: 'Cobranza', icon: ReceiptIcon },
  { to: '/suscripciones', label: 'Suscripciones', icon: RepeatIcon },
  { to: '/configuracion', label: 'Configuración', icon: SettingsIcon },
]
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.to">
          <SidebarMenuButton
            as-child
            :is-active="item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)"
          >
            <RouterLink :to="item.to">
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
