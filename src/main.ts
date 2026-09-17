import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { FoleyPlugin } from '@foleyjs/vue'
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
  .use(FoleyPlugin, { theme: 'default', volume: 0.6 })
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .mount('#app')
