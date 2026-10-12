<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { PanelLeftIcon } from '@lucide/vue'
import { SidebarTrigger } from '@/components/ui/sidebar'
</script>

<template>
  <div
    class="flex items-center justify-between gap-0.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">

    <RouterLink to="/">
      ds
    </RouterLink>
    <SidebarTrigger>
      <PanelLeftIcon />
    </SidebarTrigger>
  </div>
</template>
