import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'prefer-const': 'error',
      'no-case-declarations': 'error',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      'scripts/set-permissions.js',
      '*.d.ts',
      'coverage/',
      'vitest.config.ts',
    ],
  }
);

