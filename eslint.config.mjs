import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // Build artifacts and vendored code are never linted.
    // `**/src/generated` is Prisma's output — it is regenerated, not edited.
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/src/generated/**',
      '**/next-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    // Backend and shared packages run on Bun.
    files: ['apps/backend/**/*.ts', 'packages/**/*.ts'],
    languageOptions: {
      globals: { Bun: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },

  {
    // Next.js frontend. Server Components, Route Handlers and proxy.ts run on
    // the server; Client Components run in the browser — and a single file
    // can be either, so both global sets are available here rather than being
    // split by path.
    files: ['apps/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Server
        process: 'readonly',
        console: 'readonly',
        Bun: 'readonly',
        // Browser
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        RequestCache: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLSpanElement: 'readonly',
      },
    },
    rules: {
      // JSX components are referenced as types, which the base rule reads as
      // an unused variable.
      'no-undef': 'off',
    },
  },

  // Must stay last: turns off every rule that would fight Prettier.
  prettier
)
