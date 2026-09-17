<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Logo from '@/components/Logo.vue'
</script>

<template>
  <RouterLink to="/" class="flex items-center px-2 py-1.5">
    <Logo :width="130" />
  </RouterLink>
</template>
