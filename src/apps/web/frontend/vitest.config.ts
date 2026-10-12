import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    clearMocks: true,
    unstubGlobals: true,
  },
})
