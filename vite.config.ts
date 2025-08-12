import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss()
  ],
    server: {
        allowedHosts: [
            'b2f6d8a72807.ngrok-free.app' // Host của ngrok
        ]
    }
})
