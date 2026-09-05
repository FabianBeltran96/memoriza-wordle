import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Rutas relativas: funciona igual en local, en un dominio propio
  // y en GitHub Pages bajo /<repo>/, sin tocar la config.
  base: './',
})
