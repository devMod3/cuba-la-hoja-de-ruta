import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    coverage: {
      enabled: false,
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'apps/web/adapters/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      clean: true,
      reportOnFailure: true,
      thresholds: {
        autoUpdate: false,
        statements: 90,
        branches: 70,
        functions: 90,
        lines: 95,
        'packages/domain/src/**/*.ts': {
          statements: 100,
          branches: 75,
          functions: 100,
          lines: 100
        },
        'packages/authoring-core/src/**/*.ts': {
          statements: 95,
          branches: 85,
          functions: 100,
          lines: 100
        },
        'packages/authoring-github/src/**/*.ts': {
          statements: 90,
          branches: 75,
          functions: 90,
          lines: 95
        },
        'packages/content-catalog/src/**/*.ts': {
          statements: 95,
          branches: 85,
          functions: 100,
          lines: 100
        },
        'packages/content-renderer/src/**/*.ts': { 100: true },
        'packages/search-core/src/**/*.ts': {
          statements: 95,
          branches: 75,
          functions: 100,
          lines: 100
        },
        'packages/site-config/src/**/*.ts': {
          statements: 95,
          branches: 80,
          functions: 95,
          lines: 100
        },
        'packages/zrp-adapter/src/**/*.ts': { 100: true },
        'apps/web/adapters/**/*.ts': {
          statements: 95,
          branches: 75,
          functions: 85,
          lines: 95
        }
      }
    }
  }
});
