import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x'

export default [
  {
    ignores: ['dist/**',],
    plugins: {
      'import-x': importX,
    },
    files: ['**/*.{js,mjs,cjs,ts}',],
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'sort-imports': ['error', {
        ignoreDeclarationSort: true,
      },],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      // Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
      '@typescript-eslint/no-import-type-side-effects': 'error',
      indent: ['error', 2, {
        'SwitchCase': 1,
      },],
      quotes: [2, 'single', {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },],
      'quote-props': 'off',
      'no-shadow': ['error',],
      'object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            multiline: true,
            minProperties: 1,
          },
          ObjectPattern: {
            multiline: true,
            minProperties: 2,
          },
          ImportDeclaration: {
            multiline: true,
            minProperties: 2,
          },
          ExportDeclaration: {
            multiline: true,
            minProperties: 2,
          },
        },
      ],
      'comma-dangle': ['error', 'always',],
      'object-curly-spacing': ['error', 'always',],
      'space-before-function-paren': ['error', 'never',],
      'operator-linebreak': ['error', 'after',],
    },
  },
];
