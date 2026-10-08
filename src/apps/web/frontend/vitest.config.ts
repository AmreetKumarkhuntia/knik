import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: {
    alias: {
      $types: path.resolve(import.meta.dirname, 'src/types'),
      $components: path.resolve(import.meta.dirname, 'src/lib/components'),
      $stores: path.resolve(import.meta.dirname, 'src/lib/stores'),
      $widgets: path.resolve(import.meta.dirname, 'src/lib/widgets'),
      $sections: path.resolve(import.meta.dirname, 'src/lib/sections'),
      $pages: path.resolve(import.meta.dirname, 'src/lib/pages'),
      $lib: path.resolve(import.meta.dirname, 'src/lib'),
      $constants: path.resolve(import.meta.dirname, 'src/lib/constants'),
      $utils: path.resolve(import.meta.dirname, 'src/lib/utils'),
      $hooks: path.resolve(import.meta.dirname, 'src/lib/hooks'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    clearMocks: true,
  },
})
