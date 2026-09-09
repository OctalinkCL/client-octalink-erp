<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FirebaseError } from 'firebase/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (e) {
    error.value =
      e instanceof FirebaseError && e.code === 'auth/too-many-requests'
        ? 'Demasiados intentos. Espera un momento.'
        : 'Correo o contraseña incorrectos.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm"
    @submit.prevent="handleSubmit"
  >
    <div>
      <h1 class="text-lg font-semibold">Iniciar sesión</h1>
      <p class="text-sm text-muted-foreground">ERP Octalink</p>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="email">Correo</Label>
      <Input id="email" v-model="email" type="email" required autocomplete="email" />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="password">Contraseña</Label>
      <Input
        id="password"
        v-model="password"
        type="password"
        required
        autocomplete="current-password"
      />
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <Button type="submit" :disabled="loading" class="w-full">
      {{ loading ? 'Entrando…' : 'Entrar' }}
    </Button>
  </form>
</template>
