<script setup lang="ts">
import type { Component } from 'vue'

// Fila "ícono · etiqueta · valor" del cuerpo de un DetallePanel.

defineProps<{
  icono: Component
  etiqueta: string
}>()
</script>

<template>
  <div class="flex min-h-8 items-center gap-3 text-sm">
    <dt class="flex w-34 shrink-0 items-center gap-2 text-foreground-soft">
      <component :is="icono" class="size-3.5 shrink-0 text-foreground-faint" />
      {{ etiqueta }}
    </dt>
    <dd class="min-w-0 flex-1 truncate">
      <slot />
    </dd>
  </div>
</template>
