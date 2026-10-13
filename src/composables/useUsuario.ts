import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Datos de presentación del usuario en sesión. Firebase no siempre trae
// displayName (login con email/clave), así que se cae a la parte local del correo.
export function useUsuario() {
  const auth = useAuthStore()

  const email = computed(() => auth.user?.email ?? '')
  const nombre = computed(
    () => auth.user?.displayName?.trim() || email.value.split('@')[0] || 'Usuario',
  )
  const iniciales = computed(() => {
    const partes = nombre.value.split(/[\s._-]+/).filter(Boolean)
    const letras =
      partes.length > 1 ? partes[0][0] + partes[1][0] : nombre.value.slice(0, 2)
    return letras.toUpperCase()
  })

  return { nombre, email, iniciales }
}
