import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      'eqeqeq': ['error', 'always'],
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  },
  globalIgnores(['**/.next/**', '**/out/**', '**/coverage/**', '**/playwright-report/**', '**/test-results/**', '**/next-env.d.ts'])
]);
