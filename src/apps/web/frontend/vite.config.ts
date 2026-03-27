import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import checker from 'vite-plugin-checker'
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      overlay: {
        position: 'br',
        initialIsOpen: false,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {
      $types: path.resolve(__dirname, './src/types'),
      $services: path.resolve(__dirname, './src/services'),
      $lib: path.resolve(__dirname, './src/lib'),
      $components: path.resolve(__dirname, './src/lib/components'),
      $sections: path.resolve(__dirname, './src/lib/sections'),
      $pages: path.resolve(__dirname, './src/lib/pages'),
      $hooks: path.resolve(__dirname, './src/lib/hooks'),
      $store: path.resolve(__dirname, './src/store'),
      $assets: path.resolve(__dirname, './src/assets'),
      $common: path.resolve(__dirname, './src/lib/components'),
      $utils: path.resolve(__dirname, './src/lib/utils'),
      $constants: path.resolve(__dirname, './src/lib/constants'),
    },
  },
})
