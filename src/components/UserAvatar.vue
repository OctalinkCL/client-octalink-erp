<script setup lang="ts">
import { useUsuario } from "@/composables/useUsuario";

const { iniciales } = useUsuario();
</script>

<template>
  <div
    class="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-medium text-rose-900 dark:bg-rose-950 dark:text-rose-200"
  >
    {{ iniciales }}
  </div>
</template>
