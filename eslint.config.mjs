import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}',],
  },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      indent: ['error', 2, {
        'SwitchCase': 1,
      },],
      quotes: [2, 'single', {
        avoidEscape: true, allowTemplateLiterals: true,
      },],
      'quote-props': 'off',
      'no-shadow': ['error',],
      'object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            multiline: true, minProperties: 1,
          },
          ObjectPattern: {
            multiline: true, minProperties: 2,
          },
          ImportDeclaration: {
            multiline: true, minProperties: 2,
          },
          ExportDeclaration: {
            multiline: true, minProperties: 2,
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
