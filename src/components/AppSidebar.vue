<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import { useRouter } from 'vue-router'
import { LogOutIcon } from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import AppLogo from '@/components/AppLogo.vue'
import AppNav from '@/components/AppNav.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<SidebarProps>()

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <!-- todo: delete width in production -->
  <Sidebar v-bind="props" class="lg:w-63">
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
          <SidebarMenuButton :tooltip="auth.user?.email ?? undefined" @click="handleLogout">
            <LogOutIcon />
            <span class="truncate">{{ auth.user?.email }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
