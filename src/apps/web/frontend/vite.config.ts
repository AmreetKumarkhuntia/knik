import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
      overlay: {
        position: 'br',
        initialIsOpen: false,
      },
    }),
  ],
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
