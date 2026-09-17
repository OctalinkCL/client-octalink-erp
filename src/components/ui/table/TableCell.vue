<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { TABLE_VARIANT_KEY } from './context'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const variant = inject(TABLE_VARIANT_KEY, computed(() => 'default' as const))
</script>

<template>
  <td data-slot="table-cell"
    :class="cn(
      'px-2 py-1.5 align-middle whitespace-nowrap has-[[role=checkbox]]:pr-0',
      variant === 'border' && 'border-r last:border-r-0',
      props.class,
    )">
    <slot />
  </td>
</template>
