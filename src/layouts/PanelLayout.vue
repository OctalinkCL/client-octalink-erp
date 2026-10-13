<script setup lang="ts">
import { RouterView } from "vue-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
</script>

<template>
  <SidebarProvider>
    <AppSidebar collapsible="icon" />
    <SidebarInset
      class="bg-transparent md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:mt-0"
    >
      <AppHeader />
      <main class="fx-route bg-background rounded-b-xl p-4 flex-1">
        <RouterView :key="$route.path" />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
