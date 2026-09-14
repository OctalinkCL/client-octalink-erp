import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // En dev, el frontend corre con `pnpm dev` (Vite normal) y las functions de
  // /api se prueban aparte con `vercel dev` (puerto 3000 por defecto). Este
  // proxy reenvía las llamadas a /api hacia ese servidor.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  // pdfmake carga por import() dinámico; pre-empaquetarlo evita el "Failed to
  // fetch dynamically imported module" cuando Vite reoptimiza en caliente.
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'],
  },
})
