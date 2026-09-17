<script setup lang="ts">
import { RouterView } from 'vue-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar variant="inset" />
    <SidebarInset
      class="bg-transparent  md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:mt-0">
      <header class=" flex h-14 items-center gap-2 px-4 sticky top-0">
        <SidebarTrigger />
      </header>
      <main class="bg-background rounded-xl p-4 flex-1">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
