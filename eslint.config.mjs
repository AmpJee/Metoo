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
      '**/src/generated/**',
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
    // The frontend server is Bun; only src/scripts ships to the browser.
    files: ['apps/frontend/src/index.ts'],
    languageOptions: {
      globals: { Bun: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },

  {
    // Vanilla browser JS — no bundler, no module resolution, DOM globals.
    files: ['apps/frontend/src/public/scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
      },
    },
  },

  // Must stay last: turns off every rule that would fight Prettier.
  prettier
)
