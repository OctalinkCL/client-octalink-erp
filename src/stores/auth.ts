import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  // Se resuelve cuando Firebase entrega el primer estado de sesión al cargar
  // la app. El guard del router espera esta promesa antes de decidir.
  const whenReady = new Promise<void>((resolve) => {
    let first = true
    onAuthStateChanged(auth, (u) => {
      user.value = u
      if (first) {
        first = false
        resolve()
      }
    })
  })

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  return { user, isAuthenticated, whenReady, login, logout }
})
