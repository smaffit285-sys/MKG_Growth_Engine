import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@firebase') || id.includes('/firebase/')) return 'firebase'
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('qrcode')) return 'qrcode'
          return 'vendor'
        },
      },
    },
  },
})
