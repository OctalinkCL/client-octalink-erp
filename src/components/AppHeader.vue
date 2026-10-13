<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { detalleBreadcrumb } from "@/composables/useBreadcrumb";
import { seccionDe } from "@/router/secciones";

const route = useRoute();
const seccion = computed(() => seccionDe(route.path));
</script>

<template>
  <header
    class="ps-4 pe-3 h-12.5 border-b flex items-center gap-1.5 md:h-11.5 lg:ps-6"
  >
    <SidebarTrigger class="md:hidden size-10 opacity-70" />

    <nav
      v-if="seccion"
      aria-label="Breadcrumb"
      class="flex min-w-0 items-center gap-2 text-[12.5px] font-medium"
    >
      <template v-if="detalleBreadcrumb">
        <RouterLink
          :to="seccion.to"
          class="hidden shrink-0 text-muted-foreground hover:text-foreground sm:inline"
        >
          {{ seccion.label }}
        </RouterLink>
        <span class="hidden text-muted-foreground/60 sm:inline">/</span>
        <component
          :is="seccion.icon"
          stroke-width="1.75"
          class="size-3.5 shrink-0 text-muted-foreground"
        />
      </template>
      <span class="truncate" aria-current="page">
        {{ detalleBreadcrumb || seccion.label }}
      </span>
    </nav>
  </header>
</template>
