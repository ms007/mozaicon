import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'playwright-report',
    'test-results',
    'coverage',
    '.sandcastle',
    '.pnpm-store',
    'storybook-static',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
      '@typescript-eslint/consistent-type-definitions': 'off',
      'max-lines': ['warn', 300],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/ui/*'],
              message:
                'Import shadcn primitives from @/components/primitives/* instead. The ui/ folder is shadcn-generated output and is overwritten on regeneration; the primitives/ layer is a stable pass-through seam so that app-wide imports never drift with the shadcn update cadence.',
            },
          ],
        },
      ],
    },
  },
  {
    // shadcn-generated output. Treated as vendor code: do not reformat,
    // do not lint for react-refresh boundaries — it is regenerated verbatim.
    // Sibling ui/ imports (e.g. toggle-group → toggle) and `||` chains come
    // straight from shadcn; we can't rewrite them without breaking byte-for-
    // byte regen parity.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
      'react-refresh/only-export-components': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  {
    // The primitives layer is allowed to reach into shadcn output,
    // and wrappers often re-export helpers (variants, types) alongside
    // the component itself, which react-refresh can't statically verify.
    files: ['src/components/primitives/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**'],
    rules: {
      'max-lines': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Story files export `meta` defaults and `StoryObj` consts alongside the
    // component, which trips react-refresh's only-export-components rule.
    // The `no-restricted-imports` ban on `@/components/ui/*` stays on — per
    // parent #57 the catalog only ever covers primitives + semantic components,
    // never shadcn vendor output.
    files: ['**/*.stories.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
