import { defineConfig, } from 'vitest/config'

export default defineConfig({
  test: {
    include: [ '**/__tests__/**/*.test.ts', ],
    coverage: {
      provider: 'v8',
      reporter: [ 'text', 'json', 'html', ],
      exclude: [
        'node_modules/**',
        'packages/core/src/index.ts',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/dist/**',
        '**/__tests__/**',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    environment: 'node',
  },
},)
