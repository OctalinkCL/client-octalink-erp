<script setup lang="ts">
import { SidebarTrigger } from "@/components/ui/sidebar";
</script>

<template>
  <header
    class="ps-4 pe-3 h-12.5 border-b flex items-center gap-1.5 md:h-11.5 lg:ps-6"
  >
    <SidebarTrigger class="md:hidden size-10 opacity-70" />

    <span class="text-[12.5px] font-medium">Home</span>
  </header>
</template>
