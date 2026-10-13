<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import { ChevronsUpDownIcon } from "@lucide/vue";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import AppLogo from "@/components/AppLogo.vue";
import AppNav from "@/components/AppNav.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import UserMenu from "@/components/UserMenu.vue";
import { useUsuario } from "@/composables/useUsuario";

const props = defineProps<SidebarProps>();

const { nombre } = useUsuario();
</script>

<template>
  <!-- todo: delete width in production -->
  <Sidebar v-bind="props">
    <!-- top -->
    <SidebarHeader class="pb-1">
      <AppLogo />
    </SidebarHeader>
    <!-- middle -->
    <SidebarContent>
      <AppNav />
    </SidebarContent>
    <!-- footer -->
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <UserMenu>
            <SidebarMenuButton size="lg">
              <UserAvatar />
              <span class="flex-1 truncate font-medium">{{ nombre }}</span>
              <ChevronsUpDownIcon class="ml-auto opacity-60" />
            </SidebarMenuButton>
          </UserMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
