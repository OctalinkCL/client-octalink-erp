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
  <th data-slot="table-head"
    :class="cn(
      'text-muted-foreground h-9 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      variant === 'border' && 'border-r last:border-r-0',
      props.class,
    )">
    <slot />
  </th>
</template>
