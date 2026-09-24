import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rutaSrc = fileURLToPath(new URL('./src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En producción el build lo sirve Express en :3000 (misma carpeta dist)
  base: './',
  resolve: {
    alias: {
      '@': rutaSrc,
    },
  },
  server: {
    port: 5173,
    proxy: {
      // En desarrollo, la API vive en el monolito Express (:3000)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})