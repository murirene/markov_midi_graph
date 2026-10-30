import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev only: forward /api to the Express backend, path unchanged.
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
})
