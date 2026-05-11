import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'node_modules/**',
    '.venv/**',
    'backups/**',
    'docs/**',
    'scripts/**',
    'openspec/**',
    'next-env.d.ts',
    '*.bundle',
    '**/*.pdf',
    '**/*.m4a',
    'query_logs.js',
    'query_manual.js',
    'usb_check.txt',
  ]),
  {
    rules: {
      // Large legacy surface: keep signal without blocking CI; tighten over time.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'prefer-const': 'warn',
    },
  },
])
