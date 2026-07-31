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
    ],
    proxy: {
      '/v1': {
        target: 'http://45.146.164.123:8086',
        changeOrigin: true
      },
      '/api': {
        target: 'http://45.146.164.123:8086',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://45.146.164.123:8086',
        changeOrigin: true
      },
      '/ws-orders': {
        target: 'ws://45.146.164.123:8086',
        ws: true,
        changeOrigin: true
      }
    }
  }
})