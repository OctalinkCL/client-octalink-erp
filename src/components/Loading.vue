<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

interface LoadingProps {
  label?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<LoadingProps>(), {
  label: 'Cargando',
})

// grilla 3x3, onda tipo "chevron" que barre de izquierda a derecha
const delays = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3)
  const col = i % 3
  return (col + Math.abs(row - 1)) * 90
})

const elapsed = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    elapsed.value += 0.1
  }, 100)
})
onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<template>
  <div role="status" :class="cn('flex w-fit items-center gap-2.5', props.class)">
    <span aria-hidden class="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      <span
        v-for="(delay, i) in delays"
        :key="i"
        class="size-1 animate-pulse rounded-[1px] bg-foreground opacity-15 motion-reduce:animate-none"
        :style="{ animationDuration: '650ms', animationDelay: `${delay}ms` }"
      />
    </span>

    <span class="animate-pulse text-[13px] font-medium motion-reduce:animate-none">
      {{ props.label }}
    </span>

    <span class="font-mono text-[12px] text-muted-foreground tabular-nums">
      {{ elapsed.toFixed(1) }}s
    </span>
  </div>
</template>
