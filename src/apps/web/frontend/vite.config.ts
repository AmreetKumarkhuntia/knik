import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import checker from 'vite-plugin-checker'
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: { tsconfigPath: './tsconfig.app.json' },
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
      $lib: path.resolve(__dirname, './src/lib'),
      $components: path.resolve(__dirname, './src/lib/components'),
      $stores: path.resolve(__dirname, './src/lib/stores'),
      $widgets: path.resolve(__dirname, './src/lib/widgets'),
      $sections: path.resolve(__dirname, './src/lib/sections'),
      $pages: path.resolve(__dirname, './src/lib/pages'),
      $hooks: path.resolve(__dirname, './src/lib/hooks'),
      $assets: path.resolve(__dirname, './src/assets'),
      $utils: path.resolve(__dirname, './src/lib/utils'),
      $constants: path.resolve(__dirname, './src/lib/constants'),
    },
  },
})
