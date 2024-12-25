import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: {
    overrides: {
      'ts/explicit-function-return-type': 'off',
      'ts/no-namespace': 'off',
      'ts/no-empty-object-type': 'off',
      'ts/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
  ignores: ['eslint.config.mjs', '**/package.json', '**/**.md', 'tsconfig.json', 'pnpm-workspace.yaml'],
  rules: {
    'no-new-func': 'off',
    'no-template-curly-in-string': 'off',
    'style/brace-style': ['warn', '1tbs'],
    'unicorn/prefer-node-protocol': 'off',
    'unocss/order-attributify': 'off',
    'style/array-bracket-spacing': ['error', 'always',],
    'prefer-promise-reject-errors': 'off',
    'no-console': 'off',
    'style/space-before-function-paren': 'off',
    'style/indent': ['error', 2, {
      SwitchCase: 1,
    },],
    'style/object-curly-newline': [
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
          minProperties: 4,
        },
        ExportDeclaration: {
          multiline: true,
          minProperties: 1,
        },
      },
    ],
    'style/comma-dangle': ['error', 'always',],
    'style/object-curly-spacing': ['error', 'always',],
    'style/object-property-newline': ['error', {
      allowAllPropertiesOnSameLine: false,
    },],
    'style/operator-linebreak': ['error', 'after',],
  },
},)
