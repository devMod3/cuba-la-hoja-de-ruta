import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const strictTypeChecked = tseslint.configs.strictTypeChecked.map((config) => ({
  ...config,
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ...config.languageOptions,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      project: './tsconfig.quality.json',
      tsconfigRootDir: import.meta.dirname
    }
  }
}));

export default defineConfig([
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}']
  },
  ...strictTypeChecked,
  {
    ...reactHooks.configs.flat.recommended,
    files: ['apps/web/**/*.{js,jsx,ts,tsx}']
  },
  {
    files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin
    },
    settings: {
      next: {
        rootDir: 'apps/web/'
      }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  },
  prettier,
  globalIgnores([
    '**/.next/**',
    '**/out/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/next-env.d.ts'
  ])
]);
