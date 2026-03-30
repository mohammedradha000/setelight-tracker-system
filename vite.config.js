import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    proxy: {
      '/api/tle': {
        target: 'https://celestrak.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tle/, '/NORAD/elements/gp.php'),
        secure: true,
      },
      '/api/satcat': {
        target: 'https://celestrak.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/satcat/, '/pub/satcat.csv'),
        secure: true,
      }
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'fabbeyyy.html'),
      },
    }
  }
})
