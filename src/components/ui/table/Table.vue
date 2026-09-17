<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, provide } from 'vue'
import { cn } from '@/lib/utils'
import { TABLE_VARIANT_KEY, type TableVariant } from './context'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  variant?: TableVariant
}>(), {
  variant: 'default',
})

provide(TABLE_VARIANT_KEY, computed(() => props.variant))
</script>

<template>
  <div data-slot="table-container"
    :class="cn('relative w-full overflow-x-auto', props.variant === 'border' && 'rounded border')">
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm md:text-[12.5px]', props.class)">
      <slot />
    </table>
  </div>
</template>
