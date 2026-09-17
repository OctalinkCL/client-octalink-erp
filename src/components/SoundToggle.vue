<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSound } from '@/composables/useSound'

const { enabled } = useSound()
</script>

<template>
  <div class="flex items-center gap-3">
    <Switch id="sound-toggle" v-model="enabled" />
    <Label for="sound-toggle">Sonidos de interfaz</Label>
  </div>
</template>
