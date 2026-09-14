<script setup lang="ts">
import { computed } from 'vue'
import { LOGO_RATIO, LOGO_SVG } from '@/lib/logo'

const props = withDefaults(defineProps<{ width?: number }>(), { width: 140 })

const style = computed(() => ({
  width: `${props.width}px`,
  height: `${Math.round(props.width / LOGO_RATIO)}px`,
}))
</script>

<template>
  <span
    class="inline-block text-foreground [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
    :style="style"
    role="img"
    aria-label="Octalink"
    v-html="LOGO_SVG"
  />
</template>
