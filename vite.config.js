import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/F-2/',
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
})
