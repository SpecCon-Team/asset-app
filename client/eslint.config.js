// @ts-check
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  }
];


