import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
  },
  // Architectural boundaries for component files:
  //  - types/interfaces must live in src/types/** (import via $types)
  //  - module-scope static config (option arrays + Record<…> lookup maps) must
  //    live in src/lib/constants/** (import via $lib/constants)
  // The destination dirs are excluded so they remain free to hold types/configs
  // (src/lib/constants also contains demoData.tsx, a legit .tsx data module).
  {
    files: ['**/*.tsx'],
    // Anchored with **/ so the excludes match whether ESLint is invoked from the
    // frontend dir (src/...) or the repo root (src/apps/web/frontend/src/...),
    // e.g. via the pre-commit frontend-lint hook which passes full paths.
    ignores: ['**/src/types/**', '**/src/lib/constants/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSInterfaceDeclaration',
          message: 'Declare interfaces in src/types/** (import via $types), not in .tsx files.',
        },
        {
          selector: 'TSTypeAliasDeclaration',
          message: 'Declare type aliases in src/types/** (import via $types), not in .tsx files.',
        },
        {
          selector:
            ':matches(Program, ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator > ArrayExpression:has(> ObjectExpression)',
          message:
            'Move static config arrays to src/lib/constants/** (import via $lib/constants), not .tsx files.',
        },
        {
          selector:
            ":matches(Program, ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator[id.typeAnnotation.typeAnnotation.typeName.name='Record']",
          message:
            'Move static lookup maps to src/lib/constants/** (import via $lib/constants), not .tsx files.',
        },
      ],
    },
  },
])
