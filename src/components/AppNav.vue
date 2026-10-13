<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  ClipboardListIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
} from "@lucide/vue";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const route = useRoute();
const { isMobile, setOpenMobile } = useSidebar();

function handleNavigate() {
  if (isMobile.value) setOpenMobile(false);
}

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/clientes", label: "Clientes", icon: UsersIcon },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileTextIcon },
  { to: "/ots", label: "Órdenes de trabajo", icon: ClipboardListIcon },
  { to: "/cobranza", label: "Cobranza", icon: ReceiptIcon },
  { to: "/suscripciones", label: "Suscripciones", icon: RepeatIcon },
  { to: "/configuracion", label: "Configuración", icon: SettingsIcon },
];
</script>

<template>
  <SidebarGroup class="pt-1">
    <SidebarGroupContent>
      <SidebarMenu class="gap-1">
        <SidebarMenuItem v-for="item in items" :key="item.to">
          <SidebarMenuButton
            as-child
            class="h-7.5 rounded"
            :is-active="
              item.to === '/'
                ? route.path === '/'
                : route.path.startsWith(item.to)
            "
          >
            <RouterLink :to="item.to" v-foley="'tick'" @click="handleNavigate">
              <component :is="item.icon" class="opacity-60" />
              <span class="text-[13.5px] font-medium pl-0.5">{{
                item.label
              }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
