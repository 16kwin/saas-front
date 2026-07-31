// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    port: 3002,
    host: true,
    open: true,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '45.146.164.123'
    ]
  }
})