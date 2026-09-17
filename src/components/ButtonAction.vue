<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { CheckIcon, LoaderCircleIcon, XIcon } from '@lucide/vue'
import { Button, type ButtonVariants } from '@/components/ui/button'

export type ActionStatus = 'idle' | 'loading' | 'success' | 'error'

interface Props {
    status?: ActionStatus
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
    status: 'idle',
})

const statusIcon = computed(() => {
    if (props.status === 'loading') return LoaderCircleIcon
    if (props.status === 'success') return CheckIcon
    if (props.status === 'error') return XIcon
    return null
})
</script>

<template>
    <Button :variant="variant" :size="size" :class="props.class" :disabled="status === 'loading'">
        <component :is="statusIcon" v-if="statusIcon" :class="{ 'animate-spin': status === 'loading' }" />
        <slot />
    </Button>
</template>
