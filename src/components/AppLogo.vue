<script setup lang="ts">
import { RouterLink } from "vue-router";
import { PanelLeftIcon } from "@lucide/vue";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AsteriskIcon } from "@lucide/vue";
</script>

<template>
  <div
    class="flex items-center justify-between gap-0.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2"
  >
    <!-- brand -->
    <RouterLink to="/" class="flex-1 px-1.5 py-1.25 flex items-center gap-2">
      <div class="flex size-5.5 rounded items-center justify-center bg-black">
        <AsteriskIcon class="h-4 w-4 stroke-orange-500" />
      </div>
      <span
        class="font-semibold text-[13.5px] group-data-[collapsible=icon]:hidden"
        >Gr8r Studio</span
      >
    </RouterLink>
    <SidebarTrigger>
      <PanelLeftIcon class="size-3.75" stroke-width="1.5" />
    </SidebarTrigger>
  </div>
</template>
|
