import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import './style.css'
import App from './App.vue'
import router from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 60s: no re-lee Firestore por cada navegación
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false, // no re-lee al volver a la pestaña
      retry: 1,
    },
  },
})

createApp(App)
  .use(createPinia())
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .mount('#app')
