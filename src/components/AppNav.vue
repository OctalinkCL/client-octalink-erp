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
      <SidebarMenu class="gap-px">
        <SidebarMenuItem v-for="item in items" :key="item.to">
          <SidebarMenuButton
            as-child
            class="h-7.5 gap-2.25 rounded-sm px-2 font-[450] text-sidebar-muted-foreground data-active:bg-sidebar-active data-active:shadow-(--sidebar-active-shadow)"
            :is-active="
              item.to === '/'
                ? route.path === '/'
                : route.path.startsWith(item.to)
            "
          >
            <RouterLink :to="item.to" v-foley="'tick'" @click="handleNavigate">
              <component
                :is="item.icon"
                stroke-width="1.75"
                class="text-sidebar-icon group-hover/menu-button:text-sidebar-muted-foreground group-data-active/menu-button:text-sidebar-muted-foreground"
              />
              <span class="flex-1 truncate text-[13.5px]">{{
                item.label
              }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
