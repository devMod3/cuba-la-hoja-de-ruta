import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    coverage: {
      enabled: false,
      provider: 'v8',
      include: [
        'packages/*/src/**/*.ts',
        'apps/web/adapters/**/*.ts',
        'apps/web/components/**/*.{ts,tsx}'
      ],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      clean: true,
      thresholds: {
        autoUpdate: false
      }
    }
  }
});
