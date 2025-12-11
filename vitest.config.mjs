import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    coverage: { reporter: ['text', 'lcov'] },
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules/**'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
})

