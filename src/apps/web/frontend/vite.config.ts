import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      $types: path.resolve(__dirname, './src/types'),
      $services: path.resolve(__dirname, './src/services'),
      $lib: path.resolve(__dirname, './src/lib'),
      $components: path.resolve(__dirname, './src/lib/components'),
      $hooks: path.resolve(__dirname, './src/lib/hooks'),
      $assets: path.resolve(__dirname, './src/assets'),
    },
  },
})
