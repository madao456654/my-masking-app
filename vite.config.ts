import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Base path for GitHub Pages - only applied during build
  base: process.env.NODE_ENV === 'production' ? '/google_antigravity/log-masker/' : '/',
})
