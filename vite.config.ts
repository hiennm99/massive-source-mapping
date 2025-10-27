import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss()
  ],
  resolve: {
    alias: {
      '@lib': '/src/lib',
      '@types': '/src/types',
      '@features': '/src/features',
      '@components': '/src/shared/components',
      '@config': '/src/config',
      '@utils': '/src/utils',
      '@assets': '/src/assets',
    }
  }
})
