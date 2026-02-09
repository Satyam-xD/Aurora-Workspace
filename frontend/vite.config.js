import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all.
      include: ['buffer', 'process', 'util', 'events', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:4001',
      '/uploads': 'http://localhost:4001',
      '/socket.io': {
        target: 'http://localhost:4001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@headlessui/react', 'lucide-react', 'framer-motion', 'sonner'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-utils': ['lodash', 'dompurify', 'zod', 'socket.io-client', '@tanstack/react-query'],
          'vendor-misc': ['emoji-picker-react', '@hello-pangea/dnd']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
