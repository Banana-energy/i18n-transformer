import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    ignores: ['dist/**', 'packages/**/dist/**',],
    ...pluginJs.configs.recommended,
  },
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    ignores: ['dist/**', 'packages/**/dist/**',],
    plugins: {
      'import-x': importX,
      '@stylistic': stylistic,
    },
    files: ['**/*.{js,mjs,cjs,ts}',],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'sort-imports': ['error', {
        ignoreDeclarationSort: true,
      },],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      // Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@stylistic/indent': ['error', 2, {
        'SwitchCase': 1,
      },],
      '@stylistic/quotes': [2, 'single', {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },],
      'quote-props': 'off',
      'no-shadow': ['error',],
      '@stylistic/object-curly-newline': [
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
      '@stylistic/comma-dangle': ['error', 'always',],
      '@stylistic/object-curly-spacing': ['error', 'always',],
      '@stylistic/object-property-newline': ['error', {
        'allowAllPropertiesOnSameLine': false,
      },],
      'space-before-function-paren': ['error', 'never',],
      'operator-linebreak': ['error', 'after',],
    },
  },
];
